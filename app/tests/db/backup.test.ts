/**
 * tests/db/backup.test.ts — 备份导出 / 解析 / 导入合并（fake-indexeddb）。
 * 合并规则：person 按 id 去重保留 createdAt 较新者；其余实体按 id 覆盖。
 */

import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { getBackend, setBackendForTests, STORES } from '../../src/db/backend';
import { exportBackup, importBackup, parseBackup } from '../../src/db/backup';
import { personRepo } from '../../src/db/repos/person.repo';
import { favoriteRepo } from '../../src/db/repos/favorite.repo';
import { SCHEMA_VERSION } from '../../src/db/types';
import type { Person } from '../../src/engine/types';

function makePerson(id: string, createdAt: number, name = '阿芳'): Person {
  return {
    id,
    schemaVersion: SCHEMA_VERSION,
    name,
    sex: 'f',
    birthDate: '1990-06-15',
    birthTime: '08:00',
    birthCityId: 'beijing',
    createdAt,
  };
}

async function clearAll(): Promise<void> {
  const b = await getBackend();
  for (const s of STORES) await b.clear(s);
}

beforeEach(async () => {
  setBackendForTests(null);
  await clearAll();
});

describe('exportBackup', () => {
  it('导出带 magic 与全 store 数据', async () => {
    await personRepo.save(makePerson('p1', 1000));
    const res = await exportBackup();
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.magic).toBe('zj-backup-v1');
    expect(res.value.schemaVersion).toBe(SCHEMA_VERSION);
    expect(res.value.data.person).toHaveLength(1);
    // 八个 store 键齐全
    for (const s of STORES) expect(Array.isArray(res.value.data[s])).toBe(true);
  });
});

describe('parseBackup', () => {
  it('拒绝坏 JSON / 缺 magic / 缺 data', () => {
    expect(parseBackup('not json').ok).toBe(false);
    expect(parseBackup('{"magic":"other","data":{}}').ok).toBe(false);
    expect(parseBackup('{"magic":"zj-backup-v1"}').ok).toBe(false);
  });

  it('接受合法文件并补默认值', () => {
    const res = parseBackup(JSON.stringify({ magic: 'zj-backup-v1', data: { person: [] } }));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.schemaVersion).toBe(SCHEMA_VERSION);
    expect(typeof res.value.exportedAt).toBe('number');
    expect(res.value.data.person).toEqual([]);
  });
});

describe('importBackup 合并规则', () => {
  it('person 同 id 去重：保留 createdAt 较新者', async () => {
    await personRepo.save(makePerson('p1', 1000, '旧名'));
    const file = parseBackup(
      JSON.stringify({
        magic: 'zj-backup-v1',
        exportedAt: 1,
        schemaVersion: SCHEMA_VERSION,
        data: { person: [makePerson('p1', 2000, '新名'), makePerson('p2', 1500, '第二位')] },
      }),
    );
    expect(file.ok).toBe(true);
    if (!file.ok) return;
    const res = await importBackup(file.value);
    expect(res.ok).toBe(true);

    const list = await personRepo.list();
    expect(list).toHaveLength(2);
    expect(list.find((p) => p.id === 'p1')?.name).toBe('新名');
    expect(list.find((p) => p.id === 'p2')?.name).toBe('第二位');
  });

  it('person 同 id：导入的较旧不覆盖本机较新', async () => {
    await personRepo.save(makePerson('p1', 5000, '本机新名'));
    const file = parseBackup(
      JSON.stringify({
        magic: 'zj-backup-v1',
        exportedAt: 1,
        schemaVersion: SCHEMA_VERSION,
        data: { person: [makePerson('p1', 1000, '备份旧名')] },
      }),
    );
    if (!file.ok) throw new Error('parse failed');
    await importBackup(file.value);
    expect((await personRepo.list())[0].name).toBe('本机新名');
  });

  it('其余实体按 id 覆盖', async () => {
    await favoriteRepo.save({
      id: 'f1',
      kind: 'article',
      refId: '3',
      articleTitle: '旧标题',
    });
    const file = parseBackup(
      JSON.stringify({
        magic: 'zj-backup-v1',
        exportedAt: 1,
        schemaVersion: SCHEMA_VERSION,
        data: { favorite: [{ id: 'f1', kind: 'article', refId: '3', articleTitle: '新标题' }] },
      }),
    );
    if (!file.ok) throw new Error('parse failed');
    await importBackup(file.value);
    const list = await favoriteRepo.list();
    expect(list).toHaveLength(1);
    expect(list[0].articleTitle).toBe('新标题');
  });

  it('导出 → 清库 → 导入 往返恢复', async () => {
    await personRepo.save(makePerson('p1', 1000));
    await favoriteRepo.save({ id: 'f1', kind: 'day', refId: 'scan:2026-03-08', eventKey: 'open' });
    const out = await exportBackup();
    if (!out.ok) throw new Error('export failed');

    await clearAll();
    expect(await personRepo.list()).toHaveLength(0);

    const back = await importBackup(out.value);
    expect(back.ok && back.value).toBeGreaterThan(0);
    expect(await personRepo.list()).toHaveLength(1);
    expect(await favoriteRepo.list()).toHaveLength(1);
  });
});

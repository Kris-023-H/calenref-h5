/**
 * tests/db/repos.test.ts — 八仓库集成测试（fake-indexeddb 真实走 IDB 路径）。
 * 覆盖：person / scan / favorite / license / quota / reminder / settings 七实体仓库。
 */

import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { getBackend, setBackendForTests, STORES } from '../../src/db/backend';
import { personRepo, newPersonId, validatePerson } from '../../src/db/repos/person.repo';
import { scanRepo, newScanId } from '../../src/db/repos/scan.repo';
import { favoriteRepo } from '../../src/db/repos/favorite.repo';
import { licenseRepo } from '../../src/db/repos/license.repo';
import { quotaRepo, AI_FREE_PER_MONTH } from '../../src/db/repos/quota.repo';
import { reminderRepo } from '../../src/db/repos/reminder.repo';
import { settingsRepo } from '../../src/db/repos/settings.repo';
import { DEFAULT_SETTINGS, SCHEMA_VERSION } from '../../src/db/types';
import type { Person, ScanResult } from '../../src/engine/types';

function makePerson(patch: Partial<Person> = {}): Person {
  return {
    id: newPersonId(),
    schemaVersion: SCHEMA_VERSION,
    name: '阿芳',
    sex: 'f',
    birthDate: '1990-06-15',
    birthTime: '08:00',
    birthCityId: 'beijing',
    note: '',
    createdAt: 1_700_000_000_000,
    ...patch,
  };
}

function makeScan(createdAt = 1_700_000_000_000): ScanResult {
  return {
    input: { eventKey: 'open', people: [], startDate: { y: 2026, m: 1, d: 1 }, span: 30 },
    days: [],
    usable: [],
    byReason: {},
    total: 30,
    generic: true,
    ruleVersion: '2026.10',
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

describe('personRepo', () => {
  it('保存 / 读取 / 列表 / 删除', async () => {
    const p = makePerson();
    const saved = await personRepo.save(p);
    expect(saved.ok).toBe(true);

    const got = await personRepo.get(p.id);
    expect(got?.name).toBe('阿芳');

    const list = await personRepo.list();
    expect(list).toHaveLength(1);

    await personRepo.remove(p.id);
    expect(await personRepo.list()).toHaveLength(0);
  });

  it('removeAll 清空档案', async () => {
    await personRepo.save(makePerson({ id: 'p1' }));
    await personRepo.save(makePerson({ id: 'p2' }));
    await personRepo.removeAll();
    expect(await personRepo.list()).toHaveLength(0);
  });

  it('validatePerson：日期/时刻/姓名校验', () => {
    expect(validatePerson(makePerson({ name: '' })).ok).toBe(false);
    expect(validatePerson(makePerson({ birthDate: '1990/06/15' })).ok).toBe(false);
    expect(validatePerson(makePerson({ birthTime: '8:00' })).ok).toBe(false);
    expect(validatePerson(makePerson()).ok).toBe(true);
  });
});

describe('scanRepo', () => {
  it('保存课期（含 ScanResult 快照）并可复读', async () => {
    const id = newScanId();
    const res = await scanRepo.save(makeScan(), id, '开业 · 3/30');
    expect(res.ok && res.value.title).toBe('开业 · 3/30');

    const got = await scanRepo.get(id);
    expect(got?.result.total).toBe(30);
    expect(got?.schemaVersion).toBe(SCHEMA_VERSION);

    await scanRepo.remove(id);
    expect(await scanRepo.get(id)).toBeUndefined();
  });
});

describe('favoriteRepo', () => {
  it('收藏 / 去重查询 / 取消', async () => {
    const rec = {
      id: 'scan1:2026-03-08',
      kind: 'day' as const,
      refId: 'scan1:2026-03-08',
      eventKey: 'open',
      snapshot: { date: '2026-03-08', dayGZ: '庚午', score: 92, grade: 'shangji', eventName: '开业' },
    };
    await favoriteRepo.save(rec);
    expect(await favoriteRepo.has(rec.id)).toBe(true);
    expect(await favoriteRepo.list()).toHaveLength(1);

    await favoriteRepo.remove(rec.id);
    expect(await favoriteRepo.has(rec.id)).toBe(false);
  });
});

describe('licenseRepo', () => {
  it('累计次数 / 无限次判定 / 扣减', async () => {
    await licenseRepo.save({ id: 'l1', code: 'ZJ-B-AAA', sku: 'ai10', left: 2, boundAt: 100, source: 'redeem' });
    await licenseRepo.save({ id: 'l2', code: 'ZJ-A-BBB', sku: 'once', left: 1, boundAt: 200, source: 'redeem' });

    expect(await licenseRepo.hasUnlimited()).toBe(false);
    expect(await licenseRepo.totalLeft()).toBe(3);

    const r1 = await licenseRepo.consumeOne();
    expect(r1.ok && r1.value).toBe(1); // boundAt 最小的先扣（l1: 2 → 1）
    expect(await licenseRepo.totalLeft()).toBe(2);

    await licenseRepo.save({ id: 'l3', code: 'ZJ-D-CCC', sku: 'year', left: -1, boundAt: 300, source: 'stripe' });
    expect(await licenseRepo.hasUnlimited()).toBe(true);
    expect(await licenseRepo.totalLeft()).toBe(-1);
  });

  it('consumeOne 可按 sku 过滤', async () => {
    await licenseRepo.save({ id: 'l1', code: 'ZJ-B-AAA', sku: 'ai10', left: 1, boundAt: 100, source: 'redeem' });
    const none = await licenseRepo.consumeOne('once');
    expect(none.ok && none.value).toBe(0);
    const hit = await licenseRepo.consumeOne('ai10');
    expect(hit.ok && hit.value).toBe(0);
  });
});

describe('quotaRepo', () => {
  it('免费额度：初值 3 → 扣减 → 重置', async () => {
    expect(await quotaRepo.freeLeft('2026-03')).toBe(AI_FREE_PER_MONTH);
    const consumed = await quotaRepo.consumeFree('2026-03');
    expect(consumed.ok && consumed.value).toBe(true);
    expect(await quotaRepo.freeLeft('2026-03')).toBe(2);

    await quotaRepo.reset('2026-03');
    expect(await quotaRepo.freeLeft('2026-03')).toBe(AI_FREE_PER_MONTH);
  });

  it('扣到 0 后不可再扣', async () => {
    await quotaRepo.consumeFree('2026-03');
    await quotaRepo.consumeFree('2026-03');
    await quotaRepo.consumeFree('2026-03');
    const again = await quotaRepo.consumeFree('2026-03');
    expect(again.ok && again.value).toBe(false);
  });
});

describe('reminderRepo', () => {
  it('按日期排序保存与删除', async () => {
    await reminderRepo.save({ id: 'r2', eventKey: 'marry', date: '2026-05-01', note: '', enabled: true });
    await reminderRepo.save({ id: 'r1', eventKey: 'open', date: '2026-03-01', note: '看天气', enabled: true });
    const list = await reminderRepo.list();
    expect(list.map((r) => r.id)).toEqual(['r1', 'r2']);
    expect(list[0].schemaVersion).toBe(SCHEMA_VERSION);

    await reminderRepo.remove('r1');
    expect(await reminderRepo.list()).toHaveLength(1);
  });
});

describe('settingsRepo', () => {
  it('默认值 / 补丁式保存 / exists（首启探测）', async () => {
    // get() 只读不落库：首次启动 exists() 为 false（供首启语言/时区探测）
    expect(await settingsRepo.exists()).toBe(false);
    const def = await settingsRepo.get();
    expect(def).toEqual(DEFAULT_SETTINGS);
    expect(await settingsRepo.exists()).toBe(false);

    // 币种已收敛为 USD 单币种（Creem 只支持 USD/EUR），此处只验证局部更新语义
    const saved = await settingsRepo.save({ lang: 'en', currency: 'USD' });
    expect(saved.ok && saved.value.lang).toBe('en');
    expect(await settingsRepo.exists()).toBe(true);
    const after = await settingsRepo.get();
    expect(after.currency).toBe('USD');
    expect(after.cal).toBe('greg'); // 未传字段保持
  });
});

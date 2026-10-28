/**
 * db/backup.ts — 导出 / 导入 zj-backup-v1.json。
 * 合并规则：按 personId 去重（保留 createdAt 较新者），其余实体按 id 覆盖。
 * 文件格式带 magic 与 schemaVersion，导入前校验，不识别即拒绝。
 */

import { getBackend, STORES, type StoreName } from './backend';
import { SCHEMA_VERSION } from './types';
import { ok, err, type Result } from '../lib/result';

const MAGIC = 'zj-backup-v1';

export interface BackupFile {
  magic: typeof MAGIC;
  exportedAt: number;
  schemaVersion: number;
  data: Record<StoreName, Array<Record<string, unknown>>>;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export async function exportBackup(): Promise<Result<BackupFile>> {
  const b = await getBackend();
  const data = {} as Record<StoreName, Array<Record<string, unknown>>>;
  for (const store of STORES) {
    data[store] = (await b.all<Record<string, unknown>>(store)).map((r) => ({ ...r }));
  }
  return ok({ magic: MAGIC, exportedAt: Date.now(), schemaVersion: SCHEMA_VERSION, data });
}

export function parseBackup(text: string): Result<BackupFile> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return err('invalidInput', 'settings.importFail');
  }
  if (!isRecord(parsed) || parsed.magic !== MAGIC || !isRecord(parsed.data)) {
    return err('invalidInput', 'settings.importFail');
  }
  const data = {} as Record<StoreName, Array<Record<string, unknown>>>;
  for (const store of STORES) {
    const rows = parsed.data[store];
    data[store] = Array.isArray(rows) ? rows.filter(isRecord) : [];
  }
  return ok({
    magic: MAGIC,
    exportedAt: typeof parsed.exportedAt === 'number' ? parsed.exportedAt : Date.now(),
    schemaVersion: typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : SCHEMA_VERSION,
    data,
  });
}

export async function importBackup(file: BackupFile): Promise<Result<number>> {
  const b = await getBackend();
  let merged = 0;
  for (const store of STORES) {
    const incoming = file.data[store] ?? [];
    if (incoming.length === 0) continue;
    if (store === 'person') {
      // 当事人按 id 去重，保留 createdAt 较新者
      const existing = await b.all<Record<string, unknown>>(store);
      const byId = new Map(existing.map((r) => [String(r.id), r]));
      for (const row of incoming) {
        const id = String(row.id ?? '');
        if (!id) continue;
        const cur = byId.get(id);
        const curAt = typeof cur?.createdAt === 'number' ? cur.createdAt : -1;
        const newAt = typeof row.createdAt === 'number' ? row.createdAt : -1;
        if (!cur || newAt >= curAt) {
          byId.set(id, row);
          merged += 1;
        }
      }
      for (const row of byId.values()) await b.put(store, row as never);
    } else {
      for (const row of incoming) {
        if (row.id === undefined) continue;
        await b.put(store, row as never);
        merged += 1;
      }
    }
  }
  return ok(merged);
}

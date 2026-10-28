/**
 * db/repos/scan.repo.ts — 课期历史存读（ScanResult 快照）。
 * 快照含 input，可用同规则版本复算；报告解锁态由 license.repo 判定。
 */

import type { ScanResult } from '../../engine/types';
import { getBackend } from '../backend';
import { SCHEMA_VERSION, type ScanRecord } from '../types';
import { ok, type Result } from '../../lib/result';

const STORE = 'scan' as const;

export const scanRepo = {
  async list(): Promise<ScanRecord[]> {
    const b = await getBackend();
    const rows = await b.all<ScanRecord>(STORE);
    return rows.sort((a, c) => c.createdAt - a.createdAt);
  },

  async get(id: string): Promise<ScanRecord | undefined> {
    const b = await getBackend();
    return b.get<ScanRecord>(STORE, id);
  },

  async save(result: ScanResult, id: string, title: string): Promise<Result<ScanRecord>> {
    const record: ScanRecord = {
      id,
      schemaVersion: SCHEMA_VERSION,
      createdAt: result.createdAt || Date.now(),
      result,
      title,
    };
    const b = await getBackend();
    await b.put(STORE, record);
    return ok(record);
  },

  async remove(id: string): Promise<Result<void>> {
    const b = await getBackend();
    await b.del(STORE, id);
    return ok(undefined);
  },
};

export function newScanId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

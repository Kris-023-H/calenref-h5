/**
 * db/repos/quota.repo.ts — AI 配额：免费 3 次/月（每月 1 日重置）+ 付费次数不清零。
 * monthKey 按时区月（services/timezone.ts 的 tzMonthKey）滚动。
 */

import { getBackend } from '../backend';
import { SCHEMA_VERSION, type QuotaRecord } from '../types';
import { ok, type Result } from '../../lib/result';

const STORE = 'quota' as const;
const ID = 'ai' as const;

export const AI_FREE_PER_MONTH = 3;

async function ensure(monthKey: string): Promise<QuotaRecord> {
  const b = await getBackend();
  const cur = await b.get<QuotaRecord>(STORE, ID);
  if (cur && cur.monthKey === monthKey) return cur;
  const fresh: QuotaRecord = { id: ID, schemaVersion: SCHEMA_VERSION, freeLeft: AI_FREE_PER_MONTH, monthKey };
  await b.put(STORE, fresh);
  return fresh;
}

export const quotaRepo = {
  /** 当月免费剩余（跨月自动重置） */
  async freeLeft(monthKey: string): Promise<number> {
    const rec = await ensure(monthKey);
    return rec.freeLeft;
  },

  /** 消耗一次免费额度；成功返回 true */
  async consumeFree(monthKey: string): Promise<Result<boolean>> {
    const rec = await ensure(monthKey);
    if (rec.freeLeft <= 0) return ok(false);
    rec.freeLeft -= 1;
    const b = await getBackend();
    await b.put(STORE, rec);
    return ok(true);
  },

  async reset(monthKey: string): Promise<Result<void>> {
    const b = await getBackend();
    await b.put(STORE, { id: ID, schemaVersion: SCHEMA_VERSION, freeLeft: AI_FREE_PER_MONTH, monthKey });
    return ok(undefined);
  },
};

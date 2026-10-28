/**
 * db/repos/license.repo.ts — 购买凭证（兑换码 / 支付回跳写入）。
 * left：剩余次数（-1 不限）；凭证判定只认本机记录，恢复购买即重放本机凭证。
 */

import { getBackend } from '../backend';
import { SCHEMA_VERSION, type LicenseRecord, type Sku } from '../types';
import { ok, type Result } from '../../lib/result';

const STORE = 'license' as const;

export const licenseRepo = {
  async list(): Promise<LicenseRecord[]> {
    const b = await getBackend();
    const rows = await b.all<LicenseRecord>(STORE);
    return rows.sort((a, c) => c.boundAt - a.boundAt);
  },

  async save(rec: Omit<LicenseRecord, 'schemaVersion'>): Promise<Result<LicenseRecord>> {
    const record: LicenseRecord = { ...rec, schemaVersion: SCHEMA_VERSION };
    const b = await getBackend();
    await b.put(STORE, record);
    return ok(record);
  },

  async remove(id: string): Promise<Result<void>> {
    const b = await getBackend();
    await b.del(STORE, id);
    return ok(undefined);
  },

  /** 是否已有无限次权益（年卡） */
  async hasUnlimited(): Promise<boolean> {
    const rows = await licenseRepo.list();
    return rows.some((r) => r.sku === 'year' || r.left === -1);
  },

  /** 累计剩余次数（年卡返回 -1） */
  async totalLeft(): Promise<number> {
    const rows = await licenseRepo.list();
    if (rows.some((r) => r.sku === 'year' || r.left === -1)) return -1;
    return rows.reduce((sum, r) => sum + Math.max(0, r.left), 0);
  },

  /** 扣减一次：从最新写入的凭证扣（FIFO 之外按 boundAt 正序） */
  async consumeOne(skuFilter?: Sku): Promise<Result<number>> {
    const rows = (await licenseRepo.list()).filter((r) => r.left !== 0 && (!skuFilter || r.sku === skuFilter));
    if (rows.length === 0) return ok(0);
    const target = rows.sort((a, c) => a.boundAt - c.boundAt)[0];
    target.left = Math.max(0, target.left - 1);
    const b = await getBackend();
    await b.put(STORE, target);
    return ok(target.left);
  },
};

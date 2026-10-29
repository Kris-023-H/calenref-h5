/**
 * services/pay/redeem.ts — 兑换码服务端核验 + 写本机凭证。
 *
 * 安全边界（v2，修复「客户端可伪造兑换码」）：
 *   · 签名密钥只在 Worker 的 REDEEM_SECRET，客户端不持有，无法离线造码；
 *   · 一码一用由服务端 KV 保证（同 licenseId 第二次返回 409）；
 *   · SKU 由服务端从载荷首字母确定并回传，客户端不采信前缀字母。
 * 客户端只做一次「格式预检」，省掉明显无效码的网络往返。
 */

import type { Sku } from '../../data/prices';
import { SKU_LEFT } from '../../data/prices';
import { licenseRepo } from '../../db/repos/license.repo';
import { ok, err, type Result } from '../../lib/result';
import { parseCode } from './redeem-crypto';

export interface RedeemOk {
  sku: Sku;
  left: number;
}

/** 兑换：本地格式预检 → POST /api/redeem 由服务端验签 + 一次性核销 → 写本机凭证 */
export async function redeemCode(codeRaw: string): Promise<Result<RedeemOk>> {
  const trimmed = codeRaw.trim().toUpperCase();
  const parsed = parseCode(trimmed);
  if (!parsed) return err('redeemFail', 'pay.redeemFail');

  let data: { ok?: boolean; sku?: string; licenseId?: string; error?: string };
  try {
    const res = await fetch('/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: trimmed }),
    });
    data = (await res.json()) as typeof data;
  } catch {
    return err('unknown', 'err.unknown');
  }

  if (!data.ok || typeof data.sku !== 'string') return err('redeemFail', 'pay.redeemFail');
  const sku = data.sku as Sku;
  if (!(sku in SKU_LEFT)) return err('redeemFail', 'pay.redeemFail');

  // 服务端返回 licenseId（一码一凭证）；缺省时用载荷派生，保证幂等
  const id = typeof data.licenseId === 'string' && data.licenseId ? data.licenseId : `lic_${parsed.payload}`;
  const existing = (await licenseRepo.list()).find((r) => r.id === id);
  if (existing) return err('redeemFail', 'pay.redeemFail');

  const left = SKU_LEFT[sku];
  await licenseRepo.save({ id, code: trimmed.slice(0, 12), sku, left, boundAt: Date.now(), source: 'redeem' });
  return ok({ sku, left });
}

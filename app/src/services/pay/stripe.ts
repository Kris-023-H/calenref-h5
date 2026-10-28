/**
 * services/pay/stripe.ts — Payment Link / Checkout URL 构造 + 回跳参数解析。
 * v1 双路径之一：直跳 Stripe Payment Link（data/prices.ts 配 URL 模板）。
 * 回跳参数解析写本机凭证；服务端核验（Cloudflare Worker）为上线升级项（README 明示）。
 */

import type { Currency, Sku } from '../../data/prices';
import { PAYMENT_LINKS, SKU_LEFT } from '../../data/prices';
import { licenseRepo } from '../../db/repos/license.repo';

export interface CheckoutParams {
  sku: Sku;
  currency: Currency;
  lang: string;
  /** 本机客户端 id（回跳对齐用，非身份） */
  clientRef: string;
}

/**
 * 构造支付链接（占位模板：上线前在 prices.ts 换成真实 Payment Link）。
 * 契约：链接不可用（占位 REPLACE_WITH_* / 空 / 不可解析）一律返回空串，
 * 由 pay-screen 走 pay.linkFail 兜底提示，不得抛错（PRD 验收 #5）。
 */
export function buildCheckoutUrl(p: CheckoutParams): string {
  const base = PAYMENT_LINKS[p.currency]?.[p.sku];
  if (!base || base.length === 0) return '';
  if (base.startsWith('REPLACE_WITH_')) return '';
  try {
    const url = new URL(base);
    url.searchParams.set('client_reference_id', p.clientRef);
    url.searchParams.set('locale', p.lang === 'zh' ? 'zh' : 'en');
    return url.toString();
  } catch {
    return '';
  }
}

export interface PaymentReturn {
  status: 'success' | 'cancel';
  sku?: Sku;
  sessionId?: string;
}

/** 解析支付回跳查询串（?pay=success&sku=ai10&session_id=cs_xxx） */
export function parsePaymentReturn(search: string): PaymentReturn | null {
  const q = new URLSearchParams(search);
  const pay = q.get('pay');
  if (pay !== 'success' && pay !== 'cancel') return null;
  const sku = q.get('sku');
  return {
    status: pay,
    sku: sku === 'once' || sku === 'ai10' || sku === 'pair' || sku === 'year' ? sku : undefined,
    sessionId: q.get('session_id') ?? undefined,
  };
}

/**
 * 回跳落账：success 且带 sku → 写本机凭证（按 sessionId 防重放）。
 * v1 口径（README 明示）：回跳即写本机凭证，服务端核验（Cloudflare Worker）
 * 为上线升级项；无 sessionId 时按本地时间戳去重（同一会话只落一次）。
 * 返回是否新写入（调用方据此提示与水合）。
 */
export async function applyPaymentReturn(ret: PaymentReturn): Promise<boolean> {
  if (ret.status !== 'success' || !ret.sku) return false;
  const id = `lic_stripe_${ret.sessionId ?? `local_${Math.floor(Date.now() / 60_000)}`}`;
  const rows = await licenseRepo.list();
  if (rows.some((r) => r.id === id)) return false;
  await licenseRepo.save({
    id,
    code: id.slice(0, 12),
    sku: ret.sku,
    left: SKU_LEFT[ret.sku],
    boundAt: Date.now(),
    source: 'stripe',
  });
  return true;
}

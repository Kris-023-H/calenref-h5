/**
 * services/pay/creem.ts — Creem（Merchant of Record）支付通道。
 *
 * 与 Stripe 的关键差异：Creem 没有「静态 Payment Link」，必须由服务端调
 * `POST /v1/checkouts` 生成一次性 checkout_url。因此下单要经过同源的
 * Cloudflare Worker（worker/index.ts），API key 只存在于 Worker 的 secret 里，
 * 客户端永远看不到。
 *
 * 落账链路（不信任回跳参数，只信任服务端核验结果）：
 *   ① 前端 POST /api/checkout  → Worker 调 Creem 建单，返回 checkout_url
 *   ② 用户在 Creem 结账页付款  → Creem 回调 Worker 的 webhook（checkout.completed）
 *   ③ 回跳本站 ?paid=1&sku&ref  → 前端拿 ref 轮询 /api/verify
 *   ④ Worker 读 KV 里 webhook 写入的已付标记 → 前端据此写本机凭证
 *
 * 为什么不在回跳时直接写凭证：`?paid=1` 是纯客户端参数，任何人都能手敲。
 * v1 用 Stripe 时这里是个已知缺口（README 明示），改 Creem 后一并堵上。
 */

import type { Sku } from '../../data/prices';
import { SKU_LEFT } from '../../data/prices';
import { licenseRepo } from '../../db/repos/license.repo';

export interface CheckoutParams {
  sku: Sku;
  lang: string;
  /** 本机客户端 id（回跳对齐用，非身份） */
  clientRef: string;
}

export interface PaymentReturn {
  status: 'success' | 'cancel';
  sku?: Sku;
  /** Worker 侧的订单号（request_id），核验凭据 */
  ref?: string;
}

const SKU_SET = new Set<string>(['once', 'ai10', 'pair', 'year']);

function asSku(v: string | null | undefined): Sku | undefined {
  return v && SKU_SET.has(v) ? (v as Sku) : undefined;
}

/**
 * 下单：向同源 Worker 请求 checkout_url。
 * 契约：任何失败（未配置产品、网络错误、非 2xx）一律返回空串，
 * 由 pay-screen 走 `pay.linkFail` 兜底提示，不得抛错（PRD 验收 #5）。
 */
export async function createCheckout(p: CheckoutParams): Promise<string> {
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: p.sku, lang: p.lang, clientRef: p.clientRef }),
    });
    if (!res.ok) return '';
    const data = (await res.json()) as { url?: unknown };
    const url = typeof data.url === 'string' ? data.url : '';
    // 只接受 https 绝对地址，防止把用户送去 javascript: / data: 之类的伪协议
    if (!url.startsWith('https://')) return '';
    return url;
  } catch {
    return '';
  }
}

/** 解析回跳查询串（?paid=1&sku=ai10&ref=zj_xxx） */
export function parsePaymentReturn(search: string): PaymentReturn | null {
  const q = new URLSearchParams(search);
  const pay = q.get('pay');
  if (pay !== 'success' && pay !== 'cancel') return null;
  return {
    status: pay,
    sku: asSku(q.get('sku')),
    ref: q.get('ref') ?? undefined,
  };
}

interface VerifyResult {
  paid: boolean;
  sku?: Sku;
}

/**
 * 向 Worker 核验订单是否已付。
 * webhook 与用户回跳之间存在秒级时间差，故短暂轮询；全部失败即视为未付。
 */
async function verifyOnce(ref: string): Promise<VerifyResult> {
  try {
    const res = await fetch(`/api/verify?ref=${encodeURIComponent(ref)}`);
    if (!res.ok) return { paid: false };
    const data = (await res.json()) as { paid?: unknown; sku?: unknown };
    return {
      paid: data.paid === true,
      sku: asSku(typeof data.sku === 'string' ? data.sku : undefined),
    };
  } catch {
    return { paid: false };
  }
}

/**
 * 核验并落账：确认已付后写本机凭证（按 ref 幂等，重复回跳不会重复加次数）。
 * 返回是否新写入（调用方据此提示与水合）。
 */
export async function applyPaymentReturn(ret: PaymentReturn): Promise<boolean> {
  if (ret.status !== 'success') return false;

  const ref = ret.ref;
  if (!ref) return false;

  let sku: Sku | undefined;
  for (let i = 0; i < 5; i++) {
    const v = await verifyOnce(ref);
    if (v.paid) {
      sku = v.sku ?? ret.sku;
      break;
    }
    // 最后一次不再等待，直接判未付
    if (i < 4) await new Promise((r) => setTimeout(r, 1200));
  }
  if (!sku) return false;

  const id = `lic_creem_${ref}`;
  const rows = await licenseRepo.list();
  if (rows.some((r) => r.id === id)) return false;

  await licenseRepo.save({
    id,
    code: id.slice(0, 12),
    sku,
    left: SKU_LEFT[sku],
    boundAt: Date.now(),
    source: 'creem',
  });
  return true;
}

/**
 * services/pay/gumroad.ts — Gumroad 支付通道。
 *
 * 与上一版 Creem 的关键差异：Gumroad 的结账是**托管页面**，
 * 服务端不需要建单，只要把结账 URL 给前端跳转即可：
 *   `https://<店铺>.gumroad.com/l/<permalink>?wanted=true&email=...`
 * `?wanted=true` 让用户从商品页直接进结账，省掉一次点击。
 * （Gumroad API v2 是只读的 —— 只有 products / sales / payouts /
 * resource_subscriptions，没有建单端点，所以「服务端建单」这条路不存在。）
 *
 * 落账链路（不信任回跳参数，只信任服务端核验结果）：
 *   ① 前端 POST /api/checkout → Worker 记 ref，返回 Gumroad 结账 URL
 *   ② 用户在 Gumroad 结账页付款 → Gumroad Ping 回调 Worker 的 webhook
 *   ③ 回跳本站 ?pay=success&sku&ref → 前端拿 ref 轮询 /api/verify
 *   ④ Worker 读 KV 里 webhook 写入的已付标记 → 前端据此写本机凭证
 *
 * 为什么不在回跳时直接写凭证：`?pay=success` 是纯客户端参数，任何人都能手敲。
 * 只有服务端核验通过才放行。
 *
 * 兜底通道：license key。买家在 Gumroad 拿到 key 后可回站核销
 * （POST /api/verify-license），与 Ping 互为冗余。
 */

import type { Sku } from '../../data/prices';
import { SKU_LEFT } from '../../data/prices';
import { licenseRepo } from '../../db/repos/license.repo';

export interface CheckoutParams {
  sku: Sku;
  lang: string;
  /** 本机客户端 id（回跳对齐用，非身份） */
  clientRef: string;
  /** 买家邮箱（可选，预填 Gumroad 结账表单） */
  email?: string;
}

export interface PaymentReturn {
  status: 'success' | 'cancel';
  sku?: Sku;
  /** Worker 侧的订单号，核验凭据 */
  ref?: string;
}

const SKU_SET = new Set<string>(['once', 'ai10', 'pair', 'year']);

function asSku(v: string | null | undefined): Sku | undefined {
  return v && SKU_SET.has(v) ? (v as Sku) : undefined;
}

/**
 * 下单：向同源 Worker 请求结账 URL。
 * 契约：任何失败（未配置产品、网络错误、非 2xx）一律返回空串，
 * 由 pay-screen 走 `pay.linkFail` 兜底提示，不得抛错（PRD 验收 #5）。
 */
export async function createCheckout(p: CheckoutParams): Promise<string> {
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku: p.sku,
        lang: p.lang,
        clientRef: p.clientRef,
        email: p.email ?? '',
      }),
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

/** 解析回跳查询串（?pay=success&sku=ai10&ref=zj_xxx） */
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

  const id = `lic_gumroad_${ref}`;
  const rows = await licenseRepo.list();
  if (rows.some((r) => r.id === id)) return false;

  await licenseRepo.save({
    id,
    code: id.slice(0, 12),
    sku,
    left: SKU_LEFT[sku],
    boundAt: Date.now(),
    source: 'gumroad',
  });
  return true;
}

/**
 * License key 核销：买家拿 Gumroad 发到的 key 回站兑换。
 *
 * 与 applyPaymentReturn 是两条独立通道 —— 后者依赖回跳 + Ping，
 * 前者只依赖买家手里的 key。两者都成功才算解锁。
 */
export async function redeemLicenseKey(key: string): Promise<{ ok: boolean; sku?: Sku }> {
  try {
    const res = await fetch(`/api/verify-license?key=${encodeURIComponent(key.trim())}`);
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as { valid?: unknown; sku?: unknown };
    if (data.valid !== true) return { ok: false };
    const sku = asSku(typeof data.sku === 'string' ? data.sku : undefined);
    if (!sku) return { ok: false };

    const id = `lic_gumroad_key_${key.trim().slice(0, 24)}`;
    const rows = await licenseRepo.list();
    if (!rows.some((r) => r.id === id)) {
      await licenseRepo.save({
        id,
        code: id.slice(0, 12),
        sku,
        left: SKU_LEFT[sku],
        boundAt: Date.now(),
        source: 'gumroad',
      });
    }
    return { ok: true, sku };
  } catch {
    return { ok: false };
  }
}

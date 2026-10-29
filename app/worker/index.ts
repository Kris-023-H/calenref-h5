/**
 * worker/index.ts — 同源 API（Creem 下单/核验 + 兑换码核销）+ 静态资源 + 安全头。
 *
 * 为什么要在同一个 Worker 里：前端用相对路径 `/api/*` 调用，同源就没有 CORS；
 * 静态资源由 [assets] 绑定接管。`run_worker_first = true` 让本 Worker 接管
 * 全部请求，从而能给 HTML / 静态资源也加上安全响应头与缓存策略。
 *
 * 安全边界：
 *   · CREEM_API_KEY / REDEEM_SECRET 只存在于 Worker secret，客户端永远看不到；
 *   · 回跳参数 `?paid=1` 不可信 —— 前端必须拿 ref 回来问本 Worker，
 *     由本 Worker 调 Creem 查单确认 status === 'completed' 才放行；
 *   · 兑换码服务端验签、SKU 以载荷首字母为准、KV 一次性核销；
 *   · ref / 兑换码有严格格式校验，避免被用来枚举 KV 键。
 */

import { CREEM_PRODUCTS, isPlaceholderProduct } from '../src/data/prices';
import { parseCode, verifyCode } from '../src/services/pay/redeem-crypto';

/** 只声明用到的部分，避免为一个类型包引入整个 @cloudflare/workers-types */
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

export interface Env {
  ASSETS: Fetcher;
  /** KV：ref → { sku, checkoutId }、已付标记、兑换码核销记录 */
  ORDERS?: KVNamespace;
  /** Creem API key（wrangler secret put CREEM_API_KEY） */
  CREEM_API_KEY?: string;
  /** https://api.creem.io/v1（测试环境为 https://test-api.creem.io/v1） */
  CREEM_API_BASE?: string;
  /** 站点根地址，用于拼 success_url；缺省取请求 origin */
  SITE_URL?: string;
  /** 兑换码签名密钥（wrangler secret put REDEEM_SECRET） */
  REDEEM_SECRET?: string;
  /** 可选的按环境覆盖产品 ID（测试 Worker 用 [vars] 指向测试产品） */
  CREEM_PRODUCT_ONCE?: string;
  CREEM_PRODUCT_AI10?: string;
  CREEM_PRODUCT_PAIR?: string;
  CREEM_PRODUCT_YEAR?: string;
}

const SKU_SET = new Set<string>(['once', 'ai10', 'pair', 'year']);
/** ref 形如 zj_ + 20 位十六进制；严格校验，防止拿它去扫 KV */
const REF_RE = /^zj_[A-Za-z0-9]{8,64}$/;
const ORDER_TTL = 60 * 60 * 24 * 7;
/** 兑换码核销记录保留 3 年（足够覆盖售后与对账） */
const REDEEM_TTL = 60 * 60 * 24 * 365 * 3;

/** 全站安全响应头（对 HTML / 静态资源 / API 一视同仁） */
function securityHeaders(): Record<string, string> {
  return {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'geolocation=(), microphone=(), camera=()',
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    // 最小 CSP：只做防点击劫持 / base 注入 / 表单外发，不限制脚本与样式，
    // 避免误伤 SPA、PWA（blob manifest）与 GA4。需要更严可后续再加 nonce。
    'content-security-policy': "frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  };
}

/** 给任意响应套上安全头（静态资源也走这里） */
function withSecurity(res: Response): Response {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(securityHeaders())) h.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...securityHeaders(),
    },
  });
}

/** 产品 ID：环境变量优先（测试环境），否则用 prices.ts 里的生产默认值 */
function productIdFor(env: Env, sku: string): string | undefined {
  const override: Record<string, string | undefined> = {
    once: env.CREEM_PRODUCT_ONCE,
    ai10: env.CREEM_PRODUCT_AI10,
    pair: env.CREEM_PRODUCT_PAIR,
    year: env.CREEM_PRODUCT_YEAR,
  };
  return override[sku] || CREEM_PRODUCTS[sku as keyof typeof CREEM_PRODUCTS];
}

function creemFetch(env: Env, path: string, init?: RequestInit): Promise<Response> {
  const base = (env.CREEM_API_BASE || 'https://api.creem.io/v1').replace(/\/+$/, '');
  return fetch(`${base}${path}`, {
    ...init,
    headers: {
      'x-api-key': env.CREEM_API_KEY ?? '',
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

/** 下单：POST /api/checkout { sku, lang, clientRef } → { url } */
async function handleCheckout(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!env.CREEM_API_KEY) return json({ error: 'not_configured' }, 503);
  if (!env.ORDERS) return json({ error: 'not_configured' }, 503);

  let body: { sku?: unknown; lang?: unknown; clientRef?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: 'bad_json' }, 400);
  }

  const sku = typeof body.sku === 'string' ? body.sku : '';
  if (!SKU_SET.has(sku)) return json({ error: 'bad_sku' }, 400);

  const productId = productIdFor(env, sku);
  if (isPlaceholderProduct(productId)) return json({ error: 'product_not_configured' }, 503);

  const ref = `zj_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
  const site = (env.SITE_URL || new URL(request.url).origin).replace(/\/+$/, '');
  const successUrl = `${site}/?paid=1&sku=${sku}&ref=${ref}`;

  const res = await creemFetch(env, '/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      product_id: productId,
      request_id: ref,
      success_url: successUrl,
      metadata: {
        sku,
        clientRef: String(body.clientRef ?? '').slice(0, 64),
        lang: String(body.lang ?? 'zh').slice(0, 8),
      },
    }),
  });
  if (!res.ok) return json({ error: 'creem_error' }, 502);

  const data = (await res.json()) as { id?: unknown; checkout_url?: unknown };
  if (typeof data.id !== 'string' || typeof data.checkout_url !== 'string') {
    return json({ error: 'creem_bad_response' }, 502);
  }

  // 存 ref → checkoutId：回跳时只带 ref，靠这条映射反查 Creem 的真实单据
  await env.ORDERS.put(`order:${ref}`, JSON.stringify({ sku, checkoutId: data.id }), {
    expirationTtl: ORDER_TTL,
  });
  return json({ url: data.checkout_url });
}

/** 核验：GET /api/verify?ref=xxx → { paid, sku?, serverNow } */
async function handleVerify(url: URL, env: Env): Promise<Response> {
  const serverNow = Date.now();
  const ref = url.searchParams.get('ref') ?? '';
  if (!REF_RE.test(ref)) return json({ paid: false, serverNow }, 404);
  if (!env.CREEM_API_KEY || !env.ORDERS) return json({ paid: false, serverNow }, 503);

  // 已付标记优先：一次确认后不必每次都打 Creem
  const paidSku = await env.ORDERS.get(`paid:${ref}`);
  if (paidSku) return json({ paid: true, sku: paidSku, serverNow });

  const raw = await env.ORDERS.get(`order:${ref}`);
  if (!raw) return json({ paid: false, serverNow }, 404);

  let order: { sku?: string; checkoutId?: string };
  try {
    order = JSON.parse(raw) as typeof order;
  } catch {
    return json({ paid: false, serverNow });
  }
  if (!order.checkoutId) return json({ paid: false, serverNow }, 404);

  const res = await creemFetch(env, `/checkouts?checkout_id=${encodeURIComponent(order.checkoutId)}`);
  if (!res.ok) return json({ paid: false, serverNow }, 502);

  const data = (await res.json()) as { status?: unknown };
  if (data.status !== 'completed') return json({ paid: false, serverNow });

  const sku = order.sku ?? '';
  if (!SKU_SET.has(sku)) return json({ paid: false, serverNow });
  await env.ORDERS.put(`paid:${ref}`, sku, { expirationTtl: ORDER_TTL });
  return json({ paid: true, sku, serverNow });
}

/** 兑换：POST /api/redeem { code } → { ok, sku, licenseId } | 4xx */
async function handleRedeem(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!env.REDEEM_SECRET) return json({ ok: false, error: 'not_configured' }, 503);
  if (!env.ORDERS) return json({ ok: false, error: 'not_configured' }, 503);

  let body: { code?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }

  const raw = typeof body.code === 'string' ? body.code : '';
  const parsed = parseCode(raw);
  if (!parsed) return json({ ok: false, error: 'invalid' }, 400);

  const sku = await verifyCode(parsed, env.REDEEM_SECRET);
  if (!sku) return json({ ok: false, error: 'invalid' }, 400);

  const licenseId = `lic_${parsed.payload}`;
  const used = await env.ORDERS.get(`redeem:${licenseId}`);
  if (used) return json({ ok: false, error: 'used' }, 409);

  await env.ORDERS.put(`redeem:${licenseId}`, JSON.stringify({ sku, usedAt: Date.now() }), {
    expirationTtl: REDEEM_TTL,
  });
  return json({ ok: true, sku, licenseId });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const p = url.pathname;

    // ---- API：未命中的 /api/* 一律 404 JSON，绝不回退成 index.html ----
    if (p.startsWith('/api/')) {
      switch (p) {
        case '/api/checkout':
          return handleCheckout(request, env);
        case '/api/verify':
          return handleVerify(url, env);
        case '/api/redeem':
          return handleRedeem(request, env);
        default:
          return json({ error: 'not_found' }, 404);
      }
    }

    // ---- 静态资源 ----
    const res = await env.ASSETS.fetch(request);

    // 缺失的 hashed 资源 / 图标不应回退成 index.html（否则监控把 404 误判成 200）
    if (p.startsWith('/assets/') || p.startsWith('/icons/')) {
      const ct = res.headers.get('content-type') || '';
      if (res.status === 404 || ct.includes('text/html')) {
        return withSecurity(
          new Response('Not Found', {
            status: 404,
            headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
          }),
        );
      }
      // 带内容哈希的 /assets/*：一年强缓存 + immutable
      if (p.startsWith('/assets/')) {
        const h = new Headers(res.headers);
        h.set('cache-control', 'public, max-age=31536000, immutable');
        return withSecurity(new Response(res.body, { status: res.status, headers: h }));
      }
    }

    return withSecurity(res);
  },
};

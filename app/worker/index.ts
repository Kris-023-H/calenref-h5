/**
 * worker/index.ts — 同源 API（Creem 下单/核验）+ 静态资源。
 *
 * 为什么要在同一个 Worker 里：前端用相对路径 `/api/checkout` 调用，
 * 同源就没有 CORS、也不需要额外配置接口域名；静态资源由 [assets] 绑定接管，
 * 未命中 /api/* 的请求原样交给 ASSETS，深链回退照旧生效。
 *
 * 安全边界：
 *   · CREEM_API_KEY 只存在于 Worker secret，客户端永远看不到；
 *   · 回跳参数 `?paid=1` 不可信 —— 前端必须拿 ref 回来问本 Worker，
 *     由本 Worker 调 Creem 查单确认 status === 'completed' 才放行；
 *   · ref 有严格格式校验，避免被用来枚举 KV 键。
 */

import { CREEM_PRODUCTS, isPlaceholderProduct } from '../src/data/prices';

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
  /** KV：ref → { sku, checkoutId } 与已付标记 */
  ORDERS?: KVNamespace;
  /** Creem API key（wrangler secret put CREEM_API_KEY） */
  CREEM_API_KEY?: string;
  /** https://api.creem.io/v1（测试环境为 https://test-api.creem.io/v1） */
  CREEM_API_BASE?: string;
  /** 站点根地址，用于拼 success_url；缺省取请求 origin */
  SITE_URL?: string;
  /**
   * 可选的按环境覆盖产品 ID。
   * 生产用 src/data/prices.ts 里的默认值；测试 Worker 通过 [vars] 指向测试产品，
   * 这样同一份构建产物可以同时服务两套环境，不必改代码。
   */
  CREEM_PRODUCT_ONCE?: string;
  CREEM_PRODUCT_AI10?: string;
  CREEM_PRODUCT_PAIR?: string;
  CREEM_PRODUCT_YEAR?: string;
}

const SKU_SET = new Set<string>(['once', 'ai10', 'pair', 'year']);
/** ref 形如 zj_ + 20 位十六进制；严格校验，防止拿它去扫 KV */
const REF_RE = /^zj_[A-Za-z0-9]{8,64}$/;
const ORDER_TTL = 60 * 60 * 24 * 7;

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

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
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

/** 核验：GET /api/verify?ref=xxx → { paid, sku? } */
async function handleVerify(url: URL, env: Env): Promise<Response> {
  const ref = url.searchParams.get('ref') ?? '';
  if (!REF_RE.test(ref)) return json({ paid: false });
  if (!env.CREEM_API_KEY || !env.ORDERS) return json({ paid: false });

  // 已付标记优先：一次确认后不必每次都打 Creem
  const paidSku = await env.ORDERS.get(`paid:${ref}`);
  if (paidSku) return json({ paid: true, sku: paidSku });

  const raw = await env.ORDERS.get(`order:${ref}`);
  if (!raw) return json({ paid: false });

  let order: { sku?: string; checkoutId?: string };
  try {
    order = JSON.parse(raw) as typeof order;
  } catch {
    return json({ paid: false });
  }
  if (!order.checkoutId) return json({ paid: false });

  const res = await creemFetch(env, `/checkouts?checkout_id=${encodeURIComponent(order.checkoutId)}`);
  if (!res.ok) return json({ paid: false });

  const data = (await res.json()) as { status?: unknown };
  if (data.status !== 'completed') return json({ paid: false });

  const sku = order.sku ?? '';
  if (!SKU_SET.has(sku)) return json({ paid: false });
  await env.ORDERS.put(`paid:${ref}`, sku, { expirationTtl: ORDER_TTL });
  return json({ paid: true, sku });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    switch (url.pathname) {
      case '/api/checkout':
        return handleCheckout(request, env);
      case '/api/verify':
        return handleVerify(url, env);
      default:
        return env.ASSETS.fetch(request);
    }
  },
};

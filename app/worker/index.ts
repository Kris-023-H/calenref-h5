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

import { CREEM_PRODUCTS, OFFERED_SKUS, isPlaceholderProduct } from '../src/data/prices';
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
  /** Creem webhook 签名密钥（wrangler secret put CREEM_WEBHOOK_SECRET）。
   *  未配置时 webhook 仍可用（按 checkout id 落账），但不校验签名。 */
  CREEM_WEBHOOK_SECRET?: string;
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

/** 法务页真 URL：这四个路径必须直接返回可渲染的入口（Creem 硬性要求） */
const LEGAL_PATHS = new Set(['/privacy', '/terms', '/refund', '/cookies']);

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
  // 反向索引 checkoutId → ref：webhook 回调只带 checkout 对象，没有 ref
  await env.ORDERS.put(`chk:${data.id}`, ref, { expirationTtl: ORDER_TTL });
  return json({ url: data.checkout_url });
}

/** 常数时间比较，避免签名比对被计时侧信道利用 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** 校验 Creem webhook 签名（HMAC-SHA256 hex，头名 creem-signature） */
async function creemSignatureValid(raw: string, header: string, secret: string): Promise<boolean> {
  const hex = header.trim().replace(/^sha256=/i, '');
  if (!/^[0-9a-f]{64}$/i.test(hex)) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw));
  const expect = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return timingSafeEqual(expect, hex.toLowerCase());
}

/** webhook 收到笔数（healthz 可观测用；KV 无原子自增，容忍并发丢计数） */
async function bumpWebhookCount(env: Env): Promise<number> {
  if (!env.ORDERS) return 0;
  const cur = Number((await env.ORDERS.get('stat:webhook')) ?? '0') || 0;
  const next = cur + 1;
  await env.ORDERS.put('stat:webhook', String(next));
  return next;
}

/**
 * Webhook：POST /api/webhook/creem
 *
 * 为什么要有：`/api/verify` 是「用户回到站点后主动查单」，链路成立但依赖回跳；
 * 用户付完直接关页面就不会落账。webhook 是服务端到服务端的兜底，也是
 * 审核方实测下单时预期看到的履约痕迹。
 *
 * 落账规则：checkout.completed → 用 checkout id 反查 ref → 写 paid:<ref>。
 * 反查不到（老订单没有 chk 索引）时退化为 paidchk:<checkoutId>，verify 会兜住。
 */
async function handleWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  if (!env.ORDERS) return json({ ok: false, error: 'not_configured' }, 503);

  const raw = await request.text();

  if (env.CREEM_WEBHOOK_SECRET) {
    const sig = request.headers.get('creem-signature') ?? '';
    if (!(await creemSignatureValid(raw, sig, env.CREEM_WEBHOOK_SECRET))) {
      return json({ ok: false, error: 'bad_signature' }, 401);
    }
  }

  let evt: {
    eventType?: string;
    event_type?: string;
    object?: { id?: string; status?: string; metadata?: { sku?: string } };
  };
  try {
    evt = JSON.parse(raw) as typeof evt;
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }

  await bumpWebhookCount(env);

  const type = evt.eventType ?? evt.event_type ?? '';
  if (type !== 'checkout.completed') return json({ ok: true, ignored: type || 'unknown' });

  const checkout = evt.object ?? {};
  const checkoutId = typeof checkout.id === 'string' ? checkout.id : '';
  if (!checkoutId) return json({ ok: true, ignored: 'no_checkout_id' });

  const ref = await env.ORDERS.get(`chk:${checkoutId}`);
  let sku = typeof checkout.metadata?.sku === 'string' ? checkout.metadata.sku : '';

  if (ref) {
    const rawOrder = await env.ORDERS.get(`order:${ref}`);
    if (!sku && rawOrder) {
      try {
        sku = (JSON.parse(rawOrder) as { sku?: string }).sku ?? '';
      } catch {
        sku = '';
      }
    }
    if (!SKU_SET.has(sku)) return json({ ok: true, ignored: 'unknown_sku' });
    await env.ORDERS.put(`paid:${ref}`, sku, { expirationTtl: ORDER_TTL });
    await env.ORDERS.put(`via:${ref}`, 'webhook', { expirationTtl: ORDER_TTL });
    return json({ ok: true, ref, sku });
  }

  // 反查不到 ref：仍记下 checkout 级别的已付标记，verify 会按 checkoutId 兜住
  if (!SKU_SET.has(sku)) return json({ ok: true, ignored: 'no_ref_no_sku' });
  await env.ORDERS.put(`paidchk:${checkoutId}`, sku, { expirationTtl: ORDER_TTL });
  return json({ ok: true, checkoutId, sku, degraded: true });
}

/** 健康检查：GET /api/healthz —— 让远程排障不必猜配置 */
async function handleHealth(env: Env): Promise<Response> {
  const received = env.ORDERS ? Number((await env.ORDERS.get('stat:webhook')) ?? '0') || 0 : 0;
  return json({
    ok: true,
    service: 'chinese-date-planner',
    time: Date.now(),
    checkout: {
      configured: Boolean(env.CREEM_API_KEY && env.ORDERS),
      apiBase: env.CREEM_API_BASE || 'https://api.creem.io/v1',
    },
    kv: { bound: Boolean(env.ORDERS) },
    redeem: { configured: Boolean(env.REDEEM_SECRET) },
    webhook: {
      endpoint: '/api/webhook/creem',
      signatureRequired: Boolean(env.CREEM_WEBHOOK_SECRET),
      received,
    },
    fulfillment: ['poll:/api/verify', 'webhook:/api/webhook/creem'],
    skus: [...SKU_SET],
    offeredSkus: OFFERED_SKUS,
  });
}

/** 核验：GET /api/verify?ref=xxx → { paid, sku?, serverNow } */
async function handleVerify(url: URL, env: Env): Promise<Response> {
  const serverNow = Date.now();
  const ref = url.searchParams.get('ref') ?? '';
  if (!REF_RE.test(ref)) return json({ paid: false, serverNow }, 404);
  if (!env.CREEM_API_KEY || !env.ORDERS) return json({ paid: false, serverNow }, 503);

  // 已付标记优先：一次确认后不必每次都打 Creem
  const paidSku = await env.ORDERS.get(`paid:${ref}`);
  if (paidSku) {
    const via = await env.ORDERS.get(`via:${ref}`);
    return json({ paid: true, sku: paidSku, fulfilledBy: via === 'webhook' ? 'webhook' : 'cached', serverNow });
  }

  const raw = await env.ORDERS.get(`order:${ref}`);
  if (!raw) return json({ paid: false, serverNow }, 404);

  let order: { sku?: string; checkoutId?: string };
  try {
    order = JSON.parse(raw) as typeof order;
  } catch {
    return json({ paid: false, serverNow });
  }
  if (!order.checkoutId) return json({ paid: false, serverNow }, 404);

  // webhook 先到、ref 索引已过期时的兜底：checkout 级别已付标记
  const paidByCheckout = await env.ORDERS.get(`paidchk:${order.checkoutId}`);
  if (paidByCheckout) {
    await env.ORDERS.put(`paid:${ref}`, paidByCheckout, { expirationTtl: ORDER_TTL });
    return json({ paid: true, sku: paidByCheckout, fulfilledBy: 'webhook', serverNow });
  }

  const res = await creemFetch(env, `/checkouts?checkout_id=${encodeURIComponent(order.checkoutId)}`);
  if (!res.ok) return json({ paid: false, serverNow }, 502);

  const data = (await res.json()) as { status?: unknown };
  if (data.status !== 'completed') return json({ paid: false, serverNow });

  const sku = order.sku ?? '';
  if (!SKU_SET.has(sku)) return json({ paid: false, serverNow });
  await env.ORDERS.put(`paid:${ref}`, sku, { expirationTtl: ORDER_TTL });
  return json({ paid: true, sku, fulfilledBy: 'poll', serverNow });
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
        case '/api/webhook/creem':
        case '/api/webhook':
          return handleWebhook(request, env);
        case '/api/healthz':
          return handleHealth(env);
        default:
          return json({ error: 'not_found' }, 404);
      }
    }

    // ---- 法务页真 URL：/privacy 等四条路径必须 200 且渲染对应正文 ----
    // 之前只认 ?legal= 查询串，/privacy 落到 SPA 兜底、返回首页壳，
    // 审核员点开看到的是首页 —— 这是 Creem checklist 的硬性项。
    // 这里只保证 200 + 正确的 HTML 入口；正文由前端读 pathname 后渲染。
    if (LEGAL_PATHS.has(p.replace(/\/+$/, '') || '/')) {
      const res = await env.ASSETS.fetch(request);
      const h = new Headers(res.headers);
      h.set('cache-control', 'public, max-age=0, must-revalidate');
      return withSecurity(new Response(res.body, { status: 200, headers: h }));
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

/**
 * worker/index.ts — 同源 API（Gumroad 结账/核验 + 兑换码核销）+ 静态资源 + 安全头。
 *
 * 为什么要在同一个 Worker 里：前端用相对路径 `/api/*` 调用，同源就没有 CORS；
 * 静态资源由 [assets] 绑定接管。`run_worker_first = true` 让本 Worker 接管
 * 全部请求，从而能给 HTML / 静态资源也加上安全响应头与缓存策略。
 *
 * 安全边界：
 *   · GUMROAD_ACCESS_TOKEN / REDEEM_SECRET 只存在于 Worker secret，客户端永远看不到；
 *   · 回跳参数 `?paid=1` 不可信 —— 前端必须拿 ref 回来问本 Worker，
 *     由本 Worker 查 Gumroad 订单确认已付才放行；
 *   · 兑换码服务端验签、SKU 以载荷首字母为准、KV 一次性核销；
 *   · ref / 兑换码有严格格式校验，避免被用来枚举 KV 键。
 *
 * 支付通道说明（Creem → Gumroad）：
 *   上一版 Creem 被拒（类目红线）且无申诉机会，产品已换到 Gumroad。
 *   Gumroad 的 checkout 是托管页面 —— `?wanted=true` 直接进结账，
 *   不需要服务端建单（Gumroad API v2 是只读的，没有建单端点）。
 *   落账仍走服务端核验：Gumroad Ping 回调写已付标记，
 *   前端拿 ref 轮询 /api/verify 确认。
 */

import {
  GUMROAD_PRODUCTS,
  GUMROAD_PERMALINKS,
  GUMROAD_STORE,
  OFFERED_SKUS,
  isPlaceholderProduct,
} from '../src/data/prices';
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
  /** KV：ref → { sku, orderId }、已付标记、兑换码核销记录 */
  ORDERS?: KVNamespace;
  /** Gumroad API 访问令牌（wrangler secret put GUMROAD_ACCESS_TOKEN） */
  GUMROAD_ACCESS_TOKEN?: string;
  /** Gumroad Ping 目标地址附带的 secret（webhook 签名用） */
  GUMROAD_PING_SECRET?: string;
  /** 站点根地址，用于拼 success_url；缺省取请求 origin */
  SITE_URL?: string;
  /** 兑换码签名密钥（wrangler secret put REDEEM_SECRET） */
  REDEEM_SECRET?: string;
  /** 可选的按环境覆盖产品 ID（测试 Worker 用 [vars] 指向测试产品） */
  GUMROAD_PRODUCT_ONCE?: string;
  GUMROAD_PRODUCT_AI10?: string;
  GUMROAD_PRODUCT_PAIR?: string;
  GUMROAD_PRODUCT_YEAR?: string;
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
    once: env.GUMROAD_PRODUCT_ONCE,
    ai10: env.GUMROAD_PRODUCT_AI10,
    pair: env.GUMROAD_PRODUCT_PAIR,
    year: env.GUMROAD_PRODUCT_YEAR,
  };
  return override[sku] || GUMROAD_PRODUCTS[sku as keyof typeof GUMROAD_PRODUCTS];
}

/** SKU → Gumroad 产品 ID（用于把 Ping 回调里的 product_id 映射回 SKU） */
function skuForProductId(env: Env, productId: string): string | undefined {
  for (const sku of Object.keys(GUMROAD_PRODUCTS) as (keyof typeof GUMROAD_PRODUCTS)[]) {
    const id = productIdFor(env, sku);
    if (id && id === productId) return sku;
  }
  return undefined;
}

/**
 * Gumroad API 调用。
 *
 * 认证：Doorkeeper Bearer + access_token。Gumroad 官方文档给的写法是
 * `curl https://api.gumroad.com/v2/products -d "access_token=TOKEN" -X GET`
 * —— access_token 放 body。但**Cloudflare Workers 运行时不接受 GET 带 body**
 * （直接抛 1101 Worker 异常），所以这里按 method 分流：
 *   · GET  → access_token 拼进 query（实测 200，与 body 形式等价）
 *   · POST → access_token 放 form body
 * 两种都带上 Bearer 头，兼容 Gumroad 后续版本只认其中一种的情况。
 */
function gumroadFetch(env: Env, path: string, init?: RequestInit): Promise<Response> {
  const token = env.GUMROAD_ACCESS_TOKEN ?? '';
  const base = 'https://api.gumroad.com';
  const method = (init?.method ?? 'GET').toUpperCase();

  const headers = new Headers(init?.headers);
  headers.set('accept', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);

  if (!token) return fetch(`${base}${path}`, { ...init, headers });

  if (method === 'GET' || method === 'HEAD') {
    // query 传参：保留 path 里已有的查询串
    const [p, q = ''] = path.split('?');
    const params = new URLSearchParams(q);
    params.set('access_token', token);
    return fetch(`${base}${p}?${params.toString()}`, { ...init, method, headers });
  }

  headers.set('content-type', 'application/x-www-form-urlencoded');
  return fetch(`${base}${path}`, {
    ...init,
    method,
    headers,
    body: `access_token=${encodeURIComponent(token)}`,
  });
}

/**
 * 下单：POST /api/checkout { sku, lang, clientRef, email? } → { url }
 *
 * 与 Creem 的关键差异：Gumroad 不需要服务端建单。
 * 结账是 Gumroad 托管页面（`/l/<permalink>?wanted=true` 直达结账），
 * 本接口只负责：
 *   ① 校验 SKU 与产品是否就位；
 *   ② 造一个 ref 记进 KV，供回跳后核验；
 *   ③ 把 Gumroad 结账 URL 交给前端跳转。
 *
 * 回跳地址带 ref：Gumroad 支持在商品页设置 post-purchase 跳转，
 * 也可用 license key 通道（买家拿到 key 后回站兑换）。
 */
async function handleCheckout(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!env.ORDERS) return json({ error: 'not_configured' }, 503);

  let body: { sku?: unknown; lang?: unknown; clientRef?: unknown; email?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: 'bad_json' }, 400);
  }

  const sku = typeof body.sku === 'string' ? body.sku : '';
  if (!SKU_SET.has(sku)) return json({ error: 'bad_sku' }, 400);

  const productId = productIdFor(env, sku);
  if (isPlaceholderProduct(productId)) return json({ error: 'product_not_configured' }, 503);
  if (!GUMROAD_PERMALINKS[sku as keyof typeof GUMROAD_PERMALINKS]) {
    return json({ error: 'product_not_configured' }, 503);
  }

  const ref = `zj_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
  const site = (env.SITE_URL || new URL(request.url).origin).replace(/\/+$/, '');

  // Gumroad 结账 URL：直达结账页，并预填邮箱（买家少填一项）
  const email = typeof body.email === 'string' ? body.email.slice(0, 120) : '';
  const query = new URLSearchParams({ wanted: 'true' });
  if (email) query.set('email', email);
  const url = `https://${GUMROAD_STORE}/l/${GUMROAD_PERMALINKS[sku as keyof typeof GUMROAD_PERMALINKS]}?${query.toString()}`;

  // 记 ref → { sku, productId }：回跳与 Ping 回调都靠它把订单对上 SKU
  await env.ORDERS.put(`order:${ref}`, JSON.stringify({ sku, productId, site }), {
    expirationTtl: ORDER_TTL,
  });
  // 邮箱反查索引：Gumroad Ping 只带邮箱（没有我们的 ref），
  // 靠它把回调对上具体订单。同一邮箱再次下单会覆盖为最新 ref。
  if (email) {
    await env.ORDERS.put(`email:${email.toLowerCase()}`, ref, { expirationTtl: ORDER_TTL });
    await env.ORDERS.put(`email:${ref}`, email.toLowerCase(), { expirationTtl: ORDER_TTL });
  }
  return json({ url, ref });
}

/** 常数时间比较，避免签名比对被计时侧信道利用 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** 校验 Gumroad Ping 签名（HMAC-SHA256 hex，头名 x-gumroad-signature） */
async function gumroadSignatureValid(raw: string, header: string, secret: string): Promise<boolean> {
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
 * Webhook：POST /api/webhook/gumroad
 *
 * 为什么要有：`/api/verify` 是「用户回到站点后主动查单」，链路成立但依赖回跳；
 * 用户付完直接关页面就不会落账。webhook 是服务端到服务端的兜底，也是
 * 审核方实测下单时预期看到的履约痕迹。
 *
 * Gumroad Ping 两种投递形态都要兼容：
 *   ① 表单 POST —— 字段 product_id / product_name / price / currency /
 *      quantity / email / sale_id / sale_timestamp / is_paid / test，
 *      secret 放在 body 的 `secret` 字段；
 *   ② JSON POST —— 同样字段，外加 x-gumroad-signature 头（HMAC-SHA256）。
 *
 * 落账规则：is_paid 为真 → 用 product_id 反查 SKU → 写 paid:<ref>。
 * Ping 不带 ref（ref 是我们本地的），所以靠 email + 时间窗反查最近一笔
 * 未落账订单；对不上就退化到 license key 通道（见 handleLicenseVerify）。
 */
async function handleGumroadWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  if (!env.ORDERS) return json({ ok: false, error: 'not_configured' }, 503);

  const raw = await request.text();

  // 验签：优先用 HMAC 头；没有则退到 body 的 secret 字段（Gumroad 传统 Ping 形态）
  if (env.GUMROAD_PING_SECRET) {
    const sig = request.headers.get('x-gumroad-signature') ?? '';
    if (sig) {
      if (!(await gumroadSignatureValid(raw, sig, env.GUMROAD_PING_SECRET))) {
        return json({ ok: false, error: 'bad_signature' }, 401);
      }
    } else {
      let secret = '';
      try {
        const parsed = JSON.parse(raw) as { secret?: unknown };
        secret = typeof parsed.secret === 'string' ? parsed.secret : '';
      } catch {
        const form = new URLSearchParams(raw);
        secret = form.get('secret') ?? '';
      }
      if (!secret || !timingSafeEqual(secret, env.GUMROAD_PING_SECRET)) {
        return json({ ok: false, error: 'bad_signature' }, 401);
      }
    }
  }

  let evt: {
    product_id?: unknown;
    product_name?: unknown;
    price?: unknown;
    currency?: unknown;
    quantity?: unknown;
    email?: unknown;
    sale_id?: unknown;
    sale_timestamp?: unknown;
    is_paid?: unknown;
    test?: unknown;
    secret?: unknown;
  };
  try {
    evt = JSON.parse(raw) as typeof evt;
  } catch {
    const form = new URLSearchParams(raw);
    evt = Object.fromEntries(form.entries()) as typeof evt;
  }

  await bumpWebhookCount(env);

  // 测试单不落账（Gumroad 后台「测试购买」不发货）
  if (evt.test === true || evt.test === 'true') {
    return json({ ok: true, ignored: 'test' });
  }

  const isPaid = evt.is_paid === true || evt.is_paid === 'true';
  if (!isPaid) return json({ ok: true, ignored: 'not_paid' });

  const productId = typeof evt.product_id === 'string' ? evt.product_id : '';
  const sku = productId ? skuForProductId(env, productId) : undefined;
  if (!sku) return json({ ok: true, ignored: 'unknown_product' });

  const email = typeof evt.email === 'string' ? evt.email.toLowerCase() : '';
  const saleId = typeof evt.sale_id === 'string' ? evt.sale_id : '';

  // 反查 ref：优先用 sale_id 索引；否则用 email 索引
  let ref = '';
  if (saleId) ref = (await env.ORDERS.get(`sale:${saleId}`)) ?? '';
  if (!ref && email) ref = (await env.ORDERS.get(`email:${email}`)) ?? '';

  if (!ref) {
    // 对不上具体订单也先把 sale 记下来，license key 通道与人工核对都能用
    if (saleId) {
      await env.ORDERS.put(`sale:${saleId}`, JSON.stringify({ sku, email }), {
        expirationTtl: ORDER_TTL,
      });
    }
    return json({ ok: true, sku, saleId, degraded: true });
  }

  await env.ORDERS.put(`paid:${ref}`, sku, { expirationTtl: ORDER_TTL });
  await env.ORDERS.put(`via:${ref}`, 'gumroad-webhook', { expirationTtl: ORDER_TTL });
  if (saleId) {
    await env.ORDERS.put(`sale:${saleId}`, JSON.stringify({ sku, email, ref }), {
      expirationTtl: ORDER_TTL,
    });
  }
  return json({ ok: true, ref, sku });
}

/**
 * License key 核验：GET /api/verify-license?key=xxx → { valid, sku? }
 *
 * 为什么不只靠 webhook：Gumroad 的 Ping 需要在商品设置里配回调地址，
 * 配置之前（或买家关页面早于回调）就收不到。License key 是买家侧凭证，
 * 买家拿到 key 后可随时回来核销 —— 两条通道互为冗余。
 *
 * 核验方式：**Gumroad 没有 license 独立端点**（实测 /v2/licenses 与
 * /v2/licenses/verify 都是 404）。license key 只出现在 /v2/sales 的
 * 每条销售记录里，所以核验 = 拉销售列表、按 license_key 精确匹配。
 * 匹配到再按 product_id 反查 SKU，两步都成立才算有效。
 *
 * 本地已落库的 license → sku 优先（Ping 到过时已记下，免一次远端调用）。
 */
async function handleLicenseVerify(url: URL, env: Env): Promise<Response> {
  const key = (url.searchParams.get('key') ?? '').trim();
  if (!key || key.length > 128) return json({ valid: false }, 400);
  if (!env.ORDERS) return json({ valid: false }, 503);

  // 本地已落库的 license → sku（Ping 或人工录入）
  const local = await env.ORDERS.get(`lic:${key}`);
  if (local) return json({ valid: true, sku: local, via: 'local' });

  if (!env.GUMROAD_ACCESS_TOKEN) return json({ valid: false, reason: 'no_token' }, 503);

  const res = await gumroadFetch(env, '/v2/sales');
  if (!res.ok) return json({ valid: false, reason: 'verify_failed' }, 502);

  const data = (await res.json()) as {
    success?: unknown;
    sales?: { license_key?: unknown; product_id?: unknown; refunded?: unknown }[];
  };
  if (data.success !== true || !Array.isArray(data.sales)) {
    return json({ valid: false, reason: 'verify_failed' }, 502);
  }

  // license key 精确匹配（大小写敏感）；已退款的单不算有效
  const hit = data.sales.find(
    (s) => typeof s.license_key === 'string' && s.license_key === key && s.refunded !== true,
  );
  if (!hit) return json({ valid: false });

  const productId = typeof hit.product_id === 'string' ? hit.product_id : '';
  const sku = productId ? skuForProductId(env, productId) : undefined;
  if (!sku) return json({ valid: false, reason: 'unknown_product' });

  await env.ORDERS.put(`lic:${key}`, sku, { expirationTtl: REDEEM_TTL });
  return json({ valid: true, sku, via: 'gumroad' });
}

/** 健康检查：GET /api/healthz —— 让远程排障不必猜配置 */
async function handleHealth(env: Env): Promise<Response> {
  const received = env.ORDERS ? Number((await env.ORDERS.get('stat:webhook')) ?? '0') || 0 : 0;
  return json({
    ok: true,
    service: 'calenref',
    time: Date.now(),
    checkout: {
      provider: 'gumroad',
      store: GUMROAD_STORE,
      configured: Boolean(env.ORDERS),
      productIdsConfigured: Object.keys(GUMROAD_PRODUCTS).filter((s) =>
        Boolean(productIdFor(env, s)),
      ),
    },
    kv: { bound: Boolean(env.ORDERS) },
    redeem: { configured: Boolean(env.REDEEM_SECRET) },
    webhook: {
      endpoint: '/api/webhook/gumroad',
      signatureRequired: Boolean(env.GUMROAD_PING_SECRET),
      received,
    },
    fulfillment: [
      'poll:/api/verify',
      'webhook:/api/webhook/gumroad',
      'license:/api/verify-license',
    ],
    skus: [...SKU_SET],
    offeredSkus: OFFERED_SKUS,
  });
}

/** 核验：GET /api/verify?ref=xxx → { paid, sku?, serverNow } */
async function handleVerify(url: URL, env: Env): Promise<Response> {
  const serverNow = Date.now();
  const ref = url.searchParams.get('ref') ?? '';
  if (!REF_RE.test(ref)) return json({ paid: false, serverNow }, 404);
  if (!env.ORDERS) return json({ paid: false, serverNow }, 503);

  // 已付标记优先：一次确认后不必每次都打 Gumroad
  const paidSku = await env.ORDERS.get(`paid:${ref}`);
  if (paidSku) {
    const via = await env.ORDERS.get(`via:${ref}`);
    return json({
      paid: true,
      sku: paidSku,
      fulfilledBy: via === 'gumroad-webhook' ? 'webhook' : 'cached',
      serverNow,
    });
  }

  const raw = await env.ORDERS.get(`order:${ref}`);
  if (!raw) return json({ paid: false, serverNow }, 404);

  let order: { sku?: string; productId?: string };
  try {
    order = JSON.parse(raw) as typeof order;
  } catch {
    return json({ paid: false, serverNow });
  }
  const sku = order.sku ?? '';
  if (!SKU_SET.has(sku)) return json({ paid: false, serverNow });

  // 没有令牌就无法主动查单：只能等 Ping 回调写标记。
  // 这里如实返回「未确认」，不猜也不假装已付。
  if (!env.GUMROAD_ACCESS_TOKEN || !order.productId) {
    return json({ paid: false, sku, fulfilledBy: 'pending-webhook', serverNow });
  }

  // 主动查 Gumroad 订单列表：找该产品下匹配本 ref 记录邮箱的已付款
  const res = await gumroadFetch(env, `/v2/sales?product_id=${encodeURIComponent(order.productId)}`);
  if (!res.ok) return json({ paid: false, sku, fulfilledBy: 'pending-webhook', serverNow });

  const data = (await res.json()) as { success?: unknown; sales?: unknown };
  if (data.success !== true || !Array.isArray(data.sales)) {
    return json({ paid: false, sku, fulfilledBy: 'pending-webhook', serverNow });
  }

  const email = (await env.ORDERS.get(`email:${ref}`)) ?? '';
  const matched = data.sales.some((s) => {
    const row = s as { email?: unknown; refunded?: unknown; sale_id?: unknown };
    if (row.refunded === true) return false;
    const mail = typeof row.email === 'string' ? row.email.toLowerCase() : '';
    if (!email || !mail) return false;
    if (mail !== email) return false;
    return true;
  });
  if (!matched) return json({ paid: false, sku, fulfilledBy: 'pending-webhook', serverNow });

  await env.ORDERS.put(`paid:${ref}`, sku, { expirationTtl: ORDER_TTL });
  await env.ORDERS.put(`via:${ref}`, 'poll', { expirationTtl: ORDER_TTL });
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
        case '/api/verify-license':
          return handleLicenseVerify(url, env);
        case '/api/redeem':
          return handleRedeem(request, env);
        case '/api/webhook/gumroad':
        case '/api/webhook':
          return handleGumroadWebhook(request, env);
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

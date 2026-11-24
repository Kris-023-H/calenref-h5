/**
 * tests/services/gumroad-channel.test.ts — Gumroad 支付通道的服务端落账链路。
 *
 * 覆盖 Worker 里三条最关键的路径：
 *   ① /api/checkout —— 校验 SKU、生成 ref、返回 Gumroad 结账 URL；
 *   ② /api/webhook/gumroad —— 验签 + product_id→SKU 映射 + 写已付标记；
 *   ③ /api/verify —— 只认服务端已付标记，不认客户端自报的 paid=1。
 *
 * 为什么重点测 ③：回跳参数是纯客户端输入，任何人都能手敲。
 * 这条链路一旦松了，付费墙形同虚设。
 *
 * Worker 直接跑在 workerd 运行时上，但它的逻辑是纯 fetch/Request/Response，
 * 在 Node + vitest 下用标准 Web API 就能测（crypto.subtle 在 Node 18+ 可用）。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker from '../../worker/index';
import {
  GUMROAD_PERMALINKS,
  GUMROAD_PRODUCTS,
  OFFERED_SKUS,
} from '../../src/data/prices';

/** 内存版 KV，够跑通落账链路 */
class MemKV {
  private map = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }
  async put(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }
  async keys(): Promise<string[]> {
    return [...this.map.keys()];
  }
}

function makeEnv(overrides: Record<string, unknown> = {}): never {
  return {
    ASSETS: { fetch: async () => new Response('ok') },
    ORDERS: new MemKV(),
    GUMROAD_ACCESS_TOKEN: 'test-token',
    GUMROAD_PING_SECRET: 'ping-secret',
    ...overrides,
  } as never;
}

const CALL = 'https://calenref.com/api/checkout';

async function postCheckout(
  env: never,
  body: Record<string, unknown>,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await worker.fetch(
    new Request(CALL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    env,
  );
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
}

describe('Gumroad 通道 — /api/checkout', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('返回 Gumroad 结账 URL（?wanted=true 直达结账）并生成 ref', async () => {
    const env = makeEnv();
    const { status, json } = await postCheckout(env, { sku: 'once', lang: 'en' });
    expect(status).toBe(200);
    const url = String(json.url);
    expect(url.startsWith('https://kris188h.gumroad.com/l/')).toBe(true);
    expect(url).toContain('wanted=true');
    expect(String(json.ref)).toMatch(/^zj_[A-Za-z0-9]{8,64}$/);
  });

  it('带邮箱时预填进结账 URL', async () => {
    const env = makeEnv();
    const { json } = await postCheckout(env, { sku: 'year', lang: 'en', email: 'a@b.com' });
    expect(String(json.url)).toContain('email=a%40b.com');
  });

  it('非法 SKU → 400', async () => {
    const env = makeEnv();
    const { status } = await postCheckout(env, { sku: 'not-a-sku' });
    expect(status).toBe(400);
  });

  it('未建产品的 SKU → 503，不给死链', async () => {
    // 用一个不在 SKU 集合里的合法字符串无法触发（会 400），所以这里改测：
    // 上架清单里的 SKU 必须都已配置产品 —— 缺一个就会给出死链。
    for (const sku of OFFERED_SKUS) {
      const env = makeEnv();
      const { status, json } = await postCheckout(env, { sku });
      expect(status, `${sku} 应当能建出结账链接`).toBe(200);
      expect(String(json.url)).toContain('gumroad.com/l/');
    }
  });

  it('上架清单里的每个 SKU 都已配置 product_id 与 permalink', () => {
    // 守卫：OFFERED_SKUS 与 GUMROAD_PRODUCTS / GUMROAD_PERMALINKS 必须同步。
    // 上架了但没建产品 = 买家点进去是死链，这是最贵的线上事故。
    for (const sku of OFFERED_SKUS) {
      expect(GUMROAD_PRODUCTS[sku], `${sku} 缺 product_id`).not.toBe('');
      expect(GUMROAD_PERMALINKS[sku], `${sku} 缺 permalink`).not.toBe('');
    }
  });
});

describe('Gumroad 通道 — /api/webhook/gumroad', () => {
  const PING_URL = 'https://calenref.com/api/webhook/gumroad';

  async function postPing(env: never, body: unknown, secret = 'ping-secret'): Promise<Response> {
    return worker.fetch(
      new Request(PING_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...(body as object), secret }),
      }),
      env,
    );
  }

  it('secret 不符 → 401，不落账', async () => {
    const env = makeEnv();
    const res = await postPing(
      env,
      { product_id: '3Ybkx6dkL5uP_9GvoHa2Aw==', is_paid: true, sale_id: 's1' },
      'wrong',
    );
    expect(res.status).toBe(401);
    const kv = (env as unknown as { ORDERS: MemKV }).ORDERS;
    expect((await kv.keys()).filter((k) => k.startsWith('paid:'))).toHaveLength(0);
  });

  it('is_paid=false → 忽略，不落账', async () => {
    const env = makeEnv();
    const res = await postPing(env, { product_id: '3Ybkx6dkL5uP_9GvoHa2Aw==', is_paid: false });
    expect(res.status).toBe(200);
    const kv = (env as unknown as { ORDERS: MemKV }).ORDERS;
    expect((await kv.keys()).filter((k) => k.startsWith('paid:'))).toHaveLength(0);
  });

  it('测试单（test=true）→ 不落账', async () => {
    const env = makeEnv();
    const res = await postPing(env, {
      product_id: '3Ybkx6dkL5uP_9GvoHa2Aw==',
      is_paid: true,
      test: true,
    });
    expect(res.status).toBe(200);
    const kv = (env as unknown as { ORDERS: MemKV }).ORDERS;
    expect((await kv.keys()).filter((k) => k.startsWith('paid:'))).toHaveLength(0);
  });

  it('product_id 未对应任何 SKU → 忽略（不误发权益）', async () => {
    const env = makeEnv();
    const res = await postPing(env, { product_id: 'unknown-product', is_paid: true });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ignored?: string };
    expect(body.ignored).toBe('unknown_product');
  });

  it('已付 + 已知 product_id → 写 paid 标记（按 email 反查 ref）', async () => {
    const env = makeEnv();
    const { json } = await postCheckout(env, { sku: 'once', lang: 'en', email: 'buyer@x.com' });
    const ref = String(json.ref);
    const kv = (env as unknown as { ORDERS: MemKV }).ORDERS;
    // Worker 在建单时按邮箱建反查索引（生产实现见 handleCheckout）
    await kv.put(`email:buyer@x.com`, ref);

    const res = await postPing(env, {
      product_id: '3Ybkx6dkL5uP_9GvoHa2Aw==',
      is_paid: true,
      email: 'buyer@x.com',
      sale_id: 'sale-1',
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ref?: string; sku?: string };
    expect(body.sku).toBe('once');
    expect(body.ref).toBe(ref);
    expect(await kv.get(`paid:${ref}`)).toBe('once');
  });
});

describe('Gumroad 通道 — /api/verify', () => {
  it('未落账的 ref → paid:false（不能靠客户端参数解锁）', async () => {
    const env = makeEnv();
    const res = await worker.fetch(
      new Request('https://calenref.com/api/verify?ref=zj_abcdefgh12345678'),
      env,
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { paid?: boolean };
    expect(body.paid).toBe(false);
  });

  it('ref 格式非法 → 400/404，不当枚举器用', async () => {
    const env = makeEnv();
    const res = await worker.fetch(
      new Request('https://calenref.com/api/verify?ref=../../etc/passwd'),
      env,
    );
    expect(res.status).toBe(404);
  });

  it('KV 已有已付标记 → paid:true 且给出 sku', async () => {
    const env = makeEnv();
    const kv = (env as unknown as { ORDERS: MemKV }).ORDERS;
    await kv.put('paid:zj_abcdefgh12345678', 'year');
    const res = await worker.fetch(
      new Request('https://calenref.com/api/verify?ref=zj_abcdefgh12345678'),
      env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { paid?: boolean; sku?: string };
    expect(body.paid).toBe(true);
    expect(body.sku).toBe('year');
  });
});

describe('Gumroad 通道 — /api/verify-license（license key 核销）', () => {
  it('Gumroad 无 license 独立端点，核验走 /v2/sales 的 license_key 字段', async () => {
    // 造一个假的 /v2/sales 响应：一条带 license_key 的销售记录
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/v2/sales')) {
        return new Response(
          JSON.stringify({
            success: true,
            sales: [
              {
                license_key: 'KEY-123',
                product_id: 'e_xdorNdo-iv83DchIBqgw==',
                refunded: false,
              },
            ],
          }),
          { headers: { 'content-type': 'application/json' } },
        );
      }
      return new Response('{}', { headers: { 'content-type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);

    const env = makeEnv();
    const res = await worker.fetch(
      new Request('https://calenref.com/api/verify-license?key=KEY-123'),
      env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { valid?: boolean; sku?: string; via?: string };
    expect(body.valid).toBe(true);
    expect(body.sku).toBe('year');
    expect(body.via).toBe('gumroad');

    // 请求必须打到 /v2/sales（不是不存在的 /v2/licenses/verify）
    const called = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(called.some((u) => u.includes('/v2/sales'))).toBe(true);
    expect(called.some((u) => u.includes('/licenses/verify'))).toBe(false);
    vi.unstubAllGlobals();
  });

  it('license key 不匹配 → valid:false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ success: true, sales: [] }), {
            headers: { 'content-type': 'application/json' },
          }),
      ),
    );
    const env = makeEnv();
    const res = await worker.fetch(
      new Request('https://calenref.com/api/verify-license?key=NOPE'),
      env,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { valid?: boolean };
    expect(body.valid).toBe(false);
    vi.unstubAllGlobals();
  });

  it('已退款的单不算有效', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              sales: [
                {
                  license_key: 'KEY-REF',
                  product_id: 'e_xdorNdo-iv83DchIBqgw==',
                  refunded: true,
                },
              ],
            }),
            { headers: { 'content-type': 'application/json' } },
          ),
      ),
    );
    const env = makeEnv();
    const res = await worker.fetch(
      new Request('https://calenref.com/api/verify-license?key=KEY-REF'),
      env,
    );
    const body = (await res.json()) as { valid?: boolean };
    expect(body.valid).toBe(false);
    vi.unstubAllGlobals();
  });
});

describe('Gumroad 通道 — /api/healthz', () => {
  it('声明通道为 gumroad 并列出已配置产品', async () => {
    const env = makeEnv();
    const res = await worker.fetch(new Request('https://calenref.com/api/healthz'), env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      checkout?: { provider?: string; store?: string; productIdsConfigured?: string[] };
    };
    expect(body.checkout?.provider).toBe('gumroad');
    expect(body.checkout?.store).toBe('kris188h.gumroad.com');
    expect(body.checkout?.productIdsConfigured).toContain('once');
    expect(body.checkout?.productIdsConfigured).toContain('year');
  });
});

/**
 * tests/services/pay-share.test.ts — QA 独立补测（严过关）。
 * 覆盖工程师既有用例未覆盖的服务层纯函数：
 *   parsePaymentReturn（success / cancel / 坏 sku / 缺参 / 无 pay）；
 *   parseShareUrl（lang / ref / k 的缺省与非法值，PRD §6.2 落地优先级）；
 *   PRICE_TABLE / SKU_LEFT 与 PRD §4.1 逐值一致（验收 #5）；
 *   createCheckout 对下单失败的契约（pay-screen 依赖其返回 '' 走 linkFail 兜底）。
 */
import 'fake-indexeddb/auto'; // creem.ts 传递依赖 license.repo → backend → idb，确保可导入
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parsePaymentReturn, createCheckout } from '../../src/services/pay/creem';
import { parseShareUrl } from '../../src/services/share';
import { PRICE_TABLE, SKU_LEFT, CURRENCIES, SKUS } from '../../src/data/prices';

afterEach(() => vi.unstubAllGlobals());

describe('parsePaymentReturn — 支付回跳解析', () => {
  it('success 且带合法 sku 与 ref', () => {
    expect(parsePaymentReturn('?pay=success&sku=ai10&ref=zj_123')).toEqual({
      status: 'success',
      sku: 'ai10',
      ref: 'zj_123',
    });
  });

  it('success 但 sku 非法 → sku 置 undefined（不落账）', () => {
    const r = parsePaymentReturn('?pay=success&sku=badsku&ref=zj_1');
    expect(r?.status).toBe('success');
    expect(r?.sku).toBeUndefined();
  });

  it('success 无 ref → ref undefined（后续核验会直接拒绝）', () => {
    const r = parsePaymentReturn('?pay=success&sku=once');
    expect(r).toEqual({ status: 'success', sku: 'once', ref: undefined });
  });

  it('cancel 回跳', () => {
    expect(parsePaymentReturn('?pay=cancel')).toEqual({
      status: 'cancel',
      sku: undefined,
      ref: undefined,
    });
  });

  it('无 pay 参数 / 未知 pay 值 / 空串 → null', () => {
    expect(parsePaymentReturn('?foo=bar')).toBeNull();
    expect(parsePaymentReturn('?pay=pending')).toBeNull();
    expect(parsePaymentReturn('')).toBeNull();
  });
});

describe('parseShareUrl — 分享落地参数（PRD §6.2）', () => {
  it('完整参数', () => {
    expect(parseShareUrl('?lang=en&ref=scan1&k=day')).toEqual({ lang: 'en', ref: 'scan1', kind: 'day' });
  });

  it('缺 lang / k → 默认 zh 与 day', () => {
    expect(parseShareUrl('?ref=scan1')).toEqual({ lang: 'zh', ref: 'scan1', kind: 'day' });
  });

  it('非法 lang → 回落 zh；zh-Hant 合法', () => {
    expect(parseShareUrl('?lang=fr&ref=scan1')?.lang).toBe('zh');
    expect(parseShareUrl('?lang=zh-Hant&ref=scan1')?.lang).toBe('zh-Hant');
  });

  it('k=article 合法；非法 k → day', () => {
    expect(parseShareUrl('?ref=a1&k=article')?.kind).toBe('article');
    expect(parseShareUrl('?ref=a1&k=whatever')?.kind).toBe('day');
  });

  it('缺 ref / 空 ref / 空串 → null（非分享落地）', () => {
    expect(parseShareUrl('?lang=en')).toBeNull();
    expect(parseShareUrl('?ref=')).toBeNull();
    expect(parseShareUrl('')).toBeNull();
  });
});

describe('PRICE_TABLE / SKU_LEFT — 与 PRD §4.1 逐值一致', () => {
  it('四 SKU 价格精确匹配（USD 单币种）', () => {
    // Creem 只支持 USD/EUR 且单产品单币种，故收敛为 USD 一列。
    expect(PRICE_TABLE).toEqual({
      USD: { once: 6.9, ai10: 4.9, pair: 11.9, year: 39.9 },
    });
  });

  it('币种与 SKU 集合齐全（单币种 / 四档）', () => {
    expect([...CURRENCIES]).toEqual(['USD']);
    expect([...SKUS].sort()).toEqual(['ai10', 'once', 'pair', 'year']);
  });

  it('SKU_LEFT 权益：once/pair=1，ai10=10，year=-1 不限', () => {
    expect(SKU_LEFT).toEqual({ once: 1, ai10: 10, pair: 1, year: -1 });
  });
});

describe('createCheckout — 下单失败一律返回空串', () => {
  const params = { sku: 'once' as const, lang: 'zh', clientRef: 'x' };

  it('Worker 非 2xx → 空串', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, json: async () => ({}) }) as Response);
    await expect(createCheckout(params)).resolves.toBe('');
  });

  it('网络异常 → 空串（不抛错）', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('offline');
    });
    await expect(createCheckout(params)).resolves.toBe('');
  });

  it('返回非 https 地址 → 空串（防 javascript: 之类伪协议）', async () => {
    vi.stubGlobal(
      'fetch',
      async () => ({ ok: true, json: async () => ({ url: 'javascript:alert(1)' }) }) as Response,
    );
    await expect(createCheckout(params)).resolves.toBe('');
  });

  it('正常返回 https 结账地址 → 原样透出', async () => {
    vi.stubGlobal(
      'fetch',
      async () => ({ ok: true, json: async () => ({ url: 'https://creem.io/checkout/chk_1' }) }) as Response,
    );
    await expect(createCheckout(params)).resolves.toBe('https://creem.io/checkout/chk_1');
  });
});

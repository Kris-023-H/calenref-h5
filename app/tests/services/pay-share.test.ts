/**
 * tests/services/pay-share.test.ts — QA 独立补测（严过关）。
 * 覆盖工程师既有用例未覆盖的服务层纯函数：
 *   parsePaymentReturn（success / cancel / 坏 sku / 缺参 / 无 pay）；
 *   parseShareUrl（lang / ref / k 的缺省与非法值，PRD §6.2 落地优先级）；
 *   PRICE_TABLE / SKU_LEFT 与 PRD §4.1 逐值一致（验收 #5）；
 *   buildCheckoutUrl 对占位链接的契约（pay-screen 依赖其返回 '' 走 linkFail 兜底）。
 */
import 'fake-indexeddb/auto'; // stripe.ts 传递依赖 license.repo → backend → idb，确保可导入
import { describe, expect, it } from 'vitest';
import { parsePaymentReturn, buildCheckoutUrl } from '../../src/services/pay/stripe';
import { parseShareUrl } from '../../src/services/share';
import { PRICE_TABLE, SKU_LEFT, CURRENCIES, SKUS } from '../../src/data/prices';

describe('parsePaymentReturn — 支付回跳解析', () => {
  it('success 且带合法 sku 与 session_id', () => {
    expect(parsePaymentReturn('?pay=success&sku=ai10&session_id=cs_123')).toEqual({
      status: 'success',
      sku: 'ai10',
      sessionId: 'cs_123',
    });
  });

  it('success 但 sku 非法 → sku 置 undefined（不落账）', () => {
    const r = parsePaymentReturn('?pay=success&sku=badsku&session_id=cs_1');
    expect(r?.status).toBe('success');
    expect(r?.sku).toBeUndefined();
  });

  it('success 无 session_id → sessionId undefined', () => {
    const r = parsePaymentReturn('?pay=success&sku=once');
    expect(r).toEqual({ status: 'success', sku: 'once', sessionId: undefined });
  });

  it('cancel 回跳', () => {
    expect(parsePaymentReturn('?pay=cancel')).toEqual({
      status: 'cancel',
      sku: undefined,
      sessionId: undefined,
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
  it('四 SKU × 五币种价格精确匹配', () => {
    expect(PRICE_TABLE).toEqual({
      CNY: { once: 29, ai10: 19, pair: 49, year: 199 },
      USD: { once: 6.9, ai10: 4.9, pair: 11.9, year: 39.9 },
      SGD: { once: 9.9, ai10: 6.9, pair: 15.9, year: 52.9 },
      MYR: { once: 32.9, ai10: 21.9, pair: 54.9, year: 169.9 },
      THB: { once: 249, ai10: 169, pair: 429, year: 1399 },
    });
  });

  it('币种与 SKU 集合齐全（五币种 / 四档）', () => {
    expect([...CURRENCIES].sort()).toEqual(['CNY', 'MYR', 'SGD', 'THB', 'USD']);
    expect([...SKUS].sort()).toEqual(['ai10', 'once', 'pair', 'year']);
  });

  it('SKU_LEFT 权益：once/pair=1，ai10=10，year=-1 不限', () => {
    expect(SKU_LEFT).toEqual({ once: 1, ai10: 10, pair: 1, year: -1 });
  });
});

describe('buildCheckoutUrl — 占位链接契约', () => {
  it('占位 Payment Link 不可用时返回空串（pay-screen 据此提示 linkFail，不应抛错）', () => {
    // 现网 PAYMENT_LINKS 均为 REPLACE_WITH_STRIPE_LINK_* 占位（上线前替换）。
    // pay-screen buy() 写法为：const url = buildCheckoutUrl(...); if(!url){ toast(linkFail); return; }
    // 即约定「链接不可用 → 返回 ''」。若实现抛错，则该兜底失效、按钮点击无响应。
    let url: string | undefined;
    expect(() => {
      url = buildCheckoutUrl({ sku: 'once', currency: 'CNY', lang: 'zh', clientRef: 'x' });
    }).not.toThrow();
    expect(url).toBe('');
  });
});

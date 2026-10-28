/**
 * data/prices.ts — 四 SKU × 五币种价格表 + Stripe Payment Link 模板。
 * 定价见出海增量 PRD §4.1（以人民币价为锚，按购买力平价取整，全部 .9 结尾）。
 * 主理人拍板：v1 双路径——(a) Payment Link 直跳（本表配 URL 模板，回跳解析写本地凭证）；
 * (b) 兑换码离线 HMAC 校验（services/pay/redeem.ts）。上线前部署 Cloudflare Worker
 * 核验端点为生产升级项（README 明示）。
 */

export type Sku = 'once' | 'ai10' | 'pair' | 'year';
export type Currency = 'CNY' | 'USD' | 'SGD' | 'MYR' | 'THB';

/** 四 SKU × 五币种价格表（与 PRD §4.1 逐值一致） */
export const PRICE_TABLE: Record<Currency, Record<Sku, number>> = {
  CNY: { once: 29, ai10: 19, pair: 49, year: 199 },
  USD: { once: 6.9, ai10: 4.9, pair: 11.9, year: 39.9 },
  SGD: { once: 9.9, ai10: 6.9, pair: 15.9, year: 52.9 },
  MYR: { once: 32.9, ai10: 21.9, pair: 54.9, year: 169.9 },
  THB: { once: 249, ai10: 169, pair: 429, year: 1399 },
};

export const CURRENCIES: Currency[] = ['CNY', 'USD', 'SGD', 'MYR', 'THB'];

/** 币种符号与小数位 */
export const CURRENCY_META: Record<Currency, { symbol: string; decimals: number }> = {
  CNY: { symbol: '¥', decimals: 0 },
  USD: { symbol: '$', decimals: 1 },
  SGD: { symbol: 'S$', decimals: 1 },
  MYR: { symbol: 'RM', decimals: 1 },
  THB: { symbol: '฿', decimals: 0 },
};

export const SKUS: Sku[] = ['once', 'ai10', 'pair', 'year'];

/** 购买后权益：left（ai10=次数；once/pair=1；year=-1 不限） */
export const SKU_LEFT: Record<Sku, number> = {
  once: 1,
  ai10: 10,
  pair: 1,
  year: -1,
};

/**
 * Stripe Payment Link 代码（上线前在 Stripe Dashboard 生成并替换）。
 * 链接形如 https://buy.stripe.com/<code>，一链接一 SKU 一币种；
 * client_reference_id 由调用方注入（设备指纹/会话标识），供核验与追溯。
 */
export const PAYMENT_LINKS: Record<Currency, Record<Sku, string>> = {
  CNY: {
    once: 'REPLACE_WITH_STRIPE_LINK_CNY_ONCE',
    ai10: 'REPLACE_WITH_STRIPE_LINK_CNY_AI10',
    pair: 'REPLACE_WITH_STRIPE_LINK_CNY_PAIR',
    year: 'REPLACE_WITH_STRIPE_LINK_CNY_YEAR',
  },
  USD: {
    once: 'REPLACE_WITH_STRIPE_LINK_USD_ONCE',
    ai10: 'REPLACE_WITH_STRIPE_LINK_USD_AI10',
    pair: 'REPLACE_WITH_STRIPE_LINK_USD_PAIR',
    year: 'REPLACE_WITH_STRIPE_LINK_USD_YEAR',
  },
  SGD: {
    once: 'REPLACE_WITH_STRIPE_LINK_SGD_ONCE',
    ai10: 'REPLACE_WITH_STRIPE_LINK_SGD_AI10',
    pair: 'REPLACE_WITH_STRIPE_LINK_SGD_PAIR',
    year: 'REPLACE_WITH_STRIPE_LINK_SGD_YEAR',
  },
  MYR: {
    once: 'REPLACE_WITH_STRIPE_LINK_MYR_ONCE',
    ai10: 'REPLACE_WITH_STRIPE_LINK_MYR_AI10',
    pair: 'REPLACE_WITH_STRIPE_LINK_MYR_PAIR',
    year: 'REPLACE_WITH_STRIPE_LINK_MYR_YEAR',
  },
  THB: {
    once: 'REPLACE_WITH_STRIPE_LINK_THB_ONCE',
    ai10: 'REPLACE_WITH_STRIPE_LINK_THB_AI10',
    pair: 'REPLACE_WITH_STRIPE_LINK_THB_PAIR',
    year: 'REPLACE_WITH_STRIPE_LINK_THB_YEAR',
  },
};

/** 购买成功回跳地址（Stripe Payment Link 静态成功 URL 配置项） */
export function paymentSuccessUrl(origin: string): string {
  return `${origin}/?paid=1&sku={SKU}&cur={CUR}&license={LICENSE}`;
}

export function formatPrice(sku: Sku, currency: Currency): string {
  const v = PRICE_TABLE[currency][sku];
  const meta = CURRENCY_META[currency];
  return meta.symbol + (meta.decimals ? v.toFixed(meta.decimals) : String(Math.round(v)));
}

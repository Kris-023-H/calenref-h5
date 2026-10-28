/**
 * data/prices.ts — 四 SKU 价格表 + Creem 产品映射。
 *
 * 定价见出海增量 PRD §4.1（以人民币价为锚，按购买力平价取整，全部 .9 结尾）。
 *
 * 为什么只剩 USD：Creem 是 Merchant of Record，其产品在创建时锁定单一币种，
 * 官方仅支持 USD / EUR，没有多币种定价、也不做自动汇率换算。原先的
 * CNY / SGD / MYR / THB 四列在 Creem 下无处落地——留着只会让页面标价与
 * 实付金额不一致，跨境场景这是退款争议的头号来源。
 * 故收敛为 USD 单币种：页面标 USD，买家在 Creem 结账页看到按其所在地
 * 折算后的本币金额，这是 MoR 的通行做法。
 *
 * 若将来要加 EUR，把 Currency 扩成 'USD' | 'EUR'、补一列价格、再在 Creem
 * 建对应产品即可，其余代码无需改动。
 */

export type Sku = 'once' | 'ai10' | 'pair' | 'year';
export type Currency = 'USD';

/** 四 SKU 价格表（USD） */
export const PRICE_TABLE: Record<Currency, Record<Sku, number>> = {
  USD: { once: 6.9, ai10: 4.9, pair: 11.9, year: 39.9 },
};

export const CURRENCIES: Currency[] = ['USD'];

/** 币种符号与小数位 */
export const CURRENCY_META: Record<Currency, { symbol: string; decimals: number }> = {
  USD: { symbol: '$', decimals: 1 },
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
 * Creem 产品 ID（在 Creem Dashboard → Products 创建后填入）。
 *
 * 一 SKU 一产品，四个产品都用 USD 计价。占位符以 `REPLACE_WITH_` 开头，
 * 服务端（worker/index.ts）遇到占位符会直接拒绝下单，避免把用户送去死链。
 */
export const CREEM_PRODUCTS: Record<Sku, string> = {
  once: 'REPLACE_WITH_CREEM_PRODUCT_ONCE',
  ai10: 'REPLACE_WITH_CREEM_PRODUCT_AI10',
  pair: 'REPLACE_WITH_CREEM_PRODUCT_PAIR',
  year: 'REPLACE_WITH_CREEM_PRODUCT_YEAR',
};

/** 产品 ID 是否仍是占位符（未在 Dashboard 创建） */
export function isPlaceholderProduct(id: string | undefined): boolean {
  return !id || id.length === 0 || id.startsWith('REPLACE_WITH_');
}

export function formatPrice(sku: Sku, currency: Currency): string {
  const v = PRICE_TABLE[currency][sku];
  const meta = CURRENCY_META[currency];
  return meta.symbol + (meta.decimals ? v.toFixed(meta.decimals) : String(Math.round(v)));
}

/** 价格（最小货币单位，分）—— Creem 的 price 字段是整数分 */
export function priceInCents(sku: Sku, currency: Currency): number {
  return Math.round(PRICE_TABLE[currency][sku] * 100);
}

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

/**
 * 首审上架的商品面（Creem 首次提交只报这两个）。
 *
 * 为什么收缩：ai10（AI 解读次数包）会直接触发 Creem 的
 * 「Generative AI = Restricted」审查项 —— 需要提供前服务商记录、拒付率与
 * track record，而我们是首次提交，这三样都拿不出来，等于自己给自己加一道
 * 必不过的门。pair（双人对照）则容易被读成「替两个人算合不合」，与
 * 「Metaphysical / fortune-telling」类目只差一层解释。
 *
 * 两个 SKU 的定义、价格、Creem 产品 ID 全部保留（SKUS / CREEM_PRODUCTS 不动），
 * 只是不在界面上卖 —— 审核通过后再把 ai10 / pair 加回本数组即可上架。
 */
export const OFFERED_SKUS: Sku[] = ['once', 'year'];

/** 购买后权益：left（ai10=次数；once/pair=1；year=-1 不限） */
export const SKU_LEFT: Record<Sku, number> = {
  once: 1,
  ai10: 10,
  pair: 1,
  year: -1,
};

/**
 * Creem 产品 ID（Creem Dashboard → Products，已按 PRD §4.1 价格建好）。
 *
 * 一 SKU 一产品，四个产品都用 USD 计价、billing_type=onetime、税含在价内
 * （tax_mode=inclusive）。改价要两边同步：这里只管展示，实收以 Creem 产品价为准。
 * 占位符以 `REPLACE_WITH_` 开头，服务端遇到占位符会直接拒绝下单，避免死链。
 */
export const CREEM_PRODUCTS: Record<Sku, string> = {
  once: 'prod_6rNtAr8IAgemsoMq0ItQjl', // $6.9 单次完整报告
  ai10: 'prod_5cl5Lk2oBXjz2MpGhSvmGu', // $4.9 十次白话解读
  pair: 'prod_3YM2m6ekl6Sq5oYllrHmHj', // $11.9 双人对照
  year: 'prod_5NW3nkBRZuEuTix2rLOzac', // $39.9 全年不限次
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

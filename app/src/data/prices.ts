/**
 * data/prices.ts — 四 SKU 价格表 + 支付通道产品映射。
 *
 * 定价见出海增量 PRD §4.1（以人民币价为锚，按购买力平价取整，全部 .9 结尾）。
 *
 * 为什么只剩 USD：结账通道是 Merchant of Record，其产品在创建时锁定单一币种，
 * 官方仅支持 USD / EUR，没有多币种定价、也不做自动汇率换算。原先的
 * CNY / SGD / MYR / THB 四列在新通道下无处落地——留着只会让页面标价与
 * 实付金额不一致，跨境交易这是退款争议的头号来源。
 * 故收敛为 USD 单币种：页面标 USD，买家在结账页看到按其所在地
 * 折算后的本币金额，这是 MoR 的通行做法。
 *
 * 若将来要加 EUR，把 Currency 扩成 'USD' | 'EUR'、补一列价格、再在 Gumroad
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
 * 当前上架的商品面。
 *
 * 背景：上一版支付通道（Creem）首次提交只通过这两个，其余两个被拒：
 *   · ai10（AI 解读次数包）触发「Generative AI = Restricted」审查项，
 *     需提供前服务商记录、拒付率与 track record，首次提交拿不出来；
 *   · pair（双人对照）易被读成「替两个人算合不合」，
 *     与「fortune-telling」类目只差一层解释。
 *
 * 现状：Creem 已弃用（被拒且无申诉机会），产品已换支付通道（Gumroad），
 * Worker 上已配好新通道凭据（GUMROAD_ACCESS_TOKEN / GUMROAD_PING_SECRET）。
 * 术语口径也已回退为专业表述（择日 / 课期 / 当事人档案 / 择日宗派），
 * 不再触发当初的类目红线。
 *
 * Gumroad 店铺已建的产品与本表 SKU 的对应（2026-11-24 全部就位）：
 *   once → CalenRef - Single Full Report（$6.9）
 *   ai10 → CalenRef - AI Interpretations x10（$4.9）
 *   pair → CalenRef - Two-Person Comparison Report（$11.9）
 *   year → CalenRef - Annual Pass（$39.9）
 *
 * 四个 SKU 全部通过 Gumroad API 建品 + PATCH 补齐描述与 permalink，
 * 已逐一验证 `/l/<permalink>?wanted=true` 可直达结账页。
 */
export const OFFERED_SKUS: Sku[] = ['once', 'ai10', 'pair', 'year'];

/** 购买后权益：left（ai10=次数；once/pair=1；year=-1 不限） */
export const SKU_LEFT: Record<Sku, number> = {
  once: 1,
  ai10: 10,
  pair: 1,
  year: -1,
};

/**
 * Gumroad 产品映射（店铺 kris188h.gumroad.com）。
 *
 * 一 SKU 一产品，全部 USD 计价。改价要两边同步：这里只管展示，
 * 实收以 Gumroad 后台产品价为准。
 *
 * 两套 ID 各有用途，不能互换：
 *   · productId —— Gumroad API 的产品标识（base64 形态），核验时用；
 *   · permalink —— 店铺 URL 里的短码（如 calenref-once），
 *     结账跳转用 `https://kris188h.gumroad.com/l/<permalink>`，
 *     加 `?wanted=true` 可直达结账页（不必先过商品详情页）。
 *
 * 实测：/l/calenref-once?wanted=true → 302 → gumroad.com/checkout?price=690；
 *      /l/calenref-year?wanted=true  → 302 → gumroad.com/checkout?price=3990。
 */
export const GUMROAD_STORE = 'kris188h.gumroad.com';

/** Gumroad 产品 ID（API 用） */
export const GUMROAD_PRODUCTS: Record<Sku, string> = {
  once: '3Ybkx6dkL5uP_9GvoHa2Aw==', // $6.9  CalenRef - Single Full Report
  ai10: '8g-q5-8NYghlk6eqN19NTw==', // $4.9  CalenRef - AI Interpretations x10
  pair: 'ksHPQugNQLOqKC2I45Atrw==', // $11.9 CalenRef - Two-Person Comparison Report
  year: 'e_xdorNdo-iv83DchIBqgw==', // $39.9 CalenRef - Annual Pass
};

/** Gumroad 商品短码（URL 用） */
export const GUMROAD_PERMALINKS: Record<Sku, string> = {
  once: 'calenref-once',
  ai10: 'calenref-ai10',
  pair: 'calenref-pair',
  year: 'calenref-year',
};

/**
 * 结账跳转 URL：直达 Gumroad 结账页。
 *
 * 为什么不需要 API 建单：Gumroad 的 checkout 是托管页面，
 * `?wanted=true` 让用户从商品页直接进结账，省掉一次点击。
 * （Gumroad API v2 是只读的——只有 products / sales / payouts /
 * resource_subscriptions，没有建单端点。）
 */
export function gumroadCheckoutUrl(sku: Sku, email?: string): string {
  const slug = GUMROAD_PERMALINKS[sku];
  if (!slug) return '';
  const q = new URLSearchParams({ wanted: 'true' });
  if (email) q.set('email', email);
  return `https://${GUMROAD_STORE}/l/${slug}?${q.toString()}`;
}

/** 产品 ID 是否仍未配置（对应 SKU 在 Gumroad 尚未建产品） */
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

/**
 * data/site.ts — 站点与法务主体常量（上线前唯一改动点）。
 *
 * 为什么要集中：法务四页、页脚版权行、OG/canonical、robots/sitemap 都引用域名与
 * 客服邮箱。散落各处的硬编码会在换域名时漏改，而支付平台审核恰恰会逐页点开核对
 * 「网站上的联系邮箱是否可用」。改这一个文件即可全局一致。
 *
 * 域名来源优先级：VITE_SITE_URL（构建注入）> 内置默认值。
 */

const FALLBACK_URL = 'https://zeji.app';

function readSiteUrl(): string {
  const raw = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SITE_URL : '';
  const v = typeof raw === 'string' ? raw.trim().replace(/\/+$/, '') : '';
  return v || FALLBACK_URL;
}

export const SITE = {
  /** 站点根地址（无尾斜杠） */
  url: readSiteUrl(),
  nameZh: '中华历法',
  nameEn: 'Chinese Date Planner',
  /** 客服邮箱：支付平台审核会实际发信验证，必须是可收信的真实邮箱。
   *  域名到位后换成 support@<域名>，改这一处即可全局生效。 */
  supportEmail: 'kris.188h@gmail.com',
  /** 隐私事务邮箱（GDPR/PDPA 数据主体请求），暂与客服同址 */
  privacyEmail: 'kris.188h@gmail.com',
  /** 运营主体：须与支付平台（Creem）注册主体一致 */
  entity: 'LuckyTimely',
  /** 产品一句话说明：支付平台审核要求站点明确「非占卜/灵性服务」 */
  tagline: 'Traditional culture digital reference',
  /** 准据法属地（首站新加坡，见出海增量 PRD §1） */
  jurisdiction: 'Singapore',
  /** 法务页生效日 */
  effectiveDate: '2026-10-29',
} as const;

/** mailto 链接（可选主题） */
export function mailto(email: string, subject?: string): string {
  return subject ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : `mailto:${email}`;
}

/** 法务页 URL 段（唯一事实源；Worker 的 LEGAL_PATHS 与此保持一致） */
export const LEGAL_PATH: Record<string, string> = {
  privacy: '/privacy',
  terms: '/terms',
  refund: '/refund',
  cookie: '/cookies',
};

/** 法务页站内路径（不含域名；地址栏与 canonical 用这个） */
export function legalPath(page: string): string {
  return LEGAL_PATH[page] ?? `/${page}`;
}

/** 法务页绝对地址（分享/审核时可直接给链接，必须是可直达的真 URL） */
export function legalUrl(page: string): string {
  return `${SITE.url}${legalPath(page)}`;
}

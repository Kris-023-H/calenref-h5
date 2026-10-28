/**
 * i18n/format.ts — 数字 / 日期 / 文案格式化。
 * 历法三口径（架构决策）：公历 + 干支年 + 佛历（CE+543）；农历月日为 P1。
 * 模板替换：`t('key', { name: 'x' })` → 文案中的 {name} 占位符。
 */

import type { CalDate, Lang } from '../engine/types';
import { zh } from './zh';
import type { MsgKey } from './zh';
import { en } from './en';
import { zhHant, s2t } from './zh-hant';

/** 占位符替换：{name} → params.name */
export function fill(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const v = params[key];
    return v === undefined ? whole : String(v);
  });
}

/** 取文案（zh / en / zh-Hant 三包对齐，由测试保障） */
export function t(key: MsgKey, lang: Lang, params?: Record<string, string | number>): string {
  const raw = lang === 'en' ? en[key] : lang === 'zh-Hant' ? zhHant[key] : zh[key];
  return fill(raw, params);
}

/**
 * 组件内联文案。
 *
 * 历史包袱：大量组件把短标签写成 `lang === 'en' ? 'English' : '中文'`，
 * 于是 zh-Hant 用户永远落到简体分支——繁体界面里混着简体字。
 * 这些标签零散且带插值，逐个搬进 zh.ts 成本高、易漏，统一改走这里：
 *
 *   tx('份档案', 'files', lang)
 *
 * en → 英文原文；zh-Hant → 对中文做 s2t 转换；zh → 中文原文。
 */
export function tx(zhText: string, enText: string, lang: Lang): string {
  if (lang === 'en') return enText;
  if (lang === 'zh-Hant') return s2t(zhText);
  return zhText;
}

const WEEK_KEYS: Record<number, MsgKey> = {
  0: 'wd.full.0',
  1: 'wd.full.1',
  2: 'wd.full.2',
  3: 'wd.full.3',
  4: 'wd.full.4',
  5: 'wd.full.5',
  6: 'wd.full.6',
};

/** 星期全称 */
export function weekdayName(lang: Lang, weekday: number): string {
  return t(WEEK_KEYS[weekday] ?? 'wd.full.0', lang);
}

export type CalPref = 'greg' | 'gan' | 'buddha';

/** 历法口径标签（设置页三选一） */
export function calPrefLabel(pref: CalPref, lang: Lang): string {
  if (pref === 'gan') return t('lang.calGan', lang);
  if (pref === 'buddha') return t('lang.calBuddha', lang);
  return t('lang.calGreg', lang);
}

/** 年份显示：公历 / 干支 / 佛历 */
export function yearLabel(y: number, pref: CalPref, lang: Lang, ganText?: string): string {
  if (pref === 'buddha') return `${tx('佛历 ', 'BE ', lang)}${y + 543}`;
  if (pref === 'gan' && ganText) return `${ganText}${lang === 'zh' || lang === 'zh-Hant' ? '年' : ''}`;
  return String(y);
}

/** 日期主格式：YYYY-MM-DD（机器可读、复制分享统一） */
export function isoDate(d: CalDate): string {
  const mm = String(d.m).padStart(2, '0');
  const dd = String(d.d).padStart(2, '0');
  return `${d.y}-${mm}-${dd}`;
}

/** 本地化日期：zh 形如「2026年10月24日 星期六」，en 形如「Sat, Oct 24, 2026」 */
export function localDate(d: CalDate, lang: Lang, weekday: number): string {
  if (lang === 'en') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][weekday];
    return `${wd}, ${months[d.m - 1]} ${d.d}, ${d.y}`;
  }
  return `${d.y}年${d.m}月${d.d}日 ${weekdayName(lang, weekday)}`;
}

/** 紧凑日期：10月24日 / Oct 24 */
export function shortDate(d: CalDate, lang: Lang): string {
  if (lang === 'en') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.m - 1]} ${d.d}`;
  }
  return `${d.m}月${d.d}日`;
}

/** 分钟数 → 「+23 分钟」 */
export function offsetMinText(n: number, lang: Lang): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  const abs = Math.abs(n);
  if (lang === 'en') return `${sign}${abs} min`;
  return `${sign}${abs} ${tx('分钟', 'min', lang)}`;
}

/** 字节数 → 可读大小（KB/MB 单位三语同形，保留 lang 形参以便统一调用） */
export function bytesText(bytes: number, _lang: Lang): string {
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

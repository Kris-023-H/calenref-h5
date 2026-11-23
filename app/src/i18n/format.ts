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
import { ko } from './ko';
import { ja } from './ja';
import { th } from './th';
import { vi } from './vi';

/** 占位符替换：{name} → params.name */
export function fill(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const v = params[key];
    return v === undefined ? whole : String(v);
  });
}

/** 六语语言包（zh / en / zh-Hant 历史三语 + ko / ja / th / vi 出海四语） */
const PACKS: Record<Lang, Record<MsgKey, string>> = { zh, en, 'zh-Hant': zhHant, ko, ja, th, vi };

/** 取文案（各包 key 对齐，由测试保障） */
export function t(key: MsgKey, lang: Lang, params?: Record<string, string | number>): string {
  return fill(PACKS[lang]?.[key] ?? en[key] ?? zh[key], params);
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
  if (lang === 'ko' || lang === 'ja' || lang === 'th' || lang === 'vi') {
    // 出海四语：命中高频短语词典用对应译文（按中文原文索引），否则回退英文，避免中文夹杂。
    const hit = INLINE_TX[lang]?.[zhText];
    return hit || enText;
  }
  return zhText;
}

/**
 * 组件内联文案的出海四语高频词典（key 为 zhText 原文）。
 * 未收录的长句回退英文；后续可增量补充，不影响编译与测试。
 */
const INLINE_TX: Partial<Record<Lang, Record<string, string>>> = {
  ko: {
    '份档案': '명의 파일', '仅存本机': '이 기기에만 저장', '开启': '켜기', '关闭': '끄기',
    '语言与历法': '언어와 역법', '起课 7 日后': '7일 후 시작', '共 3 重': '총 3중',
    '（通书口径）': '(통서 기준)', '（条目）': '(항목)', '通书分 ': '통서 점수 ', '评分 ': '평점 ',
    '分钟': '분', '佛历 ': '불력 ', '日': '일', '年': '년',
  },
  ja: {
    '份档案': '件のプロフィール', '仅存本机': 'この端末のみに保存', '开启': 'オン', '关闭': 'オフ',
    '语言与历法': '言語と暦法', '起课 7 日后': '7日後に開始', '共 3 重': '計3層',
    '（通书口径）': '（通書基準）', '（条目）': '（項目）', '通书分 ': '通書点 ', '评分 ': '評点 ',
    '分钟': '分', '佛历 ': '仏暦 ', '日': '日', '年': '年',
  },
  th: {
    '份档案': 'ไฟล์', '仅存本机': 'เก็บในเครื่องนี้เท่านั้น', '开启': 'เปิด', '关闭': 'ปิด',
    '语言与历法': 'ภาษาและปฏิทิน', '起课 7 日后': 'เริ่มหลัง 7 วัน', '共 3 重': 'รวม 3 ชั้น',
    '（通书口径）': '(เกณฑ์ปฏิทิน)', '（条目）': '(รายการ)', '通书分 ': 'คะแนนปฏิทิน ', '评分 ': 'คะแนน ',
    '分钟': 'นาที', '佛历 ': 'พ.ศ. ', '日': 'วัน', '年': 'ปี',
  },
  vi: {
    '份档案': 'hồ sơ', '仅存本机': 'chỉ lưu trên máy này', '开启': 'Bật', '关闭': 'Tắt',
    '语言与历法': 'Ngôn ngữ & lịch', '起课 7 日后': 'bắt đầu sau 7 ngày', '共 3 重': 'tổng 3 lớp',
    '（通书口径）': '(theo lịch thông thường)', '（条目）': '(mục)', '通书分 ': 'điểm lịch ', '评分 ': 'điểm ',
    '分钟': 'phút', '佛历 ': 'Phật lịch ', '日': 'ngày', '年': 'năm',
  },
};

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
  if (pref === 'gan' && ganText) return `${ganText}${lang === 'zh' || lang === 'zh-Hant' || lang === 'ja' || lang === 'ko' ? '年' : ''}`;
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

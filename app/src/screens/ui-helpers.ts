/**
 * screens/ui-helpers.ts — 屏幕共享展示助手（日期/干支/五行/评分的本地化格式）。
 * 纯函数，不读时钟；时间一律由调用方传入。
 */

import type { CalDate, Lang, DayResult } from '../engine/types';
import { t, isoDate, tx } from '../i18n';
import { ZHI, MONTH_NAME } from '../engine/calendar/sexagenary';
import { jianchuName, monthName, gradeText } from '../i18n';

/** 五行标签（0 木 1 火 2 土 3 金 4 水） */
export const WX_LABEL: Record<number, Record<Lang, string>> = {
  0: { zh: '木', en: 'Wood', 'zh-Hant': '木' },
  1: { zh: '火', en: 'Fire', 'zh-Hant': '火' },
  2: { zh: '土', en: 'Earth', 'zh-Hant': '土' },
  3: { zh: '金', en: 'Metal', 'zh-Hant': '金' },
  4: { zh: '水', en: 'Water', 'zh-Hant': '水' },
};

/** 12.08 形如 2026.12.08 */
export function dottedDate(d: CalDate): string {
  return `${d.y}.${String(d.m).padStart(2, '0')}.${String(d.d).padStart(2, '0')}`;
}

/** 「12 月 8 日」/ "Dec 8" */
export function monthDay(d: CalDate, lang: Lang): string {
  if (lang === 'en') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.m - 1]} ${d.d}`;
  }
  return `${d.m} 月 ${d.d} 日`;
}

/** 「周六」/ "Sat" */
export function weekdayShort(weekday: number, lang: Lang): string {
  if (lang === 'en') return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][weekday];
  return `周${'日一二三四五六'[weekday]}`;
}

/** 星期全称 */
export function weekdayFull(weekday: number, lang: Lang): string {
  if (lang === 'en') return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weekday];
  return `${'日一二三四五六'[weekday]}`;
}

/** 节气月名（寅=正月…） */
export function monthLabel(monthZhi: number, lang: Lang): string {
  return lang === 'en' ? ZHI_PINYIN_MONTH[monthZhi] : monthName(monthZhi, lang);
}

const ZHI_PINYIN_MONTH = ['11th', '12th', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

/** 建除值神名 */
export function jianchuLabel(key: string, lang: Lang): string {
  return jianchuName(key, lang);
}

/** 课格等级词 */
export function gradeLabel(score: number, lang: Lang): string {
  return gradeText(score >= 94 ? 'shangji' : score >= 86 ? 'zhongji' : score >= 80 ? 'keyong' : 'buyong', lang);
}

/** 课格等级 chip 色调 */
export function gradeTone(score: number): 'gold' | 'jade' | 'verm' {
  if (score >= 86) return 'gold';
  if (score >= 80) return 'jade';
  return 'verm';
}

/** 月建地支名 */
export function monthZhiName(monthZhi: number): string {
  return ZHI[monthZhi];
}

/** 节气月完整名（十一月…十月） */
export function monthFullName(monthZhi: number): string {
  return MONTH_NAME[monthZhi];
}

/** 当日卡头部行：「可用」统计 */
export function usableStat(day: DayResult, lang: Lang): string {
  return `${day.score} ${tx('分', 'pts', lang)}`;
}

/** 起课偏移选项 */
export const START_OFFSETS: Array<{ value: number; label: Record<Lang, string> }> = [
  { value: 0, label: { zh: '今日', en: 'Today', 'zh-Hant': '今日' } },
  { value: 3, label: { zh: '三日后', en: 'In 3 days', 'zh-Hant': '三日後' } },
  { value: 7, label: { zh: '七日后', en: 'In 7 days', 'zh-Hant': '七日後' } },
  { value: 30, label: { zh: '三十日后', en: 'In 30 days', 'zh-Hant': '三十日後' } },
];

/** 推演天数选项 */
export const SPANS: number[] = [30, 60, 90, 120];

export { isoDate, t };

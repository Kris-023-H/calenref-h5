/**
 * services/timezone.ts — 所选时区工具：今日选取、东八区→本地参考换算、时区月 key。
 * 引擎一律按东八区民用历推演；界面展示时换算到用户时区作参考。
 */

import type { CalDate } from '../engine/types';
import { addDays, gregorianToJDN, jdnToGregorian } from '../engine/calendar/julian';

/** 当前东八区民用历日期（UI 注入；引擎不读时钟） */
export function todayCst(nowMs: number): CalDate {
  // UTC 毫秒 + 8 小时 → 东八区日历日
  const jdn = Math.floor((nowMs + 8 * 3600_000) / 86_400_000) + 2440588;
  return jdnToGregorian(jdn);
}

/** 所选时区的民用历日期（首页「今日」口径；引擎不读时钟） */
export function todayInTz(nowMs: number, tzHours: number): CalDate {
  // 与 todayCst 同法，偏移量按用户所选时区（settings.tz）参数化
  const jdn = Math.floor((nowMs + tzHours * 3600_000) / 86_400_000) + 2440588;
  return jdnToGregorian(jdn);
}

/** 时区月 key（YYYY-MM，按所选时区的当前月份；配额重置用） */
export function tzMonthKey(nowMs: number, tzHours: number): string {
  const d = new Date(nowMs + tzHours * 3600_000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** 东八区日期 → 所选时区的参考日期（可能差一日） */
export function cstToLocal(cst: CalDate, tzHours: number): CalDate {
  if (Math.abs(tzHours - 8) < 1e-9) return cst;
  // 东八区正午 → 目标时区的钟点 → 所在日历日
  const jdnNoon = gregorianToJDN(cst.y, cst.m, cst.d);
  const targetHour = 12 + (8 - tzHours);
  if (targetHour >= 24) return jdnToGregorian(jdnNoon + 1);
  if (targetHour < 0) return jdnToGregorian(jdnNoon - 1);
  return cst;
}

/** 时区展示名（设置与详情页） */
export function tzLabel(tzHours: number): string {
  const sign = tzHours >= 0 ? '+' : '−';
  const abs = Math.abs(tzHours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}

/** 默认时区（浏览器探测，回落东八区） */
export function detectTz(): number {
  try {
    const offsetMin = -new Date().getTimezoneOffset();
    return Math.round((offsetMin / 60) * 2) / 2;
  } catch {
    return 8;
  }
}

export { addDays };

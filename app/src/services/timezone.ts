/**
 * services/timezone.ts — 所选时区工具：今日选取、东八区→本地参考换算、时区月 key。
 * 引擎一律按东八区民用历推演；界面展示时换算到用户时区作参考。
 */

import type { CalDate } from '../engine/types';
import { addDays, gregorianToJDN, jdnToGregorian } from '../engine/calendar/julian';

/**
 * 数字时区 → 代表性 IANA 时区（v3.7 出海版：夏令时自动处理）。
 * 每个 UTC 偏移取一个代表城市；对无夏令时时区（中国/新加坡/东京/曼谷/迪拜）
 * 任意 IANA 算出来都是固定偏移，对有夏令时时区（纽约/伦敦/巴黎/悉尼）则随季节
 * 自动切换。detectTz() 探测到的 -4/-5 都归 America/New_York（北美用户为主）。
 */
export const TZ_IANA: Record<number, string> = {
  [-10]: 'Pacific/Honolulu',
  [-9]: 'America/Anchorage',
  [-8]: 'America/Los_Angeles',
  [-7]: 'America/Denver',
  [-6]: 'America/Chicago',
  [-5]: 'America/New_York',
  [-4]: 'America/New_York',
  [-3]: 'America/Sao_Paulo',
  [0]: 'Europe/London',
  [1]: 'Europe/Paris',
  [2]: 'Europe/Athens',
  [3]: 'Europe/Moscow',
  [4]: 'Asia/Dubai',
  [5.5]: 'Asia/Kolkata',
  [5.75]: 'Asia/Kathmandu',
  [6.5]: 'Asia/Yangon',
  [7]: 'Asia/Bangkok',
  [8]: 'Asia/Shanghai',
  [9]: 'Asia/Tokyo',
  [10]: 'Australia/Sydney',
  [11]: 'Australia/Sydney',
  [12]: 'Pacific/Auckland',
};

/**
 * 某 UTC 时刻在代表时区下的真实偏移（小时，含夏令时）。
 * 用 Intl.formatToParts 取目标时区的本地钟点，反推与 UTC 的差；
 * 无 Intl / 无映射 / 解析失败时回落到传入的固定偏移 tzHours（向后兼容）。
 */
export function tzOffsetAt(nowMs: number, tzHours: number): number {
  const zone = TZ_IANA[tzHours];
  if (!zone || typeof Intl === 'undefined' || !Intl.DateTimeFormat) return tzHours;
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23',
    });
    const parts = dtf.formatToParts(new Date(nowMs));
    const p: Record<string, number> = {};
    for (const x of parts) if (x.type !== 'literal') p[x.type] = Number(x.value);
    const localAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const wholeSecMs = Math.floor(nowMs / 1000) * 1000;
    // 15 分钟精度（覆盖 +5:45 之类），四舍五入抵消毫秒误差
    return Math.round((localAsUtc - wholeSecMs) / 900000) * 0.25;
  } catch {
    return tzHours;
  }
}

/** 当前东八区民用历日期（UI 注入；引擎不读时钟） */
export function todayCst(nowMs: number): CalDate {
  // UTC 毫秒 + 8 小时 → 东八区日历日
  const jdn = Math.floor((nowMs + 8 * 3600_000) / 86_400_000) + 2440588;
  return jdnToGregorian(jdn);
}

/** 所选时区的民用历日期（首页「今日」口径；含夏令时自动修正） */
export function todayInTz(nowMs: number, tzHours: number): CalDate {
  // 与 todayCst 同法，偏移量按所选时区 + 夏令时真实偏移参数化
  const off = tzOffsetAt(nowMs, tzHours);
  const jdn = Math.floor((nowMs + off * 3600_000) / 86_400_000) + 2440588;
  return jdnToGregorian(jdn);
}

/** 时区月 key（YYYY-MM，按所选时区当前月份、含夏令时；配额重置用） */
export function tzMonthKey(nowMs: number, tzHours: number): string {
  const off = tzOffsetAt(nowMs, tzHours);
  const d = new Date(nowMs + off * 3600_000);
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

/**
 * engine/calendar/julian.ts — 公历 ↔ 儒略日数（JDN）换算。
 * 纯算术实现，不依赖 Date；日柱干支与星期均由此递推。
 */

import type { CalDate } from '../types';

/** 公历日期 → 儒略日数（JDN，正午为界的整数日） */
export function gregorianToJDN(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

/** 儒略日数 → 公历日期（Richards 算法，整数除） */
export function jdnToGregorian(jdn: number): CalDate {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d2 = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d2) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    y: 100 * b + d2 - 4800 + Math.floor(m / 10),
    m: m + 3 - 12 * Math.floor(m / 10),
    d: e - Math.floor((153 * m + 2) / 5) + 1,
  };
}

/** 星期：0=周日 … 6=周六（与 Date#getDay 一致） */
export function dayOfWeek(d: CalDate): number {
  return (gregorianToJDN(d.y, d.m, d.d) + 1) % 7;
}

/** 日期加减天数 */
export function addDays(d: CalDate, n: number): CalDate {
  return jdnToGregorian(gregorianToJDN(d.y, d.m, d.d) + n);
}

/** 年内第几天（1–366），供均时差计算 */
export function dayOfYear(d: CalDate): number {
  return gregorianToJDN(d.y, d.m, d.d) - gregorianToJDN(d.y, 1, 1) + 1;
}

/** 日期比较：a<b → -1，a>b → 1，相等 → 0 */
export function compareDate(a: CalDate, b: CalDate): number {
  if (a.y !== b.y) return a.y < b.y ? -1 : 1;
  if (a.m !== b.m) return a.m < b.m ? -1 : 1;
  if (a.d !== b.d) return a.d < b.d ? -1 : 1;
  return 0;
}

/** 'YYYY-MM-DD' ↔ CalDate */
export function parseDate(s: string): CalDate {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
}

export function formatDate(d: CalDate): string {
  const p = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.y}-${p(d.m)}-${p(d.d)}`;
}

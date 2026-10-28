/**
 * engine/calendar/dst-china.ts — 1986–1991 中国夏令时起止日期表。
 *
 * 口径来源：IANA tzdata（Asia/Shanghai 1986–1991 年夏令时段落），
 * 此处固化为静态日期表（禁手抄月近似——如原型中 m>=4&&m<=9 的做法）。
 * 夏令时期间钟表拨快 1 小时；档案记录的是「夏令时」钟面时刻，
 * 求真太阳时须先回拨 1 小时，再按出生地经度校正。
 */

import type { CalDate } from '../types';
import { compareDate } from './julian';

interface Window {
  start: [number, number]; // [月, 日] 含
  end: [number, number]; // [月, 日] 含
}

/** 1986–1991 各年夏令时起止（Asia/Shanghai, tzdata） */
export const CHINA_DST: Record<number, Window> = {
  1986: { start: [5, 4], end: [9, 14] },
  1987: { start: [4, 12], end: [9, 13] },
  1988: { start: [4, 17], end: [9, 11] },
  1989: { start: [4, 16], end: [9, 17] },
  1990: { start: [4, 15], end: [9, 16] },
  1991: { start: [4, 14], end: [9, 15] },
};

/** 出生地是否东八区（夏令时表仅适用于中国） */
export function isChinaZone(tzHours: number): boolean {
  return Math.abs(tzHours - 8) < 1e-9;
}

/** 某公历日期是否处于中国夏令时窗口 */
export function isChinaDst(y: number, m: number, d: number): boolean {
  const w = CHINA_DST[y];
  if (!w) return false;
  const day: CalDate = { y, m, d };
  return (
    compareDate(day, { y, m: w.start[0], d: w.start[1] }) >= 0 &&
    compareDate(day, { y, m: w.end[0], d: w.end[1] }) <= 0
  );
}

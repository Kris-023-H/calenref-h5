/**
 * engine/calendar/true-solar.ts — 真太阳时：经度校正 + 夏令时回拨。
 *
 * 顺序（不可颠倒）：先回拨夏令时（1986–1991 中国窗口），再按出生地经度与均时差校正。
 * 档案只存原始钟表时刻 + 出生地，真太阳时读取时重算，禁存结果。
 */

import type { CalDate } from '../types';
import { equationOfTime } from './equation-of-time';
import { isChinaDst, isChinaZone } from './dst-china';

export interface BirthInput {
  y: number;
  m: number;
  d: number;
  /** 原始钟表时刻（出生地本地钟面） */
  hh: number;
  mm: number;
  /** 出生地经度（东经为正） */
  lon: number;
  /** 出生地时区（小时，如北京 +8、洛杉矶 −8） */
  tz: number;
  /** 出生钟面是否处于夏令时（需回拨 1 小时） */
  dst: boolean;
}

export interface TrueSolarResult {
  /** 真太阳时（校正后当日小时，0–23） */
  h: number;
  /** 真太阳时（校正后分钟，0–59） */
  m: number;
  /** 跨日偏移：校正后相对原日期的日移 */
  dayShift: -1 | 0 | 1;
  /** 总校正分钟数（含夏令时回拨，带符号） */
  offsetMin: number;
}

/**
 * 某出生地是否须回拨中国夏令时（1986–1991）。
 * 适用条件（三者同时满足）：出生地在中国境内（城市表 region='cn'，
 * 手动经纬度无地区信息不适用）、时区为 UTC+8、日期命中历史夏令时窗口。
 * 新加坡等地虽同为 UTC+8，但不适用中国夏令时。
 */
export function dstForBirth(d: CalDate, region: string | undefined, tz: number): boolean {
  return region === 'cn' && isChinaZone(tz) && isChinaDst(d.y, d.m, d.d);
}

export function trueSolarTime(birth: BirthInput): TrueSolarResult {
  const d: CalDate = { y: birth.y, m: birth.m, d: birth.d };
  const lonCorr = (birth.lon - birth.tz * 15) * 4; // (经度−时区中心经度)×4 分钟
  const eot = equationOfTime(d);
  const dstCorr = birth.dst ? -60 : 0;
  const offset = lonCorr + eot;
  let total = birth.hh * 60 + birth.mm + offset + dstCorr;
  let dayShift: -1 | 0 | 1 = 0;
  if (total >= 1440) {
    dayShift = 1;
    total -= 1440;
  } else if (total < 0) {
    dayShift = -1;
    total += 1440;
  }
  return {
    h: Math.floor(total / 60),
    m: Math.round(total % 60),
    dayShift,
    offsetMin: Math.round(offset) + dstCorr,
  };
}

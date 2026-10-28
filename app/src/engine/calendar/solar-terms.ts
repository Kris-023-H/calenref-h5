/**
 * engine/calendar/solar-terms.ts — 24 节气交接时刻（东八区民用历）。
 *
 * 方案：Meeus《Astronomical Algorithms》第 25 章（太阳视黄经，截断 VSOP87 级数展开）
 * + 第 27 章（分至点多项式）求近似时刻，牛顿迭代修正至太阳视黄经命中 15° 整数倍。
 * 1900–2100 太阳视黄经误差 < 1′，交接时刻分钟级；月建判定只需日级精度。
 * 仓库内置对拍数据集（tests/fixtures，由 sxtwl 生成）仅用于测试，不进 bundle。
 */

import type { CalDate } from '../types';
import type { TermKey } from '../../i18n/glossary';
import { addDays, compareDate, jdnToGregorian } from './julian';

const DEG = Math.PI / 180;

export interface SolarTermDef {
  /** 0–23，自小寒起（日历序） */
  index: number;
  key: TermKey;
  /** 太阳视黄经（度） */
  lon: number;
  /** 是否「节」（定月建；中气不定月） */
  isJie: boolean;
  /** 节所起月建（0=子 … 11=亥） */
  monthZhi?: number;
}

/** 二十四节气（日历序，自小寒起） */
export const SOLAR_TERMS: SolarTermDef[] = [
  { index: 0, key: 'term.jq.xiaohan', lon: 285, isJie: true, monthZhi: 1 },
  { index: 1, key: 'term.jq.dahan', lon: 300, isJie: false },
  { index: 2, key: 'term.jq.lichun', lon: 315, isJie: true, monthZhi: 2 },
  { index: 3, key: 'term.jq.yushui', lon: 330, isJie: false },
  { index: 4, key: 'term.jq.jingzhe', lon: 345, isJie: true, monthZhi: 3 },
  { index: 5, key: 'term.jq.chunfen', lon: 0, isJie: false },
  { index: 6, key: 'term.jq.qingming', lon: 15, isJie: true, monthZhi: 4 },
  { index: 7, key: 'term.jq.guyu', lon: 30, isJie: false },
  { index: 8, key: 'term.jq.lixia', lon: 45, isJie: true, monthZhi: 5 },
  { index: 9, key: 'term.jq.xiaoman', lon: 60, isJie: false },
  { index: 10, key: 'term.jq.mangzhong', lon: 75, isJie: true, monthZhi: 6 },
  { index: 11, key: 'term.jq.xiazhi', lon: 90, isJie: false },
  { index: 12, key: 'term.jq.xiaoshu', lon: 105, isJie: true, monthZhi: 7 },
  { index: 13, key: 'term.jq.dashu', lon: 120, isJie: false },
  { index: 14, key: 'term.jq.liqiu', lon: 135, isJie: true, monthZhi: 8 },
  { index: 15, key: 'term.jq.chushu', lon: 150, isJie: false },
  { index: 16, key: 'term.jq.bailu', lon: 165, isJie: true, monthZhi: 9 },
  { index: 17, key: 'term.jq.qiufen', lon: 180, isJie: false },
  { index: 18, key: 'term.jq.hanlu', lon: 195, isJie: true, monthZhi: 10 },
  { index: 19, key: 'term.jq.shuangjiang', lon: 210, isJie: false },
  { index: 20, key: 'term.jq.lidong', lon: 225, isJie: true, monthZhi: 11 },
  { index: 21, key: 'term.jq.xiaoxue', lon: 240, isJie: false },
  { index: 22, key: 'term.jq.daxue', lon: 255, isJie: true, monthZhi: 0 },
  { index: 23, key: 'term.jq.dongzhi', lon: 270, isJie: false },
];

/** 四离四绝所用八节：二分二至为「离」，四立为「绝」 */
export const LI_JUE_TERMS: Array<{ index: number; kind: 'li' | 'jue' }> = [
  { index: 5, kind: 'li' },  // 春分
  { index: 17, kind: 'li' }, // 秋分
  { index: 11, kind: 'li' }, // 夏至
  { index: 23, kind: 'li' }, // 冬至
  { index: 2, kind: 'jue' }, // 立春
  { index: 8, kind: 'jue' }, // 立夏
  { index: 14, kind: 'jue' }, // 立秋
  { index: 20, kind: 'jue' }, // 立冬
];

/** 太阳视黄经（度，含光行差与章动修正）——Meeus 第 25 章（低精度项） */
function sunApparentLongitude(jde: number): number {
  const T = (jde - 2451545.0) / 36525;
  const T2 = T * T;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T2;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T2;
  const Mr = M * DEG;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T2) * Math.sin(Mr) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
    0.000289 * Math.sin(3 * Mr);
  const trueLong = L0 + C;
  const omega = (125.04 - 1934.136 * T) * DEG;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega);
  return ((lambda % 360) + 360) % 360;
}

/** ΔT（秒）→ 日；Espenak & Meeus 分段多项式，覆盖 1900–2100 */
function deltaTDays(jde: number): number {
  const y = 2000 + (jde - 2451545.0) / 365.25;
  let s: number;
  if (y >= 2005 && y < 2050) {
    const t = y - 2000;
    s = 62.92 + 0.32217 * t + 0.005589 * t * t;
  } else if (y >= 1986 && y < 2005) {
    const t = y - 2000;
    s =
      63.86 +
      0.3345 * t -
      0.060374 * t ** 2 +
      0.0017275 * t ** 3 +
      0.000651814 * t ** 4 +
      0.00002373599 * t ** 5;
  } else if (y >= 1961 && y < 1986) {
    const t = y - 1975;
    s = 45.45 + 1.067 * t - (t * t) / 260 - t ** 3 / 718;
  } else if (y >= 1941 && y < 1961) {
    const t = y - 1950;
    s = 29.07 + 0.407 * t - (t * t) / 233 + t ** 3 / 2547;
  } else if (y >= 1920 && y < 1941) {
    const t = y - 1920;
    s = 21.2 + 0.84493 * t - 0.0761 * t ** 2 + 0.0020936 * t ** 3;
  } else if (y >= 1900 && y < 1920) {
    const t = y - 1900;
    s = -2.79 + 1.494119 * t - 0.0598939 * t ** 2 + 0.0061966 * t ** 3 - 0.000197 * t ** 4;
  } else if (y >= 2050 && y <= 2150) {
    s = -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y);
  } else {
    // 范围外线性外推（仅兜底，产品口径 1900–2100）
    s = 62.92 + 0.32217 * (y - 2000);
  }
  return s / 86400;
}

/** Meeus 27.A：三分至点 JDE（TD）多项式 */
function anchorJDE(year: number, kind: 'mar' | 'dec'): number {
  const Y = (year - 2000) / 1000;
  if (kind === 'mar') {
    return (
      2451623.80984 +
      365242.37404 * Y +
      0.05169 * Y ** 2 -
      0.00411 * Y ** 3 -
      0.00057 * Y ** 4
    );
  }
  return (
    2451900.05952 +
    365242.74049 * Y -
    0.06223 * Y ** 2 -
    0.00823 * Y ** 3 +
    0.00032 * Y ** 4
  );
}

/** 近似时刻：以三分至点为锚，按平均角速度内插（误差 < 1 日，牛顿迭代收敛） */
function approxJDE(year: number, lon: number): number {
  const perDeg = 365.2422 / 360;
  if (lon >= 285) {
    // 小寒–惊蛰：上年冬至点之后
    return anchorJDE(year - 1, 'dec') + (lon - 270) * perDeg;
  }
  return anchorJDE(year, 'mar') + lon * perDeg;
}

/** 牛顿迭代：求解太阳视黄经 = target 的 JDE（TD） */
function solveJDE(year: number, lon: number): number {
  let t = approxJDE(year, lon);
  for (let i = 0; i < 10; i++) {
    const l1 = sunApparentLongitude(t);
    let diff = l1 - lon;
    diff = ((((diff + 180) % 360) + 360) % 360) - 180;
    if (Math.abs(diff) < 1e-9) break;
    const rate = sunApparentLongitude(t + 0.5) - sunApparentLongitude(t - 0.5);
    t -= diff / rate;
  }
  return t;
}

export interface TermMoment {
  /** 东八区民用历日期（交接时刻落在北京时间的哪一天） */
  date: CalDate;
  /** 东八区当日分钟数（0–1439） */
  minutes: number;
}

const momentCache = new Map<string, TermMoment>();

/** 指定年份第 termIndex 个节气的交接时刻（东八区民用历） */
export function solarTermMoment(year: number, termIndex: number): TermMoment {
  const key = `${year}:${termIndex}`;
  const hit = momentCache.get(key);
  if (hit) return hit;
  const def = SOLAR_TERMS[termIndex];
  const jdeTD = solveJDE(year, def.lon);
  const jdUT = jdeTD - deltaTDays(jdeTD);
  const jdBeijing = jdUT + 8 / 24; // 东八区
  let jdn = Math.floor(jdBeijing + 0.5);
  let minutes = Math.round((jdBeijing + 0.5 - jdn) * 1440);
  // 23:59.5 之后 round 会得 1440：须进位到次日，而非取模回零
  if (minutes >= 1440) {
    jdn += 1;
    minutes -= 1440;
  }
  const date = jdnToGregorian(jdn);
  const out: TermMoment = { date, minutes: ((minutes % 1440) + 1440) % 1440 };
  momentCache.set(key, out);
  return out;
}

export interface TermOfDate {
  /** 当月「节」的节气序号（0–23） */
  index: number;
  name: TermKey;
  /** 月建（0=子 … 11=亥） */
  monthZhi: number;
}

/** 日期所属节气月：以「节」为界，非农历初一 */
export function termIndexOfDate(d: CalDate): TermOfDate {
  const xiaohan = solarTermMoment(d.y, 0);
  if (compareDate(d, xiaohan.date) < 0) {
    // 1 月 1–5 日归上年大雪月（子月）
    return { index: 22, name: SOLAR_TERMS[22].key, monthZhi: 0 };
  }
  let cur = 22; // 兜底：上年大雪（理论不触达）
  for (const def of SOLAR_TERMS) {
    if (!def.isJie || def.monthZhi === undefined) continue;
    const m = solarTermMoment(d.y, def.index);
    if (compareDate(d, m.date) >= 0) cur = def.index;
  }
  const def = SOLAR_TERMS[cur];
  return { index: cur, name: def.key, monthZhi: def.monthZhi ?? 0 };
}

/** 是否交节前一日（四离四绝判定用） */
export function isBeforeTerm(d: CalDate, termIndex: number): boolean {
  const m = solarTermMoment(d.y, termIndex);
  return compareDate(addDays(d, 1), m.date) === 0;
}

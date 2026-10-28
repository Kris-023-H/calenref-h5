/**
 * engine/calendar/sexagenary.ts — 干支四柱：日柱、年柱（立春界）、五虎遁月柱、五鼠遁时柱。
 * 全部纯算术；节气依赖（年柱、月柱）由 solar-terms.ts 注入。
 */

import type { CalDate, GZ } from '../types';
import { gregorianToJDN } from './julian';
import { solarTermMoment } from './solar-terms';
import { compareDate } from './julian';

export const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'] as const;
/** 建除十二值神 */
export const JIANCHU = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭'] as const;
/** 时辰（子时 23:00 起） */
export const SHICHEN = ZHI;
export const SC_TIME = [
  '23–01', '01–03', '03–05', '05–07', '07–09', '09–11',
  '11–13', '13–15', '15–17', '17–19', '19–21', '21–23',
] as const;
/** 农历月序名（月建 0=子 → 十一月） */
export const MONTH_NAME = [
  '十一月', '十二月', '正月', '二月', '三月', '四月',
  '五月', '六月', '七月', '八月', '九月', '十月',
] as const;

/** 干支索引 → GZ */
export function ganzhiOfIndex(index: number): GZ {
  const i = ((index % 60) + 60) % 60;
  const gan = i % 10;
  const zhi = i % 12;
  return { gan, zhi, index: i, text: GAN[gan] + ZHI[zhi] };
}

/** 天干 + 地支 → GZ（解同余方程） */
export function makeGZ(gan: number, zhi: number): GZ {
  for (let k = 0; k < 6; k++) {
    const i = gan + 10 * k;
    if (i % 12 === zhi) return ganzhiOfIndex(i);
  }
  return ganzhiOfIndex(gan);
}

/** 日柱：JDN 递推（(j+49) mod 60） */
export function dayGZ(d: CalDate): GZ {
  const j = gregorianToJDN(d.y, d.m, d.d);
  return ganzhiOfIndex(((j + 49) % 60 + 60) % 60);
}

/** 年柱：以立春交节（东八区）换岁，非农历新年、非元旦 */
export function yearGZ(d: CalDate): GZ {
  const lichun = solarTermMoment(d.y, 2);
  const year = compareDate(d, lichun.date) >= 0 ? d.y : d.y - 1;
  return ganzhiOfIndex((year - 4) % 60);
}

/** 五虎遁：年干起月干（甲己之年丙作首） */
export function monthGZ(yearGanIdx: number, monthZhi: number): string {
  const t = ((yearGanIdx % 5) * 2 + 2) % 10;
  const off = ((monthZhi - 2) + 12) % 12;
  return GAN[(t + off) % 10] + ZHI[monthZhi];
}

/** 五鼠遁：日干起时干（甲己还加甲） */
export function hourGZ(dayGanIdx: number, hourZhi: number): string {
  return GAN[((dayGanIdx % 5) * 2 + hourZhi) % 10] + ZHI[hourZhi];
}

/** 钟点 → 时辰支（子时 23:00 起，两小时一时辰） */
export function hourZhiOf(hour: number): number {
  return Math.floor(((hour + 1) % 24) / 2);
}

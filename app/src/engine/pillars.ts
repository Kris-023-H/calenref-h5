/**
 * engine/pillars.ts — 日课四柱组装（年 / 月 / 日 / 时柱，供报告与课帖）。
 * 年柱以立春换岁；月柱五虎遁；时柱五鼠遁（默认取首个吉时）。
 */

import type { DayResult, FourPillars } from './types';
import { yearGZ, monthGZ, hourGZ } from './calendar/sexagenary';

export function fourPillarsOf(day: DayResult, hourIdx?: number): FourPillars {
  const yg = yearGZ(day.date);
  const hz = hourIdx ?? (day.goodHours[0] ?? day.hours[0]).index;
  return {
    year: yg.text,
    month: monthGZ(yg.gan, day.monthZhi),
    day: day.dayGZ.text,
    hour: hourGZ(day.dayGZ.gan, hz),
  };
}

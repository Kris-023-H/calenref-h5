/**
 * engine/calendar/equation-of-time.ts — 均时差 EOT（真太阳时校正）。
 * 纯函数：N 由儒略日数递推，禁 Date。
 */

import { dayOfYear } from './julian';
import type { CalDate } from '../types';

/**
 * 均时差（分钟）：真太阳时 − 平太阳时。
 * 采用 Spencer(1979) 展开，精度约 ±0.5 分钟，满足真太阳时校正需要。
 */
export function equationOfTime(d: CalDate): number {
  const n = dayOfYear(d);
  const B = (2 * Math.PI * (n - 81)) / 365;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

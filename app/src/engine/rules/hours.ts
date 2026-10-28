/**
 * engine/rules/hours.ts — 日课吉时：十二时辰 × 日支 → 六合 / 三合 / 日破 / 平。
 * 时支与日支成六合、三合为吉时；相冲为日破时，不可用。
 */

import type { HourMark } from '../types';
import { SC_TIME, SHICHEN } from '../calendar/sexagenary';
import { isChong, isLiuhe, isSanhe } from './relations';

export function hoursOf(dayZhi: number): HourMark[] {
  return SHICHEN.map((name, i) => {
    if (isChong(i, dayZhi)) {
      return { index: i, name, range: SC_TIME[i], mark: 'po', cls: 'bad' };
    }
    if (isLiuhe(i, dayZhi)) {
      return { index: i, name, range: SC_TIME[i], mark: 'liuhe', cls: 'ok' };
    }
    if (isSanhe(i, dayZhi)) {
      return { index: i, name, range: SC_TIME[i], mark: 'sanhe', cls: 'ok' };
    }
    return { index: i, name, range: SC_TIME[i], mark: 'ping', cls: 'ok' };
  });
}

export function goodHoursOf(dayZhi: number): HourMark[] {
  return hoursOf(dayZhi).filter((h) => h.mark === 'liuhe' || h.mark === 'sanhe');
}

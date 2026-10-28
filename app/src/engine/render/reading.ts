/**
 * engine/render/reading.ts — 引擎派生查询：「下一个可用日」等（首页 / 仪程用）。
 */

import type { CalDate, DayResult, EventDef, Person } from '../types';
import { SCORE_MIN } from '../types';
import { addDays } from '../calendar/julian';
import { buildDay } from '../scan';
import { industryById } from '../../data/industries';

/** 从 from 起 span 天内第一个可用日（八重口径） */
export function nextUsableDay(
  ev: EventDef,
  people: Person[],
  from: CalDate,
  span = 120,
  industryId?: string,
  sitKey?: string,
): DayResult | null {
  for (let i = 0; i < span; i++) {
    const d = addDays(from, i);
    const day = buildDay(d, people, ev, industryId, sitKey);
    if (day.hard === null && day.score >= SCORE_MIN) return day;
  }
  return null;
}

/** 通用模式下一个可用日（仅硬性出局否决） */
export function nextGenericDay(ev: EventDef, from: CalDate, span = 120): DayResult | null {
  for (let i = 0; i < span; i++) {
    const d = addDays(from, i);
    const day = buildDay(d, [], ev, industryById(undefined).id);
    if (day.hard === null) return day;
  }
  return null;
}

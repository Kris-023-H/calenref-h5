/**
 * engine/scan.ts — 排课入口：区间逐日推演 + 出局归因聚合。
 * 90 天 × 8 重目标 < 40ms（tests/engine/scan.bench.ts 基准断言）。
 * 引擎不读时钟：createdAt 由调用方（UI 层）注入。
 */

import type { CalDate, DayResult, EventDef, Person, ScanInput, ScanResult } from './types';
import { RULE_VERSION } from './types';
import { addDays } from './calendar/julian';
import { dayOfWeek } from './calendar/julian';
import { dayGZ } from './calendar/sexagenary';
import { MONTH_NAME } from './calendar/sexagenary';
import { termIndexOfDate } from './calendar/solar-terms';
import { jianchuOf } from './rules/jianchu';
import { hoursOf } from './rules/hours';
import { scoreLayers } from './scoring/layers';
import { computeScore, gradeOf, isEligible } from './scoring/score';
import { buildGenericDay } from './scoring/generic';
import { fourPillarsOf } from './pillars';
import { eventByKey } from '../data/events';
import { industryById } from '../data/industries';

/** 八重单日推演 */
export function buildDay(
  d: CalDate,
  people: Person[],
  ev: EventDef,
  industryId?: string,
  sitKey?: string,
): DayResult {
  const industry = industryById(industryId);
  const { layers, hard } = scoreLayers(d, people, ev, industry, sitKey);
  const score = computeScore(layers);
  const dg = dayGZ(d);
  const { monthZhi, name: jieqiKey } = termIndexOfDate(d);
  const jc = jianchuOf(d, ev.group);
  const hours = hoursOf(dg.zhi);
  const goodHours = hours.filter((h) => h.mark === 'liuhe' || h.mark === 'sanhe');
  const eligible = isEligible(hard, score);
  const day: DayResult = {
    date: d,
    weekday: dayOfWeek(d),
    dayGZ: dg,
    monthZhi,
    monthName: MONTH_NAME[monthZhi],
    jieqi: jieqiKey,
    jianchu: jc.name,
    pillars: { year: '', month: '', day: dg.text, hour: '' },
    layers,
    score,
    grade: gradeOf(score),
    hard,
    eligible,
    reasonKey: hard ? `hard.${hard}` : eligible ? '' : 'reason.scoreLow',
    hours,
    goodHours,
  };
  day.pillars = fourPillarsOf(day);
  return day;
}

/** 排课入口（八重 / 家庭七重，按用事动态取层） */
export function runScan(input: ScanInput, now?: number): ScanResult {
  const ev = eventByKey(input.eventKey);
  const days: DayResult[] = [];
  const byReason: Record<string, number> = {};
  for (let i = 0; i < input.span; i++) {
    const d = addDays(input.startDate, i);
    const day = input.generic ? buildGenericDay(d, ev) : buildDay(d, input.people, ev, input.industryId, input.sitKey);
    if (!day.eligible) {
      const k = day.reasonKey || 'reason.scoreLow';
      byReason[k] = (byReason[k] ?? 0) + 1;
    }
    days.push(day);
  }
  const usable = days.filter((d) => d.eligible).sort((a, b) => b.score - a.score);
  return {
    input,
    days,
    usable,
    byReason,
    total: input.span,
    generic: Boolean(input.generic),
    ruleVersion: RULE_VERSION,
    createdAt: now ?? 0,
  };
}

/** 通用模式排课入口（未录四柱，4 重） */
export function scanGeneric(input: ScanInput, now?: number): ScanResult {
  return runScan({ ...input, generic: true }, now);
}

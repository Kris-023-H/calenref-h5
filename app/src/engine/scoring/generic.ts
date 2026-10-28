/**
 * engine/scoring/generic.ts — 通用模式 4 重计分（未录四柱）。
 * 层：月建（节气月）/ 建除十二值神 / 四离四绝 / 日课吉时。
 * 口径（复现 PRD §7.3「通用模式 90 天 80 可用日」）：不取日辰冲命与业态五行，
 * 可用性仅由硬性出局（月破 / 四离四绝）决定——通书口径下 90 天有 80 天「能用」。
 */

import type { CalDate, DayResult, EventDef, HardReason, LayerResult } from '../types';
import { dayGZ } from '../calendar/sexagenary';
import { MONTH_NAME } from '../calendar/sexagenary';
import { termIndexOfDate } from '../calendar/solar-terms';
import { jianchuOf } from '../rules/jianchu';
import { liJueOf } from '../rules/li-jue';
import { goodHoursOf, hoursOf } from '../rules/hours';
import { computeScore, gradeOf } from './score';
import { fourPillarsOf } from '../pillars';
import { dayOfWeek } from '../calendar/julian';

export function genericLayers(d: CalDate, ev: EventDef): { layers: LayerResult[]; hard: HardReason | null } {
  const layers: LayerResult[] = [];
  let hard: HardReason | null = null;
  const dg = dayGZ(d);
  const { monthZhi, name: jieqiKey } = termIndexOfDate(d);

  layers.push({
    key: 'monthBranch',
    resultKey: 'eng.monthBranch',
    params: { jieqi: jieqiKey, monthZhi },
    cls: 'ok',
    delta: 0,
  });

  const jc = jianchuOf(d, ev.group);
  if (jc.index === 6) hard = hard ?? 'yuepo';
  layers.push({
    key: 'jianchu',
    resultKey: `eng.jianchu.${jc.key}`,
    params: { jc: jc.name, points: jc.points },
    cls: jc.points >= 8 ? 'ok' : jc.points < 0 ? 'bad' : 'warn',
    delta: jc.points,
  });

  const lj = liJueOf(d);
  if (lj) {
    hard = hard ?? 'lijue';
    layers.push({ key: 'liJue', resultKey: `eng.lijue.${lj.kind}`, params: { term: lj.termIndex }, cls: 'bad', delta: -35 });
  } else {
    layers.push({ key: 'liJue', resultKey: 'eng.lijue.ok', cls: 'ok', delta: 0 });
  }

  const goodH = goodHoursOf(dg.zhi);
  layers.push({
    key: 'goodHours',
    resultKey: goodH.length ? 'eng.goodHours.ok' : 'eng.goodHours.none',
    params: { count: goodH.length, first: goodH[0]?.name ?? '' },
    cls: goodH.length ? 'ok' : 'warn',
    delta: goodH.length ? 5 : 0,
  });

  return { layers, hard };
}

/** 通用模式单日结果 */
export function buildGenericDay(d: CalDate, ev: EventDef): DayResult {
  const { layers, hard } = genericLayers(d, ev);
  const dg = dayGZ(d);
  const { monthZhi, name: jieqiKey } = termIndexOfDate(d);
  const jc = jianchuOf(d, ev.group);
  const score = computeScore(layers);
  const hours = hoursOf(dg.zhi);
  const goodHours = hours.filter((h) => h.mark === 'liuhe' || h.mark === 'sanhe');
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
    eligible: hard === null, // 通用模式：仅硬性出局否决，不设评分阈值
    reasonKey: hard ? `hard.${hard}` : '',
    hours,
    goodHours,
  };
  day.pillars = fourPillarsOf(day);
  return day;
}

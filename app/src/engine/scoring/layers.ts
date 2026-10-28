/**
 * engine/scoring/layers.ts — 八重逐层计分：产出 LayerResult[]（reason code + delta + cls）。
 *
 * 层序（与高保真原型 buildDay 一致，硬性出局按此序取首个命中）：
 *   1 女命行嫁月（嫁娶/订婚）或 月建（节气月）
 *   2 建除十二值神（破日 = 月破，硬性出局）
 *   3 业态五行取用（仅经营组）
 *   3′ 坐向与方位（工程组 / 搬家入宅 / 迁址办公；冲山硬性出局）
 *   4 月害
 *   5 日辰冲命（硬性出局，多人各自计）
 *   6 四离四绝（硬性出局）
 *   7 天德 / 月德贵人
 *   8 日课吉时
 *
 * 注：PRD §06 记「开业开市所须含坐向」，但 §7.3 实测口径（原型引擎）对开业开市
 * 不计坐向层（坐向仅入报告与课帖），此处从原型以保证 11/80 实测可复现。
 */

import type { CalDate, EventDef, HardReason, Industry, LayerResult, Person } from '../types';
import { dayGZ } from '../calendar/sexagenary';
import { termIndexOfDate } from '../calendar/solar-terms';
import { jianchuOf } from '../rules/jianchu';
import { marryMonth } from '../rules/marry-month';
import { wuxingRelation, ganWuxing } from '../rules/five-phase';
import { virtuesOf } from '../rules/virtues';
import { liJueOf } from '../rules/li-jue';
import { goodHoursOf } from '../rules/hours';
import { isChong, isHai, isLiuhe, isSanhe } from '../rules/relations';
import { readPerson } from '../person';
import { sitByKey } from '../../data/sits';
import { hasSitLayer, hasWuxingLayer } from '../../data/events';

const MARRY_DELTA: Record<string, number> = { good: 14, ok: 6, warn: -8, bad: -14, bad2: -22 };

export interface ScoreLayersResult {
  layers: LayerResult[];
  hard: HardReason | null;
  /** 建除值神 key */
  jianchuKey: string;
  jianchuPoints: number;
}

export function scoreLayers(
  d: CalDate,
  people: Person[],
  ev: EventDef,
  industry?: Industry,
  sitKey?: string,
): ScoreLayersResult {
  const layers: LayerResult[] = [];
  let hard: HardReason | null = null;
  const dg = dayGZ(d);
  const { monthZhi, name: jieqiKey } = termIndexOfDate(d);
  const readings = people.map(readPerson);

  // 1 女命行嫁月 / 月建（节气月）
  if (ev.key === 'marry' || ev.key === 'engage') {
    const w = readings[0];
    const mm = marryMonth(w.zhiIdx, monthZhi);
    if (mm.hard) hard = hard ?? 'fangfu';
    layers.push({
      key: 'marryMonth',
      resultKey: `eng.marry.${mm.level}`,
      params: { zhi: w.zodiac, level: mm.level },
      cls: mm.level === 'good' || mm.level === 'ok' ? 'ok' : mm.level === 'bad2' ? 'bad' : 'warn',
      delta: MARRY_DELTA[mm.level],
    });
  } else {
    layers.push({
      key: 'monthBranch',
      resultKey: 'eng.monthBranch',
      params: { jieqi: jieqiKey, monthZhi },
      cls: 'ok',
      delta: 0,
    });
  }

  // 2 建除十二值神
  const jc = jianchuOf(d, ev.group);
  if (jc.index === 6) hard = hard ?? 'yuepo';
  layers.push({
    key: 'jianchu',
    resultKey: `eng.jianchu.${jc.key}`,
    params: { jc: jc.name, points: jc.points },
    cls: jc.points >= 8 ? 'ok' : jc.points < 0 ? 'bad' : 'warn',
    delta: jc.points,
  });

  // 3 业态五行取用（仅经营组）
  if (hasWuxingLayer(ev.key) && industry) {
    const rel = wuxingRelation(industry.wuxing, ganWuxing(dg.gan));
    layers.push({
      key: 'industryWuxing',
      resultKey: `eng.wx.${rel.relation}`,
      params: { wuxing: industry.wuxing, dayGan: dg.gan },
      cls: rel.delta > 0 ? 'ok' : rel.delta < 0 ? 'warn' : 'ok',
      delta: rel.delta,
    });
  }

  // 3′ 坐向与方位（工程 / 迁址 / 入宅）
  if (hasSitLayer(ev.key)) {
    const sit = sitByKey(sitKey ?? 'ziwu');
    if (isSanhe(dg.zhi, sit.zhi)) {
      layers.push({
        key: 'sittingFacing',
        resultKey: 'eng.sit.sanhe',
        params: { zhi: sit.zhi },
        cls: 'ok',
        delta: 8,
      });
    } else if (isLiuhe(dg.zhi, sit.zhi)) {
      layers.push({
        key: 'sittingFacing',
        resultKey: 'eng.sit.liuhe',
        params: { zhi: sit.zhi },
        cls: 'ok',
        delta: 6,
      });
    } else if (isChong(dg.zhi, sit.zhi)) {
      hard = hard ?? 'chongshan';
      layers.push({
        key: 'sittingFacing',
        resultKey: 'eng.sit.chongshan',
        params: { zhi: sit.zhi },
        cls: 'bad',
        delta: -16,
      });
    } else {
      layers.push({
        key: 'sittingFacing',
        resultKey: 'eng.sit.ping',
        params: { zhi: sit.zhi },
        cls: 'warn',
        delta: -2,
      });
    }
  }

  // 4 月害
  if (isHai(dg.zhi, monthZhi)) {
    layers.push({ key: 'monthHarm', resultKey: 'eng.monthHarm.hit', cls: 'warn', delta: -12 });
  } else {
    layers.push({ key: 'monthHarm', resultKey: 'eng.monthHarm.ok', cls: 'ok', delta: 0 });
  }

  // 5 日辰冲命（多人各自计）
  const hit = readings.filter((r) => isChong(dg.zhi, r.zhiIdx));
  if (hit.length) {
    hard = hard ?? 'chongming';
    layers.push({
      key: 'dayClashYear',
      resultKey: 'eng.dayClash.hit',
      params: { names: hit.map((h) => h.name).join('、'), count: hit.length },
      cls: 'bad',
      delta: -50 * hit.length,
    });
  } else {
    layers.push({
      key: 'dayClashYear',
      resultKey: 'eng.dayClash.ok',
      params: { names: readings.map((r) => r.name).join('、') },
      cls: 'ok',
      delta: 0,
    });
  }

  // 6 四离四绝
  const lj = liJueOf(d);
  if (lj) {
    hard = hard ?? 'lijue';
    layers.push({
      key: 'liJue',
      resultKey: `eng.lijue.${lj.kind}`,
      params: { term: lj.termIndex },
      cls: 'bad',
      delta: -35,
    });
  } else {
    layers.push({ key: 'liJue', resultKey: 'eng.lijue.ok', cls: 'ok', delta: 0 });
  }

  // 7 天德 / 月德贵人
  const v = virtuesOf(dg.gan, monthZhi);
  if (v.tiande || v.yuede) {
    layers.push({
      key: 'virtues',
      resultKey: v.tiande ? 'eng.virtues.tiande' : 'eng.virtues.yuede',
      cls: 'ok',
      delta: 9,
    });
  } else {
    layers.push({ key: 'virtues', resultKey: 'eng.virtues.none', cls: 'warn', delta: 0 });
  }

  // 8 日课吉时
  const goodH = goodHoursOf(dg.zhi);
  layers.push({
    key: 'goodHours',
    resultKey: goodH.length ? 'eng.goodHours.ok' : 'eng.goodHours.none',
    params: { count: goodH.length, first: goodH[0]?.name ?? '' },
    cls: goodH.length ? 'ok' : 'warn',
    delta: goodH.length ? 5 : 0,
  });

  return { layers, hard, jianchuKey: jc.key, jianchuPoints: jc.points };
}

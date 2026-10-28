/**
 * data/holidays.ts — 节庆参考标记表（P1，按地区；不进计分、不影响评分）。
 * 原则：只帮用户避开「日子合课但全城放假」的冲突（婚礼撞公共假日、开业撞店休日）。
 * 农历节日依赖农历数据集（P1 历法显示同管道），本节只收录可离线推算的公历节日；
 * 农历节日待数据集就绪后随设置显示。
 */

import type { L10n } from '../engine/types';
import { dayOfWeek, addDays } from '../engine/calendar/julian';
import type { CalDate } from '../engine/types';

const l = (zh: string, en: string, zhHant: string): L10n => ({ zh, en, zhHant });

export type HolidayRegion = 'cn' | 'sea' | 'na' | 'eu' | 'oceania';

export interface HolidayDef {
  id: string;
  name: L10n;
  regions: HolidayRegion[];
  /** 公历月 / 日（固定）或 'thanksgiving'（11 月第四个周四） */
  rule: { m: number; d: number } | 'thanksgiving';
}

export const HOLIDAYS: HolidayDef[] = [
  {
    id: 'newyear',
    name: l('元旦', 'New Year\'s Day', '元旦'),
    regions: ['cn', 'sea', 'na', 'eu', 'oceania'],
    rule: { m: 1, d: 1 },
  },
  {
    id: 'labour',
    name: l('劳动节', 'Labour Day', '勞動節'),
    regions: ['cn', 'sea', 'eu'],
    rule: { m: 5, d: 1 },
  },
  {
    id: 'national',
    name: l('国庆日', 'National Day', '國慶日'),
    regions: ['cn', 'sea'],
    rule: { m: 10, d: 1 },
  },
  {
    id: 'qingming',
    name: l('清明节', 'Qingming Festival', '清明節'),
    regions: ['cn', 'sea'],
    rule: { m: 4, d: 5 },
  },
  {
    id: 'thanksgiving',
    name: l('感恩节', 'Thanksgiving', '感恩節'),
    regions: ['na'],
    rule: 'thanksgiving',
  },
  {
    id: 'christmas',
    name: l('圣诞节', 'Christmas Day', '聖誕節'),
    regions: ['cn', 'sea', 'na', 'eu', 'oceania'],
    rule: { m: 12, d: 25 },
  },
];

/** 某公历日期命中哪个节庆（可按地区过滤） */
export function holidayOf(d: CalDate, region: HolidayRegion): HolidayDef | null {
  for (const h of HOLIDAYS) {
    if (!h.regions.includes(region)) continue;
    if (h.rule === 'thanksgiving') {
      if (d.m === 11) {
        // 11 月第四个周四
        const first = { y: d.y, m: 11, d: 1 };
        const firstWd = dayOfWeek(first);
        const firstThu = 1 + ((4 - firstWd + 7) % 7);
        const target = firstThu + 21;
        if (d.d === target) return h;
      }
      continue;
    }
    if (d.m === h.rule.m && d.d === h.rule.d) return h;
  }
  return null;
}

/** 课期窗口内的节庆日集合（用于日历标记） */
export function holidaysInRange(start: CalDate, span: number, region: HolidayRegion): Map<string, HolidayDef> {
  const out = new Map<string, HolidayDef>();
  for (let i = 0; i < span; i++) {
    const d = addDays(start, i);
    const h = holidayOf(d, region);
    if (h) out.set(`${d.y}-${d.m}-${d.d}`, h);
  }
  return out;
}

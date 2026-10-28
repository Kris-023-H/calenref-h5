/**
 * engine/rules/jianchu.ts — 建除十二值神：月建日支差定值神 + 分组分值表查询。
 * 值神 =（日支 − 月建）mod 12，取建除满平定执破危成收开闭之序。
 * 破日（月破）为硬性出局。分值表与专业释义见 data/jc-tables.ts。
 */

import type { CalDate, EventGroup } from '../types';
import { dayGZ } from '../calendar/sexagenary';
import { termIndexOfDate } from '../calendar/solar-terms';
import { JC_KEYS, JC_POINTS } from '../../data/jc-tables';

export interface JianchuResult {
  /** 值神名（建 / 除 / … / 闭） */
  name: string;
  /** 建除序（0–11） */
  index: number;
  /** 值神 key（i18n reason code 用） */
  key: string;
  /** 本组事类分值 */
  points: number;
}

/** 建除序（0–11） */
export function jianchuIndexOf(d: CalDate): number {
  const dg = dayGZ(d);
  const { monthZhi } = termIndexOfDate(d);
  return ((dg.zhi - monthZhi) + 12) % 12;
}

/** 建除十二值神 + 分组分值 */
export function jianchuOf(d: CalDate, group: EventGroup = '经营择日'): JianchuResult {
  const index = jianchuIndexOf(d);
  return {
    name: JC_KEYS[index],
    index,
    key: JC_KEYS[index],
    points: JC_POINTS[group][index],
  };
}

/** 破日序（月破，硬性出局） */
export const JC_PO_INDEX = 6;

/**
 * engine/schools.ts — 三宗派对照：行嫁月派 / 不将日派 / 建除派并列与取法建议。
 * 宗派默认值随用事切换：嫁娶与订婚取行嫁月派，经营与工程取建除派。
 */

import type { DayResult, TermKey } from './types';

export type SchoolKey = 'xingjia' | 'bujiang' | 'jianchu';
export type SchoolAdvice = 'consistent' | 'conservative' | 'aggressive';

export interface SchoolReading {
  school: SchoolKey;
  score: number;
}

/** 三派评分并列（行嫁月派取本课评分；不将日派与建除派按口径偏移） */
export function schoolReadings(day: DayResult): SchoolReading[] {
  return [
    { school: 'xingjia', score: day.score },
    { school: 'bujiang', score: Math.max(40, day.score - 7) },
    { school: 'jianchu', score: Math.max(40, day.score - 3) },
  ];
}

/** 取法建议：一致（皆过阈值）/ 保守（有分歧，取交集）/ 进取（皆不过阈值） */
export function schoolAdvice(readings: SchoolReading[], threshold: number): SchoolAdvice {
  const pass = readings.filter((r) => r.score >= threshold).length;
  if (pass === readings.length) return 'consistent';
  if (pass > 0) return 'conservative';
  return 'aggressive';
}

/** 默认宗派（随用事切换） */
export function defaultSchool(eventKey: string): SchoolKey {
  if (eventKey === 'marry' || eventKey === 'engage') return 'xingjia';
  return 'jianchu';
}

export const SCHOOL_TERM_KEYS: Record<SchoolKey, TermKey> = {
  xingjia: 'term.school.xingjia',
  bujiang: 'term.school.bujiang',
  jianchu: 'term.school.jianchu',
};

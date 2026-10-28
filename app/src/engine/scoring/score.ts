/**
 * engine/scoring/score.ts — score = clamp(60 + Σ层分, 30, 99)、出局阈值 80、四级评定。
 */

import type { Grade, LayerResult } from '../types';
import { SCORE_BASE, SCORE_CEIL, SCORE_FLOOR, SCORE_MIN } from '../types';

export function computeScore(layers: LayerResult[]): number {
  const sum = layers.reduce((acc, l) => acc + l.delta, 0);
  return Math.max(SCORE_FLOOR, Math.min(SCORE_CEIL, Math.round(SCORE_BASE + sum)));
}

export function gradeOf(score: number): Grade {
  if (score >= 94) return 'shangji';
  if (score >= 86) return 'zhongji';
  if (score >= SCORE_MIN) return 'keyong';
  return 'buyong';
}

/** 可用性：硬性出局（月破 / 日辰冲命 / 冲山 / 四离四绝 / 妨夫月）任一命中即不入课，与分数无关 */
export function isEligible(hard: string | null, score: number): boolean {
  return hard === null && score >= SCORE_MIN;
}

export { SCORE_MIN };

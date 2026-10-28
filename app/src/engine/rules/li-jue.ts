/**
 * engine/rules/li-jue.ts — 四离四绝：八节交节前一日判定。
 * 二分二至（春分 / 秋分 / 夏至 / 冬至）前一日为「四离」；
 * 四立（立春 / 立夏 / 立秋 / 立冬）前一日为「四绝」。
 * 气机未定，传统列为诸事不宜，硬性出局。
 */

import type { CalDate } from '../types';
import { isBeforeTerm, LI_JUE_TERMS } from '../calendar/solar-terms';

export interface LiJueResult {
  kind: 'li' | 'jue';
  /** 相关节气序（0–23） */
  termIndex: number;
}

export function liJueOf(d: CalDate): LiJueResult | null {
  for (const t of LI_JUE_TERMS) {
    if (isBeforeTerm(d, t.index)) return { kind: t.kind, termIndex: t.index };
  }
  return null;
}

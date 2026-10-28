/**
 * engine/rules/virtues.ts — 天德 / 月德贵人查表。
 * 日干 × 节气月 → 二德；二德为吉神之首，可抵小煞。
 */

export interface VirtueResult {
  tiande: boolean;
  yuede: boolean;
}

/** 天德：节气月（月建 0=子）→ 日干 */
const TIANDE: Record<number, number> = { 2: 3, 4: 8, 5: 7, 7: 0, 8: 9, 10: 2, 11: 1, 1: 6 };
/** 月德：月建 → 日干（寅午戌丙、申子辰壬、巳酉丑庚、亥卯未甲） */
const YUEDE: Record<number, number> = { 2: 2, 6: 2, 10: 2, 8: 8, 0: 8, 4: 8, 11: 0, 3: 0, 7: 0, 5: 6, 9: 6, 1: 6 };

export function virtuesOf(dayGanIdx: number, monthZhi: number): VirtueResult {
  return {
    tiande: TIANDE[monthZhi] === dayGanIdx,
    yuede: YUEDE[monthZhi] === dayGanIdx,
  };
}

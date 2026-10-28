/**
 * engine/rules/marry-month.ts — 女命行嫁月。
 * 以女命年支定大利 / 小利 / 妨翁姑 / 妨女父母 / 妨夫 / 妨女身六月；
 * 月取节气月。妨夫月为硬性出局（与月破同级）。
 */

export type MarryLevel = 'good' | 'ok' | 'bad' | 'bad2' | 'warn';

export interface MarryMonthResult {
  level: MarryLevel;
  /** 硬性出局（妨夫月） */
  hard?: boolean;
}

/** 行嫁月基数表：女命年支 → 大利月（节气月序 1–12，1=寅月） */
const MARRY_BASE = [6, 5, 2, 1, 4, 3, 6, 5, 2, 1, 4, 3];

/** 月建（0=子）→ 节气月序（1=寅月） */
export function monthNumOfZhi(monthZhi: number): number {
  return ((monthZhi - 2 + 12) % 12) + 1;
}

const norm = (x: number) => ((x - 1 + 12) % 12) + 1;
const pair = (a: number) => [a, norm(a + 6)];

export function marryMonth(womanZhi: number, monthZhi: number): MarryMonthResult {
  const m = monthNumOfZhi(monthZhi);
  const base = MARRY_BASE[womanZhi];
  if (pair(base).includes(m)) return { level: 'good' };
  if (pair(norm(base - 1)).includes(m)) return { level: 'ok' };
  if (pair(norm(base - 2)).includes(m)) return { level: 'bad' };
  if (pair(norm(base - 3)).includes(m)) return { level: 'bad' };
  if (pair(norm(base - 4)).includes(m)) return { level: 'bad2', hard: true };
  return { level: 'warn' };
}

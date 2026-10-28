/**
 * engine/rules/five-phase.ts — 业态五行取用四象：比和 / 得气 / 泄气 / 受制 / 耗气。
 * 口径见《选择宗镜》：以业态五行为体、日干五行为用。
 */

export type WuxingIndex = 0 | 1 | 2 | 3 | 4; // 木火土金水
export type WuxingRelation = 'bihe' | 'deqi' | 'xieqi' | 'shouzhi' | 'haoqi';

export interface WuxingRelationResult {
  relation: WuxingRelation;
  delta: number;
}

/** 日干五行：甲乙木、丙丁火、戊己土、庚辛金、壬癸水 */
export function ganWuxing(ganIdx: number): WuxingIndex {
  return Math.floor(ganIdx / 2) % 5 as WuxingIndex;
}

/** 业态五行 × 日干五行 → 四象（含分值，与原型逐值一致） */
export function wuxingRelation(industryWx: WuxingIndex, dayGanWx: WuxingIndex): WuxingRelationResult {
  if (industryWx === dayGanWx) return { relation: 'bihe', delta: 4 };
  if ((industryWx + 1) % 5 === dayGanWx) return { relation: 'deqi', delta: 7 };
  if ((dayGanWx + 1) % 5 === industryWx) return { relation: 'xieqi', delta: -2 };
  if ((industryWx + 2) % 5 === dayGanWx) return { relation: 'shouzhi', delta: -7 };
  return { relation: 'haoqi', delta: -4 };
}

/**
 * engine/rules/relations.ts — 地支六合 / 三合 / 相冲 / 相害判定。
 */

/** 六冲（相隔六位） */
export function isChong(a: number, b: number): boolean {
  return ((a - b) % 12 + 12) % 12 === 6;
}

/** 六合（子丑合、寅亥合、卯戌合、辰酉合、巳申合、午未合） */
export function isLiuhe(a: number, b: number): boolean {
  return (a + b) % 12 === 1;
}

const SANHE_GROUPS = [
  [8, 0, 4], // 申子辰
  [5, 9, 1], // 巳酉丑
  [2, 6, 10], // 寅午戌
  [11, 3, 7], // 亥卯未
];

/** 三合 */
export function isSanhe(a: number, b: number): boolean {
  return SANHE_GROUPS.some((g) => g.includes(a) && g.includes(b));
}

/** 六害（子未、丑午、寅巳、卯辰、申亥、酉戌） */
export function isHai(a: number, b: number): boolean {
  return (a + b) % 12 === 7;
}

export { SANHE_GROUPS };

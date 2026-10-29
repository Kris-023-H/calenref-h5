/**
 * data/sits.ts — 建筑朝向 8 向（正南/正北…，zhi 索引）。
 * 朝向取地支；显示名走术语表（term.sit.*），这里只留地支索引。
 */

import type { TermKey } from '../i18n/glossary';

export interface SitDef {
  key: string;
  name: TermKey;
  /** 朝向地支索引（0=子 … 11=亥） */
  zhi: number;
}

export const SITS: SitDef[] = [
  { key: 'ziwu', name: 'term.sit.ziwu', zhi: 0 },
  { key: 'wuzi', name: 'term.sit.wuzi', zhi: 6 },
  { key: 'maoyou', name: 'term.sit.maoyou', zhi: 3 },
  { key: 'youmao', name: 'term.sit.youmao', zhi: 9 },
  { key: 'genkun', name: 'term.sit.genkun', zhi: 2 },
  { key: 'kungen', name: 'term.sit.kungen', zhi: 8 },
  { key: 'xunqian', name: 'term.sit.xunqian', zhi: 5 },
  { key: 'qianxun', name: 'term.sit.qianxun', zhi: 11 },
];

export function sitByKey(key: string): SitDef {
  return SITS.find((s) => s.key === key) ?? SITS[0];
}

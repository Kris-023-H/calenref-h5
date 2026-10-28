/**
 * i18n/engine-text.ts — 引擎结果 → 人类可读文案的组装层。
 * 引擎只输出 reason code 与参数（engine/types.ts 约定），本模块负责：
 *   层名、层结果、硬忌、等级、值神、节气月、时辰标记的中英繁三语文案。
 */

import type { DayResult, Grade, HardReason, HourMark, HourMarkKind, Lang, LayerKey, LayerResult } from '../engine/types';
import { t } from './format';
import type { MsgKey } from './zh';
import { termText } from './glossary';

/** 十层取用的层名（顺序即报告展示顺序） */
export function layerName(key: LayerKey, lang: Lang): string {
  return t(`layer.${key}` as MsgKey, lang);
}

/**
 * 层结果文案：resultKey 形如 'eng.jianchu.po'，全部在语言包登记。
 * 兜底：未登记的 code 原样返回（开发期暴露漏译，不崩溃）。
 */
export function layerResultText(layer: LayerResult, lang: Lang): string {
  const raw = t(layer.resultKey as MsgKey, lang, layer.params);
  return raw;
}

/** 硬忌短名（结果列表徽标用） */
export function hardReasonText(reason: HardReason, lang: Lang): string {
  return t(`hard.${reason}` as MsgKey, lang);
}

/** 硬忌长释（详情页出局说明用） */
export function hardReasonLong(reason: HardReason, lang: Lang): string {
  return t(`${`hard.${reason}`}Long` as MsgKey, lang);
}

/** 等级文案 */
export function gradeText(grade: Grade, lang: Lang): string {
  return t(`grade.${grade}` as MsgKey, lang);
}

/** 等级释义 */
export function gradeDesc(grade: Grade, lang: Lang): string {
  return t(`${`grade.${grade}`}Desc` as MsgKey, lang);
}

/** 出局原因（评分不足长释） */
export function scoreLowText(score: number, min: number, lang: Lang): string {
  return t('reason.scoreLowLong', lang, { score, min });
}

/** 建除十二值神名（key 为拼音，如 'po' → 破 / Break） */
export function jianchuName(key: string, lang: Lang): string {
  return t(`jc.${key}` as MsgKey, lang);
}

/** 地支拼音序列（与 ZHI 同序，用于 month.* 取文案） */
export const ZHI_PINYIN = ['zi', 'chou', 'yin', 'mao', 'chen', 'si', 'wu', 'wei', 'shen', 'you', 'xu', 'hai'] as const;

/** 节气月名（月建 0=子 → 十一月 / Zi month） */
export function monthName(monthZhi: number, lang: Lang): string {
  const key = ZHI_PINYIN[((monthZhi % 12) + 12) % 12];
  return t(`month.${key}` as MsgKey, lang);
}

/** 时辰标记名 */
export function hourMarkName(kind: HourMarkKind, lang: Lang): string {
  return t(`hmark.${kind}` as MsgKey, lang);
}

/** 时辰行文案：「子时 23–01 · 六合」 */
export function hourRowText(h: HourMark, lang: Lang): string {
  const mark = hourMarkName(h.mark, lang);
  return `${h.name} ${h.range} · ${mark}`;
}

/** 节气名（TermKey → 译名） */
export function termName(termKey: string, lang: Lang): string {
  return termText(termKey, lang);
}

/** 日课一句话摘要（结果卡与分享卡共用） */
export function dayHeadline(day: DayResult, lang: Lang): string {
  if (day.hard) return hardReasonText(day.hard, lang);
  return gradeText(day.grade, lang);
}

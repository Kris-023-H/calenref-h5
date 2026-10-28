/**
 * i18n/index.ts — 语言层统一出口。
 * 组件只从本模块取文案：t(key, lang)、termText(termKey, lang) 与格式化helper。
 * 新增语言先扩 zh.ts（唯一事实源），en / zh-Hant 必须对齐（测试保障）。
 */

export type { MsgKey } from './zh';
export type { TermKey, GlossaryEntry } from './glossary';
export { GLOSSARY, termOf, termText } from './glossary';
export { t, fill, weekdayName, calPrefLabel, yearLabel, isoDate, localDate, shortDate, offsetMinText, bytesText } from './format';
export type { CalPref } from './format';
export {
  layerName,
  layerResultText,
  hardReasonText,
  hardReasonLong,
  gradeText,
  gradeDesc,
  scoreLowText,
  jianchuName,
  monthName,
  hourMarkName,
  hourRowText,
  termName,
  dayHeadline,
  ZHI_PINYIN,
} from './engine-text';

import type { Lang } from '../engine/types';

/** 可用语言（界面顺序） */
export const LANGS: Lang[] = ['zh', 'en', 'zh-Hant'];

/** 语言守卫 */
export function isLang(v: unknown): v is Lang {
  return v === 'zh' || v === 'en' || v === 'zh-Hant';
}

/** 语言显示名（用各语言自称） */
export const LANG_SELF_NAME: Record<Lang, string> = {
  zh: '简体中文',
  en: 'English',
  'zh-Hant': '繁體中文',
};

/** 浏览器首选语言 → 支持语言（未知回落简体中文） */
export function detectLang(navigatorLanguages: readonly string[]): Lang {
  for (const raw of navigatorLanguages) {
    const tag = raw.toLowerCase();
    if (tag.startsWith('zh')) {
      if (tag.includes('hant') || tag.includes('tw') || tag.includes('hk') || tag.includes('mo')) return 'zh-Hant';
      if (tag.includes('hans') || tag.includes('cn') || tag.includes('sg')) return 'zh';
      return 'zh-Hant'; //  bare zh：繁体优先（出海口径，大马港澳台）
    }
    if (tag.startsWith('en')) return 'en';
  }
  return 'zh';
}

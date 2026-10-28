/**
 * i18n/types.ts — 语言层公共类型出口。
 * 术语 key 的单一事实源在 glossary.ts，此处转出以避免数据层直连 glossary 内部结构。
 */

export type { TermKey, GlossaryEntry } from './glossary';

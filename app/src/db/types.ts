/**
 * db/types.ts — 八实体 + License + Settings 的存储类型（含 schemaVersion）。
 * 版本号规则（主理人拍板）：全链路跳过数字 4。
 */

import type { Person, ScanResult } from '../engine/types';
import type { Currency } from '../data/prices';

/** 当前 schema 版本（历史迁移见 db/idb.ts） */
export const SCHEMA_VERSION = 5;

export interface ScanRecord {
  id: string;
  schemaVersion: number;
  createdAt: number;
  /**  ScanResult 快照（含 input，可复算） */
  result: ScanResult;
  /** 展示用标题（用事 + 起始日） */
  title: string;
}

export interface FavoriteRecord {
  id: string;
  schemaVersion: number;
  createdAt: number;
  kind: 'day' | 'article';
  /** 日课：ISO 日期 + 用事；文章：文章 id */
  refId: string;
  eventKey?: string;
  /** 收藏时的日课快照（列表展示免重算） */
  snapshot?: {
    date: string;
    dayGZ: string;
    score: number;
    grade: string;
    eventName: string;
  };
  articleTitle?: string;
}

export type Sku = 'once' | 'ai10' | 'pair' | 'year';

export interface LicenseRecord {
  id: string;
  schemaVersion: number;
  /** 兑换码（脱敏保存前 8 位） */
  code: string;
  sku: Sku;
  /** 剩余次数（-1 不限） */
  left: number;
  boundAt: number;
  /** 来源：离线兑换 / Gumroad 支付（'stripe'、'creem' 为历史数据兼容，新写入不再产生） */
  source: 'redeem' | 'gumroad' | 'stripe' | 'creem';
}

export interface QuotaRecord {
  id: 'ai';
  schemaVersion: number;
  /** 免费剩余（每月 1 日重置） */
  freeLeft: number;
  /** 时区月 key（YYYY-MM，按时区算） */
  monthKey: string;
}

export interface SettingsRecord {
  id: 'settings';
  schemaVersion: number;
  lang: 'zh' | 'en' | 'zh-Hant' | 'ko' | 'ja' | 'th' | 'vi';
  cal: 'greg' | 'gan' | 'buddha';
  tz: number;
  /** 结算币种；读取时由 settings-store 归一化到支持列表（默认 USD） */
  currency: Currency;
  analytics: boolean;
  onboarded: boolean;
  /** v3.7 邮件提醒（PRD §12.7）：以下为可选字段，老数据缺失即视为未绑定 */
  email?: string;
  emailOn?: boolean;
  emailItems?: string[];
}

export interface AiCacheRecord {
  /** scanId:ruleVersion:lang */
  id: string;
  schemaVersion: number;
  createdAt: number;
  /** 四段解读文本 */
  sections: string[];
}

export interface ReminderRecord {
  id: string;
  schemaVersion: number;
  createdAt: number;
  eventKey: string;
  date: string;
  note: string;
  enabled: boolean;
}

export type DbRecord =
  | ({ schemaVersion: number } & Person)
  | ScanRecord
  | FavoriteRecord
  | LicenseRecord
  | QuotaRecord
  | SettingsRecord
  | AiCacheRecord
  | ReminderRecord;

export const DEFAULT_SETTINGS: SettingsRecord = {
  id: 'settings',
  schemaVersion: SCHEMA_VERSION,
  lang: 'zh',
  cal: 'greg',
  tz: 8,
  currency: 'USD',
  analytics: true,
  onboarded: false,
};

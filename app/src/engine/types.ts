/**
 * engine/types.ts — 引擎全部输入输出类型。
 *
 * 边界约定（架构 §7.5）：本目录为纯函数层——禁 DOM、禁 fetch、禁 Date.now/new Date，
 * 时间一律参数注入；引擎永不 import UI / store / screens。
 * 引擎只输出结构化 reason code 与参数，人类可读文案由 i18n/engine-text.ts 组装。
 */
import type { TermKey } from '../i18n/glossary';

export type { TermKey } from '../i18n/glossary';

// ============ 基础历法类型 ============

/** 东八区民用历日期（date-only，纯函数口径） */
export interface CalDate {
  y: number;
  m: number;
  d: number;
}

/** 干支；index 为六十甲子序（0=甲子） */
export interface GZ {
  gan: number;
  zhi: number;
  index: number;
  text: string;
}

/** 日课四柱（年 / 月 / 日 / 时柱干支文本） */
export interface FourPillars {
  year: string;
  month: string;
  day: string;
  hour: string;
}

export type Lang = 'zh' | 'en' | 'zh-Hant';

// ============ 当事人档案 Person（db/types.ts 同源定义） ============

export interface Person {
  id: string;
  schemaVersion: number;
  name: string;
  sex: 'f' | 'm';
  /** 原始钟表日期 'YYYY-MM-DD'（出生地本地历） */
  birthDate: string;
  /** 原始钟表时刻 'HH:mm'（出生地本地钟表，未经校正） */
  birthTime: string;
  /** 城市表 id；null 表示手动经纬度 */
  birthCityId: string | null;
  manualLon?: number;
  manualLat?: number;
  /** 1986–1991 中国出生：档案已标注夏令时，读取时回拨（默认按历表自动判定） */
  dstAdjusted?: boolean;
  note?: string;
  createdAt: number;
}

// ============ 业态 Industry / 用事 Event（data/*.ts，静态表） ============

/** 双语长文文案（数据层直排，长文不走语言包——同 kb-bodies 的先例） */
export interface L10n {
  zh: string;
  en: string;
  zhHant: string;
}

export interface Industry {
  id: string;
  name: TermKey;
  category: TermKey;
  wuxing: 0 | 1 | 2 | 3 | 4; // 木火土金水
  subs: L10n;
  acts: L10n[];
  books: string[];
  note: L10n;
}

export type EventGroup = '经营择日' | '工程择日' | '家庭择日' | '生命礼';

export interface EventDef {
  key: string;
  group: EventGroup;
  name: TermKey;
  sub: L10n;
  need: L10n;
  acts: L10n[];
  core: TermKey;
  /** 家庭 7 重 / 经营工程 8 重（含坐向的用事按实际层数动态计算） */
  layers: 7 | 8;
  twoPerson: boolean;
}

// ============ 引擎输入输出 ============

export type LayerKey =
  | 'marryMonth'
  | 'monthBranch'
  | 'jianchu'
  | 'industryWuxing'
  | 'sittingFacing'
  | 'monthHarm'
  | 'dayClashYear'
  | 'liJue'
  | 'virtues'
  | 'goodHours';

export type LayerCls = 'ok' | 'warn' | 'bad';

/** 引擎只出 reason code 与参数，不出界面字符串 */
export interface LayerResult {
  key: LayerKey;
  /** 如 'eng.jc.po'、'eng.wx.deqi' */
  resultKey: string;
  params?: Record<string, string | number>;
  cls: LayerCls;
  delta: number;
}

export type HardReason = 'yuepo' | 'chongming' | 'chongshan' | 'lijue' | 'fangfu';

export type Grade = 'shangji' | 'zhongji' | 'keyong' | 'buyong'; // 上吉/中吉/可用/不用

export type HourMarkKind = 'liuhe' | 'sanhe' | 'po' | 'ping';

export interface HourMark {
  index: number;
  name: string;
  range: string;
  mark: HourMarkKind;
  cls: LayerCls;
}

export interface DayResult {
  date: CalDate;
  weekday: number;
  dayGZ: GZ;
  monthZhi: number;
  monthName: string;
  jieqi: string;
  jianchu: string;
  pillars: FourPillars;
  layers: LayerResult[];
  score: number;
  grade: Grade;
  hard: HardReason | null;
  eligible: boolean;
  /** 'reason.scoreLow' / 'hard.yuepo' 等 */
  reasonKey: string;
  hours: HourMark[];
  goodHours: HourMark[];
}

export interface ScanInput {
  eventKey: string;
  people: Person[];
  industryId?: string;
  sitKey?: string;
  startDate: CalDate;
  span: number; // 默认 90 天
  generic?: boolean; // 通用模式（未录四柱，4 重）
  school?: 'xingjia' | 'bujiang' | 'jianchu';
}

export interface ScanResult {
  input: ScanInput;
  days: DayResult[];
  usable: DayResult[];
  byReason: Record<string, number>;
  total: number;
  generic: boolean;
  ruleVersion: string; // '2026.10'
  createdAt: number; // ISO 8601 UTC（由调用方注入，引擎不读时钟）
}

// ============ 当事人读取结果（真太阳时 + 年命，读取时重算，禁存结果） ============

export interface PersonReading {
  name: string;
  raw: string; // 原始钟表 'YYYY-MM-DD HH:mm'
  cityName: string;
  lon: number;
  tz: number;
  /** 真太阳时 'HH:mm' */
  trueTime: string;
  /** 校正分钟数（含夏令时回拨，带符号） */
  offsetMin: number;
  dayShift: -1 | 0 | 1;
  dst: boolean;
  sex: 'f' | 'm';
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
  yearGZ: GZ;
  ganIdx: number;
  zhiIdx: number;
  zodiac: string;
}

// ============ 规则常量 ============

export const RULE_VERSION = '2026.10';

/** 出局阈值：课格评分 SCORE_MIN 以下不入课 */
export const SCORE_MIN = 80;

/** 计分基数 */
export const SCORE_BASE = 60;

export const SCORE_FLOOR = 30;
export const SCORE_CEIL = 99;

/**
 * router/screens.ts — 21 屏注册表：屏幕 key、Tab 归属、参数类型。
 * 屏幕栈由 store/app-store 持有；本文件只做静态登记（无 React 依赖）。
 */

import type { LegalPage } from '../data/legal';

export const SCREEN_KEYS = [
  'splash',
  'onboard',
  'home',
  'event',
  'info',
  'people',
  'peopleForm',
  'calc',
  'result',
  'detail',
  'card',
  'pay',
  'reports',
  'report',
  'ai',
  'kb',
  'article',
  'fav',
  'me',
  'lang',
  'remind',
  'share',
  'legal',
] as const;

export type ScreenKey = (typeof SCREEN_KEYS)[number];

/** 底部 Tab（原型五 Tab：今日 / 择日 / 报告 / 知库 / 我的） */
export const TAB_SCREENS: ScreenKey[] = ['home', 'event', 'reports', 'kb', 'me'];

export function isTabScreen(key: ScreenKey): boolean {
  return TAB_SCREENS.includes(key);
}

/** 各屏参数（undefined 表示无参） */
export interface ScreenParams {
  splash: undefined;
  onboard: undefined;
  home: undefined;
  event: { preselect?: string } | undefined;
  info: { eventKey?: string } | undefined;
  people: { selectFor?: 'a' | 'b' } | undefined;
  peopleForm: { personId?: string } | undefined;
  calc: undefined;
  result: { scanId?: string } | undefined;
  detail: { scanId: string; date: string } | undefined;
  card: { scanId: string; date: string } | undefined;
  pay: { from?: 'report' | 'ai' } | undefined;
  reports: undefined;
  report: { scanId: string } | undefined;
  ai: { scanId: string; date: string } | undefined;
  kb: { cat?: string } | undefined;
  article: { articleId: string } | undefined;
  fav: undefined;
  me: undefined;
  lang: undefined;
  remind: undefined;
  share: { ref: string; kind: 'day' | 'article' } | undefined;
  legal: { page?: LegalPage } | undefined;
}

/** 类型安全取参（key 仅用于约束泛型，运行期不做校验） */
export function paramsOf<K extends ScreenKey>(_key: K, params: unknown): ScreenParams[K] | undefined {
  return params as ScreenParams[K] | undefined;
}

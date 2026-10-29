/**
 * services/analytics.ts — 埋点：本机事件队列 + GA4 上报（同意后才发）。
 *
 * 双轨口径（主理人拍板，出海合规前提）：
 *   ① 本机队列：始终只写本机（上限 200 条），供「我的」页展示与后续导出，
 *      不依赖网络，也不构成个人信息传输；
 *   ② GA4：仅在「用户接受统计」且「应用内匿名统计开关开启」时才加载脚本并上报。
 *      未同意前不注入任何第三方脚本——这是 GDPR 对分析型 Cookie 的硬要求，
 *      比 consent mode 默认拒绝更彻底（连请求都不发）。
 *
 * 三个关键事件（上线投放与转化分析口径）：
 *   date_check   — 发起一次历法推演
 *   ai_gen_start — 开始生成 AI 白话解读
 *   report_buy   — 点击购买/解锁
 *
 * 隐私红线：事件参数只放枚举与计数（用事类型、可选天数、币种、套餐），
 * 绝不放姓名、出生日期、出生地等可识别个人的内容。
 */

import { isAnalyticsAllowed } from './consent';

const QUEUE_KEY = 'zj.analytics.queue';
const MAX_EVENTS = 200;

export interface AnalyticsEvent {
  name: string;
  at: number;
  params?: Record<string, string | number>;
}

/** 事件名白名单（防随手打点污染） */
export const EVENTS = {
  appOpen: 'app_open',
  onboardDone: 'onboard_done',
  langChange: 'lang_change',
  /** 发起历法推演（关键事件 ①） */
  dateCheck: 'date_check',
  dayView: 'day_view',
  reportSave: 'report_save',
  /** 开始生成 AI 解读（关键事件 ②） */
  aiGenStart: 'ai_gen_start',
  payView: 'pay_view',
  /** 点击购买（关键事件 ③） */
  reportBuy: 'report_buy',
  payRedeem: 'pay_redeem',
  shareSend: 'share_send',
  favAdd: 'fav_add',
} as const;

type Listener = (queue: AnalyticsEvent[]) => void;

const listeners = new Set<Listener>();
let memoryQueue: AnalyticsEvent[] | null = null;

function readQueue(): AnalyticsEvent[] {
  if (memoryQueue) return memoryQueue;
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    memoryQueue = raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
  } catch {
    memoryQueue = [];
  }
  return memoryQueue;
}

function writeQueue(q: AnalyticsEvent[]): void {
  memoryQueue = q.length > MAX_EVENTS ? q.slice(q.length - MAX_EVENTS) : q;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(memoryQueue));
  } catch {
    /* 隐私模式：仅内存 */
  }
  for (const l of listeners) l([...memoryQueue]);
}

let enabled = true;

// ---------------------------------------------------------------- GA4

/** GA4 衡量 ID（构建注入；为空则完全不启用 GA4，本地开发不会产生真实数据） */
const GA_ID = (import.meta.env?.VITE_GA4_ID ?? '').trim();

let gtagLoaded = false;

interface GtagWindow extends Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

/**
 * 注入 gtag.js（幂等）。仅在「同意统计」且配置了衡量 ID 时才真正加载。
 * 未同意时调用本函数不会产生任何网络请求。
 */
export function loadGtag(): void {
  if (gtagLoaded || !GA_ID || typeof document === 'undefined') return;
  if (!isAnalyticsAllowed()) return;
  gtagLoaded = true;

  const w = window as GtagWindow;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);

  w.dataLayer = w.dataLayer ?? [];
  w.gtag = function gtag(...args: unknown[]): void {
    w.dataLayer?.push(args);
  };
  w.gtag('js', new Date());
  w.gtag('config', GA_ID, {
    // 不记录完整 IP（GA4 侧仍会做地域聚合）
    anonymize_ip: true,
    // 单页应用：屏幕切换不走浏览器导航，这里只统计落地页，事件另行上报
    send_page_view: true,
  });
}

/** 是否已启用 GA4（测试与调试用） */
export function isGtagActive(): boolean {
  return gtagLoaded;
}

// ---------------------------------------------------------------- 对外 API

export const analytics = {
  /** 由 settings-store 在启动时同步开关 */
  setEnabled(v: boolean): void {
    enabled = v;
  },

  /** 当前开关（app-store 等非 React 模块读取，避免循环依赖） */
  isEnabled(): boolean {
    return enabled;
  },

  track(name: string, params?: Record<string, string | number>): void {
    if (!enabled) return;

    // ① 本机队列
    const q = readQueue();
    q.push({ name, at: Date.now(), params });
    writeQueue(q);

    // ② GA4（双重闸门：应用内开关 + Cookie 同意）
    if (!isAnalyticsAllowed()) return;
    loadGtag();
    const w = window as GtagWindow;
    w.gtag?.('event', name, params ?? {});
  },

  list(): AnalyticsEvent[] {
    return [...readQueue()];
  },

  clear(): void {
    writeQueue([]);
  },

  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

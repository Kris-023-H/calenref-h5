/**
 * store/app-store.ts — 应用主 store：导航栈 + 排课草稿/会话 + 档案/报告/收藏/提醒。
 * 约定：引擎为纯函数，时间一律由 UI 注入（Date.now() 只出现在本层）。
 */

import { create } from 'zustand';
import type { CalDate, DayResult, Person, ScanResult } from '../engine/types';
import { runScan } from '../engine/scan';
import { defaultSchool, type SchoolKey } from '../engine/schools';
import { eventByKey } from '../data/events';
import { addDays } from '../engine/calendar/julian';
import { personRepo, validatePerson } from '../db/repos/person.repo';
import { scanRepo, newScanId } from '../db/repos/scan.repo';
import { favoriteRepo } from '../db/repos/favorite.repo';
import { licenseRepo } from '../db/repos/license.repo';
import { reminderRepo, newReminderId } from '../db/repos/reminder.repo';
import { getBackend, STORES } from '../db/backend';
import { exportBackup, importBackup, parseBackup } from '../db/backup';
import type { FavoriteRecord, LicenseRecord, ReminderRecord, ScanRecord } from '../db/types';
import { initialNav, navReducer, currentScreen, canGoBack, type NavState } from '../router/nav';
import type { ScreenKey } from '../router/screens';
import { todayCst } from '../services/timezone';
import { quotaState, runAiReading, type QuotaState } from '../services/ai/ai-service';
import { resolveAiService } from '../services/ai/remote-ai';
import { analytics, EVENTS } from '../services/analytics';
import { err, ok, type Result } from '../lib/result';
import { useSettings } from './settings-store';

/** 排课草稿（info 屏编辑，calc 屏消费） */
export interface ScanDraft {
  eventKey: string;
  industryId: string | undefined;
  sitKey: string | undefined;
  /** 入选当事人 id（嫁娶须两位） */
  personIds: string[];
  generic: boolean;
  startOffset: number;
  span: number;
  school: SchoolKey;
}

export interface ScanSession {
  scanId: string;
  result: ScanResult;
  /** 结果列表当前选中下标（detail / card / report / ai 共用） */
  cursor: number;
  filter: 'all' | 'best' | 'weekend' | 'hour';
  view: 'list' | 'cal';
  saved: boolean;
}

export interface AppState {
  // ---- 导航 ----
  nav: NavState;
  push: (key: ScreenKey, params?: unknown) => void;
  pop: () => void;
  replace: (key: ScreenKey, params?: unknown) => void;
  switchTab: (tab: ScreenKey) => void;
  resetTo: (key: ScreenKey, params?: unknown) => void;

  // ---- 数据 ----
  hydrated: boolean;
  people: Person[];
  scans: ScanRecord[];
  favorites: FavoriteRecord[];
  reminders: ReminderRecord[];
  licenses: LicenseRecord[];
  quota: QuotaState;

  // ---- 草稿与会话 ----
  draft: ScanDraft;
  session: ScanSession | null;
  /** 演算动画是否进行中（calc 屏驱动） */
  scanning: boolean;
  /** AI 解读段落（ai 屏） */
  aiSections: string[];
  aiLoading: boolean;
  /** 追问记录（仅本机内存，不入库） */
  aiFollowups: Array<{ q: string; a: string }>;

  // ---- actions ----
  hydrate: () => Promise<void>;
  setDraft: (patch: Partial<ScanDraft>) => void;
  selectEvent: (eventKey: string) => void;
  togglePerson: (personId: string) => void;
  savePerson: (p: Person) => Promise<Result<Person>>;
  removePerson: (id: string) => Promise<void>;
  startScan: () => Promise<void>;
  finishScan: (result: ScanResult) => void;
  setCursor: (i: number) => void;
  setFilter: (f: ScanSession['filter']) => void;
  setView: (v: ScanSession['view']) => void;
  saveReport: () => Promise<Result<ScanRecord>>;
  removeScan: (id: string) => Promise<void>;
  loadScan: (id: string) => void;
  toggleFavorite: (day: DayResult, note?: string) => Promise<void>;
  isFaved: (date: string) => boolean;
  removeFavorite: (id: string) => Promise<void>;
  addReminder: (r: Omit<ReminderRecord, 'schemaVersion' | 'createdAt' | 'id'>) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  removeReminder: (id: string) => Promise<void>;
  refreshQuota: () => Promise<void>;
  generateAi: () => Promise<Result<string[]>>;
  askFollowup: (q: string, a: string) => void;
  /** 导出备份 JSON 文本（settings 区「导出备份」） */
  exportData: () => Promise<Result<string>>;
  /** 导入备份 JSON 文本（settings 区「导入备份」） */
  importData: (text: string) => Promise<Result<number>>;
  /** 清除本机全部数据（八实体） */
  clearData: () => Promise<void>;
  /** 本机数据占用（字节，用于展示） */
  storageBytes: () => Promise<number>;
  today: () => CalDate;
}

const DEFAULT_DRAFT: ScanDraft = {
  eventKey: 'open',
  industryId: 'catering',
  sitKey: 'ziwu',
  personIds: [],
  generic: false,
  startOffset: 7,
  span: 90,
  school: 'jianchu',
};

const EMPTY_QUOTA: QuotaState = { freeLeft: 3, paidLeft: 0, unlimited: false };

export const useApp = create<AppState>((set, get) => ({
  nav: initialNav,
  hydrated: false,
  people: [],
  scans: [],
  favorites: [],
  reminders: [],
  licenses: [],
  quota: EMPTY_QUOTA,
  draft: DEFAULT_DRAFT,
  session: null,
  scanning: false,
  aiSections: [],
  aiLoading: false,
  aiFollowups: [],

  // ---------- 导航 ----------
  push: (key, params) => set((s) => ({ nav: navReducer(s.nav, { type: 'push', key, params }) })),
  pop: () => set((s) => ({ nav: navReducer(s.nav, { type: 'pop' }) })),
  replace: (key, params) => set((s) => ({ nav: navReducer(s.nav, { type: 'replace', key, params }) })),
  switchTab: (tab) => set((s) => ({ nav: navReducer(s.nav, { type: 'switchTab', tab }) })),
  resetTo: (key, params) => set((s) => ({ nav: navReducer(s.nav, { type: 'resetTo', key, params }) })),

  // ----------  hydrate ----------
  hydrate: async () => {
    const [people, scans, favorites, reminders, licenses] = await Promise.all([
      personRepo.list(),
      scanRepo.list(),
      favoriteRepo.list(),
      reminderRepo.list(),
      licenseRepo.list(),
    ]);
    const quota = await quotaState(8, Date.now());
    const draft = { ...get().draft };
    if (draft.personIds.length === 0 && people.length > 0) draft.personIds = [people[0].id];
    set({ people, scans, favorites, reminders, licenses, quota, draft, hydrated: true });
  },

  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

  selectEvent: (eventKey) => {
    const ev = eventByKey(eventKey);
    set((s) => ({ draft: { ...s.draft, eventKey, school: defaultSchool(eventKey), generic: false } }));
    if (ev.twoPerson) {
      const ids = get().draft.personIds;
      if (ids.length < 2 && get().people.length >= 2) {
        set((s) => ({ draft: { ...s.draft, personIds: get().people.slice(0, 2).map((p) => p.id) } }));
      }
    }
  },

  togglePerson: (personId) =>
    set((s) => {
      const has = s.draft.personIds.includes(personId);
      const personIds = has
        ? s.draft.personIds.filter((id) => id !== personId)
        : [...s.draft.personIds, personId];
      return { draft: { ...s.draft, personIds } };
    }),

  savePerson: async (p) => {
    const v = validatePerson(p);
    if (!v.ok) return v;
    const rec = await personRepo.save(p);
    if (!rec.ok) return rec;
    await get().hydrate();
    return rec;
  },

  removePerson: async (id) => {
    await personRepo.remove(id);
    set((s) => ({ draft: { ...s.draft, personIds: s.draft.personIds.filter((x) => x !== id) } }));
    await get().hydrate();
  },

  // ---------- 排课 ----------
  startScan: async () => {
    const { draft, people } = get();
    const persons = draft.personIds
      .map((id) => people.find((p) => p.id === id))
      .filter((p): p is Person => Boolean(p));
    const start = addDays(todayCst(Date.now()), draft.startOffset);
    const input = {
      eventKey: draft.eventKey,
      people: persons,
      industryId: draft.industryId,
      sitKey: draft.sitKey,
      startDate: start,
      span: draft.span,
      generic: draft.generic,
      school: draft.school,
    };
    set({ scanning: true });
    // 让出一帧给动画，再同步推演（引擎 < 40ms）
    await new Promise((r) => setTimeout(r, 60));
    const result = runScan(input, Date.now());
    if (get().hydrated && analytics.isEnabled()) {
      // 关键事件 ①：只放枚举与计数，不含当事人信息
      analytics.track(EVENTS.dateCheck, {
        event_key: draft.eventKey,
        span_days: draft.span,
        school: draft.school,
        people: persons.length,
        usable_days: result.usable.length,
      });
    }
    set({ scanning: false });
    get().finishScan(result);
  },

  finishScan: (result) =>
    set(() => ({
      session: {
        scanId: newScanId(),
        result,
        cursor: 0,
        filter: 'all',
        view: 'list',
        saved: false,
      },
      aiSections: [],
      aiFollowups: [],
    })),

  setCursor: (i) => set((s) => (s.session ? { session: { ...s.session, cursor: i } } : {})),
  setFilter: (filter) => set((s) => (s.session ? { session: { ...s.session, filter } } : {})),
  setView: (view) => set((s) => (s.session ? { session: { ...s.session, view } } : {})),

  saveReport: async () => {
    const { session } = get();
    if (!session) return err('notFound', 'report.notFound');
    const ev = eventByKey(session.result.input.eventKey);
    const title = `${ev.name} · ${session.result.usable.length}/${session.result.total}`;
    const rec = await scanRepo.save(session.result, session.scanId, title);
    if (!rec.ok) return rec;
    if (analytics.isEnabled()) analytics.track(EVENTS.reportSave, { scanId: session.scanId });
    set((s) => ({ session: s.session ? { ...s.session, saved: true } : null }));
    await get().hydrate();
    return rec;
  },

  removeScan: async (id) => {
    await scanRepo.remove(id);
    await get().hydrate();
  },

  loadScan: (id) => {
    const rec = get().scans.find((x) => x.id === id);
    if (!rec) return;
    set(() => ({
      session: { scanId: rec.id, result: rec.result, cursor: 0, filter: 'all', view: 'list', saved: true },
      aiSections: [],
      aiFollowups: [],
    }));
  },

  // ---------- 收藏 ----------
  toggleFavorite: async (day, note) => {
    const { session, favorites } = get();
    if (!session) return;
    const date = `${day.date.y}-${String(day.date.m).padStart(2, '0')}-${String(day.date.d).padStart(2, '0')}`;
    const id = `${session.scanId}:${date}`;
    const exists = favorites.find((f) => f.id === id);
    if (exists) {
      await favoriteRepo.remove(id);
    } else {
      await favoriteRepo.save({
        id,
        kind: 'day',
        refId: id,
        eventKey: session.result.input.eventKey,
        snapshot: {
          date,
          dayGZ: day.dayGZ.text,
          score: day.score,
          grade: day.grade,
          eventName: eventByKey(session.result.input.eventKey).name,
        },
        articleTitle: note,
      });
      if (analytics.isEnabled()) analytics.track(EVENTS.favAdd, { date: id });
    }
    await get().hydrate();
  },

  isFaved: (date) => get().favorites.some((f) => f.kind === 'day' && f.snapshot?.date === date),

  removeFavorite: async (id) => {
    await favoriteRepo.remove(id);
    await get().hydrate();
  },

  // ---------- 提醒 ----------
  addReminder: async (r) => {
    await reminderRepo.save({ ...r, id: newReminderId() });
    await get().hydrate();
  },

  toggleReminder: async (id) => {
    const rec = get().reminders.find((x) => x.id === id);
    if (!rec) return;
    await reminderRepo.save({
      id: rec.id,
      eventKey: rec.eventKey,
      date: rec.date,
      note: rec.note,
      enabled: !rec.enabled,
    });
    await get().hydrate();
  },

  removeReminder: async (id) => {
    await reminderRepo.remove(id);
    await get().hydrate();
  },

  refreshQuota: async () => {
    const quota = await quotaState(8, Date.now());
    set({ quota });
  },

  // ---------- AI ----------
  generateAi: async () => {
    const { session } = get();
    if (!session) return err('notFound', 'report.notFound');
    const day = session.result.usable[session.cursor] ?? session.result.days[0];
    set({ aiLoading: true });
    // 关键事件 ②：开始即上报（成功/失败都算一次意图，用于看漏斗起点）
    if (analytics.isEnabled()) analytics.track(EVENTS.aiGenStart, { event_key: session.result.input.eventKey });
    try {
      const svc = resolveAiService();
      const res = await runAiReading(svc, {
        scan: session.result,
        day,
        lang: useSettings.getState().lang,
        scanId: session.scanId,
        tzHours: useSettings.getState().tz,
        nowMs: Date.now(),
      });
      if (res.ok) {
        set({ aiSections: res.value });
        await get().refreshQuota();
      }
      return res;
    } finally {
      set({ aiLoading: false });
    }
  },

  askFollowup: (q, a) => set((s) => ({ aiFollowups: [...s.aiFollowups, { q, a }] })),

  // ---------- 数据导入导出（设置区） ----------
  exportData: async () => {
    const res = await exportBackup();
    if (!res.ok) return res;
    return ok(JSON.stringify(res.value));
  },

  importData: async (text) => {
    const parsed = parseBackup(text);
    if (!parsed.ok) return parsed;
    const res = await importBackup(parsed.value);
    await get().hydrate();
    return res;
  },

  clearData: async () => {
    const b = await getBackend();
    // 设置（语言/历法/引导态）不属于「数据」，清除时保留
    for (const store of STORES) {
      if (store === 'settings') continue;
      await b.clear(store);
    }
    analytics.clear();
    set(() => ({
      people: [],
      scans: [],
      favorites: [],
      reminders: [],
      licenses: [],
      session: null,
      aiSections: [],
      aiFollowups: [],
      quota: EMPTY_QUOTA,
    }));
  },

  storageBytes: async () => {
    const b = await getBackend();
    let bytes = 0;
    for (const store of STORES) {
      const rows = await b.all<Record<string, unknown>>(store);
      bytes += JSON.stringify(rows).length;
    }
    return bytes;
  },

  today: () => todayCst(Date.now()),
}));

/** 当前栈顶屏幕 */
export function currentScreenOf(): { key: ScreenKey; params?: unknown } {
  const entry = currentScreen(useApp.getState().nav);
  return { key: entry.key, params: entry.params };
}

export function canGoBackNow(): boolean {
  return canGoBack(useApp.getState().nav);
}

export { newScanId };

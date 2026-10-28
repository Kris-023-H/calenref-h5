/**
 * store/settings-store.ts — Zustand：语言 / 时区 / 币种 / 历法（persist → settings.repo）。
 * 语言是横切关注点：t(key, lang) 由组件经 useSettings() 取用。
 */

import { create } from 'zustand';
import type { Lang } from '../engine/types';
import type { CalPref } from '../i18n/format';
import { settingsRepo } from '../db/repos/settings.repo';
import { detectLang, type MsgKey } from '../i18n';
import { t as translate } from '../i18n/format';
import { detectTz } from '../services/timezone';
import { analytics } from '../services/analytics';
import { EVENTS } from '../services/analytics';

export interface SettingsState {
  lang: Lang;
  cal: CalPref;
  tz: number;
  currency: 'CNY' | 'USD' | 'SGD' | 'MYR' | 'THB';
  analyticsOn: boolean;
  onboarded: boolean;
  /** 是否已从 db 恢复（防首屏闪烁） */
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setLang: (lang: Lang) => Promise<void>;
  setCal: (cal: CalPref) => Promise<void>;
  setTz: (tz: number) => Promise<void>;
  setCurrency: (c: SettingsState['currency']) => Promise<void>;
  setAnalytics: (on: boolean) => Promise<void>;
  setOnboarded: (v: boolean) => Promise<void>;
  /** 便捷取文案 */
  t: (key: MsgKey, params?: Record<string, string | number>) => string;
}

export const useSettings = create<SettingsState>((set, get) => ({
  lang: 'zh',
  cal: 'greg',
  tz: 8,
  currency: 'CNY',
  analyticsOn: true,
  onboarded: false,
  hydrated: false,

  hydrate: async () => {
    const rec = await settingsRepo.get();
    analytics.setEnabled(rec.analytics);
    set({
      lang: rec.lang,
      cal: rec.cal,
      tz: rec.tz,
      currency: rec.currency,
      analyticsOn: rec.analytics,
      onboarded: rec.onboarded,
      hydrated: true,
    });
  },

  setLang: async (lang) => {
    set({ lang });
    await settingsRepo.save({ lang });
    if (get().analyticsOn) analytics.track(EVENTS.langChange, { lang });
  },

  setCal: async (cal) => {
    set({ cal });
    await settingsRepo.save({ cal });
  },

  setTz: async (tz) => {
    set({ tz });
    await settingsRepo.save({ tz });
  },

  setCurrency: async (currency) => {
    set({ currency });
    await settingsRepo.save({ currency });
  },

  setAnalytics: async (analyticsOn) => {
    set({ analyticsOn });
    analytics.setEnabled(analyticsOn);
    await settingsRepo.save({ analytics: analyticsOn });
  },

  setOnboarded: async (v) => {
    set({ onboarded: v });
    await settingsRepo.save({ onboarded: v });
  },

  t: (key, params) => translate(key, get().lang, params),
}));

/** 首次启动语言探测（浏览器语言 → 设置） */
export function detectInitialLang(): Lang {
  if (typeof navigator !== 'undefined' && navigator.languages) return detectLang(navigator.languages);
  return 'zh';
}

export { detectTz };

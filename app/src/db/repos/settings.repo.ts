/**
 * db/repos/settings.repo.ts — 设置（语言 / 历法 / 时区 / 币种 / 埋点开关 /  onboarding）。
 * 单例记录 id='settings'；读时按 schemaVersion 补默认字段（向前兼容）。
 */

import { getBackend } from '../backend';
import { DEFAULT_SETTINGS, SCHEMA_VERSION, type SettingsRecord } from '../types';
import { ok, type Result } from '../../lib/result';

const STORE = 'settings' as const;

export const settingsRepo = {
  async get(): Promise<SettingsRecord> {
    const b = await getBackend();
    const cur = await b.get<SettingsRecord>(STORE, 'settings');
    if (!cur) return { ...DEFAULT_SETTINGS };
    // 迁移：缺字段补默认值
    return { ...DEFAULT_SETTINGS, ...cur, id: 'settings', schemaVersion: SCHEMA_VERSION };
  },

  /** 是否首次启动（无设置记录）——用于首启语言/时区/币种探测 */
  async exists(): Promise<boolean> {
    const b = await getBackend();
    const cur = await b.get<SettingsRecord>(STORE, 'settings');
    return cur !== undefined;
  },

  async save(patch: Partial<SettingsRecord>): Promise<Result<SettingsRecord>> {
    const merged = { ...(await settingsRepo.get()), ...patch, id: 'settings' as const, schemaVersion: SCHEMA_VERSION };
    const b = await getBackend();
    await b.put(STORE, merged);
    return ok(merged);
  },
};

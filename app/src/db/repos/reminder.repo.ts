/**
 * db/repos/reminder.repo.ts — 择日提醒（仅本机；联网推送为后续升级项）。
 */

import { getBackend } from '../backend';
import { SCHEMA_VERSION, type ReminderRecord } from '../types';
import { ok, type Result } from '../../lib/result';

const STORE = 'reminder' as const;

export const reminderRepo = {
  async list(): Promise<ReminderRecord[]> {
    const b = await getBackend();
    const rows = await b.all<ReminderRecord>(STORE);
    return rows.sort((a, c) => a.date.localeCompare(c.date));
  },

  async save(rec: Omit<ReminderRecord, 'schemaVersion' | 'createdAt'>): Promise<Result<ReminderRecord>> {
    const record: ReminderRecord = { ...rec, schemaVersion: SCHEMA_VERSION, createdAt: Date.now() };
    const b = await getBackend();
    await b.put(STORE, record);
    return ok(record);
  },

  async remove(id: string): Promise<Result<void>> {
    const b = await getBackend();
    await b.del(STORE, id);
    return ok(undefined);
  },
};

export function newReminderId(): string {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

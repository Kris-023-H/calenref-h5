/**
 * db/repos/person.repo.ts — 当事人档案 CRUD（按 personId）。
 * 档案只存原始输入（钟表时刻 + 出生地）；四柱读取时重算，禁存结果（引擎约定）。
 */

import type { Person } from '../../engine/types';
import { getBackend } from '../backend';
import { SCHEMA_VERSION } from '../types';
import { ok, err, type Result } from '../../lib/result';

const STORE = 'person' as const;

export const personRepo = {
  async list(): Promise<Person[]> {
    const b = await getBackend();
    const rows = await b.all<Person>(STORE);
    return rows.sort((a, c) => a.createdAt - c.createdAt);
  },

  async get(id: string): Promise<Person | undefined> {
    const b = await getBackend();
    return b.get<Person>(STORE, id);
  },

  async save(p: Person): Promise<Result<Person>> {
    const record: Person = { ...p, schemaVersion: SCHEMA_VERSION };
    const b = await getBackend();
    await b.put(STORE, record);
    return ok(record);
  },

  async remove(id: string): Promise<Result<void>> {
    const b = await getBackend();
    await b.del(STORE, id);
    return ok(undefined);
  },

  async removeAll(): Promise<Result<void>> {
    const b = await getBackend();
    await b.clear(STORE);
    return ok(undefined);
  },
};

/** 新档案 id（时间戳 + 随机，避开 crypto 依赖以保旧 Safari） */
export function newPersonId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function validatePerson(p: Person): Result<Person> {
  if (!p.name || !p.name.trim()) return err('invalidInput', 'person.nameRequired');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.birthDate)) return err('invalidInput', 'person.invalidDate');
  if (p.birthTime && !/^\d{2}:\d{2}$/.test(p.birthTime)) return err('invalidInput', 'person.invalidTime');
  if (typeof p.manualLon === 'number' && (p.manualLon < -180 || p.manualLon > 180)) {
    return err('invalidInput', 'person.invalidLon');
  }
  if (typeof p.manualLat === 'number' && (p.manualLat < -90 || p.manualLat > 90)) {
    return err('invalidInput', 'person.invalidLat');
  }
  return ok(p);
}

/**
 * db/repos/favorite.repo.ts — 收藏吉日 / 文章。
 */

import { getBackend } from '../backend';
import { SCHEMA_VERSION, type FavoriteRecord } from '../types';
import { ok, type Result } from '../../lib/result';

const STORE = 'favorite' as const;

export const favoriteRepo = {
  async list(): Promise<FavoriteRecord[]> {
    const b = await getBackend();
    const rows = await b.all<FavoriteRecord>(STORE);
    return rows.sort((a, c) => c.createdAt - a.createdAt);
  },

  async save(rec: Omit<FavoriteRecord, 'schemaVersion' | 'createdAt'>): Promise<Result<FavoriteRecord>> {
    const record: FavoriteRecord = { ...rec, schemaVersion: SCHEMA_VERSION, createdAt: Date.now() };
    const b = await getBackend();
    await b.put(STORE, record);
    return ok(record);
  },

  async remove(id: string): Promise<Result<void>> {
    const b = await getBackend();
    await b.del(STORE, id);
    return ok(undefined);
  },

  async has(id: string): Promise<boolean> {
    const b = await getBackend();
    return (await b.get<FavoriteRecord>(STORE, id)) !== undefined;
  },
};

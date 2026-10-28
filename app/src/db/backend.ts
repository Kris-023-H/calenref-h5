/**
 * db/backend.ts — 存储后端选择：IndexedDB 优先，localStorage/内存降级。
 * repos 只依赖本模块的 Backend 接口，不关心底层是哪种存储。
 */

import { idb, STORES, type StoreName } from './idb';
import { fallbackStore, indexedDbAvailable, type KeyValueStore } from '../lib/storage-fallback';

export interface Backend {
  readonly kind: 'idb' | 'fallback';
  get<T>(store: StoreName, key: string): Promise<T | undefined>;
  put<T>(store: StoreName, value: T & { id: string }): Promise<void>;
  del(store: StoreName, key: string): Promise<void>;
  all<T>(store: StoreName): Promise<T[]>;
  clear(store: StoreName): Promise<void>;
}

/** localStorage 降级后端：一个 store 一个 JSON 键 */
class FallbackBackend implements Backend {
  readonly kind = 'fallback' as const;
  constructor(private kv: KeyValueStore) {}

  private keyOf(store: StoreName): string {
    return `zj.store.${store}`;
  }

  private readAll<T>(store: StoreName): Array<T & { id: string }> {
    const raw = this.kv.get(this.keyOf(store));
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeAll<T>(store: StoreName, rows: Array<T & { id: string }>): void {
    this.kv.set(this.keyOf(store), JSON.stringify(rows));
  }

  async get<T>(store: StoreName, key: string): Promise<T | undefined> {
    return this.readAll<T>(store).find((r) => r.id === key);
  }

  async put<T>(store: StoreName, value: T & { id: string }): Promise<void> {
    const rows = this.readAll(store);
    const idx = rows.findIndex((r) => r.id === value.id);
    if (idx >= 0) rows[idx] = value;
    else rows.push(value);
    this.writeAll(store, rows);
  }

  async del(store: StoreName, key: string): Promise<void> {
    this.writeAll(
      store,
      this.readAll(store).filter((r) => r.id !== key),
    );
  }

  async all<T>(store: StoreName): Promise<T[]> {
    return this.readAll<T>(store);
  }

  async clear(store: StoreName): Promise<void> {
    this.kv.del(this.keyOf(store));
  }
}

let backendPromise: Promise<Backend> | null = null;

/** 探测并缓存后端（应用启动时调用一次） */
export function getBackend(): Promise<Backend> {
  if (!backendPromise) {
    backendPromise = indexedDbAvailable().then((idbOk) =>
      idbOk
        ? ({
            kind: 'idb' as const,
            get: <T>(s: StoreName, k: string) => idb.get<T>(s, k),
            put: <T>(s: StoreName, v: T & { id: string }) => idb.put<T>(s, v).then(() => undefined),
            del: (s: StoreName, k: string) => idb.del(s, k),
            all: <T>(s: StoreName) => idb.all<T>(s),
            clear: (s: StoreName) => idb.clear(s),
          } satisfies Backend)
        : new FallbackBackend(fallbackStore()),
    );
  }
  return backendPromise;
}

/** 测试用：强制指定后端 */
export function setBackendForTests(b: Backend | null): void {
  backendPromise = b ? Promise.resolve(b) : null;
}

export { STORES };
export type { StoreName };

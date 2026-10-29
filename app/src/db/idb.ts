/**
 * db/idb.ts — 自研 IndexedDB 薄封装（store: get/put/del/all + 事务）。
 * 不引第三方库（id 包 API 不确定，见 README 偏差说明）。
 * 不可用时由 lib/storage-fallback 的 KV 适配层顶上（同一 AsyncKV 接口）。
 */

export const DB_NAME = 'calenref';
export const DB_VERSION = 1;

export const STORES = [
  'person',
  'scan',
  'favorite',
  'license',
  'quota',
  'settings',
  'aiCache',
  'reminder',
] as const;

export type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'));
  });
  return dbPromise;
}

function tx<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error('idb request failed'));
      }),
  );
}

export const idb = {
  get<T>(store: StoreName, key: string): Promise<T | undefined> {
    return tx<T | undefined>(store, 'readonly', (s) => s.get(key) as unknown as IDBRequest<T | undefined>);
  },
  put<T>(store: StoreName, value: T): Promise<T> {
    return tx<T>(store, 'readwrite', (s) => s.put(value) as unknown as IDBRequest<T>);
  },
  del(store: StoreName, key: string): Promise<void> {
    return tx<void>(store, 'readwrite', (s) => s.delete(key) as unknown as IDBRequest<void>).then(() => undefined);
  },
  all<T>(store: StoreName): Promise<T[]> {
    return tx<T[]>(store, 'readonly', (s) => s.getAll() as unknown as IDBRequest<T[]>);
  },
  clear(store: StoreName): Promise<void> {
    return tx<void>(store, 'readwrite', (s) => s.clear() as unknown as IDBRequest<void>).then(() => undefined);
  },
};

/** 测试用：重置连接（fake-indexeddb 切换时） */
export function resetIdbForTests(): void {
  dbPromise = null;
}

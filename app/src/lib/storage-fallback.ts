/**
 * lib/storage-fallback.ts — IndexedDB 不可用时的 localStorage 降级。
 * 同一套 get/set/del/keys 接口，db 层探测后二选一；隐私模式下 Safari 会走到这里。
 */

export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  del(key: string): void;
  keys(): string[];
  available: boolean;
}

function localStorageStore(): KeyValueStore {
  let ls: Storage | null = null;
  try {
    ls = window.localStorage;
    // 探测写入（部分浏览器隐私模式下直接抛错）
    const probe = 'zj.probe';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
  } catch {
    ls = null;
  }
  return {
    available: ls !== null,
    get(key) {
      return ls ? ls.getItem(key) : null;
    },
    set(key, value) {
      ls?.setItem(key, value);
    },
    del(key) {
      ls?.removeItem(key);
    },
    keys() {
      if (!ls) return [];
      const out: string[] = [];
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k && k.startsWith('zj.')) out.push(k);
      }
      return out;
    },
  };
}

/** 内存兜底：localStorage 也不可用时（极端隐私模式）保功能不崩 */
function memoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    available: false,
    get: (k) => map.get(k) ?? null,
    set: (k, v) => void map.set(k, v),
    del: (k) => void map.delete(k),
    keys: () => [...map.keys()],
  };
}

/** 取当前可用存储（localStorage 优先，退内存） */
export function fallbackStore(): KeyValueStore {
  const ls = localStorageStore();
  return ls.available ? ls : memoryStore();
}

/** IndexedDB 是否可用（探测 open，不用第三方依赖） */
export async function indexedDbAvailable(): Promise<boolean> {
  if (typeof indexedDB === 'undefined') return false;
  return new Promise((resolve) => {
    let settled = false;
    const done = (v: boolean) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    try {
      const req = indexedDB.open('zj-probe', 1);
      req.onsuccess = () => {
        req.result.close();
        indexedDB.deleteDatabase('zj-probe');
        done(true);
      };
      req.onerror = () => done(false);
      req.onblocked = () => done(false);
      setTimeout(() => done(false), 1500);
    } catch {
      done(false);
    }
  });
}

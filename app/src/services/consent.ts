/**
 * services/consent.ts — Cookie 同意状态（GDPR 最低要求口径）。
 *
 * 为什么用 localStorage 而不是 IndexedDB：同意必须在任何统计代码加载之前
 * 同步可读。IndexedDB 是异步的，等到读出来，脚本已经发出去了。
 *
 * 两种取值：
 *   'all'       — 接受统计（GA4 才允许加载）
 *   'essential' — 仅必要存储（不加载任何第三方脚本）
 *   null        — 尚未选择（横幅未处理，等同于未同意）
 *
 * 撤回同意必须和给予同意一样容易：调用 clearConsent() 后横幅会重新出现。
 */

const CONSENT_KEY = 'zj.consent.v1';

export type ConsentValue = 'all' | 'essential';

type Listener = (v: ConsentValue | null) => void;

const listeners = new Set<Listener>();
let cached: ConsentValue | null | undefined;

/** 读取当前同意状态（同步，带内存缓存） */
export function readConsent(): ConsentValue | null {
  if (cached !== undefined) return cached;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    cached = raw === 'all' || raw === 'essential' ? raw : null;
  } catch {
    // 隐私模式 / 存储被禁用：按未同意处理
    cached = null;
  }
  return cached;
}

/** 是否允许加载与发送统计分析 */
export function isAnalyticsAllowed(): boolean {
  return readConsent() === 'all';
}

/** 是否已经作出过选择（决定横幅是否出现） */
export function hasDecided(): boolean {
  return readConsent() !== null;
}

function notify(): void {
  const v = readConsent();
  for (const l of listeners) l(v);
}

/** 保存选择 */
export function saveConsent(v: ConsentValue): void {
  cached = v;
  try {
    window.localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* 存储不可用：本次会话内仍按内存值生效 */
  }
  notify();
}

/** 清除选择（横幅重新出现，用于「更改偏好」） */
export function clearConsent(): void {
  cached = null;
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* 忽略 */
  }
  notify();
}

/** 订阅同意变化 */
export function onConsentChange(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

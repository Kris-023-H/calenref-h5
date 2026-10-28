/**
 * services/share.ts — 分享链接（lang/ref）+ 二维码 + 长图导出。
 * 链接形态：{host}/?lang=xx&ref=scanId —— 落地页 ShareLandScreen 读取。
 */

import type { Lang } from '../engine/types';

export interface ShareTarget {
  lang: Lang;
  /** 分享来源：scanId 或 article id */
  ref: string;
  kind: 'day' | 'article';
}

/** 分享 host（.env VITE_SHARE_HOST；空则用当前 origin） */
function shareHost(): string {
  const fromEnv = import.meta.env.VITE_SHARE_HOST;
  if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return 'https://zeji.app';
}

export function buildShareUrl(t: ShareTarget): string {
  const url = new URL(shareHost());
  url.searchParams.set('lang', t.lang);
  url.searchParams.set('ref', t.ref);
  url.searchParams.set('k', t.kind);
  return url.toString();
}

/** 从当前 URL 解析分享参数 */
export function parseShareUrl(search: string): ShareTarget | null {
  const q = new URLSearchParams(search);
  const lang = q.get('lang');
  const ref = q.get('ref');
  const k = q.get('k');
  if (!ref) return null;
  return {
    lang: lang === 'en' || lang === 'zh-Hant' ? lang : 'zh',
    ref,
    kind: k === 'article' ? 'article' : 'day',
  };
}

/** 复制到剪贴板（降级 execCommand） */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 走降级 */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const done = document.execCommand('copy');
    document.body.removeChild(ta);
    return done;
  } catch {
    return false;
  }
}

/** 系统分享（不支持时返回 false，调用方降级复制链接） */
export async function systemShare(data: { title: string; text: string; url: string }): Promise<boolean> {
  try {
    if (navigator.share) {
      await navigator.share(data);
      return true;
    }
  } catch {
    /* 用户取消或不支持 */
  }
  return false;
}

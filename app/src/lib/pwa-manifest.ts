/**
 * lib/pwa-manifest.ts — 动态按语言生成 manifest（blob URL）。
 * v1 离线优先：无服务端，安装到主屏后图标与名称随界面语言。
 */

import type { Lang } from '../engine/types';

export interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

export interface WebManifest {
  name: string;
  short_name: string;
  description: string;
  lang: string;
  start_url: string;
  scope: string;
  display: 'standalone';
  orientation: 'portrait';
  background_color: string;
  theme_color: string;
  icons: ManifestIcon[];
}

const NAMES: Record<Lang, { name: string; short: string; desc: string }> = {
  zh: { name: '中华历法 · 历法参考', short: '中华历法', desc: '中国传统历法文化参考工具：人·事·日三层，八重取用，本机演算，不构成命理预测。' },
  en: { name: 'Chinese Date Planner', short: 'Date Planner', desc: 'A traditional Chinese calendar reference for planning dates — computed on device, no fortune-telling.' },
  'zh-Hant': { name: '中華曆法 · 曆法參考', short: '中華曆法', desc: '中國傳統曆法文化參考工具：人·事·日三層，八重取用，本機演算，不構成命理預測。' },
};

const ICONS: ManifestIcon[] = [
  { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
];

/** 部署根路径（支持 GitHub Pages 项目站点这类子路径部署） */
function basePath(): string {
  const b = import.meta.env?.BASE_URL ?? '/';
  return b.endsWith('/') ? b : `${b}/`;
}

/** 构造 manifest 对象 */
export function buildManifest(lang: Lang, origin = ''): WebManifest {
  const n = NAMES[lang];
  const base = basePath();
  // manifest 以 blob URL 注入，相对路径会解析到 blob 自身，故图标必须给绝对地址
  const abs = (p: string): string => (origin ? `${origin}${base}${p}` : `${base}${p}`);
  return {
    name: n.name,
    short_name: n.short,
    description: n.desc,
    lang,
    start_url: abs(`?lang=${lang}`),
    scope: origin ? `${origin}${base}` : base,
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F8F4EA',
    theme_color: '#191710',
    icons: ICONS.map((i) => ({ ...i, src: abs(i.src) })),
  };
}

/** 生成本次会话的 manifest blob URL（注入 <link rel="manifest">） */
export function manifestUrlFor(lang: Lang, origin = window.location.origin): string {
  const json = JSON.stringify(buildManifest(lang, origin));
  const blob = new Blob([json], { type: 'application/manifest+json' });
  return URL.createObjectURL(blob);
}

/** 切换语言时刷新 manifest 链接 */
export function applyManifest(lang: Lang): void {
  if (typeof document === 'undefined') return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'manifest';
    document.head.appendChild(link);
  }
  const url = manifestUrlFor(lang);
  link.href = url;
}

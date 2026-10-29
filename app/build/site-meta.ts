/**
 * build/site-meta.ts — 站点元信息构建插件。
 *
 * 三件事，都围绕「域名只有一个来源」：
 *   ① 把 index.html 里的 __SITE_URL__ 换成真实站点地址（canonical / OG / JSON-LD 共用）；
 *   ② 构建时生成 robots.txt 与 sitemap.xml（单页应用也要有 sitemap，否则搜索平台
 *      无法确认站点存在）；
 *   ③ 开发服务器同样能访问这两个文件，便于上线前本地核对。
 *
 * 域名来源优先级（从高到低）：
 *   1. VITE_SITE_URL      — 显式指定，绑了自定义域名时用这个
 *   2. CF_PAGES_URL       — Cloudflare Pages 构建环境自带，形如 https://xxx.pages.dev
 *   3. .env 里的 VITE_SITE_URL
 *   4. 内置兜底
 * 有了第 2 条，接 Cloudflare Pages 时无需手工配任何域名变量，canonical 也不会漏。
 */

import type { Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE } from '../src/data/site';

const FALLBACK_URL = 'https://calenref.kris-188h.workers.dev';

/** 法务页真 URL（审核方会直接打开；必须可直达，不能只挂查询串） */
const LEGAL_PATHS = ['/privacy', '/terms', '/refund', '/cookies'];

function normalize(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function readSiteUrl(root: string): string {
  if (process.env.VITE_SITE_URL) return normalize(process.env.VITE_SITE_URL);
  // Cloudflare Pages 在构建容器里注入，生产为 https://<project>.pages.dev
  if (process.env.CF_PAGES_URL) return normalize(process.env.CF_PAGES_URL);
  try {
    const env = readFileSync(join(root, '.env'), 'utf-8');
    const m = env.match(/^\s*VITE_SITE_URL\s*=\s*(.+)$/m);
    if (m) return normalize(m[1].replace(/^["']|["']$/g, ''));
  } catch {
    /* 无 .env，用默认值 */
  }
  return FALLBACK_URL;
}

function robotsTxt(siteUrl: string): string {
  return [
    '# CalenRef',
    `# ${siteUrl}`,
    '',
    'User-agent: *',
    'Allow: /',
    '',
    '# 支付回跳与分享落地参数无需收录',
    'Disallow: /*?paid=',
    'Disallow: /*?ref=',
    'Disallow: /*?license=',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

function sitemapXml(siteUrl: string, today: string): string {
  const urls = [
    { loc: `${siteUrl}/`, priority: '1.0', changefreq: 'weekly' },
    ...LEGAL_PATHS.map((p) => ({ loc: `${siteUrl}${p}`, priority: '0.3', changefreq: 'yearly' })),
  ];
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

/**
 * 静态 manifest.webmanifest。
 *
 * App 运行时按语言注入 blob manifest（多语言安装名），但 blob URL 对爬虫与
 * 审核方不可见，/manifest.webmanifest 之前直接落到 SPA 兜底返回 HTML。
 * 这里补一份静态默认值（简体），运行时注入仍会覆盖它。
 */
function webManifest(siteUrl: string): string {
  return JSON.stringify(
    {
      name: '历知 CalenRef',
      short_name: '历知',
      description: '中国传统历法文化参考工具：按场景查阅历法规则与日期参考，全部计算在本机完成，不提供预测。',
      lang: 'zh-CN',
      start_url: `${siteUrl}/`,
      scope: `${siteUrl}/`,
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#F8F4EA',
      theme_color: '#191710',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2,
  );
}

export function siteMeta(): Plugin {
  let siteUrl = FALLBACK_URL;
  let today = '';

  return {
    name: 'calenref-site-meta',
    configResolved(config) {
      siteUrl = readSiteUrl(config.root);
      today = new Date().toISOString().slice(0, 10);
    },
    transformIndexHtml(html) {
      // 占位符刻意不用 %VITE_XXX% 语法：Vite 内建的 HTML env 替换会在本插件之前
      // 抢先处理它，遇到未定义变量时还会因 URI 解码失败中断构建。
      // 邮箱与主体名同样走占位符 —— 支付平台审核会读 JSON-LD 里的 contactPoint，
      // 硬编码在 index.html 里等于绕过了 site.ts 这个唯一真源。
      return html
        .replaceAll('__SITE_URL__', siteUrl)
        .replaceAll('__SUPPORT_EMAIL__', SITE.supportEmail)
        .replaceAll('__ENTITY__', SITE.entity);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0];
        if (path === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(robotsTxt(siteUrl));
          return;
        }
        if (path === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8');
          res.end(sitemapXml(siteUrl, today || new Date().toISOString().slice(0, 10)));
          return;
        }
        if (path === '/manifest.webmanifest') {
          res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
          res.end(webManifest(siteUrl));
          return;
        }
        next();
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(siteUrl) });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(siteUrl, today) });
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: webManifest(siteUrl) });
    },
  };
}

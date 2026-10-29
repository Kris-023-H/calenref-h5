/**
 * build/legal-pages.ts — 把法务四页预渲染成**静态 HTML**（/privacy、/terms、/refund、/cookies）。
 *
 * 为什么非做不可：
 *   支付平台审核要求「隐私政策与服务条款必须存在且可访问」。站内法务屏是客户端渲染，
 *   直接抓 /privacy 拿到的只有 6KB 的空壳 index.html —— 正文一个字都不在返回体里。
 *   审核方（或它的抓取工具）看不到正文，就等于「没有隐私政策」，这是硬性驳回项。
 *
 * 做法：用与站内法务屏**同一份数据源**（src/data/legal.ts）在构建时生成独立 HTML，
 *   正文直接写进返回体，不依赖 JS。中英双版同页（准据法属地新加坡，双语法务页是常态），
 *   英文审核员往下滚就能看到英文条款。
 *
 * 单一事实源：正文只维护 legal.ts，静态页与站内屏都由它渲染，不会出现「页脚说 A、页面写 B」。
 *
 * 产物：dist/privacy.html / terms.html / refund.html / cookies.html
 *   配合 Cloudflare 静态资源的 html_handling（auto-trailing-slash），
 *   `/privacy` 会直接命中 privacy.html，返回 200 + text/html，无重定向。
 */

import type { Plugin } from 'vite';
import { legalDoc, LEGAL_PAGES, type LegalDoc, type LegalPage } from '../src/data/legal';
import { SITE, legalPath } from '../src/data/site';
import { t } from '../src/i18n/format';

/** 法务页路径段 → 静态文件名（/cookies 是复数，与 page 名不同） */
const FILE_OF: Record<LegalPage, string> = {
  privacy: 'privacy',
  terms: 'terms',
  refund: 'refund',
  cookie: 'cookies',
};

const esc = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const STYLE = `
:root{--paper:#F8F4EA;--ink:#191710;--ink2:#4A4438;--muted:#8A8271;--line:#DDD3BF;--accent:#8C6A3F}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:radial-gradient(120% 80% at 50% -10%,#FBF7EE 0%,#EDE5D4 46%,#E3D9C5 100%);
min-height:100vh;color:var(--ink);font:15px/1.85 -apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans",sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:28px 20px 64px}
.top{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:22px;flex-wrap:wrap}
.brand{font-size:13px;letter-spacing:.28em;font-weight:700}
.brand small{display:block;font-size:9.5px;letter-spacing:.18em;color:var(--muted);font-weight:400;margin-top:2px}
.back{font-size:12px;color:var(--accent);text-decoration:none;border-bottom:1px solid var(--line);padding-bottom:1px}
.card{background:rgba(255,253,247,.86);border:1px solid var(--line);border-radius:14px;padding:26px 24px;
box-shadow:0 1px 0 rgba(255,255,255,.7) inset,0 8px 24px rgba(60,48,24,.06)}
h1{font-size:22px;letter-spacing:.06em;margin:0 0 6px}
.meta{font-size:11.5px;color:var(--muted);letter-spacing:.04em;margin-bottom:14px}
.lead{font-size:14px;color:var(--ink2);background:rgba(140,106,63,.07);border-left:3px solid var(--accent);
padding:10px 14px;border-radius:0 8px 8px 0;margin:0 0 22px}
h2{font-size:15px;margin:26px 0 8px;letter-spacing:.02em}
p{margin:0 0 10px;color:var(--ink2)}
ul{margin:0 0 12px;padding-left:20px;color:var(--ink2)}
li{margin-bottom:5px}
.contact{margin-top:26px;padding-top:18px;border-top:1px solid var(--line);font-size:13px;color:var(--ink2)}
.contact a{color:var(--accent)}
.note{font-size:11.5px;color:var(--muted);margin-top:8px;line-height:1.75}
.disc{margin-top:18px;font-size:11.5px;color:var(--muted);line-height:1.8}
.sep{margin:38px 0 0;border:0;border-top:1px dashed var(--line)}
.langnav{font-size:11.5px;color:var(--muted);margin-bottom:14px}
.langnav a{color:var(--accent);text-decoration:none;margin-right:10px}
.foot{margin-top:26px;text-align:center;font-size:10.5px;color:var(--muted);line-height:1.8}
@media (max-width:520px){.card{padding:20px 16px}h1{font-size:19px}.wrap{padding:20px 14px 48px}}
`;

/** 渲染一份法务文档（不含 <html> 外壳） */
function renderDoc(doc: LegalDoc, lang: 'zh' | 'en'): string {
  const secs = doc.sections
    .map((sec) => {
      const ps = sec.p.map((para) => `<p>${esc(para)}</p>`).join('');
      const list = sec.list ? `<ul>${sec.list.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>` : '';
      return `<h2>${esc(sec.h)}</h2>${ps}${list}`;
    })
    .join('');

  const contactTitle = t('legal.contactTitle', lang);
  const entityLine = t('legal.entityLine', lang, { entity: SITE.entity, jurisdiction: SITE.jurisdiction });
  const contactBody = t('legal.contactBody', lang, { email: SITE.supportEmail });
  const updated = t('legal.updated', lang, { date: doc.updated });
  const disclaimer = t('legal.disclaimer', lang);
  const email = SITE.supportEmail;

  return `
    <h1>${esc(doc.title)}</h1>
    <div class="meta">${esc(updated)}</div>
    <p class="lead">${esc(doc.lead)}</p>
    ${secs}
    <div class="contact">
      <strong>${esc(contactTitle)}</strong><br />
      <a href="mailto:${esc(email)}">${esc(email)}</a>
      <p class="note">${esc(contactBody)}</p>
      <p class="note">${esc(entityLine)}</p>
    </div>
    <p class="disc">${esc(disclaimer)}</p>`;
}

/** 单个法务页的完整 HTML（中英双语同页） */
export function legalPageHtml(page: LegalPage, siteUrl: string): string {
  const zh = legalDoc(page, 'zh');
  const en = legalDoc(page, 'en');
  const path = legalPath(page);
  const url = `${siteUrl}${path}`;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="zh-Hans">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>${esc(zh.title)} · ${esc(SITE.nameZh)} — ${esc(SITE.nameEn)}</title>
<meta name="description" content="${esc(zh.lead).slice(0, 150)}" />
<meta name="robots" content="index,follow" />
<meta name="author" content="${esc(SITE.entity)}" />
<link rel="canonical" href="${esc(url)}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="${esc(SITE.nameEn)}" />
<meta property="og:title" content="${esc(zh.title)} · ${esc(SITE.nameEn)}" />
<meta property="og:url" content="${esc(url)}" />
<meta name="theme-color" content="#F8F4EA" />
<link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
<style>${STYLE}</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <div class="brand">中 华 历 法<small>CHINESE DATE PLANNER</small></div>
    <a class="back" href="/">← ${esc(t('legal.backHome', 'zh'))} / ${esc(t('legal.backHome', 'en'))}</a>
  </div>

  <div class="langnav"><a href="#zh">中文</a><a href="#en">English</a></div>

  <div class="card">
    <section id="zh" lang="zh-Hans">${renderDoc(zh, 'zh')}</section>
    <hr class="sep" />
    <section id="en" lang="en">${renderDoc(en, 'en')}</section>
  </div>

  <div class="foot">
    ${esc(SITE.nameZh)} · ${esc(SITE.nameEn)} · ${esc(SITE.tagline)}<br />
    © ${year} ${esc(SITE.entity)}
  </div>
</div>
</body>
</html>
`;
}

/** 全部法务页产物（文件名 → HTML） */
export function legalPageFiles(siteUrl: string): Array<{ fileName: string; html: string }> {
  return LEGAL_PAGES.map((p) => ({
    fileName: `${FILE_OF[p]}.html`,
    html: legalPageHtml(p, siteUrl),
  }));
}

/** 开发服务器：/privacy 等路径在 dev 下也返回静态法务页（便于上线前核对返回体） */
function devPathToPage(path: string): LegalPage | null {
  const p = path.replace(/\/+$/, '') || '/';
  const hit = LEGAL_PAGES.find((page) => legalPath(page) === p);
  return hit ?? null;
}

export function legalPages(siteUrl: string): Plugin {
  return {
    name: 'zeji-legal-pages',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0];
        const page = devPathToPage(path);
        if (!page) {
          next();
          return;
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(legalPageHtml(page, siteUrl));
      });
    },
    generateBundle() {
      for (const f of legalPageFiles(siteUrl)) {
        this.emitFile({ type: 'asset', fileName: f.fileName, source: f.html });
      }
    },
  };
}

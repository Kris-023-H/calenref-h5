/**
 * tests/redline/legal-static.test.ts — 法务页必须是**能拿到正文的静态页**。
 *
 * 背景（Creem 二次复核的驳回项）：SPA 客户端渲染的法务屏，抓 /privacy 只能拿到
 * 6KB 的空壳 index.html，返回体里没有一个字是隐私政策。审核方判定「隐私政策缺失」，
 * 而这一条属于硬性项——前两条改得再好也会被打回。
 *
 * 本测试锁四件事：
 *   ① 四页都生成了独立 HTML，且返回体含中英文正文（不是空壳）；
 *   ② 每页有独立 <title> 与 canonical（审核看源码能对上页面主题）；
 *   ③ 页面里没有任何构建占位符残留（__SITE_URL__ 之类）；
 *   ④ Worker 的 LEGAL_PATHS 与 site.ts 的 LEGAL_PATH 不漂移
 *      （漂移会让某条路径重新落回 SPA 兜底，等于白做）。
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { legalPageFiles } from '../../build/legal-pages';
import { legalDoc, LEGAL_PAGES, type LegalPage } from '../../src/data/legal';
import { SITE, legalPath } from '../../src/data/site';

const SITE_URL = 'https://example.com';
const FILES = legalPageFiles(SITE_URL);
const read = (p: string): string => readFileSync(join(process.cwd(), p), 'utf-8');

/** 页面 → 产物文件名（/cookies 的 page 名是 cookie，靠 legalPath 统一） */
const fileOf = (page: LegalPage): string => `${legalPath(page).slice(1)}.html`;
const htmlOf = (page: LegalPage): string => {
  const f = FILES.find((x) => x.fileName === fileOf(page));
  if (!f) throw new Error(`缺少法务页产物：${fileOf(page)}`);
  return f.html;
};

describe('法务静态页 ① — 四页都产出且含正文', () => {
  it('产物数量与页面数一致', () => {
    expect(FILES.map((f) => f.fileName)).toEqual([
      'privacy.html',
      'terms.html',
      'refund.html',
      'cookies.html',
    ]);
  });

  it.each(LEGAL_PAGES)('%s 页含中英文正文，且不是 SPA 空壳', (page) => {
    const html = htmlOf(page);
    const zh = legalDoc(page, 'zh');
    const en = legalDoc(page, 'en');

    expect(html).toContain(zh.title);
    expect(html).toContain(en.title);
    // 首段正文必须逐字出现（标题可能是同形词，正文不会）
    expect(html).toContain(zh.lead.slice(0, 24));
    expect(html).toContain(en.lead.slice(0, 24));
    // 空壳判据：真正的内容页远大于 6KB 的 index.html
    expect(html.length).toBeGreaterThan(6000);
    expect(html).not.toContain('/src/main.tsx');
  });
});

describe('法务静态页 ② — 独立 title / canonical', () => {
  it.each(LEGAL_PAGES)('%s 页有独立标题与 canonical', (page) => {
    const html = htmlOf(page);
    expect(html).toContain(`<title>${legalDoc(page, 'zh').title} · `);
    expect(html).toContain(`<link rel="canonical" href="${SITE_URL}${legalPath(page)}" />`);
  });

  it('联系邮箱与运营主体出现在页面上（审核会核对可联系性）', () => {
    for (const page of LEGAL_PAGES) {
      const html = htmlOf(page);
      expect(html).toContain(SITE.supportEmail);
      expect(html).toContain(SITE.entity);
    }
  });
});

describe('法务静态页 ③ — 无占位符残留', () => {
  it.each(['__SITE_URL__', '__ENTITY__', '__SUPPORT_EMAIL__'])('%s 已替换', (ph) => {
    for (const page of LEGAL_PAGES) expect(htmlOf(page)).not.toContain(ph);
  });
});

describe('法务静态页 ④ — Worker 放行路径与站点配置一致', () => {
  it('worker/index.ts 的 LEGAL_PATHS 覆盖 site.ts 的四条路径', () => {
    const worker = read('worker/index.ts');
    const m = worker.match(/const LEGAL_PATHS = new Set\(\[([^\]]+)\]\)/);
    expect(m).not.toBeNull();
    const inWorker = (m![1].match(/'[^']+'/g) ?? []).map((s) => s.slice(1, -1));
    const inSite = LEGAL_PAGES.map((p) => legalPath(p));
    expect(inWorker.sort()).toEqual(inSite.sort());
  });
});

/**
 * tests/services/legal-consent.test.ts — 上线合规面回归（法务四页 + Cookie 同意 + 关键埋点）。
 *
 * 覆盖上线前一次性投入的四项（法务页、同意机制、埋点、SEO 深链）：
 *   ① 四篇法务 × 三语齐全，且退款政策必须写明「已交付不退」的例外条款；
 *   ② 繁体由 s2t 派生，标题不得残留简体；
 *   ③ `?legal=` 深链只接受四个合法值（脏参数不得把用户带进空白页）；
 *   ④ Cookie 同意三态与「同意前不上报」的闸门；
 *   ⑤ 三个关键事件名与投放口径一致（改名字会悄悄打断数据看板）。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LEGAL_PAGES, LEGAL_DOCS, legalDoc, parseLegalParam } from '../../src/data/legal';
import { SITE } from '../../src/data/site';

// ---------------------------------------------------------------- localStorage 桩

const store = new Map<string, string>();

function installWindow(): void {
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  };
}

describe('法务四页 — 结构与三语齐备', () => {
  it('四页在三语下都有标题、摘要与至少 5 个小节', () => {
    for (const lang of ['zh', 'en', 'zh-Hant'] as const) {
      for (const page of LEGAL_PAGES) {
        const doc = legalDoc(page, lang);
        expect(doc.title.length, `${lang}/${page} title`).toBeGreaterThan(1);
        expect(doc.lead.length, `${lang}/${page} lead`).toBeGreaterThan(20);
        expect(doc.sections.length, `${lang}/${page} sections`).toBeGreaterThanOrEqual(5);
        for (const sec of doc.sections) {
          expect(sec.h.length, `${lang}/${page} section heading`).toBeGreaterThan(1);
          expect(sec.p.length, `${lang}/${page} section body`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('退款政策写明数字产品「已交付不退」的例外条款（支付平台审核必查）', () => {
    const zh = legalDoc('refund', 'zh');
    const all = zh.sections.flatMap((s) => [...s.p, ...(s.list ?? [])]).join('\n');
    expect(all).toContain('不予退款');
    expect(all).toMatch(/报告已生成/);
    expect(all).toMatch(/7 日/);

    const en = legalDoc('refund', 'en');
    const enAll = en.sections.flatMap((s) => [...s.p, ...(s.list ?? [])]).join('\n');
    expect(enAll.toLowerCase()).toContain('not available');
    expect(enAll).toContain('14-day right of withdrawal');
  });

  it('隐私政策披露「出生资料不出设备」与第三方（支付 / 统计）', () => {
    const zh = legalDoc('privacy', 'zh');
    const all = zh.sections.flatMap((s) => [...s.p, ...(s.list ?? [])]).join('\n');
    expect(all).toContain('本机');
    expect(all).toContain('出生资料');
    expect(all).toMatch(/Creem|Stripe/);
    expect(all).toContain('Google Analytics');
  });

  it('繁体由 s2t 派生：标题与小节标题无简体残留', () => {
    const hant = legalDoc('privacy', 'zh-Hant');
    expect(hant.title).toBe('隱私政策');
    expect(hant.sections[0].h).toContain('誰');
    // 简体特征字不得出现在繁体标题里
    const headings = [hant.title, hant.lead, ...hant.sections.map((s) => s.h)].join('');
    for (const ch of ['谁', '隐私', '条款', '联络', '费']) {
      expect(headings).not.toContain(ch);
    }
  });

  it('四页的 updated 与站点生效日一致', () => {
    for (const page of LEGAL_PAGES) {
      expect(legalDoc(page, 'zh').updated).toBe(SITE.effectiveDate);
      expect(LEGAL_DOCS.en[page].updated).toBe(SITE.effectiveDate);
    }
  });
});

describe('法务深链 — ?legal=', () => {
  it('接受四个合法值', () => {
    for (const p of LEGAL_PAGES) expect(parseLegalParam(`?legal=${p}`)).toBe(p);
  });

  it('非法值与缺省返回 null', () => {
    expect(parseLegalParam('')).toBeNull();
    expect(parseLegalParam('?legal=')).toBeNull();
    expect(parseLegalParam('?legal=admin')).toBeNull();
    expect(parseLegalParam('?foo=1')).toBeNull();
  });
});

describe('Cookie 同意 — 三态与闸门', () => {
  beforeEach(() => {
    store.clear();
    installWindow();
    vi.resetModules();
  });

  it('未选择时为 null，且不允许分析', async () => {
    const { readConsent, isAnalyticsAllowed, hasDecided } = await import('../../src/services/consent');
    expect(readConsent()).toBeNull();
    expect(hasDecided()).toBe(false);
    expect(isAnalyticsAllowed()).toBe(false);
  });

  it('接受统计后允许分析，仅必要则不允许', async () => {
    const consent = await import('../../src/services/consent');
    consent.saveConsent('all');
    expect(consent.isAnalyticsAllowed()).toBe(true);
    expect(store.get('zj.consent.v1')).toBe('all');

    consent.saveConsent('essential');
    expect(consent.isAnalyticsAllowed()).toBe(false);
    expect(consent.hasDecided()).toBe(true);
  });

  it('清除选择后回到未选择（撤回与给予同样容易）', async () => {
    const consent = await import('../../src/services/consent');
    consent.saveConsent('all');
    consent.clearConsent();
    expect(consent.readConsent()).toBeNull();
    expect(consent.hasDecided()).toBe(false);
  });

  it('脏值按未同意处理（不因手工改 localStorage 就默认开启）', async () => {
    store.set('zj.consent.v1', 'yes-please');
    const consent = await import('../../src/services/consent');
    expect(consent.readConsent()).toBeNull();
    expect(consent.isAnalyticsAllowed()).toBe(false);
  });
});

describe('关键埋点 — 事件名与投放口径一致', () => {
  it('三个关键事件名固定', async () => {
    const { EVENTS } = await import('../../src/services/analytics');
    expect(EVENTS.dateCheck).toBe('date_check');
    expect(EVENTS.aiGenStart).toBe('ai_gen_start');
    expect(EVENTS.reportBuy).toBe('report_buy');
  });

  it('未同意时不注入 GA4（isGtagActive 保持 false）', async () => {
    store.clear();
    installWindow();
    vi.resetModules();
    const { isGtagActive, loadGtag } = await import('../../src/services/analytics');
    loadGtag();
    expect(isGtagActive()).toBe(false);
  });
});

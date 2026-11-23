/**
 * tests/redline/creem-category.test.ts — 产品定位与专业术语质量门。
 *
 * 背景变更：Creem 支付已弃用（审核终局拒绝、无上诉，已换支付通道）。
 * 原「Creem 禁售类目 / Restricted 类目」红线整体解除；产品定位不再为过审
 * 而自我矮化为「通俗说法」，改为守护原型 v3.7 的专业术语口径。
 *
 * 仍保留的合规底线：免责声明在场、品牌名一致、首屏「非预测/咨询」提示——
 * 这些与支付通道无关，是对用户应有的透明信息，继续锁定。
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string): string => readFileSync(join(process.cwd(), p), 'utf-8');

const PACKS = {
  zh: read('src/i18n/zh.ts'),
  en: read('src/i18n/en.ts'),
  'zh-Hant': read('src/i18n/zh-hant.ts'),
};

describe('产品定位 — 品牌与免责声明', () => {
  it('产品名与标语一致', () => {
    expect(PACKS.en).toContain("'app.name': 'CalenRef'");
    expect(PACKS.zh).toContain("'app.name': '历知'");
  });

  it('首屏免责声明在场', () => {
    const splash = read('src/components/compass-intro.tsx');
    expect(splash).toContain('免责声明');
    expect(splash).toContain('No predictions, consulting, or spiritual guidance');
    expect(splash).toContain('仅供文化学习与研究参考');
  });

  it('首页第一屏含常驻免责一行', () => {
    const home = read('src/screens/home-screen.tsx');
    expect(home).toContain('不提供任何预测、咨询或灵性指导');
    expect(home).toContain('No predictions, consulting, or spiritual guidance');
  });

  it('法务免责声明存在', () => {
    expect(PACKS.zh).toContain('legal.disclaimer');
    expect(PACKS.en).toContain('legal.disclaimer');
  });

  it('PWA manifest 名称与品牌一致', () => {
    const m = read('src/lib/pwa-manifest.ts');
    expect(m).toContain('CalenRef');
    expect(m).toContain('历知');
  });
});

describe('专业术语口径 — 中英语言包', () => {
  it('简中包使用专业术语', () => {
    for (const w of ['AI 解读', '知库', '年卡', '单次课期报告']) {
      expect(PACKS.zh, `缺少「${w}」`).toContain(w);
    }
  });

  it('英文包使用专业术语', () => {
    for (const w of ['AI reading', 'Annual card', 'Single course report', 'Knowledge']) {
      expect(PACKS.en, `缺少「${w}」`).toContain(w);
    }
  });

  it('中英包无 Creem 时代的通俗说法', () => {
    for (const w of ['释义摘要', '白话释义', '知识库', '年度会员', '单次报告']) {
      expect(PACKS.zh, `残留「${w}」`).not.toContain(w);
    }
    for (const w of ['Plain-language summary', 'Annual pass', 'Single report']) {
      expect(PACKS.en, `残留「${w}」`).not.toContain(w);
    }
  });

  it('支付文案不再绑定已弃用的 Creem', () => {
    expect(PACKS.zh).not.toContain('支付由 Creem 处理');
    expect(PACKS.en).not.toContain('Payments run through Creem');
  });
});

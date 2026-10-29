/**
 * tests/redline/creem-category.test.ts — Creem 商户审核「禁售类目」红线。
 *
 * 背景：Creem 禁止「Metaphysical, fortune-telling, and spiritual outcome services」。
 * 该品类被拒为终局（无 re-review），因此把产品定位改为
 * 「中国传统历法文化参考工具」是上线的硬前提，不能靠人工记忆守。
 *
 * 本测试锁三件事：
 *   ① 三语包与 index.html 不含命理/择日类词汇（用户可见文案的唯一事实源）；
 *   ② 英文包不含 fortune-telling / astrology / destiny 等结果性表述
 *      （唯一例外：免责声明里以否定形式出现的 “Not a fortune-telling ...” 与
 *        “No prediction of outcomes”，这是审核要求明示的表述）；
 *   ③ 首屏免责声明存在（审核员第一眼要能看到「非占卜服务」）。
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

/** 命理/择日类中文词：出现即为类目风险 */
const BANNED_ZH = [
  '择吉',
  '择日',
  '四柱',
  '八字',
  '命主',
  '课期',
  '排课',
  '吉凶',
  '冲命',
  '犯冲',
  '神煞',
  '三宗派',
  '年命',
  '行嫁',
];

/** 英文命理/占卜类词 */
const BANNED_EN = [
  'four pillars',
  'life chart',
  'auspicious',
  'destiny',
  'fate',
  'horoscope',
  'astrology',
  'psychic',
  'fortune teller',
  'guaranteed luck',
  'ward off evil',
  'prosperity',
];

describe('Creem 类目红线 ① — 三语包无命理/择日词汇', () => {
  it('zh / zh-Hant 包不含禁用中文词', () => {
    const hits: string[] = [];
    for (const lang of ['zh', 'zh-Hant'] as const) {
      for (const w of BANNED_ZH) {
        if (PACKS[lang].includes(w)) hits.push(`${lang}: ${w}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it('index.html 不含禁用中文词', () => {
    const html = read('index.html');
    expect(BANNED_ZH.filter((w) => html.includes(w))).toEqual([]);
  });
});

describe('Creem 类目红线 ② — 英文包无占卜类表述', () => {
  it('en.ts 不含 BANNED_EN（免责声明的否定句式除外）', () => {
    const lines = PACKS.en.split('\n');
    const hits: string[] = [];
    for (const line of lines) {
      const lower = line.toLowerCase();
      // 免责声明必须以否定形式出现，属于审核要求，不算违规
      const isNegated = lower.includes('not a fortune-telling') || lower.includes('no prediction of outcomes');
      if (isNegated) continue;
      for (const w of BANNED_EN) {
        if (lower.includes(w)) hits.push(`${w} :: ${line.trim().slice(0, 80)}`);
      }
    }
    expect(hits).toEqual([]);
  });
});

describe('Creem 类目红线 ③ — 首屏免责声明在场', () => {
  it('启动页（轮盘）含中英免责声明', () => {
    const splash = read('src/components/compass-intro.tsx');
    expect(splash).toContain('免责声明');
    expect(splash).toContain('Not a fortune-telling or spiritual service');
    expect(splash).toContain('No prediction of outcomes');
  });

  it('首页第一屏含常驻免责一行', () => {
    const home = read('src/screens/home-screen.tsx');
    expect(home).toContain('不构成命理预测');
    expect(home).toContain('No fortune-telling or predictions');
  });

  it('法务免责声明存在且明确「非专业意见」', () => {
    expect(PACKS.zh).toContain('legal.disclaimer');
    expect(PACKS.en).toContain('legal.disclaimer');
  });
});

describe('Creem 类目红线 ④ — 产品定位一致', () => {
  it('产品名与标语已去玄学化', () => {
    expect(PACKS.en).toContain("'app.name': 'Chinese Date Planner'");
    expect(PACKS.en).toContain('traditional Chinese calendar context');
    expect(PACKS.zh).toContain("'app.name': '中华历法'");
  });

  it('PWA manifest 名称不含 Zeji / 择吉', () => {
    const m = read('src/lib/pwa-manifest.ts');
    expect(m).not.toContain('Zeji');
    expect(m).not.toContain('择吉');
  });
});

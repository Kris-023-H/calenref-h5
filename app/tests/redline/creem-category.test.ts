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
    expect(splash).toContain('No predictions, consulting, or spiritual guidance');
    expect(splash).toContain('仅供文化学习与研究参考');
  });

  it('首页第一屏含常驻免责一行', () => {
    const home = read('src/screens/home-screen.tsx');
    expect(home).toContain('不提供任何预测、咨询或灵性指导');
    expect(home).toContain('No predictions, consulting, or spiritual guidance');
  });

  it('法务免责声明存在且明确「非专业意见」', () => {
    expect(PACKS.zh).toContain('legal.disclaimer');
    expect(PACKS.en).toContain('legal.disclaimer');
  });
});

describe('Creem 类目红线 ④ — 产品定位一致', () => {
  it('产品名与标语已去玄学化', () => {
    expect(PACKS.en).toContain("'app.name': 'CalenRef'");
    expect(PACKS.en).toContain('Traditional Chinese Almanac Reference Tool');
    expect(PACKS.zh).toContain("'app.name': '历知'");
  });

  /**
   * 2026-10-30 追加：Creem 的 Generative AI 属 Restricted 类目，首审要求前服务商
   * 记录、拒付率与 track record —— 首次提交拿不出来，效果等同 Prohibited。
   * 所以产品表述里不能出现 AI 卖点，也不能用「知识图谱」这类语义网术语把自己
   * 归到 AI 类目。这条测试防的是「下次改文案又把它加回来」。
   */
  it('不出现 AI 卖点与知识图谱表述（Restricted 类目红线）', () => {
    const banned = ['AI-powered', 'AI 解读', 'AI reading', 'AI readings', 'AI 驱动', 'AI 驅動', 'knowledge graph', 'Knowledge graph', '知识图谱', '知識圖譜', 'CalenAI'];
    // CalenRef 是最终英文名（方案 2.2），Calen 是中间态，两者都不能残留在正文里
    for (const pack of ['zh', 'en'] as const) {
      for (const w of banned) {
        expect(PACKS[pack]).not.toContain(w);
      }
    }
    expect(read('index.html')).not.toContain('CalenAI');
    expect(read('index.html')).not.toContain('AI-powered');
    expect(read('index.html')).toContain('CalenRef');
  });

  /**
   * 2026-10-30 追加：法务四页的正文不在 i18n 包里，上一轮只扫了 i18n 与 index.html，
   * 结果退款条款里「未消耗 AI 解读次数」一路漏到线上。法务文案同样是审核员会逐页
   * 阅读的正文，必须一起锁。
   */
  it('法务文案不含以 AI 为卖点的表述', () => {
    const legal = read('src/data/legal.ts');
    // 独立的 AI 词（前后不接字母），覆盖「AI 解读」「AI credits」「AI-powered」等写法
    expect(legal).not.toMatch(/(?<![A-Za-z])AI(?![A-Za-z])/);
    for (const w of ['知识图谱', '知識圖譜', 'knowledge graph', 'CalenAI']) {
      expect(legal).not.toContain(w);
    }
  });

  it('PWA manifest 名称不含 Zeji / 择吉', () => {
    const m = read('src/lib/pwa-manifest.ts');
    expect(m).not.toContain('Zeji');
    expect(m).not.toContain('择吉');
  });
});

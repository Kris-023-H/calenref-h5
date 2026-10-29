/**
 * tests/redline/creem-wording.test.ts — 全站用户可见文案的「命理表述」红线。
 *
 * 为什么在 i18n 红线之外再加一层：creem-category.test.ts 只扫三个语言包，
 * 但产品里大量文案写在 data/*.ts（知库长文、用事描述、行业说明、典籍简介）与
 * screens/*.tsx（内联 tx 文案）里。Creem 判「Metaphysical / fortune-telling」看的是
 * 站上真正显示的字，不是语言包。
 *
 * 扫描方式：只取**单引号字符串字面量**（注释天然被排除），
 *   · 内部标识符（EventGroup 的三个 'X择日' key）按白名单跳过 —— 它们不上界面；
 *   · 免责声明里的否定句（「不构成命理预测」「Not a fortune-telling」）按审核要求保留。
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

const FILES = walk(join(ROOT, 'src')).map((p) => ({
  rel: relative(ROOT, p).replace(/\\/g, '/'),
  text: readFileSync(p, 'utf-8'),
}));

/** 只取单引号字面量（跨行串会被拆开，仍能覆盖到其中的关键词） */
const LITERAL = /'((?:[^'\\\n]|\\.)*)'/g;

/** 中文命理/术数词：出现即类目风险 */
const BANNED_ZH = [
  '择吉',
  '择日',
  '四柱',
  '八字',
  '命主',
  '课格',
  '课期',
  '排课',
  '吉凶',
  '冲命',
  '犯冲',
  '神煞',
  '三宗派',
  '年命',
  '行嫁',
  '妨夫',
  '五行',
  '坐山',
  '山向',
  '胎元',
  '合参',
  '化解',
  '制化',
  '上吉',
  '中吉',
  '天德',
  '月害',
  '四离四绝',
  '太岁',
  '算命',
  '风水',
  '开运',
  '转运',
  '招财',
  '辟邪',
  '化煞',
  '命理',
];

/** 英文命理/占卜词 */
const BANNED_EN = [
  'four pillars',
  'life chart',
  'auspicious',
  'destiny',
  'horoscope',
  'astrology',
  'psychic',
  'fortune teller',
  'fortune-telling',
  'guaranteed luck',
  'ward off evil',
  'prosperity',
  'tai sui',
  'sitting mountain',
  'five phases',
  'five-phase',
  'fetal origin',
];

/** 不上界面的内部标识符（EventGroup key，引擎与 18 个测试依赖） */
const INTERNAL = new Set(['经营择日', '工程择日', '家庭择日']);

/** 免责声明否定句：审核要求明示「本产品不提供此类服务」，必须保留这些词 */
const NEGATION = ['不构成命理', '不構成命理', '不是命理', '非命理', '不涉及命理', 'not a fortune-telling', 'no prediction of outcomes', 'no fortune-telling'];

function scan(): Array<{ rel: string; line: number; word: string; snippet: string }> {
  const hits: Array<{ rel: string; line: number; word: string; snippet: string }> = [];
  for (const { rel, text } of FILES) {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // import/export 行里的模块路径不是文案（'../rules/five-phase' 会误报）
      if (/^\s*(import|export)\b/.test(line) || /\bfrom\s*'/.test(line)) continue;
      LITERAL.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = LITERAL.exec(line))) {
        const s = m[1];
        if (INTERNAL.has(s)) continue;
        const lower = s.toLowerCase();
        if (NEGATION.some((n) => lower.includes(n.toLowerCase()))) continue;
        for (const w of BANNED_ZH) {
          if (s.includes(w)) hits.push({ rel, line: i + 1, word: w, snippet: s.slice(0, 70) });
        }
        for (const w of BANNED_EN) {
          if (lower.includes(w)) hits.push({ rel, line: i + 1, word: w, snippet: s.slice(0, 70) });
        }
      }
    }
  }
  return hits;
}

describe('Creem 文案红线 — 全站字符串字面量无命理表述', () => {
  const hits = scan();

  it('扫到了源码（防止 walk 失效导致空跑通过）', () => {
    expect(FILES.length).toBeGreaterThan(60);
  });

  it('没有命中任何禁用词', () => {
    const brief = hits.slice(0, 40).map((h) => `${h.rel}:${h.line} [${h.word}] ${h.snippet}`);
    expect(brief).toEqual([]);
  });
});

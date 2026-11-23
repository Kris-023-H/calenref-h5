/**
 * tests/redline/creem-wording.test.ts — 全站「专业术语口径」质量门。
 *
 * 背景变更：Creem 支付已弃用（审核终局拒绝、无上诉，已换支付通道）。
 * 因此原「为过 Creem 审核而禁止专业术语」的红线整体解除，改为正向守护
 * 主理人拍板的专业口径：术语必须用原型 v3.7 的专业术语，不得回退为通俗词。
 *
 * 本测试锁两件事：
 *   ① 用户可见文案里专业术语在场（AI 解读 / 知库 / 课期 / 年卡 / 单次课期报告）；
 *   ② 通俗说法已清零（释义摘要 / 白话释义 / 知识库 / 年度会员 / 单次报告）。
 *
 * 扫描方式沿用：只取单引号字符串字面量（注释天然被排除）。
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

/** 专业术语（至少各命中一次，防止整站术语被回退） */
const REQUIRED_ZH = ['AI 解读', '知库', '年卡', '课期'];
const REQUIRED_EN = ['AI reading', 'Annual card', 'Knowledge'];

/** 通俗说法（ Creem 时代的措辞，出现即视为术语回退） */
const BANNED_ZH = ['释义摘要', '白话释义', '知识库', '年度会员', '年度通行证', '单次报告'];
const BANNED_EN = ['Plain-language summary', 'Annual pass', '10 summaries', 'Calendar knowledge base'];

/** 接口标识符与免责声明否定句中的词不算回退 */
const ALLOW = new Set(['经营择日', '工程择日', '家庭择日']);

function literals(): Array<{ rel: string; s: string }> {
  const out: Array<{ rel: string; s: string }> = [];
  for (const { rel, text } of FILES) {
    const lines = text.split('\n');
    for (const line of lines) {
      if (/^\s*(import|export)\b/.test(line) || /\bfrom\s*'/.test(line)) continue;
      LITERAL.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = LITERAL.exec(line))) {
        const s = m[1];
        if (ALLOW.has(s)) continue;
        out.push({ rel, s });
      }
    }
  }
  return out;
}

describe('专业术语口径 — 全站字符串字面量', () => {
  const lits = literals();
  const allText = lits.map((x) => x.s).join('\n');

  it('扫到了源码（防止 walk 失效导致空跑通过）', () => {
    expect(FILES.length).toBeGreaterThan(60);
  });

  it('专业术语在场（简中）', () => {
    for (const w of REQUIRED_ZH) {
      expect(allText, `缺少专业术语「${w}」`).toContain(w);
    }
  });

  it('专业术语在场（英文）', () => {
    for (const w of REQUIRED_EN) {
      expect(allText, `缺少专业术语「${w}」`).toContain(w);
    }
  });

  it('通俗说法已清零（简中）', () => {
    const hits = lits.filter((x) => BANNED_ZH.some((w) => x.s.includes(w)));
    const brief = hits.slice(0, 30).map((h) => `${h.rel} :: ${h.s.slice(0, 70)}`);
    expect(brief).toEqual([]);
  });

  it('通俗说法已清零（英文）', () => {
    const hits = lits.filter((x) => BANNED_EN.some((w) => x.s.toLowerCase().includes(w.toLowerCase())));
    const brief = hits.slice(0, 30).map((h) => `${h.rel} :: ${h.s.slice(0, 70)}`);
    expect(brief).toEqual([]);
  });
});

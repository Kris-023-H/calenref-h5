/**
 * tests/redline/purity.test.ts — QA 独立红线核查（严过关）。
 * 依据 架构 §7.5 / §7.7 / §7.8 / §7.9 与 PRD §2.2.5 / §9 #1 #15：
 *   ① 引擎纯度：src/engine 禁 DOM / fetch / Date.now / new Date / 存储 / import.meta.env；
 *   ② 版本号全局不含 4（package.json / RULE_VERSION / SCHEMA_VERSION）；
 *   ③ 英文包无结果性词汇红线词（guaranteed luck / prosperity / ward off evil）；
 *   ④ 三语包无过程性说明文案（原型 / 本版未纳入 / 尚未纳入 / 待接入）；
 *   ⑤ 英文包无中文字段残留（专有名词语言自称除外）——对工程师既有断言的独立回归。
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir: string, ext = '.ts'): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, ext));
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

/** 去注释（块 + 行），避免把注释里的禁令说明误判为违规 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
}

const ENGINE_DIR = join(process.cwd(), 'src', 'engine');

describe('红线① — 引擎纯度（禁 DOM / fetch / Date.now / 存储 / env）', () => {
  const files = walk(ENGINE_DIR);
  it('src/engine 存在待检文件', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it('去除注释后无禁用副作用调用', () => {
    const forbidden = [
      /Date\.now\s*\(/,
      /new\s+Date\s*\(/,
      /\bdocument\s*\./,
      /\bwindow\s*\./,
      /\bfetch\s*\(/,
      /\blocalStorage\b/,
      /\bsessionStorage\b/,
      /\bindexedDB\b/,
      /import\s*\.\s*meta\s*\.\s*env/,
    ];
    const violations: string[] = [];
    for (const f of files) {
      const code = stripComments(readFileSync(f, 'utf-8'));
      for (const re of forbidden) {
        const m = code.match(re);
        if (m) violations.push(`${f.replace(process.cwd(), '')}: ${m[0]}`);
      }
    }
    expect(violations).toEqual([]);
  });
});

describe('红线② — 版本号全局不含 4', () => {
  it('package.json version / RULE_VERSION / SCHEMA_VERSION 均无数字 4', () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
    const ruleVersion = readFileSync(join(process.cwd(), 'src', 'engine', 'types.ts'), 'utf-8').match(
      /RULE_VERSION\s*=\s*'([^']+)'/,
    )?.[1];
    const schemaVersion = readFileSync(join(process.cwd(), 'src', 'db', 'types.ts'), 'utf-8').match(
      /SCHEMA_VERSION\s*=\s*(\d+)/,
    )?.[1];
    expect(pkg.version).toBeTruthy();
    expect(String(pkg.version)).not.toMatch(/4/);
    expect(ruleVersion).toBeTruthy();
    expect(ruleVersion).not.toMatch(/4/);
    expect(schemaVersion).toBeTruthy();
    expect(schemaVersion).not.toMatch(/4/);
  });
});

describe('红线③ — 结果性词汇红线（中英）', () => {
  const banned = ['guaranteed luck', 'prosperity', 'ward off evil', '大吉', '必发财', 'guaranteed fortune'];
  const packs: Record<string, string> = {
    en: readFileSync(join(process.cwd(), 'src', 'i18n', 'en.ts'), 'utf-8'),
    zh: readFileSync(join(process.cwd(), 'src', 'i18n', 'zh.ts'), 'utf-8'),
    'zh-Hant': readFileSync(join(process.cwd(), 'src', 'i18n', 'zh-hant.ts'), 'utf-8'),
  };
  it('三语包无 PRD §2.2.5 点名结果性词汇', () => {
    const hits: string[] = [];
    for (const [lang, src] of Object.entries(packs)) {
      const lower = src.toLowerCase();
      for (const w of banned) if (lower.includes(w.toLowerCase())) hits.push(`${lang}: ${w}`);
    }
    expect(hits).toEqual([]);
  });
});

describe('红线④ — 无过程性说明文案', () => {
  it('三语包无「原型 / 本版未纳入 / 尚未纳入 / 待接入」', () => {
    const files = ['zh.ts', 'en.ts', 'zh-hant.ts'].map((f) => join(process.cwd(), 'src', 'i18n', f));
    const banned = ['原型', '本版未纳入', '尚未纳入', '待接入', '敬请期待', '即将推出'];
    const hits: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf-8');
      for (const w of banned) if (src.includes(w)) hits.push(`${f.split(/[\\/]/).pop()}: ${w}`);
    }
    expect(hits).toEqual([]);
  });
});

describe('红线⑤ — 英文包无中文残留（独立回归）', () => {
  it('en.ts 除语言自称 key 外无汉字', async () => {
    const { en } = await import('../../src/i18n/en');
    const zhChar = /[\u4e00-\u9fff]/;
    const allowed = new Set(['lang.zh', 'lang.zhHant']);
    const bad: string[] = [];
    for (const [k, v] of Object.entries(en)) {
      if (allowed.has(k)) continue;
      if (typeof v === 'string' && zhChar.test(v)) bad.push(`${k}: ${v}`);
    }
    expect(bad).toEqual([]);
  });
});

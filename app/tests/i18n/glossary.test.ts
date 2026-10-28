import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { GLOSSARY, termText, termOf } from '../../src/i18n/glossary';
import { zh } from '../../src/i18n/zh';
import { en } from '../../src/i18n/en';
import { zhHant } from '../../src/i18n/zh-hant';

/** 递归收集 src 下所有 .ts 文件 */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}

describe('glossary — 术语表一致性', () => {
  it('条目数量与 key 唯一', () => {
    const keys = GLOSSARY.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.length).toBeGreaterThanOrEqual(112);
  });

  it('三语译名非空', () => {
    for (const e of GLOSSARY) {
      expect(e.zh.length, e.key).toBeGreaterThan(0);
      expect(e.en.length, e.key).toBeGreaterThan(0);
      expect(e.zhHant.length, e.key).toBeGreaterThan(0);
    }
  });

  it('一概念一译名：同一命名空间内无重复译名（防同概念两译名）', () => {
    // 同一命名空间（如 ind.* / kbcat.*）内，同一译名不得对应两个术语 key。
    // 跨命名空间的同形词（业态「餐饮」与知库门类「餐饮」）是不同分类体系，允许。
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const e of GLOSSARY) {
      const ns = e.key.split('.')[1] ?? '';
      const id = `${ns}:${e.zh}`;
      const hit = seen.get(id);
      if (hit && hit !== e.key) dupes.push(`${e.zh}: ${hit} vs ${e.key}`);
      seen.set(id, e.key);
    }
    expect(dupes).toEqual([]);
  });

  it('termText 三语取值与兜底', () => {
    expect(termText('term.jq.lichun', 'zh')).toBe('立春');
    expect(termText('term.jq.lichun', 'en')).toBe('Start of Spring');
    expect(termText('term.jq.lichun', 'zh-Hant')).toBe('立春');
    expect(termText('term.not.exist', 'zh')).toBe('term.not.exist'); // 兜底回 key
    expect(termOf('term.ev.open')?.zh).toBe('开业开市');
    expect(termOf('nope')).toBeUndefined();
  });

  it('数据层所有 term.* 引用均在术语表登记（防漏译）', () => {
    const files = walk(join(process.cwd(), 'src'));
    const used = new Set<string>();
    for (const f of files) {
      const src = readFileSync(f, 'utf-8');
      for (const m of src.matchAll(/'term\.[a-zA-Z0-9.]+'/g)) used.add(m[0].slice(1, -1));
    }
    const missing = [...used].filter((k) => !termOf(k));
    expect(missing).toEqual([]);
    expect(used.size).toBeGreaterThanOrEqual(112);
  });

  it('术语表无未被引用的孤立条目（保持表干净）', () => {
    const files = walk(join(process.cwd(), 'src'));
    const used = new Set<string>();
    for (const f of files) {
      const src = readFileSync(f, 'utf-8');
      for (const m of src.matchAll(/'term\.[a-zA-Z0-9.]+'/g)) used.add(m[0].slice(1, -1));
    }
    const orphan = GLOSSARY.map((e) => e.key).filter((k) => !used.has(k));
    expect(orphan).toEqual([]);
  });
});

describe('i18n — 三语 key 对齐', () => {
  it('zh / en / zh-Hant key 集合完全一致', () => {
    const zhKeys = Object.keys(zh).sort();
    expect(Object.keys(en).sort()).toEqual(zhKeys);
    expect(Object.keys(zhHant).sort()).toEqual(zhKeys);
  });

  it('MsgKey 数量规模（约 550 条）', () => {
    expect(Object.keys(zh).length).toBeGreaterThanOrEqual(500);
  });

  it('zh-Hant 由 zh 派生且不含未转换简体残留', () => {
    // 抽查关键领域词已转换
    expect(zhHant['event.title']).toBe('選擇用事');
    expect(zhHant['home.cta']).toBe('開始擇日');
    expect(zhHant['person.readingRaw']).toBe('原始鐘錶');
    expect(zhHant['lang.calGreg']).toBe('公曆');
    // 占位符保留
    expect(zhHant['home.greet']).toContain('{name}');
    expect(en['home.greet']).toContain('{name}');
  });

  it('英文包无中文残留（除语言自称）', () => {
    const zhChar = /[\u4e00-\u9fff]/;
    const allowed = new Set(['lang.zh', 'lang.zhHant']);
    for (const [k, v] of Object.entries(en)) {
      if (allowed.has(k)) continue;
      expect(zhChar.test(v), `${k}: ${v}`).toBe(false);
    }
  });
});

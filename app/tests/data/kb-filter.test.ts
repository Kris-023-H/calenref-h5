import { describe, expect, it } from 'vitest';
import { KB_ARTICLES, KB_CATS, filterKbArticles } from '../../src/data/kb';

// 回归测试：知库类型筛选必须真正过滤列表。
// 历史 bug：ScrollX 的 onSelect 是空函数（() => undefined），list 永远等于全部，点击类型无反应。

describe('知库类型筛选', () => {
  it("'全部' 返回所有篇目", () => {
    expect(filterKbArticles('term.kbcat.all').length).toBe(KB_ARTICLES.length);
  });

  it('每个非全部类别只返回该类别的篇目', () => {
    for (const cat of KB_CATS) {
      if (cat === 'term.kbcat.all') continue;
      const got = filterKbArticles(cat);
      for (const a of got) expect(a.category).toBe(cat);
      // 不应混入其他类别
      const others = KB_ARTICLES.filter((x) => x.category !== cat);
      for (const o of others) expect(got).not.toContain(o);
    }
  });

  it('所有篇目的类别都在 KB_CATS 中（否则筛选会漏）', () => {
    for (const a of KB_ARTICLES) {
      expect(KB_CATS).toContain(a.category);
    }
  });

  it('每个可见类别（除全部外）至少有 1 篇，确保选中后列表非空', () => {
    const visible = KB_CATS.filter((c) => c !== 'term.kbcat.all');
    for (const cat of visible) {
      expect(filterKbArticles(cat).length, `类别 ${cat} 无篇目`).toBeGreaterThan(0);
    }
  });
});

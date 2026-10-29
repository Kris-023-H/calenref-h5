import { describe, expect, it } from 'vitest';
import { JC_YI, JC_JI, JC_KEYS } from '../../src/data/jc-tables';
import { jianchuName } from '../../src/i18n/engine-text';
import { jianchuOf } from '../../src/engine/rules/jianchu';
import type { CalDate } from '../../src/engine/types';

// 回归测试：建除「宜/忌」查表的 key 与值神汉字必须一致。
// 历史 bug：jianchuOf 返回 name=建除 key（如 'man'），而 JC_YI/JC_JI 以值神汉字（如 '满'）为键，
// 直接 JC_YI[jc.name] 永远 undefined → 首页宜忌渲染成「—」。修复后必须通过。

describe('建除宜忌查表（key → 汉字一致性）', () => {
  it('JC_YI / JC_JI 覆盖全部 12 值神，且以值神汉字为键', () => {
    expect(Object.keys(JC_YI).length).toBe(12);
    expect(Object.keys(JC_JI).length).toBe(12);
    for (const key of JC_KEYS) {
      const char = jianchuName(key, 'zh');
      expect(JC_YI[char], `JC_YI 缺键「${char}」(来自 key=${key})`).toBeDefined();
      expect(JC_YI[char]).not.toBe('');
      expect(JC_JI[char], `JC_JI 缺键「${char}」(来自 key=${key})`).toBeDefined();
      expect(JC_JI[char]).not.toBe('');
    }
  });

  it('首页宜忌取值链路：jianchuOf().name → 汉字 → JC_YI/JC_JI 不再为空', () => {
    const day: CalDate = { y: 2026, m: 10, d: 29 };
    const jc = jianchuOf(day, '经营择日');
    const jcChar = jianchuName(jc.name, 'zh');

    // 旧写法（bug 复现）：用 key 直接查 char 表 → undefined → 渲染「—」
    expect(JC_YI[jc.name]).toBeUndefined();
    expect(JC_JI[jc.name]).toBeUndefined();

    // 修复后：先转汉字再查 → 有值
    expect(JC_YI[jcChar]).toBeDefined();
    expect(JC_JI[jcChar]).toBeDefined();
    expect(JC_YI[jcChar]).not.toBe('—');
    expect(JC_JI[jcChar]).not.toBe('—');
  });

  it('每个建除 key 都能拿到非空宜忌（穷举 12 序）', () => {
    for (let i = 0; i < 12; i++) {
      const key = JC_KEYS[i];
      const char = jianchuName(key, 'zh');
      expect(JC_YI[char], `宜[${key}/${char}]`).toBeTruthy();
      expect(JC_JI[char], `忌[${key}/${char}]`).toBeTruthy();
    }
  });
});

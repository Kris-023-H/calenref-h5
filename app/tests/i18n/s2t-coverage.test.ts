/**
 * tests/i18n/s2t-coverage.test.ts — 字符表覆盖率护栏。
 *
 * 背景：CHARS 最初按 zh.ts 的用字集生成，但组件里还有 300+ 处内联文案（tx 第一参），
 * 它们引入的字不在表内，繁体界面就会残留简体（线上曾出现「農历」「课期与提醒均按此时区」）。
 *
 * 做法：把「真正会经过 s2t 的字」——即 zh.ts 全量 + 所有 tx() 第一参 + 残留三元的中文分支——
 * 预先落成 fixture（tests/fixtures/s2t-expected.json），断言其中每个「有繁体形」的字
 * 经 s2t 后都不再是简体原形。新增文案若引入未映射的字，此测试立即失败。
 *
 * 只断言「是否仍为简体原形」，不断言具体繁体写法，避免异体字（為/爲、淨/凈）争议。
 * fixture 生成：python scripts/gen-s2t-fixture.py（需 opencc-python-reimplemented）。
 */

import { describe, expect, it } from 'vitest';
import need from '../fixtures/s2t-expected.json';
import { s2t } from '../../src/i18n/zh-hant';

/**
 * 有意保持原形的字：
 *   干支 / 北斗 / 时辰等术数专名，字符层不做简化字转换；
 *   采 → 由 PHRASES_POST 在词组层把「納採」改回「納采」。
 */
const KEEP_AS_IS = new Set(['干', '丑', '斗', '采']);

describe('s2t 字符表覆盖率', () => {
  const chars = (need as string[]).filter((c) => !KEEP_AS_IS.has(c));

  it('fixture 规模合理（防止误删或解析失败）', () => {
    expect(chars.length).toBeGreaterThan(200);
  });

  it('每个需要转换的字都能转出繁体（缺映射即失败）', () => {
    const leaked = chars.filter((c) => s2t(c) === c);
    expect(leaked, `字符表缺映射，繁体界面会残留简体：${leaked.join(' ')}`).toEqual([]);
  });

  it('转换结果仍是单个汉字（防止映射表写错成词组）', () => {
    const bad = chars.filter((c) => [...s2t(c)].length !== 1);
    expect(bad, `映射目标应为单字：${bad.join(' ')}`).toEqual([]);
  });

  it('术数专名与一情多义保持原形', () => {
    expect(s2t('干支')).toBe('干支');
    expect(s2t('日干')).toBe('日干');
    expect(s2t('丑时')).toBe('丑時');
    expect(s2t('纳采')).toBe('納采');
  });
});

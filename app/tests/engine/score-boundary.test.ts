/**
 * tests/engine/score-boundary.test.ts — QA 独立补测（严过关）。
 * 覆盖工程师既有用例未断言的计分边界：
 *   score = clamp(round(60 + Σdelta), 30, 99) 的上下限与取整；
 *   gradeOf 四级评定阈值（80 / 86 / 94）；
 *   isEligible 硬忌优先于分数。
 * 依据 PRD §9 #4 与架构 §7.7 / engine/scoring/score.ts。
 */
import { describe, expect, it } from 'vitest';
import { computeScore, gradeOf, isEligible, SCORE_MIN } from '../../src/engine/scoring/score';
import type { LayerResult } from '../../src/engine/types';

function layer(delta: number, key: LayerResult['key'] = 'jianchu'): LayerResult {
  return { key, resultKey: 'x', cls: 'ok', delta };
}

describe('computeScore — clamp(60+Σ, 30, 99) 边界', () => {
  it('空层 → 基数 60', () => {
    expect(computeScore([])).toBe(60);
  });

  it('常量与文档一致：BASE=60 / FLOOR=30 / CEIL=99 / MIN=80', () => {
    expect(SCORE_MIN).toBe(80);
    expect(computeScore([layer(0)])).toBe(60);
  });

  it('上限封顶 99（Σ 远超上限）', () => {
    expect(computeScore([layer(50), layer(50), layer(50)])).toBe(99);
    expect(computeScore([layer(39)])).toBe(99); // 60+39=99 恰好
  });

  it('下限托底 30（Σ 远低于下限）', () => {
    expect(computeScore([layer(-50), layer(-50)])).toBe(30);
    expect(computeScore([layer(-30)])).toBe(30); // 60-30=30 恰好
  });

  it('中间值线性叠加', () => {
    expect(computeScore([layer(10), layer(5), layer(-3)])).toBe(72); // 60+12
  });

  it('取整为四舍五入（round）', () => {
    // delta 为整数，这里验证实现用 round 而非 floor/ceil：用可产生 .5 的组合
    // 60 + 0.5 需 round；但 delta 类型为 number，构造 0.5
    expect(computeScore([layer(0.5)])).toBe(61); // round(60.5)=61
    expect(computeScore([layer(-0.5)])).toBe(60); // round(59.5)=60（银行家舍入外按 JS Math.round）
  });
});

describe('gradeOf — 四级评定阈值', () => {
  it('94 起上吉，86 起中吉，80 起可用，其余不用', () => {
    expect(gradeOf(99)).toBe('shangji');
    expect(gradeOf(94)).toBe('shangji');
    expect(gradeOf(93)).toBe('zhongji');
    expect(gradeOf(86)).toBe('zhongji');
    expect(gradeOf(85)).toBe('keyong');
    expect(gradeOf(80)).toBe('keyong');
    expect(gradeOf(79)).toBe('buyong');
    expect(gradeOf(30)).toBe('buyong');
  });
});

describe('isEligible — 硬忌优先', () => {
  it('无硬忌且分数达阈值才可用', () => {
    expect(isEligible(null, 80)).toBe(true);
    expect(isEligible(null, 99)).toBe(true);
    expect(isEligible(null, 79)).toBe(false);
  });

  it('任一硬忌命中即不可用，与分数无关', () => {
    for (const hard of ['yuepo', 'chongming', 'chongshan', 'lijue', 'fangfu'] as const) {
      expect(isEligible(hard, 99)).toBe(false);
      expect(isEligible(hard, 80)).toBe(false);
    }
  });
});

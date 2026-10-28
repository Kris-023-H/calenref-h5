/**
 * tests/services/timezone.test.ts — 工程师补测（QA Round 1 缺陷 #3 回归）。
 * 首页「今日」按所选时区（settings.tz）取日历日（PRD 验收 #7 时区双口径）：
 *   同一 UTC 时刻，东八区与西八区可归不同日历日；
 *   时区参数为 8 时与 todayCst（东八区口径）完全一致。
 */
import { describe, expect, it } from 'vitest';
import { todayInTz, todayCst } from '../../src/services/timezone';

describe('todayInTz — 「今日」随所选时区变化', () => {
  it('同一时刻不同时区可归不同日历日', () => {
    // 2026-10-31 20:00 UTC：东八区已入 11-01，西八区/零时区仍是 10-31
    const nowMs = Date.UTC(2026, 9, 31, 20, 0, 0);
    expect(todayInTz(nowMs, 8)).toEqual({ y: 2026, m: 11, d: 1 });
    expect(todayInTz(nowMs, -8)).toEqual({ y: 2026, m: 10, d: 31 });
    expect(todayInTz(nowMs, 0)).toEqual({ y: 2026, m: 10, d: 31 });
  });

  it('跨日边界另一侧：UTC 凌晨东八区当日、西八区前一日', () => {
    // 2026-03-01 02:00 UTC：东八区 10:00 当日；西八区前一日 18:00
    const nowMs = Date.UTC(2026, 2, 1, 2, 0, 0);
    expect(todayInTz(nowMs, 8)).toEqual({ y: 2026, m: 3, d: 1 });
    expect(todayInTz(nowMs, -8)).toEqual({ y: 2026, m: 2, d: 28 });
  });

  it('时区 8 与 todayCst（东八区口径）逐刻一致', () => {
    for (const h of [0, 3, 12, 15, 23]) {
      const nowMs = Date.UTC(2026, 5, 15, h, 30, 0);
      expect(todayInTz(nowMs, 8)).toEqual(todayCst(nowMs));
    }
  });

  it('东南亚常用半时区（+7 / +6.5）正常取日', () => {
    const nowMs = Date.UTC(2026, 9, 31, 20, 0, 0);
    expect(todayInTz(nowMs, 7)).toEqual({ y: 2026, m: 11, d: 1 }); // 曼谷 +7 → 11-01 03:00
    expect(todayInTz(nowMs, 6.5)).toEqual({ y: 2026, m: 11, d: 1 }); // 仰光 +6.5 → 11-01 02:30
  });
});

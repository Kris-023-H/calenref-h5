/**
 * tests/services/timezone-dst.test.ts — v3.7 出海版夏令时专项。
 * 欧美时区（纽约/伦敦/巴黎/悉尼）冬夏偏移经 IANA + Intl 自动切换，
 * 无夏令时时区（北京/东京/曼谷/迪拜）保持固定偏移。
 */
import { describe, expect, it } from 'vitest';
import { tzOffsetAt, todayInTz, TZ_IANA } from '../../src/services/timezone';

describe('时区映射 — 18 区覆盖欧美', () => {
  it('欧美主要城市时区都有 IANA 映射', () => {
    for (const tz of [-8, -5, -3, 0, 1, 10, 12]) {
      expect(TZ_IANA[tz], `缺少 UTC${tz} 的 IANA 映射`).toBeTruthy();
    }
  });

  it('半时区（+5:30 / +5:45 / +6:30）保留', () => {
    for (const tz of [5.5, 5.75, 6.5]) {
      expect(TZ_IANA[tz]).toBeTruthy();
    }
  });
});

describe('tzOffsetAt — 夏令时自动切换', () => {
  it('纽约：冬季 UTC−5，夏季 UTC−4', () => {
    const winter = Date.UTC(2026, 0, 15, 12, 0, 0); // 1 月
    const summer = Date.UTC(2026, 6, 15, 12, 0, 0); // 7 月
    expect(tzOffsetAt(winter, -5)).toBe(-5);
    expect(tzOffsetAt(summer, -5)).toBe(-4);
  });

  it('伦敦：冬季 UTC+0，夏季 UTC+1', () => {
    expect(tzOffsetAt(Date.UTC(2026, 0, 15, 12), 0)).toBe(0);
    expect(tzOffsetAt(Date.UTC(2026, 6, 15, 12), 0)).toBe(1);
  });

  it('巴黎：冬季 UTC+1，夏季 UTC+2', () => {
    expect(tzOffsetAt(Date.UTC(2026, 0, 15, 12), 1)).toBe(1);
    expect(tzOffsetAt(Date.UTC(2026, 6, 15, 12), 1)).toBe(2);
  });

  it('无夏令时时区全年固定（北京 / 东京 / 曼谷 / 迪拜）', () => {
    for (const [tz, expected] of [[8, 8], [9, 9], [7, 7], [4, 4]]) {
      expect(tzOffsetAt(Date.UTC(2026, 0, 15, 12), tz)).toBe(expected);
      expect(tzOffsetAt(Date.UTC(2026, 6, 15, 12), tz)).toBe(expected);
    }
  });
});

describe('todayInTz — 夏令时下的「今日」', () => {
  it('纽约夏令时：UTC 凌晨归到前一日（偏移 −4）', () => {
    // 2026-07-01 03:00 UTC → 纽约 EDT 06-30 23:00，仍是 6-30
    const now = Date.UTC(2026, 6, 1, 3, 0, 0);
    expect(todayInTz(now, -5)).toEqual({ y: 2026, m: 6, d: 30 });
  });

  it('纽约冬令时：同一 UTC 时刻偏移 −5，仍归前一日但钟点更早', () => {
    // 2026-01-01 03:00 UTC → 纽约 EST 01-01 前夜 22:00（12-31）
    const now = Date.UTC(2026, 0, 1, 3, 0, 0);
    expect(todayInTz(now, -5)).toEqual({ y: 2025, m: 12, d: 31 });
  });
});

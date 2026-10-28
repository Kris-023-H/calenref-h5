import { describe, expect, it } from 'vitest';
import {
  addDays,
  compareDate,
  dayOfWeek,
  dayOfYear,
  formatDate,
  gregorianToJDN,
  jdnToGregorian,
  parseDate,
} from '../../src/engine/calendar/julian';

describe('julian — 公历 ↔ 儒略日数', () => {
  it('JDN 锚点：J2000.0 = 2000-01-01 12:00 TT → JDN 2451545', () => {
    expect(gregorianToJDN(2000, 1, 1)).toBe(2451545);
    expect(gregorianToJDN(1987, 1, 1)).toBe(2446797); // 距 J2000 4748 天（含 3 闰）
    expect(gregorianToJDN(1900, 1, 1)).toBe(2415021);
  });

  it('往返换算：1900–2100 抽样无损', () => {
    for (const [y, m, d] of [
      [1900, 1, 1], [1900, 2, 28], [2000, 2, 29], [2024, 12, 31],
      [2026, 10, 24], [2100, 12, 31], [2000, 1, 1], [1999, 12, 31],
    ]) {
      const back = jdnToGregorian(gregorianToJDN(y, m, d));
      expect(back).toEqual({ y, m, d });
    }
  });

  it('连续 30 年逐日往返（回归 Richards 算法边界）', () => {
    let d = { y: 2020, m: 1, d: 1 };
    for (let i = 0; i < 365 * 30; i++) {
      const back = jdnToGregorian(gregorianToJDN(d.y, d.m, d.d));
      expect(back.y).toBe(d.y);
      expect(back.m).toBe(d.m);
      expect(back.d).toBe(d.d);
      d = addDays(d, 1);
    }
  });

  it('星期：2024-03-01 是星期五（getDay = 5）', () => {
    expect(dayOfWeek({ y: 2024, m: 3, d: 1 })).toBe(5);
    expect(dayOfWeek({ y: 2000, m: 1, d: 1 })).toBe(6); // 周六
  });

  it('addDays 跨闰年 / 跨年 / 跨世纪', () => {
    expect(addDays({ y: 2024, m: 2, d: 28 }, 1)).toEqual({ y: 2024, m: 2, d: 29 });
    expect(addDays({ y: 2023, m: 2, d: 28 }, 1)).toEqual({ y: 2023, m: 3, d: 1 });
    expect(addDays({ y: 2026, m: 12, d: 31 }, 1)).toEqual({ y: 2027, m: 1, d: 1 });
    expect(addDays({ y: 2000, m: 2, d: 28 }, 1)).toEqual({ y: 2000, m: 2, d: 29 });
    expect(addDays({ y: 1900, m: 2, d: 28 }, 1)).toEqual({ y: 1900, m: 3, d: 1 }); // 1900 非闰
  });

  it('年内第几天', () => {
    expect(dayOfYear({ y: 2026, m: 1, d: 1 })).toBe(1);
    expect(dayOfYear({ y: 2026, m: 12, d: 31 })).toBe(365);
    expect(dayOfYear({ y: 2024, m: 12, d: 31 })).toBe(366);
  });

  it('compareDate 三态', () => {
    expect(compareDate({ y: 2026, m: 1, d: 1 }, { y: 2026, m: 1, d: 2 })).toBe(-1);
    expect(compareDate({ y: 2026, m: 1, d: 2 }, { y: 2026, m: 1, d: 1 })).toBe(1);
    expect(compareDate({ y: 2026, m: 1, d: 1 }, { y: 2026, m: 1, d: 1 })).toBe(0);
  });

  it('parse / format 互逆', () => {
    expect(parseDate('2026-10-24')).toEqual({ y: 2026, m: 10, d: 24 });
    expect(formatDate({ y: 2026, m: 10, d: 4 })).toBe('2026-10-04');
  });
});

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { solarTermMoment, termIndexOfDate, isBeforeTerm, SOLAR_TERMS, LI_JUE_TERMS } from '../../src/engine/calendar/solar-terms';
import { formatDate, gregorianToJDN } from '../../src/engine/calendar/julian';

/** 对拍数据集：scripts/gen_solar_fixture.py 生成（lunar-python 寿星天文历） */
interface FixtureRow {
  year: number;
  index: number;
  name: string;
  date: string;
  minutes: number;
}

function loadFixture(): FixtureRow[] {
  const raw = readFileSync(join(process.cwd(), 'tests', 'fixtures', 'solar-terms-1900-2100.csv'), 'utf-8');
  const lines = raw.trim().split('\n').slice(1);
  return lines.map((line) => {
    const [year, index, name, date, minutes] = line.split(',');
    return { year: Number(year), index: Number(index), name, date, minutes: Number(minutes) };
  });
}

const FIXTURE = loadFixture();

/** 二十四节气中文名（日历序，自小寒起） */
const TERM_NAMES = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑',
  '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
];

/** 术语 key 拼音（与 glossary.ts 一致） */
const PINYIN = [
  'xiaohan', 'dahan', 'lichun', 'yushui', 'jingzhe', 'chunfen', 'qingming', 'guyu',
  'lixia', 'xiaoman', 'mangzhong', 'xiazhi', 'xiaoshu', 'dashu', 'liqiu', 'chushu',
  'bailu', 'qiufen', 'hanlu', 'shuangjiang', 'lidong', 'xiaoxue', 'daxue', 'dongzhi',
];

describe('solar-terms — 节气交接时刻（1900–2100 全量对拍）', () => {
  it('数据集完整：201 年 × 24 节气', () => {
    expect(FIXTURE).toHaveLength(201 * 24);
  });

  it('SOLAR_TERMS 表与数据集节气名同序同 idx', () => {
    const firstYear = FIXTURE.filter((r) => r.year === 2026);
    expect(firstYear.map((r) => r.name)).toEqual(TERM_NAMES);
    expect(firstYear.map((r) => r.index)).toEqual(TERM_NAMES.map((_, i) => i));
    for (const def of SOLAR_TERMS) {
      expect(def.key).toBe(`term.jq.${PINYIN[def.index]}`);
    }
  });

  it('逐条对拍：交接时刻偏差 ≤ 20 分钟（1900–2100 全量 4824 项）', () => {
    // 引擎为 Meeus 截断级数，与寿星天文历互为独立算法；日级判定足够，分钟级容差 20
    let maxDiff = 0;
    let maxAt = '';
    for (const row of FIXTURE) {
      const m = solarTermMoment(row.year, row.index);
      const [fy, fm, fd] = row.date.split('-').map(Number);
      const fixAbs = gregorianToJDN(fy, fm, fd) * 1440 + row.minutes;
      const engAbs = gregorianToJDN(m.date.y, m.date.m, m.date.d) * 1440 + m.minutes;
      const diff = Math.abs(engAbs - fixAbs);
      if (diff > maxDiff) {
        maxDiff = diff;
        maxAt = `${row.year} ${row.name}`;
      }
    }
    expect(maxDiff).toBeLessThanOrEqual(20);
    expect(maxAt).toBeTruthy();
  });

  it('节气月界日不受分钟级误差影响（小寒/立春界日稳定）', () => {
    // 2026-02-04 立春 04:02：界日前后月建稳定
    expect(termIndexOfDate({ y: 2026, m: 2, d: 4 }).monthZhi).toBe(2); // 寅月
    expect(termIndexOfDate({ y: 2026, m: 2, d: 3 }).monthZhi).toBe(1); // 丑月
    // 2026-01-05 小寒 16:23：界日当天即入丑月
    expect(termIndexOfDate({ y: 2026, m: 1, d: 5 }).monthZhi).toBe(1);
    expect(termIndexOfDate({ y: 2026, m: 1, d: 4 }).monthZhi).toBe(0); // 子月
  });

  it('已知节气日期抽查（与权威口径 / 对拍集一致）', () => {
    // 2026 年节气（东八区）
    expect(formatDate(solarTermMoment(2026, 2).date)).toBe('2026-02-04'); // 立春
    expect(formatDate(solarTermMoment(2026, 8).date)).toBe('2026-05-05'); // 立夏
    expect(formatDate(solarTermMoment(2026, 20).date)).toBe('2026-11-07'); // 立冬
    expect(formatDate(solarTermMoment(2026, 23).date)).toBe('2026-12-22'); // 冬至 04:48
    // 2024 立春 16:27 前后
    const lichun2024 = solarTermMoment(2024, 2);
    expect(formatDate(lichun2024.date)).toBe('2024-02-04');
    expect(lichun2024.minutes).toBeGreaterThan(15 * 60);
    expect(lichun2024.minutes).toBeLessThan(17 * 60);
  });

  it('节气月判定：以「节」为界', () => {
    // 2026-11-06 仍属戌月（立冬前一日），11-07 起亥月
    expect(termIndexOfDate({ y: 2026, m: 11, d: 6 }).monthZhi).toBe(10);
    expect(termIndexOfDate({ y: 2026, m: 11, d: 7 }).monthZhi).toBe(11);
    // 2026-10-31 属戌月
    expect(termIndexOfDate({ y: 2026, m: 10, d: 31 }).monthZhi).toBe(10);
    // 2027-01-05 小寒起丑月（2027 小寒为 1 月 5 日）
    expect(termIndexOfDate({ y: 2027, m: 1, d: 4 }).monthZhi).toBe(0); // 子月
    expect(termIndexOfDate({ y: 2027, m: 1, d: 5 }).monthZhi).toBe(1); // 丑月
    // 2026-02-03 立春前仍属丑月（小寒后、立春前）
    expect(termIndexOfDate({ y: 2026, m: 2, d: 3 }).monthZhi).toBe(1);
    // 1 月 1–5 日归上年大雪月（子月）
    expect(termIndexOfDate({ y: 2026, m: 1, d: 3 }).monthZhi).toBe(0);
  });

  it('四离四绝：二分二至与四立前一日', () => {
    // 2026 立冬 11-07 → 前一日 11-06 为「绝」
    expect(isBeforeTerm({ y: 2026, m: 11, d: 6 }, 20)).toBe(true);
    expect(isBeforeTerm({ y: 2026, m: 11, d: 5 }, 20)).toBe(false);
    // 2026 冬至 12-22 → 前一日 12-21 为「离」
    expect(isBeforeTerm({ y: 2026, m: 12, d: 21 }, 23)).toBe(true);
    expect(isBeforeTerm({ y: 2026, m: 12, d: 20 }, 23)).toBe(false);
    // 八节表：四离（二分二至）+ 四绝（四立）
    expect(LI_JUE_TERMS.filter((t) => t.kind === 'li')).toHaveLength(4);
    expect(LI_JUE_TERMS.filter((t) => t.kind === 'jue')).toHaveLength(4);
  });

  it('边界年：1900 与 2100 首末节气可解', () => {
    const first = solarTermMoment(1900, 0);
    expect(first.date.y).toBe(1900);
    const last = solarTermMoment(2100, 23);
    expect(last.date.y).toBe(2100);
  });
});

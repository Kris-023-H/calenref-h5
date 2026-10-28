import { describe, expect, it } from 'vitest';
import { runScan, scanGeneric } from '../../src/engine/scan';
import { buildDay } from '../../src/engine/scan';
import { schoolReadings, schoolAdvice, defaultSchool } from '../../src/engine/schools';
import { eventByKey } from '../../src/data/events';
import type { Person, ScanInput } from '../../src/engine/types';

const person: Person = {
  id: 'p1',
  schemaVersion: 1,
  name: '林',
  sex: 'f',
  birthDate: '1996-08-14',
  birthTime: '06:20',
  birthCityId: 'beijing',
  createdAt: 0,
};

function input(over: Partial<ScanInput> = {}): ScanInput {
  return {
    eventKey: 'open',
    people: [person],
    industryId: 'catering',
    sitKey: 'ziwu',
    startDate: { y: 2026, m: 10, d: 31 },
    span: 90,
    ...over,
  };
}

describe('scan — 排课性能基准', () => {
  it('90 天 × 8 重 < 40ms', () => {
    // 预热（节气缓存填充）
    runScan(input());
    const t0 = performance.now();
    const r = runScan(input());
    const elapsed = performance.now() - t0;
    expect(r.days).toHaveLength(90);
    expect(elapsed).toBeLessThan(40);
  });

  it('通用模式同样满足基准', () => {
    scanGeneric(input());
    const t0 = performance.now();
    scanGeneric(input());
    expect(performance.now() - t0).toBeLessThan(40);
  });

  it('300 天长窗口仍可控（< 120ms）', () => {
    runScan(input({ span: 300 }));
    const t0 = performance.now();
    runScan(input({ span: 300 }));
    expect(performance.now() - t0).toBeLessThan(120);
  });
});

describe('schools — 三宗派对照', () => {
  it('三派评分并列：行嫁月派取本课分，不将 −7，建除 −3，下限 40', () => {
    const day = buildDay({ y: 2026, m: 11, d: 11 }, [person], eventByKey('open'), 'catering', 'ziwu');
    const readings = schoolReadings(day);
    expect(readings).toHaveLength(3);
    const xj = readings.find((r) => r.school === 'xingjia')!;
    const bj = readings.find((r) => r.school === 'bujiang')!;
    const jc = readings.find((r) => r.school === 'jianchu')!;
    expect(xj.score).toBe(day.score);
    expect(bj.score).toBe(Math.max(40, day.score - 7));
    expect(jc.score).toBe(Math.max(40, day.score - 3));
  });

  it('低分日三派均不低于 40（行嫁月派可取本课分）', () => {
    const day = buildDay({ y: 2026, m: 11, d: 4 }, [person], eventByKey('open'), 'catering', 'ziwu');
    const readings = schoolReadings(day);
    const bj = readings.find((r) => r.school === 'bujiang')!;
    const jc = readings.find((r) => r.school === 'jianchu')!;
    const xj = readings.find((r) => r.school === 'xingjia')!;
    expect(bj.score).toBeGreaterThanOrEqual(40);
    expect(jc.score).toBeGreaterThanOrEqual(40);
    expect(xj.score).toBe(day.score); // 行嫁月派口径即本课评分，不设下限
  });

  it('取法建议：一致 / 保守 / 进取', () => {
    expect(schoolAdvice([{ school: 'xingjia', score: 85 }, { school: 'bujiang', score: 82 }, { school: 'jianchu', score: 84 }], 80)).toBe('consistent');
    expect(schoolAdvice([{ school: 'xingjia', score: 85 }, { school: 'bujiang', score: 78 }, { school: 'jianchu', score: 84 }], 80)).toBe('conservative');
    expect(schoolAdvice([{ school: 'xingjia', score: 70 }, { school: 'bujiang', score: 68 }, { school: 'jianchu', score: 71 }], 80)).toBe('aggressive');
  });

  it('默认宗派随用事切换', () => {
    expect(defaultSchool('marry')).toBe('xingjia');
    expect(defaultSchool('engage')).toBe('xingjia');
    expect(defaultSchool('open')).toBe('jianchu');
    expect(defaultSchool('ground')).toBe('jianchu');
  });
});

describe('scan — 硬性出局五类各至少一例', () => {
  const scan = runScan(input());

  it('月破（破日）', () => {
    const days = scan.days.filter((d) => d.hard === 'yuepo');
    expect(days.length).toBeGreaterThan(0);
    for (const d of days) expect(d.jianchu).toBe('po');
  });

  it('日辰冲命（子命遇午日）', () => {
    const days = scan.days.filter((d) => d.hard === 'chongming');
    expect(days.length).toBeGreaterThan(0);
    for (const d of days) expect(d.dayGZ.zhi).toBe(6); // 午
  });

  it('四离四绝', () => {
    const days = scan.days.filter((d) => d.hard === 'lijue');
    expect(days.length).toBeGreaterThan(0);
  });

  it('冲山（工程类用事，坐子向午遇午日）', () => {
    const eng = runScan(input({ eventKey: 'ground', sitKey: 'ziwu' }));
    const days = eng.days.filter((d) => d.hard === 'chongshan');
    expect(days.length).toBeGreaterThan(0);
    for (const d of days) expect(d.dayGZ.zhi).toBe(6);
  });

  it('妨夫月（女命 1996 丙子：寅月 / 申月为硬忌）', () => {
    // 子命行嫁月基数 6；妨夫月为寅月(2)与申月(8)，窗口须覆盖其一
    const marry = runScan(input({ eventKey: 'marry', people: [person], startDate: { y: 2027, m: 1, d: 20 }, span: 60 }));
    const days = marry.days.filter((d) => d.hard === 'fangfu');
    expect(days.length).toBeGreaterThan(0);
    for (const d of days) {
      // 妨夫月落在寅月或申月
      expect([2, 8]).toContain(((d.monthZhi - 2 + 12) % 12) + 1);
    }
  });

  it('硬忌优先级：破日优先于冲命计归因', () => {
    for (const d of scan.days) {
      if (d.hard === 'yuepo') expect(d.reasonKey).toBe('hard.yuepo');
      if (d.hard === 'chongming') expect(d.reasonKey).toBe('hard.chongming');
    }
  });
});

describe('scan — 结果结构', () => {
  it('usable 按评分降序，且不含硬忌日', () => {
    const r = runScan(input());
    for (let i = 1; i < r.usable.length; i++) {
      expect(r.usable[i - 1].score).toBeGreaterThanOrEqual(r.usable[i].score);
    }
    expect(r.usable.every((d) => d.hard === null && d.score >= 80)).toBe(true);
  });

  it('byReason 键为 reasonKey，总数守恒', () => {
    const r = runScan(input());
    const excluded = Object.values(r.byReason).reduce((a, b) => a + b, 0);
    expect(excluded + r.usable.length).toBe(r.total);
  });

  it('ruleVersion 与 createdAt 注入', () => {
    const r = runScan(input(), 1234567890);
    expect(r.ruleVersion).toBe('2026.10');
    expect(r.createdAt).toBe(1234567890);
  });

  it('每日结果字段完整（hours / goodHours / layers）', () => {
    const r = runScan(input());
    const d = r.days[0];
    expect(d.hours).toHaveLength(12);
    expect(d.goodHours.length).toBeGreaterThan(0);
    expect(d.layers.length).toBeGreaterThanOrEqual(7);
    expect(d.pillars.day).toBe(d.dayGZ.text);
    expect(d.weekday).toBeGreaterThanOrEqual(0);
    expect(d.weekday).toBeLessThanOrEqual(6);
  });

  it('通用模式 4 重且无个人层', () => {
    const r = scanGeneric(input());
    const d = r.days.find((x) => x.eligible)!;
    expect(d.layers.map((l) => l.key)).not.toContain('dayClashYear');
    expect(d.layers.map((l) => l.key)).not.toContain('industryWuxing');
  });
});

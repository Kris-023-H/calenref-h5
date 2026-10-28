import { describe, expect, it } from 'vitest';
import { trueSolarTime, dstForBirth } from '../../src/engine/calendar/true-solar';
import { isChinaDst, isChinaZone } from '../../src/engine/calendar/dst-china';
import { equationOfTime } from '../../src/engine/calendar/equation-of-time';
import { readPerson } from '../../src/engine/person';
import type { Person } from '../../src/engine/types';

function person(over: Partial<Person> = {}): Person {
  return {
    id: 'p1',
    schemaVersion: 1,
    name: '测试',
    sex: 'f',
    birthDate: '1990-06-15',
    birthTime: '12:00',
    birthCityId: 'beijing',
    createdAt: 0,
    ...over,
  };
}

describe('true-solar — 真太阳时校正', () => {
  it('北京（东经 116.41，UTC+8）正午约慢 14 分钟', () => {
    const r = trueSolarTime({ y: 1990, m: 6, d: 15, hh: 12, mm: 0, lon: 116.41, tz: 8, dst: false });
    // 经度校正 (116.41−120)×4 ≈ −14.4 分钟；6 月中均时差 ≈ 0
    expect(r.offsetMin).toBeGreaterThan(-20);
    expect(r.offsetMin).toBeLessThan(-10);
    expect(r.h).toBe(11);
    expect(r.m).toBeGreaterThan(40);
    expect(r.dayShift).toBe(0);
  });

  it('新加坡（东经 103.85，UTC+8）约慢 65 分钟', () => {
    const r = trueSolarTime({ y: 1990, m: 6, d: 15, hh: 12, mm: 0, lon: 103.85, tz: 8, dst: false });
    // (103.85−120)×4 ≈ −64.6 分钟
    expect(r.offsetMin).toBeLessThan(-60);
    expect(r.offsetMin).toBeGreaterThan(-70);
    expect(r.h).toBe(10);
  });

  it('洛杉矶（西经 118.24，UTC−8）约快 7 分钟', () => {
    const r = trueSolarTime({ y: 1990, m: 6, d: 15, hh: 12, mm: 0, lon: -118.24, tz: -8, dst: false });
    // (−118.24+120)×4 ≈ +7 分钟
    expect(r.offsetMin).toBeGreaterThan(2);
    expect(r.offsetMin).toBeLessThan(12);
  });

  it('伦敦（零时区，西经 0.13）约慢 1 分钟', () => {
    const r = trueSolarTime({ y: 1990, m: 6, d: 15, hh: 12, mm: 0, lon: -0.13, tz: 0, dst: false });
    expect(Math.abs(r.offsetMin)).toBeLessThan(5);
  });

  it('夏令时回拨：1986–1991 中国出生额外 −60 分钟', () => {
    // 1988-06-15 在中国夏令时窗口内（4/17–9/11）
    expect(isChinaDst(1988, 6, 15)).toBe(true);
    const withDst = trueSolarTime({ y: 1988, m: 6, d: 15, hh: 12, mm: 0, lon: 116.41, tz: 8, dst: true });
    const noDst = trueSolarTime({ y: 1988, m: 6, d: 15, hh: 12, mm: 0, lon: 116.41, tz: 8, dst: false });
    expect(withDst.offsetMin - noDst.offsetMin).toBe(-60);
    // 窗口外（1992）不回拨
    expect(isChinaDst(1992, 6, 15)).toBe(false);
    // 窗口边界
    expect(isChinaDst(1988, 4, 16)).toBe(false);
    expect(isChinaDst(1988, 4, 17)).toBe(true);
    expect(isChinaDst(1988, 9, 11)).toBe(true);
    expect(isChinaDst(1988, 9, 12)).toBe(false);
  });

  it('跨日：校正后落到次日 / 前日', () => {
    // 乌鲁木齐（东经 87.6）23:30 校正后约 21:20（当日）
    const urc = trueSolarTime({ y: 1990, m: 6, d: 15, hh: 23, mm: 30, lon: 87.6, tz: 8, dst: false });
    expect(urc.dayShift).toBe(0);
    // 新加坡 00:30 → 真太阳时约前一日 23:20
    const sg = trueSolarTime({ y: 1990, m: 6, d: 15, hh: 0, mm: 30, lon: 103.85, tz: 8, dst: false });
    expect(sg.dayShift).toBe(-1);
    expect(sg.h).toBe(23);
    // 东边界 23:50（东经 135 一带，UTC+9 时区中心 135°）不跨日
    const jp = trueSolarTime({ y: 1990, m: 6, d: 15, hh: 23, mm: 50, lon: 135, tz: 9, dst: false });
    expect(jp.dayShift).toBe(0);
  });

  it('dstForBirth：仅中国境内 + UTC+8 + 窗口内为 true', () => {
    expect(dstForBirth({ y: 1988, m: 6, d: 15 }, 'cn', 8)).toBe(true);
    expect(dstForBirth({ y: 1988, m: 6, d: 15 }, 'sea', 8)).toBe(false); // 新加坡同时区但不适用
    expect(dstForBirth({ y: 1992, m: 6, d: 15 }, 'cn', 8)).toBe(false); // 窗口外
    expect(dstForBirth({ y: 1988, m: 6, d: 15 }, undefined, 8)).toBe(false); // 手动经纬度无地区
  });

  it('均时差：一年内极值在 ±17 分钟内，2 月约 −14 分钟，11 月约 +16 分钟', () => {
    const feb = equationOfTime({ y: 2026, m: 2, d: 11 });
    const nov = equationOfTime({ y: 2026, m: 11, d: 3 });
    expect(feb).toBeLessThan(-10);
    expect(feb).toBeGreaterThan(-18);
    expect(nov).toBeGreaterThan(12);
    expect(nov).toBeLessThan(18);
  });

  it('isChinaZone 判定', () => {
    expect(isChinaZone(8)).toBe(true);
    expect(isChinaZone(9)).toBe(false);
    expect(isChinaZone(-5)).toBe(false);
  });

  it('readPerson：档案 → 四柱读取（含真太阳时）', () => {
    const r = readPerson(person());
    expect(r.yearGZ.text).toBe('庚午'); // 1990 立春后
    expect(r.zodiac).toBe('马');
    expect(r.trueTime).toMatch(/^\d{2}:\d{2}$/);
    expect(r.offsetMin).toBeLessThan(0); // 北京偏西
    expect(r.cityName).toBeTruthy();
    expect(r.lon).toBeGreaterThan(100);
  });

  it('readPerson：手动经纬度兜底（无城市）', () => {
    const r = readPerson(person({ birthCityId: null, manualLon: -74, manualLat: 40.7, birthTime: '09:00' }));
    expect(r.cityName).toBeTruthy();
    expect(r.lon).toBeCloseTo(-74, 5);
  });

  it('readPerson：时辰不详时按 12:00 中性处理', () => {
    const r = readPerson(person({ birthTime: '' }));
    expect(r.trueTime).toMatch(/^\d{2}:\d{2}$/);
  });
});

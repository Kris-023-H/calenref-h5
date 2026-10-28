/**
 * tests/engine/overseas-true-solar.test.ts — QA 独立补测（严过关）。
 * 任务点名「真太阳时跨日与海外经度（温哥华/新加坡）」：
 *   温哥华（西经 123.12，UTC−8）经度校正约 −12 分钟；
 *   新加坡（东经 103.82，UTC+8）凌晨出生跨前一日；
 *   readPerson 端到端用温哥华档案读四柱（真太阳时重算而非存结果）。
 * 依据 PRD §7.2 / T02 验收。
 */
import { describe, expect, it } from 'vitest';
import { trueSolarTime } from '../../src/engine/calendar/true-solar';
import { readPerson } from '../../src/engine/person';
import { CITIES, cityById } from '../../src/data/cities';
import type { Person } from '../../src/engine/types';

describe('overseas true-solar — 海外经度与跨日', () => {
  it('温哥华（−123.12, UTC−8）正午约慢 12 分钟', () => {
    const van = cityById('vancouver')!;
    expect(van.lon).toBeCloseTo(-123.12, 2);
    expect(van.tz).toBe(-8);
    const r = trueSolarTime({ y: 1990, m: 6, d: 15, hh: 12, mm: 0, lon: van.lon, tz: van.tz, dst: false });
    // (−123.12 − (−120))×4 ≈ −12.5 分钟；6 月中均时差≈0
    expect(r.offsetMin).toBeGreaterThan(-18);
    expect(r.offsetMin).toBeLessThan(-6);
    expect(r.h).toBe(11);
    expect(r.dayShift).toBe(0);
  });

  it('新加坡（103.82, UTC+8）00:30 真太阳时落前一日 23 时', () => {
    const sg = cityById('singapore')!;
    expect(sg.lon).toBeCloseTo(103.82, 2);
    const r = trueSolarTime({ y: 1990, m: 6, d: 15, hh: 0, mm: 30, lon: sg.lon, tz: sg.tz, dst: false });
    expect(r.dayShift).toBe(-1);
    expect(r.h).toBe(23);
  });

  it('温哥华深夜 23:40 不跨日（西八区偏离时区中心仅 −3°）', () => {
    const r = trueSolarTime({ y: 1990, m: 6, d: 15, hh: 23, mm: 40, lon: -123.12, tz: -8, dst: false });
    expect(r.dayShift).toBe(0);
  });

  it('readPerson：温哥华档案端到端读取（含真太阳时与年柱）', () => {
    const p: Person = {
      id: 'van1',
      schemaVersion: 1,
      name: '海外',
      sex: 'm',
      birthDate: '1990-06-15',
      birthTime: '12:00',
      birthCityId: 'vancouver',
      createdAt: 0,
    };
    const r = readPerson(p);
    expect(r.cityName).toBeTruthy();
    expect(r.lon).toBeCloseTo(-123.12, 2);
    expect(r.offsetMin).toBeLessThan(0); // 温哥华在时区中心以西
    expect(r.trueTime).toMatch(/^\d{2}:\d{2}$/);
    expect(r.yearGZ.text).toBe('庚午'); // 1990 立春后属马
  });

  it('PRD §7.2 点名的海外城市全部在表且经度非零预填', () => {
    // PRD §7.2 明确列举的海外华人聚居城市（须逐一在场）
    const named = [
      'singapore', 'kualalumpur', 'penang', 'bangkok', 'chiangmai', 'jakarta', 'surabaya',
      'hochiminh', 'hanoi', 'manila', 'vancouver', 'toronto', 'calgary', 'sanfrancisco',
      'losangeles', 'sandiego', 'seattle', 'newyork', 'boston', 'houston', 'chicago',
      'london', 'manchester', 'sydney', 'melbourne', 'auckland',
    ];
    for (const id of named) {
      const c = cityById(id);
      expect(c, `缺失城市 ${id}`).not.toBeNull();
      expect(typeof c!.lon).toBe('number');
      expect(Number.isFinite(c!.lon)).toBe(true);
    }
  });

  it('海外城市数量记录（PRD 约 40；实测非国内条数）', () => {
    const overseas = CITIES.filter((c) => c.region !== 'cn');
    // 说明：实测非国内 37 城（含日韩 ea 5），略低于 PRD「约 40」表述；
    // 但 §7.2 点名城市已全部覆盖（见上条）。此处记录实际规模，不作硬性 40 断言。
    expect(overseas.length).toBeGreaterThanOrEqual(30);
    expect(overseas.length).toBeLessThanOrEqual(45);
  });
});

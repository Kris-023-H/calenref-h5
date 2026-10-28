/**
 * engine/person.ts — 当事人读取：真太阳时 + 年命四柱（读取时重算，禁存结果）。
 * 档案只存原始钟表时刻 + 出生地；出生地不在城市表时用手动经纬度兜底。
 */

import type { CalDate, Person, PersonReading } from './types';
import { cityById } from '../data/cities';
import { yearGZ, ZODIAC } from './calendar/sexagenary';
import { addDays } from './calendar/julian';
import { trueSolarTime, dstForBirth } from './calendar/true-solar';

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

/** 解析 'HH:mm' */
function parseTime(t: string): { hh: number; mm: number } {
  const [hh, mm] = (t || '12:00').split(':').map(Number);
  return { hh: hh || 0, mm: mm || 0 };
}

/** 出生地经度与时区（城市表优先，手动经纬度兜底；时区仅用于显示与夏令时判定） */
export function birthGeo(p: Person): { lon: number; tz: number; cityName: string; region?: string } {
  const c = cityById(p.birthCityId);
  if (c) return { lon: c.lon, tz: c.tz, cityName: c.zh, region: c.region };
  if (typeof p.manualLon === 'number' && Number.isFinite(p.manualLon)) {
    return { lon: p.manualLon, tz: Math.round(p.manualLon / 15), cityName: `${p.manualLon.toFixed(1)}°E` };
  }
  return { lon: 116.41, tz: 8, cityName: '北京', region: 'cn' };
}

export function readPerson(p: Person): PersonReading {
  const [y, m, d] = p.birthDate.split('-').map(Number);
  const { hh, mm } = parseTime(p.birthTime);
  const geo = birthGeo(p);
  const dst =
    p.dstAdjusted !== undefined
      ? p.dstAdjusted && dstForBirth({ y, m, d }, geo.region, geo.tz)
      : dstForBirth({ y, m, d }, geo.region, geo.tz);
  const ts = trueSolarTime({ y, m, d, hh, mm, lon: geo.lon, tz: geo.tz, dst });
  const shifted: CalDate = ts.dayShift === 0 ? { y, m, d } : addDays({ y, m, d }, ts.dayShift);
  const yg = yearGZ(shifted);
  return {
    name: p.name || '当事人',
    raw: `${p.birthDate} ${pad(hh)}:${pad(mm)}`,
    cityName: geo.cityName,
    lon: geo.lon,
    tz: geo.tz,
    trueTime: `${pad(ts.h)}:${pad(ts.m)}`,
    offsetMin: ts.offsetMin,
    dayShift: ts.dayShift,
    dst,
    sex: p.sex,
    y: shifted.y,
    m: shifted.m,
    d: shifted.d,
    hh,
    mm,
    yearGZ: yg,
    ganIdx: yg.gan,
    zhiIdx: yg.zhi,
    zodiac: ZODIAC[yg.zhi],
  };
}

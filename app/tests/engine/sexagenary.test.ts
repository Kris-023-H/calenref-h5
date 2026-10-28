import { describe, expect, it } from 'vitest';
import {
  GAN,
  ZHI,
  ganzhiOfIndex,
  hourGZ,
  hourZhiOf,
  makeGZ,
  dayGZ,
  monthGZ,
  yearGZ,
} from '../../src/engine/calendar/sexagenary';
import { addDays } from '../../src/engine/calendar/julian';
import { fourPillarsOf } from '../../src/engine/pillars';
import { buildDay } from '../../src/engine/scan';
import { eventByKey } from '../../src/data/events';

describe('sexagenary — 四柱干支', () => {
  it('六十甲子序：甲子=0，乙丑=1，癸亥=59', () => {
    expect(ganzhiOfIndex(0).text).toBe('甲子');
    expect(ganzhiOfIndex(1).text).toBe('乙丑');
    expect(ganzhiOfIndex(59).text).toBe('癸亥');
    expect(ganzhiOfIndex(60).text).toBe('甲子'); // 循环
    expect(ganzhiOfIndex(-1).text).toBe('癸亥');
  });

  it('makeGZ 解同余方程', () => {
    const gz = makeGZ(0, 0);
    expect(gz.text).toBe('甲子');
    expect(gz.index).toBe(0);
    expect(makeGZ(9, 11).text).toBe('癸亥');
  });

  it('日柱锚点（与 lunar-python 寿星天文历对拍）', () => {
    expect(dayGZ({ y: 1949, m: 10, d: 1 }).text).toBe('甲子'); // 开国日，史载甲子日
    expect(dayGZ({ y: 2000, m: 1, d: 1 }).text).toBe('戊午');
    expect(dayGZ({ y: 2024, m: 2, d: 10 }).text).toBe('甲辰');
    expect(dayGZ({ y: 2026, m: 10, d: 24 }).text).toBe('辛未');
    expect(dayGZ({ y: 2026, m: 10, d: 31 }).text).toBe('戊寅');
    expect(dayGZ({ y: 2026, m: 11, d: 7 }).text).toBe('乙酉');
    expect(dayGZ({ y: 2027, m: 1, d: 1 }).text).toBe('庚辰');
  });

  it('日柱逐日递推 60 天回环', () => {
    let d = { y: 2026, m: 10, d: 31 };
    const first = dayGZ(d).index;
    for (let i = 0; i < 60; i++) d = addDays(d, 1);
    expect(dayGZ(d).index).toBe(first); // 60 日后干支回环
    expect(dayGZ({ y: 2026, m: 12, d: 30 }).index).toBe(first);
  });

  it('年柱以立春换岁，非元旦非农历新年', () => {
    expect(yearGZ({ y: 2024, m: 2, d: 3 }).text).toBe('癸卯'); // 立春前
    expect(yearGZ({ y: 2024, m: 2, d: 4 }).text).toBe('甲辰'); // 立春当日
    expect(yearGZ({ y: 1984, m: 2, d: 2 }).text).toBe('癸亥'); // 立春前属猪
    expect(yearGZ({ y: 1996, m: 8, d: 14 }).text).toBe('丙子'); // 实测场景当事人
    expect(yearGZ({ y: 1949, m: 10, d: 1 }).text).toBe('己丑');
  });

  it('五虎遁（可人工验算：甲己之年丙作首）', () => {
    // 甲己之年丙作首：年干甲(0)/己(5) → 寅月干丙(2)
    expect(monthGZ(0, 2)).toBe('丙寅');
    expect(monthGZ(5, 2)).toBe('丙寅');
    // 乙庚之岁戊为头
    expect(monthGZ(1, 2)).toBe('戊寅');
    expect(monthGZ(6, 2)).toBe('戊寅');
    // 丙辛之岁寻庚上
    expect(monthGZ(2, 2)).toBe('庚寅');
    // 丁壬壬位顺行流
    expect(monthGZ(3, 2)).toBe('壬寅');
    // 戊癸之年甲寅上
    expect(monthGZ(4, 2)).toBe('甲寅');
  });

  it('月柱实例（与 lunar-python 对拍）', () => {
    // 2026-10-31：丙午年戊戌月
    expect(monthGZ(yearGZ({ y: 2026, m: 10, d: 31 }).gan, 10)).toBe('戊戌');
    // 2026-11-07 立冬换己亥月
    expect(monthGZ(yearGZ({ y: 2026, m: 11, d: 7 }).gan, 11)).toBe('己亥');
    // 2024-02-10：甲辰年丙寅月
    expect(monthGZ(yearGZ({ y: 2024, m: 2, d: 10 }).gan, 2)).toBe('丙寅');
    // 2000-01-01：己卯年丙子月
    expect(monthGZ(yearGZ({ y: 2000, m: 1, d: 1 }).gan, 0)).toBe('丙子');
  });

  it('五鼠遁（可人工验算：甲己还加甲）', () => {
    // 甲己还加甲：日干甲(0)/己(5) → 子时干甲(0)
    expect(hourGZ(0, 0)).toBe('甲子');
    expect(hourGZ(5, 0)).toBe('甲子');
    // 乙庚丙作初
    expect(hourGZ(1, 0)).toBe('丙子');
    // 丙辛从戊起
    expect(hourGZ(2, 0)).toBe('戊子');
    // 丁壬庚子居
    expect(hourGZ(3, 0)).toBe('庚子');
    // 戊癸何方发，壬子是真途
    expect(hourGZ(4, 0)).toBe('壬子');
    // 甲日子时甲子，顺推至午为庚午
    expect(hourGZ(0, 6)).toBe('庚午');
  });

  it('钟点 → 时辰支（子时 23:00 起）', () => {
    expect(hourZhiOf(0)).toBe(0); // 00:30 子时
    expect(hourZhiOf(6)).toBe(3); // 06:20 卯时
    expect(hourZhiOf(12)).toBe(6); // 正午 午时
    expect(hourZhiOf(23)).toBe(0); // 23:30 子时
    expect(hourZhiOf(22)).toBe(11); // 亥时
  });

  it('四柱整体：1996-08-14 06:20（丙子年 / 丙申月 / 癸未日 / 乙卯时）', () => {
    const day = buildDay({ y: 1996, m: 8, d: 14 }, [], eventByKey('open'), 'catering', 'ziwu');
    expect(day.pillars.year).toBe('丙子');
    expect(day.pillars.month).toBe('丙申');
    expect(day.pillars.day).toBe('癸未');
    expect(day.pillars.hour).toBe('乙卯');
  });

  it('GAN/ZHI 常量完整', () => {
    expect(GAN).toHaveLength(10);
    expect(ZHI).toHaveLength(12);
  });

  it('四柱接口对默认时辰的兜底（取首个吉时）', () => {
    const day = buildDay({ y: 2026, m: 10, d: 31 }, [], eventByKey('open'), 'catering', 'ziwu');
    const pillars = fourPillarsOf(day);
    expect(pillars.year).toBe('丙午');
    expect(pillars.month).toBe('戊戌');
    expect(pillars.day).toBe('戊寅');
    expect(pillars.hour).toHaveLength(2);
  });
});

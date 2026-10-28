import { describe, expect, it } from 'vitest';
import { runScan, scanGeneric, buildDay } from '../../src/engine/scan';
import { eventByKey } from '../../src/data/events';
import type { Person, ScanInput } from '../../src/engine/types';

/**
 * PRD §7.3 实测场景（2026.10.24 构建实测）：
 * 开业开市 · 餐饮服务 · 坐北朝南（子山午向），课期为构建日起第 7 日起 90 天
 * （原型 ST.startOffset = 7），即 2026-10-31 → 2027-01-28。
 * 当事人：林 · 女 · 1996-08-14 06:20 · 北京（年命 丙子）。
 */
function scenario(): ScanInput {
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
  return {
    eventKey: 'open',
    people: [person],
    industryId: 'catering',
    sitKey: 'ziwu',
    startDate: { y: 2026, m: 10, d: 31 },
    span: 90,
  };
}

describe('PRD §7.3 阈值与实测', () => {
  it('开业开市·餐饮·坐北朝南 90 天 = 11 个可用日', () => {
    const r = runScan(scenario());
    expect(r.usable.length).toBe(11);
    expect(r.total).toBe(90);
  });

  it('出局归因分布与 PRD 逐项一致', () => {
    const r = runScan(scenario());
    expect(r.byReason['reason.scoreLow'] ?? 0).toBe(64); // 课格评分不足
    expect(r.byReason['hard.yuepo'] ?? 0).toBe(8); // 月破
    expect(r.byReason['hard.chongming'] ?? 0).toBe(5); // 日辰冲命
    expect(r.byReason['hard.lijue'] ?? 0).toBe(2); // 四绝 1 + 四离 1
    const sum = Object.values(r.byReason).reduce((a, b) => a + b, 0);
    expect(sum + r.usable.length).toBe(90);
  });

  it('通用模式 90 天 = 80 个可用日（月破 8 + 四离四绝 2）', () => {
    const r = scanGeneric(scenario());
    expect(r.usable.length).toBe(80);
    expect(r.byReason['hard.yuepo'] ?? 0).toBe(8);
    expect(r.byReason['hard.lijue'] ?? 0).toBe(2);
    expect(r.generic).toBe(true);
  });

  it('可用日评分全部 ≥ 80 且无硬忌', () => {
    const r = runScan(scenario());
    for (const d of r.usable) {
      expect(d.hard).toBeNull();
      expect(d.score).toBeGreaterThanOrEqual(80);
    }
  });

  it('11 与 80 的差距来自个人层：录四柱后可用日收窄', () => {
    const full = runScan(scenario());
    const gen = scanGeneric(scenario());
    expect(gen.usable.length - full.usable.length).toBe(69);
  });

  it('事件定义解析', () => {
    const ev = eventByKey('open');
    expect(ev.group).toBe('经营择日');
    expect(ev.layers).toBe(8);
  });

  it('黄金日课抽查：2026-11-07（11 个可用日之一，84 分）八层齐全', () => {
    const day = buildDay({ y: 2026, m: 11, d: 7 }, scenario().people, eventByKey('open'), 'catering', 'ziwu');
    expect(day.hard).toBeNull();
    expect(day.score).toBe(84);
    expect(day.grade).toBe('keyong');
    // 八层：行嫁月层不适用于开业（替换为月建层）
    const keys = day.layers.map((l) => l.key);
    expect(keys).toContain('monthBranch');
    expect(keys).toContain('jianchu');
    expect(keys).toContain('industryWuxing');
    expect(keys).toContain('monthHarm');
    expect(keys).toContain('dayClashYear');
    expect(keys).toContain('liJue');
    expect(keys).toContain('virtues');
    expect(keys).toContain('goodHours');
    // 开业不含坐向层与行嫁月层
    expect(keys).not.toContain('sittingFacing');
    expect(keys).not.toContain('marryMonth');
  });
});

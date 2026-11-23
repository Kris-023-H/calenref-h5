/**
 * tests/services/ics.test.ts — 日历订阅导出（PRD §12.6）。
 * 验证标准 ICS 结构、全天事件、VALARM 闹铃、转义与仅导出启用项。
 */
import { describe, expect, it } from 'vitest';
import { buildIcs } from '../../src/services/ics';
import type { ReminderRecord } from '../../src/db/types';

const NOW = Date.UTC(2026, 0, 1, 0, 0, 0);

function rec(id: string, date: string, enabled: boolean, note = ''): ReminderRecord {
  return { id, schemaVersion: 1, createdAt: NOW, eventKey: 'open', date, note, enabled };
}

describe('buildIcs — 日历订阅', () => {
  const reminders = [
    rec('r1', '2026-02-10', true, '签约, 备料'),
    rec('r2', '2026-03-15', false),
    rec('r3', '2026-04-20', true),
  ];
  const ics = buildIcs(reminders, () => '开业', NOW);

  it('含标准 VCALENDAR 头尾', () => {
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//CalenRef//Lizhi//ZH');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('只导出启用的提醒（2 条）', () => {
    const count = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(count).toBe(2);
    expect(ics).not.toContain('UID:r2@calenref');
  });

  it('全天事件日期为 YYYYMMDD', () => {
    expect(ics).toContain('DTSTART;VALUE=DATE:20260210');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260420');
  });

  it('每条事件含提前 1 天闹铃', () => {
    const triggers = (ics.match(/TRIGGER:-P1D/g) || []).length;
    expect(triggers).toBe(2);
    expect(ics).toContain('ACTION:DISPLAY');
  });

  it('逗号与分号按 RFC 5545 转义', () => {
    expect(ics).toContain('签约\\, 备料');
    expect(ics).not.toContain('签约, 备料');
  });

  it('DTSTAMP 为 UTC 时间戳格式', () => {
    expect(ics).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
  });

  it('CRLF 行结束', () => {
    expect(ics).toContain('\r\n');
  });
});

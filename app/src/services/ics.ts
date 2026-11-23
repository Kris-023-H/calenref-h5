/**
 * services/ics.ts — 日历订阅：把本机日期提醒导出为标准 .ics（v3.7 PRD §12.6）。
 *
 * 每条启用的提醒生成一个全天事件（DTSTART;VALUE=DATE），附提前 1 天的
 * DISPLAY 闹铃（VALARM）——主流日历（Apple / Google / Outlook）均识别。
 * 纯函数 buildIcs 便于测试；downloadIcs 负责浏览器端触发下载。
 * 不联网、不上传任何提醒数据。
 */
import type { ReminderRecord } from '../db/types';

/** ICS 文本转义：反斜杠、分号、逗号、换行（RFC 5545） */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** YYYY-MM-DD → YYYYMMDD；非法输入回落到今天 */
function icsDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[1]}${m[2]}${m[3]}` : new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

/** 当前 UTC 时间戳（DTSTAMP：YYYYMMDDTHHMMSSZ） */
function stamp(nowMs: number): string {
  return new Date(nowMs).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export interface IcsEventInput {
  date: string;
  title: string;
  description?: string;
}

/**
 * 由提醒列表构建 ICS 字符串。
 * @param reminders 本机提醒（仅 enabled 的导出）
 * @param titleFor 把 eventKey 映射为本地化标题的回调
 * @param nowMs 生成时间戳（可注入以便测试）
 */
export function buildIcs(
  reminders: ReminderRecord[],
  titleFor: (r: ReminderRecord) => string,
  nowMs: number = Date.now(),
): string {
  const stampVal = stamp(nowMs);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CalenRef//Lizhi//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:历知 CalenRef · 日期提醒',
  ];

  const active = reminders.filter((r) => r.enabled);
  for (const r of active) {
    const d = icsDate(r.date);
    const title = titleFor(r);
    const desc = r.note ? `${title} · ${r.note}` : title;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${r.id}@calenref`,
      `DTSTAMP:${stampVal}`,
      `DTSTART;VALUE=DATE:${d}`,
      `SUMMARY:${esc(title)}`,
      `DESCRIPTION:${esc(desc)}`,
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(`明日：${title}`)}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  // CRLF 行结束（RFC 5545）；用 reduce 避免尾部多一个空行
  return lines.reduce((acc, l, i) => acc + l + (i < lines.length - 1 ? '\r\n' : ''), '');
}

/** 浏览器端触发 .ics 下载 */
export function downloadIcs(content: string, filename = 'calenref-reminders.ics'): void {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

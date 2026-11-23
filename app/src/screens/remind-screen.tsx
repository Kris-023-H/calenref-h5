/**
 * screens/remind-screen.tsx — 日期提醒（本机清单：用事 + 日期 + 备注 + 开关）。
 * 提醒存本机（reminder repo），可导出 .ics 日历订阅（PRD §12.6，含提前 1 天闹铃）；
 * 邮件提醒见 me 页绑定入口。默认日期取「今天 + 7 天」（东八区民用历）。
 */

import { useState } from 'react';
import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { EVENTS, eventByKey } from '../data/events';
import { isoDate, t, termText, tx } from '../i18n';
import { Btn, EmptyState } from '../components/basics';
import { AppBar, IconBtn } from '../components/app-bar';
import { Icon } from '../components/icons';
import { useNav } from './types';
import { monthDay } from './ui-helpers';
import { todayCst } from '../services/timezone';
import { addDays } from '../engine/calendar/julian';
import { buildIcs, downloadIcs } from '../services/ics';

/** 今天 + days（东八区民用历，ISO 字符串） */
function defaultDate(days: number): string {
  const d = addDays(todayCst(Date.now()), days);
  return isoDate(d);
}

function parseIso(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map((x) => Number(x));
  return { y: y || 1970, m: m || 1, d: d || 1 };
}

export function RemindScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const email = useSettings((s) => s.email);
  const emailOn = useSettings((s) => s.emailOn);
  const emailItems = useSettings((s) => s.emailItems);
  const setEmailPref = useSettings((s) => s.setEmailPref);
  const reminders = useApp((s) => s.reminders);
  const addReminder = useApp((s) => s.addReminder);
  const toggleReminder = useApp((s) => s.toggleReminder);
  const removeReminder = useApp((s) => s.removeReminder);
  const showToast = useUi((s) => s.showToast);
  const { pop } = useNav();

  const [adding, setAdding] = useState(false);
  const [eventKey, setEventKey] = useState('open');
  const [date, setDate] = useState(() => defaultDate(7));
  const [note, setNote] = useState('');
  const [emailDraft, setEmailDraft] = useState(email);

  /** 邮件提醒项（课期临近 / 吉时前 / 仪程待办） */
  const MAIL_ITEMS: Array<[string, string, string]> = [
    ['course', tx('课期临近', 'Course approaching', lang), tx('日期前 1 天', '1 day before', lang)],
    ['hour', tx('吉时前', 'Before good hour', lang), tx('吉时前 30 分钟', '30 min before', lang)],
    ['todo', tx('仪程待办', 'Ritual tasks', lang), tx('倒排节点提醒', 'Milestone reminders', lang)],
  ];
  const toggleMailItem = (k: string): void => {
    const next = emailItems.includes(k) ? emailItems.filter((x) => x !== k) : [...emailItems, k];
    void setEmailPref({ emailItems: next });
  };
  const saveEmail = (): void => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDraft.trim());
    if (!ok) {
      showToast(tx('邮箱格式不正确', 'Invalid email address', lang));
      return;
    }
    void setEmailPref({ email: emailDraft.trim(), emailOn: true });
    showToast(tx('邮箱已绑定', 'Email bound', lang));
  };

  const save = (): void => {
    if (!date) {
      showToast(t('remind.dateRequired', lang));
      return;
    }
    void addReminder({ eventKey, date, note: note.trim(), enabled: true }).then(() => {
      setAdding(false);
      setNote('');
      setDate(defaultDate(7));
      showToast(t('common.saved', lang));
    });
  };

  /** 导出启用中的提醒为 .ics（日历订阅，PRD §12.6） */
  const exportCalendar = (): void => {
    const active = reminders.filter((r) => r.enabled);
    if (active.length === 0) {
      showToast(tx('没有可导出的提醒', 'No reminders to export', lang));
      return;
    }
    const ics = buildIcs(reminders, (r) => termText(eventByKey(r.eventKey).name, lang));
    downloadIcs(ics);
    showToast(tx('日历文件已导出', 'Calendar file exported', lang));
  };

  return (
    <div className="screen">
      <AppBar
        title={t('remind.title', lang)}
        onBack={() => pop()}
        actions={
          <div style={{ display: 'flex', gap: 2 }}>
            <IconBtn name="down" label={tx('导出日历', 'Export calendar', lang)} onClick={exportCalendar} />
            <IconBtn name="plus" label={t('remind.add', lang)} onClick={() => setAdding((v) => !v)} />
          </div>
        }
      />

      {/* ---------- 添加表单 ---------- */}
      {adding && (
        <div className="card flat" style={{ marginBottom: 14 }}>
          <div className="fld">
            <label>{t('remind.event', lang)}</label>
            <div className="unit">
              <select className="input" value={eventKey} onChange={(e) => setEventKey(e.target.value)}>
                {EVENTS.map((ev) => (
                  <option key={ev.key} value={ev.key}>
                    {termText(ev.name, lang)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="fld">
            <label>{t('remind.date', lang)}</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="fld">
            <label>
              {t('remind.note', lang)} · {t('common.optional', lang)}
            </label>
            <input className="input" type="text" value={note} placeholder={t('remind.notePh', lang)} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Btn block variant="gold" onClick={save}>
            {t('common.save', lang)}
          </Btn>
        </div>
      )}

      {/* ---------- 提醒列表 ---------- */}
      {reminders.length === 0 ? (
        <EmptyState
          mark="bell"
          title={t('remind.empty', lang)}
          body={t('remind.emptyHint', lang)}
          action={
            <Btn variant="gold" onClick={() => setAdding(true)}>
              {t('remind.add', lang)}
            </Btn>
          }
        />
      ) : (
        <div className="replist">
          {reminders.map((r) => {
            const ev = eventByKey(r.eventKey);
            const d = parseIso(r.date);
            return (
              <div key={r.id} className={`rep${r.enabled ? '' : ' off'}`}>
                <div className="rd" style={r.enabled ? undefined : { background: 'var(--muted)' }}>
                  <b>{d.d}</b>
                  <span>{d.m}</span>
                </div>
                <div className="rb">
                  <b>{termText(ev.name, lang)}</b>
                  <span>
                    {monthDay(d, lang)} · {r.enabled ? t('remind.on', lang) : t('remind.off', lang)}
                    {r.note ? ` · ${r.note}` : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconBtn
                    name="bell"
                    label={t('remind.enable', lang)}
                    onClick={() => {
                      void toggleReminder(r.id);
                      showToast(r.enabled ? t('remind.off', lang) : t('remind.on', lang));
                    }}
                  />
                  <IconBtn
                    name="empty"
                    label={t('common.delete', lang)}
                    onClick={() => {
                      void removeReminder(r.id).then(() => showToast(t('remind.deleted', lang)));
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- 日历订阅导出 ---------- */}
      {reminders.length > 0 && (
        <div className="card flat" style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <Icon name="down" size={14} />
            <b style={{ fontSize: 12 }}>{tx('日历订阅', 'Calendar subscription', lang)}</b>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 10 }}>
            {tx('导出 .ics 文件，导入 Apple / Google / Outlook 日历；提前 1 天自动提醒，数据不上传。', 'Export an .ics file for Apple / Google / Outlook calendars, with a reminder one day before. Nothing is uploaded.', lang)}
          </div>
          <Btn block variant="ghost" onClick={exportCalendar}>
            {tx('导出日历文件 (.ics)', 'Export calendar (.ics)', lang)}
          </Btn>
        </div>
      )}

      {/* ---------- 邮件提醒（PRD §12.7） ---------- */}
      <div className="card flat" style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icon name="bell" size={14} />
            <b style={{ fontSize: 12 }}>{tx('邮件提醒', 'Email reminder', lang)}</b>
          </div>
          <button
            className={`switch${emailOn ? ' on' : ''}`}
            role="switch"
            aria-checked={emailOn}
            aria-label={tx('邮件提醒开关', 'Email reminder toggle', lang)}
            onClick={() => {
              if (!email && !emailOn) {
                showToast(tx('请先绑定邮箱', 'Bind an email first', lang));
                return;
              }
              void setEmailPref({ emailOn: !emailOn });
            }}
          >
            <div className="sw" />
          </button>
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 8 }}>
          {tx('绑定邮箱后，课期临近时自动寄出提醒。', 'Bind your email to get automatic reminders as the date approaches.', lang)}
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
          {MAIL_ITEMS.map(([k, label, hint]) => (
            <button
              key={k}
              className={`ei${emailItems.includes(k) ? ' on' : ''}`}
              onClick={() => toggleMailItem(k)}
              title={hint}
              style={{
                fontSize: 10, padding: '5px 9px', borderRadius: 20, cursor: 'pointer',
                border: `1px solid ${emailItems.includes(k) ? 'var(--gold)' : 'var(--line)'}`,
                background: emailItems.includes(k) ? 'rgba(216,188,120,.14)' : 'transparent',
                color: emailItems.includes(k) ? 'var(--gold)' : 'var(--muted)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          <input
            className="input"
            type="email"
            value={emailDraft}
            placeholder={tx('输入邮箱地址', 'Enter email address', lang)}
            onChange={(e) => setEmailDraft(e.target.value)}
            style={{ flex: 1 }}
          />
          <Btn variant="gold" onClick={saveEmail} style={{ flex: '0 0 auto', padding: '9px 16px' }}>
            {tx('保存', 'Save', lang)}
          </Btn>
        </div>
        {email && (
          <div style={{ fontSize: 9.5, color: 'var(--muted)', marginTop: 7 }}>
            {tx('已绑定', 'Bound', lang)}: {email}
          </div>
        )}
      </div>

      <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.7, display: 'flex', gap: 6, justifyContent: 'center' }}>
        <Icon name="info" size={11} />
        {t('remind.localNote', lang)}
      </div>
      <div style={{ height: 8 }} />
    </div>
  );
}

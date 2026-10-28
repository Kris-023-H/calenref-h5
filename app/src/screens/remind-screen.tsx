/**
 * screens/remind-screen.tsx — 择日提醒（本机清单：用事 + 日期 + 备注 + 开关）。
 * 提醒仅存本机（reminder repo）；联网推送为 P1 升级项（PRD 决策）。
 * 默认日期取「今天 + 7 天」——与首页通书口径一致（东八区民用历）。
 */

import { useState } from 'react';
import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { EVENTS, eventByKey } from '../data/events';
import { isoDate, t, termText } from '../i18n';
import { Btn, EmptyState } from '../components/basics';
import { AppBar, IconBtn } from '../components/app-bar';
import { Icon } from '../components/icons';
import { useNav } from './types';
import { monthDay } from './ui-helpers';
import { todayCst } from '../services/timezone';
import { addDays } from '../engine/calendar/julian';

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

  return (
    <div className="screen">
      <AppBar
        title={t('remind.title', lang)}
        onBack={() => pop()}
        actions={<IconBtn name="plus" label={t('remind.add', lang)} onClick={() => setAdding((v) => !v)} />}
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

      <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.7, display: 'flex', gap: 6, justifyContent: 'center' }}>
        <Icon name="info" size={11} />
        {t('remind.localNote', lang)}
      </div>
      <div style={{ height: 8 }} />
    </div>
  );
}

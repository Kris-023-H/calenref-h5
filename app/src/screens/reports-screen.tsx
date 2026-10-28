/**
 * screens/reports-screen.tsx — 课期档案列表（本机报告 + 统计 + 提醒入口）。
 */

import { useState } from 'react';
import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { eventByKey } from '../data/events';
import { t, termText, isoDate } from '../i18n';
import { Btn, Chip, EmptyState, Seg } from '../components/basics';
import { AppBar, IconBtn } from '../components/app-bar';
import { Icon } from '../components/icons';
import { useNav } from './types';

type RepTab = 'all' | 'done' | 'wait';

export function ReportsScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const scans = useApp((s) => s.scans);
  const quota = useApp((s) => s.quota);
  const loadScan = useApp((s) => s.loadScan);
  const removeScan = useApp((s) => s.removeScan);
  const openSheet = useUi((s) => s.openSheet);
  const showToast = useUi((s) => s.showToast);
  const { push } = useNav();
  const [tab, setTab] = useState<RepTab>('all');

  const rows = scans.filter((r) => (tab === 'all' ? true : tab === 'done' ? r.result.usable.length > 0 : r.result.usable.length === 0));

  return (
    <div className="screen has-tab">
      <AppBar title={t('reports.title', lang)} actions={<IconBtn name="grid" onClick={() => openSheet('guide')} />} />
      <h2 className="tt">
        {t('reports.title', lang)}
        <small>{lang === 'en' ? 'Every lesson is archived — next year’s expansion reuses it.' : '每一课都留档——同一家店，明年扩店还会再用一次。'}</small>
      </h2>

      <Seg
        options={[
          { value: 'all', label: t('common.all', lang) },
          { value: 'done', label: lang === 'en' ? 'Issued' : '已出具' },
          { value: 'wait', label: lang === 'en' ? 'No usable' : '待解锁' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="card flat" style={{ margin: '12px 0' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div>
            <div className="serif" style={{ fontSize: 19, fontWeight: 700 }}>
              {scans.reduce((n, r) => n + r.result.usable.length, 0)}
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '.1em' }}>{lang === 'en' ? 'usable days' : '可用之日'}</div>
          </div>
          <div>
            <div className="serif" style={{ fontSize: 19, fontWeight: 700 }}>
              {scans.length}
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '.1em' }}>{lang === 'en' ? 'lessons' : '历史课期'}</div>
          </div>
          <div>
            <div className="serif" style={{ fontSize: 19, fontWeight: 700 }}>
              {quota.unlimited ? '∞' : quota.freeLeft}
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '.1em' }}>{lang === 'en' ? 'AI left' : 'AI 解读余次'}</div>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          mark="doc"
          title={t('reports.empty', lang)}
          body={t('reports.emptyHint', lang)}
          action={
            <Btn variant="gold" onClick={() => push('event')}>
              {lang === 'en' ? 'Start first lesson' : '起第一课'}
            </Btn>
          }
        />
      ) : (
        rows.map((r) => {
          const ev = eventByKey(r.result.input.eventKey);
          const top = r.result.usable[0];
          const d = new Date(r.createdAt);
          return (
            <div key={r.id} className="rep" role="button" tabIndex={0} onClick={() => { loadScan(r.id); push('report'); }} onKeyDown={(e) => e.key === 'Enter' && push('report')}>
              <div className="rd">
                <b>{d.getDate()}</b>
                <span>
                  {d.getMonth() + 1} {lang === 'en' ? '' : '月'}
                </span>
              </div>
              <div className="rb">
                <b>{r.title}</b>
                <span>
                  {termText(ev.name, lang)} · {t('reports.createdAt', lang, { date: isoDate({ y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }) })} ·{' '}
                  {top ? `${lang === 'en' ? 'best ' : '首选 '}${top.score}` : t('result.noneTitle', lang)}
                </span>
              </div>
              <button
                type="button"
                className={`rs ${r.result.usable.length > 0 ? 'ok' : 'wait'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  void removeScan(r.id).then(() => showToast(t('reports.deleted', lang)));
                }}
              >
                {r.result.usable.length > 0 ? t('reports.open', lang) : t('common.delete', lang)}
              </button>
            </div>
          );
        })
      )}

      <div className="rule-h">
        <span>{lang === 'en' ? 'Reminders' : '提醒'}</span>
        <i />
      </div>
      <div className="card flat" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => push('remind')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="mig" style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="clock" size={15} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{lang === 'en' ? 'Countdown checklist' : '仪程倒排清单'}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{lang === 'en' ? 'by good hours, backwards' : '还有 6 项待办 · 按吉时倒排'}</div>
          </div>
          <Icon name="right" size={13} />
        </div>
      </div>
      <div style={{ height: 8 }} />
      <Chip>{t('reports.count', lang, { n: scans.length })}</Chip>
    </div>
  );
}

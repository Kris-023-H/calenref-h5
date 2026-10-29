/**
 * screens/detail-screen.tsx — 当日详解（首选/备选课 + 出生资料 + 逐层依据 + 时辰 + 三派对照 + 制化）。
 * 层结果文案由 i18n/engine-text 组装；时辰可点选并印入课帖。
 */

import { useState } from 'react';
import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { eventByKey } from '../data/events';
import { industryById } from '../data/industries';
import { readPerson } from '../engine/person';
import { fourPillarsOf } from '../engine/pillars';
import { schoolReadings, schoolAdvice } from '../engine/schools';
import { ZHI } from '../engine/calendar/sexagenary';
import { SCORE_MIN } from '../engine/types';
import type { Lang } from '../engine/types';
import { t, hardReasonLong, isoDate, scoreLowText, termText, tx } from '../i18n';
import { Ring, Btn, EmptyState } from '../components/basics';
import { AppBar, IconBtn } from '../components/app-bar';
import { Icon } from '../components/icons';
import { LayerRow, HourCell, SubShaCard } from '../components/layer-row';
import { dottedDate, monthDay, weekdayShort, monthFullName } from './ui-helpers';
import { useNav } from './types';

/** 三派名称：中文走 tx 以便繁体同步转换 */
const SCHOOL_NAMES: Record<'xingjia' | 'bujiang' | 'jianchu', { zh: string; en: string }> = {
  xingjia: { zh: '婚月派', en: 'Marriage-month' },
  bujiang: { zh: '不将日派', en: 'Bujiang day' },
  jianchu: { zh: '建除派', en: 'Jianchu' },
};
const schoolName = (k: 'xingjia' | 'bujiang' | 'jianchu', lang: Lang): string => tx(SCHOOL_NAMES[k].zh, SCHOOL_NAMES[k].en, lang);

export function DetailScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const session = useApp((s) => s.session);
  const cursor = useApp((s) => s.session?.cursor ?? 0);
  const isFaved = useApp((s) => s.isFaved);
  const toggleFavorite = useApp((s) => s.toggleFavorite);
  const openSheet = useUi((s) => s.openSheet);
  const showToast = useUi((s) => s.showToast);
  const { pop, push } = useNav();
  const [hourSel, setHourSel] = useState<number | null>(null);

  if (!session) {
    return (
      <div className="screen">
        <AppBar title={t('detail.title', lang)} onBack={() => pop()} />
        <EmptyState mark="empty" title={t('result.noneTitle', lang)} body={t('result.noneBody', lang)} />
      </div>
    );
  }

  const s = session.result;
  const day = s.usable[cursor] ?? s.days[0];
  const rank = s.usable.indexOf(day);
  const ev = eventByKey(s.input.eventKey);
  const ind = industryById(s.input.industryId);
  const readings = s.input.people.map((p) => readPerson(p));
  const hourIdx = hourSel ?? day.goodHours[0]?.index ?? day.hours[0]?.index ?? 0;
  const fp = fourPillarsOf(day, hourIdx);
  const readings3 = schoolReadings(day);
  const advice = schoolAdvice(readings3, SCORE_MIN);
  const dateIso = isoDate(day.date);
  const faved = isFaved(dateIso);

  return (
    <div className="screen">
      <AppBar
        title={monthDay(day.date, lang)}
        onBack={() => pop()}
        actions={
          <>
            <IconBtn
              name="star"
              label={faved ? t('detail.faved', lang) : t('detail.fav', lang)}
              onClick={() => {
                void toggleFavorite(day);
                showToast(faved ? t('detail.favRemoved', lang) : t('detail.favAdded', lang));
              }}
            />
            <IconBtn name="share" label={t('share.title', lang)} onClick={() => openSheet('share')} />
          </>
        }
      />

      <div className="dhero">
        <div className="dh-top">
          <div style={{ flex: 1 }}>
            <div className="k">
              {rank === 0 ? (tx('首 选 课', 'FIRST CHOICE', lang)) : tx('备 选 课', 'ALTERNATE', lang)} ／ {termText(ev.name, lang)} ／{' '}
              {termText(ind.name, lang)}
            </div>
            <div className="big">{dottedDate(day.date)}</div>
            <div className="sub2">
              {weekdayShort(day.weekday, lang)}　{day.dayGZ.text}
              {tx('日', ' Day', lang)}　{day.jianchu}
              {tx('日', ' Day', lang)}　{tx('月建', 'month ', lang)}
              {ZHI[day.monthZhi]}
            </div>
          </div>
          <Ring value={day.score} size="lg" dark />
        </div>
        <div className="dh-meta">
          <span>
            {monthFullName(day.monthZhi)} · {tx('後', 'after term', lang)}
          </span>
          <span>{readings.length > 0 ? readings.map((r) => r.name).join(' & ') : t('scan.generic', lang)}</span>
          <span>
            {tx('时辰 ', 'hour ', lang)}
            {day.goodHours[0]?.name ?? '—'}
            {tx('时', '', lang)}
          </span>
        </div>
      </div>

      <div className="rtab" style={{ marginTop: 14 }}>
        <div className="rtab-row">
          <div>{t('detail.pillarsTitle', lang)}</div>
          <div>
            <b>
              {fp.year}　{fp.month}　{fp.day}　{fp.hour}
            </b>
            　{tx('年 · 月 · 日 · 时', 'year · month · day · hour', lang)}
          </div>
        </div>
        <div className="rtab-row">
          <div>{t('common.score', lang)}</div>
          <div>
            <b>{day.score}</b>　{tx('（≥94 上吉 · ≥86 中吉 · ≥80 可用）', '≥94 supreme · ≥86 high · ≥80 usable', lang)}
          </div>
        </div>
      </div>

      {day.hard ? (
        <div className="card flat" style={{ marginTop: 12, borderColor: 'rgba(178,58,43,.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Icon name="info" size={14} />
            <b style={{ color: 'var(--verm)', fontSize: 12.5 }}>{t('detail.hardTitle', lang)}</b>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.8 }}>{hardReasonLong(day.hard, lang)}</div>
          <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 6 }}>{t('detail.hardBody', lang)}</div>
        </div>
      ) : (
        !day.eligible && (
          <div className="card flat" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.8 }}>{scoreLowText(day.score, SCORE_MIN, lang)}</div>
          </div>
        )
      )}

      {s.generic && (
        <div className="whybar" style={{ marginTop: 10 }}>
          <Icon name="info" size={13} />
          <div>
            <b>{t('scan.generic', lang)}</b>　{t('detail.genericNotice', lang)}
          </div>
        </div>
      )}

      <div className="sect" style={{ marginTop: 16 }}>
        <h3>{t('detail.layersTitle', lang)}</h3>
        <em>
          {tx(`共 ${day.layers.length} 重`, `${day.layers.length} layers`, lang)}
        </em>
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--muted)', margin: '-4px 0 10px' }}>
        {tx('逐层点开，每一层都给出口径与出处，可拿去核对。', 'Open each layer — every one states its basis and source, ready to verify.', lang)}
      </div>
      <div id="layers">
        {day.layers.map((l, i) => (
          <LayerRow key={l.key} layer={l} index={i} lang={lang} defaultOpen={i === 0} />
        ))}
      </div>

      <div className="sect">
        <h3>{t('detail.hoursTitle', lang)}</h3>
        <em>{tx('时辰', 'Hours', lang)}</em>
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--muted)', margin: '-4px 0 9px' }}>{t('detail.hoursHint', lang)}</div>
      <div className="hours">
        {day.hours.map((h) => (
          <HourCell key={h.index} hour={h} lang={lang} selected={h.index === hourIdx} onSelect={() => setHourSel(h.index)} />
        ))}
      </div>

      <div className="sect">
        <h3>{t('detail.schoolsTitle', lang)}</h3>
        <em>{tx('多口径', 'multi-approach', lang)}</em>
      </div>
      <div className="schools">
        {readings3.map((r) => (
          <div key={r.school} className={`school${r.score === Math.max(...readings3.map((x) => x.score)) ? ' best' : ''}`}>
            <em>{schoolName(r.school, lang)}</em>
            <b>{r.score}</b>
            <span>{r.score >= SCORE_MIN ? (tx('过阈值', 'pass', lang)) : tx('未过', 'below', lang)}</span>
          </div>
        ))}
      </div>
      <div className="hint" style={{ marginTop: 9, fontSize: 10.5 }}>
        {advice === 'consistent'
          ? t('school.adviceConsistent', lang)
          : advice === 'conservative'
            ? t('school.adviceConservative', lang)
            : t('school.adviceAggressive', lang)}
      </div>

      <div className="sect">
        <h3>{tx('次级因素与调整', 'Secondary factors & adjustments', lang)}</h3>
        <em>{tx('调整', 'Adjustment', lang)}</em>
      </div>
      <SubShaCard layers={day.layers.filter((l) => l.cls === 'warn' || l.cls === 'bad')} lang={lang} />

      <div className="card lacquer" style={{ marginTop: 14, cursor: 'pointer' }} role="button" tabIndex={0} onClick={() => openSheet('elder')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: '.22em', color: 'var(--gold-2)', fontWeight: 700, marginBottom: 5 }}>
              {tx('呈长辈', 'FOR ELDERS', lang)}
            </div>
            <div className="serif" style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 4 }}>
              {tx('依据摘录 · 呈长辈', 'Basis excerpt', lang)}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--on-lacquer-2)' }}>
              {tx('三条可核的出处，可直接转发', 'Three verifiable sources, forwardable.', lang)}
            </div>
          </div>
          <Icon name="right" size={15} />
        </div>
      </div>

      <div className="ctabar">
        <div className="btn-row">
          <Btn variant="ghost" style={{ flex: '0 0 42%' }} onClick={() => push('report')}>
            {t('detail.reportTitle', lang)}
          </Btn>
          <Btn variant="gold" onClick={() => push('card')}>
            {tx('制作当日帖', 'Make day card', lang)}
          </Btn>
        </div>
      </div>
    </div>
  );
}

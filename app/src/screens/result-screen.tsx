/**
 * screens/result-screen.tsx — 查询筛选结果（列表 / 历表 + 筛选 + 出局归因 + 报告 CTA）。
 * 列表复刻原型 dayCard：首选/备选徽标、干支值神、评分、吉时与层摘要。
 */

import { useMemo, useState } from 'react';
import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { eventByKey } from '../data/events';
import { formatPrice } from '../data/prices';
import { dayOfWeek, gregorianToJDN } from '../engine/calendar/julian';
import { termIndexOfDate } from '../engine/calendar/solar-terms';
import { t, hardReasonText, jianchuName, layerName, layerResultText, termText, tx } from '../i18n';
import { Btn, Chip, EmptyState } from '../components/basics';
import { AppBar, IconBtn } from '../components/app-bar';
import { Icon } from '../components/icons';
import { ScrollX } from '../components/scroll-x';
import { monthDay, weekdayShort, dottedDate, gradeLabel, gradeTone, monthFullName, monthZhiName } from './ui-helpers';
import { useNav } from './types';
import type { DayResult, HardReason, Lang } from '../engine/types';

export function ResultScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const currency = useSettings((s) => s.currency);
  const session = useApp((s) => s.session);
  const setCursor = useApp((s) => s.setCursor);
  const setFilter = useApp((s) => s.setFilter);
  const setView = useApp((s) => s.setView);
  const openSheet = useUi((s) => s.openSheet);
  const { pop, push } = useNav();
  const [calMonth, setCalMonth] = useState(0);

  const ev = session ? eventByKey(session.result.input.eventKey) : eventByKey('open');

  const items: DayResult[] = useMemo(() => {
    const list = session?.result.usable ?? [];
    const f = session?.filter ?? 'all';
    if (f === 'best') return list.filter((d) => d.score >= 85);
    if (f === 'weekend') return list.filter((d) => d.weekday === 0 || d.weekday === 6);
    if (f === 'hour') return list.filter((d) => d.goodHours.length > 0);
    return list;
  }, [session]);

  if (!session) {
    return (
      <div className="screen">
        <AppBar title={t('result.title', lang)} onBack={() => pop()} />
        <EmptyState mark="empty" title={t('result.noneTitle', lang)} body={t('result.noneBody', lang)} action={<Btn onClick={() => push('event')}>{t('home.cta', lang)}</Btn>} />
      </div>
    );
  }

  const s = session.result;
  const byReason = s.byReason;
  const layerCount = s.generic ? 4 : 8;

  const filterItems = [
    { key: 'all', label: `${t('result.filterAll', lang)} ${s.usable.length}` },
    { key: 'best', label: `${tx('评分 ≥ 85', 'Score ≥ 85', lang)}` },
    { key: 'weekend', label: tx('仅周末', 'Weekend', lang) },
    { key: 'hour', label: tx('有合时', 'Has hour', lang) },
  ];

  const best = s.usable[0]?.score ?? 0;

  return (
    <div className="screen">
      <AppBar
        title={t('result.title', lang)}
        onBack={() => pop()}
        actions={
          <>
            <Chip tone="gold">{termText(ev.name, lang)}</Chip>
            <IconBtn name="grid" onClick={() => openSheet('guide')} />
          </>
        }
      />

      <div className="rhead">
        <h2 className="tt">
          {s.total} {tx('天，', 'days,', lang)}
          {s.usable.length} {tx('日可用', 'usable', lang)}
          <small>
            {tx(`通过 ${layerCount} 重`, `through ${layerCount} layers`, lang)}
            {s.generic ? (tx('（通书口径）', ' (generic)', lang)) : tx('（条目）', ' (entries)', lang)} ·{' '}
            {tx('已出局 ', 'excluded ', lang)}
            {s.total - s.usable.length} {tx('日', 'days', lang)}
          </small>
        </h2>
      </div>

      {s.generic && (
        <div className="whybar" style={{ marginBottom: 12 }}>
          <Icon name="info" size={13} />
          <div>
            <b>{t('scan.generic', lang)}</b>　{t('result.genericBody', lang)}
          </div>
        </div>
      )}

      <div className="hint" style={{ marginBottom: 12 }}>
        {t('result.reasonsTitle', lang)}：
        {Object.keys(byReason).length === 0
          ? t('common.none', lang)
          : Object.entries(byReason)
              .map(([k, n]) => `${reasonLabel(k, lang)} ${n}`)
              .join(' · ')}
        。{tx('出局不等于「不吉」，是不合本套规则的条件。', 'Excluded ≠ unlucky — it fails this lesson’s taking conditions.', lang)}
      </div>

      <ScrollX items={filterItems} activeKey={session.filter} onSelect={(k) => setFilter(k as typeof session.filter)} />

      <div style={{ display: 'flex', gap: 7, margin: '10px 0 12px' }}>
        <Btn variant={session.view === 'list' ? 'secondary' : 'ghost'} onClick={() => setView('list')} className="grow">
          {tx('列表', 'List', lang)}
        </Btn>
        <Btn variant={session.view === 'cal' ? 'secondary' : 'ghost'} onClick={() => setView('cal')} className="grow">
          {tx('历表', 'Calendar', lang)}
        </Btn>
      </div>

      {session.view === 'list' ? (
        items.length === 0 ? (
          <EmptyState
            mark="empty"
            title={t('result.noneTitle', lang)}
            body={t('result.noneBody', lang)}
            action={
              <>
                <Btn variant="ghost" onClick={() => push('info')}>
                  {tx('改查询条件', 'Change query conditions', lang)}
                </Btn>
                <Btn variant="ghost" onClick={() => setDraftGeneric()}>
                  {tx('换口径再看', 'Try generic', lang)}
                </Btn>
              </>
            }
          />
        ) : (
          <>
            {items.slice(0, 12).map((d, i) => (
              <DayCard key={dottedDate(d.date)} day={d} rank={i} lang={lang} best={best} generic={s.generic} onOpen={() => { setCursor(i); push('detail'); }} />
            ))}
            {items.length > 12 && (
              <div className="hint" style={{ textAlign: 'center', marginTop: 10 }}>
                {tx(`另有 ${items.length - 12} 日，完整清单见查询报告`, `${items.length - 12} more in the full report`, lang)}
              </div>
            )}
          </>
        )
      ) : (
        <MonthCal
          usable={s.usable}
          best={best}
          lang={lang}
          monthOffset={calMonth}
          onMonth={setCalMonth}
          onPick={(i) => {
            setCursor(i);
            push('detail');
          }}
        />
      )}

      <div className="ctabar">
        <div className="btn-row">
          <Btn variant="ghost" style={{ flex: '0 0 40%' }} onClick={() => push('info')}>
            {tx('改条件', 'Conditions', lang)}
          </Btn>
          <Btn variant="gold" onClick={() => push('pay')}>
            {tx('出具查询报告', 'Issue query report', lang)} · {formatPrice('once', currency)}
          </Btn>
        </div>
      </div>
    </div>
  );

  function setDraftGeneric(): void {
    useApp.getState().setDraft({ generic: true });
    push('info');
  }
}

function reasonLabel(key: string, lang: Lang): string {
  if (key.startsWith('hard.')) return hardReasonText(key.slice(5) as HardReason, lang);
  if (key === 'reason.scoreLow') return tx('评分不足', 'score below threshold', lang);
  return key;
}

function DayCard({
  day,
  rank,
  lang,
  best,
  generic,
  onOpen,
}: {
  day: DayResult;
  rank: number;
  lang: Lang;
  best: number;
  generic: boolean;
  onOpen: () => void;
}): JSX.Element {
  const okLayers = day.layers.filter((l) => l.cls === 'ok' && !['goodHours', 'monthHarm', 'liJue'].includes(l.key));
  const warnLayers = day.layers.filter((l) => l.cls === 'warn');
  const isTop = rank === 0 || day.score === best;
  return (
    <div className={`daycard${isTop ? ' top' : ''}`} role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      <div className="dr1">
        <span className="rk">{isTop ? (tx('首 选', 'FIRST', lang)) : `${tx('备选 ', 'ALT ', lang)}${rank}`}</span>
        <span className="dd">
          {monthDay(day.date, lang)}
          <em>{weekdayShort(day.weekday, lang)}</em>
        </span>
        <span className="dgz">
          {day.dayGZ.text}
          {tx('日 · ', ' · ', lang)}
          {jianchuName(day.jianchu, lang)}
          {tx('日', '', lang)}
        </span>
      </div>
      <div className="why">
        {gradeLabel(day.score, lang)} ／ {okLayers.slice(0, 2).map((l) => `${layerName(l.key, lang)}·${layerResultText(l, lang)}`).join('　')}　
        {tx('时辰 ', 'hour ', lang)}
        {day.goodHours[0]?.name ?? '—'}
        {tx('时', '', lang)}
      </div>
      <div className="dmeta">
        <Chip tone={gradeTone(day.score)}>
          {generic ? (tx('通书分 ', 'almanac ', lang)) : tx('评分 ', 'score ', lang)}
          {day.score}
        </Chip>
        {okLayers.slice(0, 2).map((l) => (
          <Chip key={l.key}>{layerName(l.key, lang)}</Chip>
        ))}
        {warnLayers.slice(0, 1).map((l) => (
          <Chip tone="gold" key={l.key}>
            {layerName(l.key, lang)}·{layerResultText(l, lang)}
          </Chip>
        ))}
      </div>
    </div>
  );
}

/** 月历（两个月，可前后翻页） */
function MonthCal({
  usable,
  best,
  lang,
  monthOffset,
  onMonth,
  onPick,
}: {
  usable: DayResult[];
  best: number;
  lang: Lang;
  monthOffset: number;
  onMonth: (n: number) => void;
  onPick: (i: number) => void;
}): JSX.Element {
  const base = usable[0]?.date ?? { y: 2026, m: 1, d: 1 };
  const months = [base, shiftMonth(base, 1)];
  const shown = months[Math.min(1, Math.max(0, monthOffset))];
  const passMap = new Map<string, { score: number; idx: number }>();
  usable.forEach((d, i) => passMap.set(dottedDate(d.date), { score: d.score, idx: i }));

  const firstWd = dayOfWeek({ y: shown.y, m: shown.m, d: 1 });
  const dim = daysInMonth(shown.y, shown.m);
  const wd = lang === 'en' ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <>
      <div className="cal">
        <div className="ch">
          <b>
            {shown.y} {tx('年 ', '', lang)}
            {shown.m} {tx('月', '', lang)}
          </b>
          <span style={{ fontSize: 9, letterSpacing: '.14em', color: 'var(--muted)' }}>
            {monthFullName(monthZhiOfMonth(shown))} · {monthZhiName(monthZhiOfMonth(shown))}
          </span>
          <div className="cnav">
            <button type="button" aria-label="prev" onClick={() => onMonth(Math.max(0, monthOffset - 1))}>
              ‹
            </button>
            <button type="button" aria-label="next" onClick={() => onMonth(Math.min(1, monthOffset + 1))}>
              ›
            </button>
          </div>
        </div>
        <div className="wk">
          {wd.map((w, i) => (
            <span key={`${w}${i}`}>{w}</span>
          ))}
        </div>
        <div className="days">
          {Array.from({ length: firstWd }, (_, i) => (
            <div className="dc mut" key={`pad${i}`} />
          ))}
          {Array.from({ length: dim }, (_, i) => {
            const d = i + 1;
            const key = dottedDate({ y: shown.y, m: shown.m, d });
            const hit = passMap.get(key);
            if (hit) {
              const isBest = hit.score === best;
              return (
                <div
                  key={key}
                  className={`dc ${isBest ? 'best' : 'good'}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onPick(hit.idx)}
                  onKeyDown={(e) => e.key === 'Enter' && onPick(hit.idx)}
                >
                  {d}
                  {isBest && <span className="dot" />}
                </div>
              );
            }
            return (
              <div className="dc" key={key}>
                {d}
              </div>
            );
          })}
        </div>
        <div className="tl-cap" style={{ marginTop: 8, fontSize: 9, color: 'var(--muted)' }}>
          {tx('金色为评分最高，浅金为可用日。点开任意一天看逐层依据。', 'Gold = highest lesson score, light gold = usable. Tap any day for layer detail.', lang)}
        </div>
      </div>
      {monthOffset === 0 && (
        <div className="hint" style={{ textAlign: 'center', fontSize: 10.5 }}>
          {tx('后一个月 →', 'One more month →', lang)}
        </div>
      )}
    </>
  );
}

function shiftMonth(d: { y: number; m: number }, n: number): { y: number; m: number } {
  const m = d.m - 1 + n;
  return { y: d.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 + 1 };
}

/** 当月天数（JDN 差值，不依赖 Date） */
function daysInMonth(y: number, m: number): number {
  const n = shiftMonth({ y, m }, 1);
  return gregorianToJDN(n.y, n.m, 1) - gregorianToJDN(y, m, 1);
}

function monthZhiOfMonth(d: { y: number; m: number }): number {
  // 以每月 15 日近似节气月（历表展示用）
  return termIndexOfDate({ y: d.y, m: d.m, d: 15 }).monthZhi;
}

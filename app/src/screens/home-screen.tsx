/**
 * screens/home-screen.tsx — 今日（通书口径 + 你的课期 + 起一课 + 知库入口）。
 * 通书宜忌取建除口径（JC_YI/JC_JI 数据层，对所有人一致）；
 * 「最近可用课期」按当前草稿（用事/当事人/业态）推演 120 天取首个可用日。
 */

import { useMemo } from 'react';
import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { dayGZ, ZHI } from '../engine/calendar/sexagenary';
import { termIndexOfDate } from '../engine/calendar/solar-terms';
import { jianchuOf } from '../engine/rules/jianchu';
import { runScan } from '../engine/scan';
import { eventByKey, isTwoPerson } from '../data/events';
import { industryById } from '../data/industries';
import { JC_YI, JC_JI } from '../data/jc-tables';
import { KB_ARTICLES } from '../data/kb';
import { todayInTz } from '../services/timezone';
import { t, termText, jianchuName } from '../i18n';
import { Ring, Chip } from '../components/basics';
import { BrandMark, Icon } from '../components/icons';
import { IconBtn, AppBar } from '../components/app-bar';
import { monthDay, weekdayShort, dottedDate, monthFullName, monthZhiName } from './ui-helpers';
import { useNav } from './types';
import type { DayResult, Person } from '../engine/types';
import type { CalDate } from '../engine/types';

export function HomeScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const tz = useSettings((s) => s.tz);
  const draft = useApp((s) => s.draft);
  const people = useApp((s) => s.people);
  const scans = useApp((s) => s.scans);
  const setDraft = useApp((s) => s.setDraft);
  const finishScan = useApp((s) => s.finishScan);
  const openSheet = useUi((s) => s.openSheet);
  const { push, switchTab } = useNav();

  // 「今日」按所选时区（PRD 验收 #7 时区双口径）；时区切换即重算
  const today = useMemo(() => todayInTz(Date.now(), tz), [tz]);
  const dg = dayGZ(today);
  const jc = jianchuOf(today, eventByKey(draft.eventKey).group);
  const ev = eventByKey(draft.eventKey);
  const ind = industryById(draft.industryId);

  const nextGood: DayResult | null = useMemo(() => {
    const persons: Person[] = draft.personIds
      .map((id) => people.find((p) => p.id === id))
      .filter((p): p is Person => Boolean(p));
    const two = isTwoPerson(draft.eventKey);
    if (!draft.generic && (persons.length === 0 || (two && persons.length < 2))) return null;
    const res = runScan(
      {
        eventKey: draft.eventKey,
        people: persons,
        industryId: draft.industryId,
        sitKey: draft.sitKey,
        startDate: today,
        span: 120,
        generic: draft.generic,
        school: draft.school,
      },
      Date.now(),
    );
    return res.usable[0] ?? null;
  }, [draft, people, today]);

  const greeting = (): string => {
    const h = new Date().getHours();
    if (lang === 'en') return h < 11 ? 'Good morning' : h < 14 ? 'Good noon' : h < 19 ? 'Good afternoon' : 'Good evening';
    return h < 11 ? '早上好' : h < 14 ? '午安' : h < 19 ? '下午好' : '晚上好';
  };

  const quick: Array<[string, string, string]> = [
    ['open', '開', lang === 'en' ? 'Open' : '开业'],
    ['sign', '契', lang === 'en' ? 'Sign' : '签约'],
    ['marry', '囍', lang === 'en' ? 'Marry' : '嫁娶'],
    ['move', '遷', lang === 'en' ? 'Move' : '入宅'],
  ];

  const article = KB_ARTICLES[0];

  return (
    <div className="screen has-tab">
      <AppBar
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span className="applogo">
              <BrandMark size={20} tone="gold" />
            </span>
            <BrandMark showMark={false} text={t('app.name', lang)} tone="ink" sub={lang === 'en' ? 'Threefold' : '三元择日'} titleSize={15} />
          </div>
        }
        actions={
          <>
            <IconBtn name="grid" label={lang === 'en' ? 'Guide' : '场景导览'} onClick={() => openSheet('guide')} />
            <IconBtn name="bell" label={lang === 'en' ? 'Reminders' : '提醒'} onClick={() => push('remind')} />
          </>
        }
      />

      <div className="hero">
        <div className="hz">
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            {t('home.todayTitle', lang)} ／ {greeting()}
          </div>
          <div className="hdate">
            <b>{today.d}</b>
            <span>
              {monthFullName(monthZhiOf(today))} · {monthZhiName(monthZhiOf(today))}
              {lang === 'en' ? ' month' : '月'}
            </span>
          </div>
          <div className="hgz">
            {dg.text}
            {lang === 'en' ? ' Day' : '日'} ／ {t('home.todayJianchu', lang)} {jianchuName(jc.name, lang)}
            {lang === 'en' ? ' Day' : '日'} ／ {lang === 'en' ? 'clash ' : '冲'}
            {ZHI[(dg.zhi + 6) % 12]}
          </div>
          <div className="hi-cap" role="button" tabIndex={0} onClick={() => openSheet('why')} onKeyDown={(e) => e.key === 'Enter' && openSheet('why')}>
            {t('home.todayTitle', lang)} · {lang === 'en' ? 'general reading' : '通用口径'}
            <b>?</b>
            <Icon name="right" size={10} />
          </div>
          <div className="hrow">
            <div className="hi">
              <em>{t('home.todayYi', lang)}</em>
              <b>{JC_YI[jc.name] ?? '—'}</b>
            </div>
            <div className="hi">
              <em>{t('home.todayJi', lang)}</em>
              <b>{JC_JI[jc.name] ?? '—'}</b>
            </div>
          </div>
        </div>
      </div>

      <div className="whybar" role="button" tabIndex={0} onClick={() => openSheet('why')} onKeyDown={(e) => e.key === 'Enter' && openSheet('why')}>
        <Icon name="info" size={13} />
        <div>
          {lang === 'en' ? (
            <>
              Above is the <b>general almanac reading</b> — same for everyone, <b>not tuned to your pillars</b>. Your lesson reads person · matter · day.
            </>
          ) : (
            <>
              以上为<b>通书宜忌</b>，按建除十二值神排，对所有人一致，<b>不针对你的年命</b>。你的课期要看人·事·日三元。
            </>
          )}
        </div>
        <Icon name="right" size={11} className="ar" />
      </div>

      {nextGood && (
        <div
          className="nextday"
          style={{ marginTop: 14 }}
          role="button"
          tabIndex={0}
          onClick={() => {
            setDraft({ generic: false });
            finishScan(
              runScan(
                {
                  eventKey: draft.eventKey,
                  people: draft.personIds.map((id) => people.find((p) => p.id === id)).filter((p): p is Person => Boolean(p)),
                  industryId: draft.industryId,
                  sitKey: draft.sitKey,
                  startDate: today,
                  span: 120,
                  school: draft.school,
                },
                Date.now(),
              ),
            );
            push('detail');
          }}
          onKeyDown={(e) => e.key === 'Enter' && push('detail')}
        >
          <Ring value={nextGood.score} />
          <div className="nd">
            <em>
              {t('result.nextUsable', lang)} · {termText(ev.name, lang)}（{termText(ind.name, lang)}）
            </em>
            <b>{monthDay(nextGood.date, lang)}</b>
            <span>
              {weekdayShort(nextGood.weekday, lang)} ／ {nextGood.dayGZ.text}
              {lang === 'en' ? ' Day' : '日'} ／ {jianchuName(nextGood.jianchu, lang)}
              {lang === 'en' ? ' Day' : '日'} ／ {lang === 'en' ? 'hour ' : '吉时 '}
              {nextGood.goodHours[0]?.name ?? '—'}
              {lang === 'en' ? '' : '时'}
            </span>
          </div>
          <Icon name="right" size={14} />
        </div>
      )}

      <div className="sect">
        <h3>{lang === 'en' ? 'Active lesson periods' : '进行中的课期'}</h3>
        <em>{lang === 'en' ? 'Active' : '进行中'}</em>
        <a role="button" tabIndex={0} onClick={() => switchTab('reports')} onKeyDown={(e) => e.key === 'Enter' && switchTab('reports')}>
          {t('common.all', lang)}
        </a>
      </div>
      <div className="card flat" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => switchTab('reports')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <Chip tone="gold">{termText(ind.name, lang)}</Chip>
              <Chip>
                {draft.span} {lang === 'en' ? 'days' : '天课期'}
              </Chip>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 3 }}>
              {scans.length > 0
                ? scans[0].title
                : `${termText(ev.name, lang)} · ${lang === 'en' ? 'not run yet' : '尚未推演'}`}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>
              {scans.length > 0
                ? `${t('reports.count', lang, { n: scans.length })} · ${t('reports.createdAt', lang, { date: dottedDate(today) })}`
                : t('home.noRecent', lang)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="serif" style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
              {scans.length}
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '.08em' }}>{lang === 'en' ? 'reports' : '份'}</div>
          </div>
        </div>
      </div>

      <div className="sect">
        <h3>{lang === 'en' ? 'Start a lesson' : '起一课'}</h3>
        <em>{lang === 'en' ? 'New' : '新起'}</em>
      </div>
      <div className="quick">
        {quick.map((x) => (
          <button key={x[0]} type="button" onClick={() => push('event')}>
            <div className="qg">{x[1]}</div>
            <span>{x[2]}</span>
          </button>
        ))}
      </div>

      <div className="sect">
        <h3>{t('home.kbEntry', lang)}</h3>
        <em>{lang === 'en' ? 'Library' : '知库'}</em>
        <a role="button" tabIndex={0} onClick={() => switchTab('kb')} onKeyDown={(e) => e.key === 'Enter' && switchTab('kb')}>
          {t('nav.more', lang)}
        </a>
      </div>
      <div className="mini-art" role="button" tabIndex={0} onClick={() => push('article')}>
        <div className="thumb">
          <i />
          <b>曆</b>
        </div>
        <div className="mt">
          <b>{article.title[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh']}</b>
          <span>
            {termText(article.category, lang)} ／ {t('kb.minutes', lang, { n: article.minutes })}
          </span>
        </div>
      </div>
      <div style={{ height: 8 }} />
    </div>
  );
}

// 节气月索引（与 engine termIndexOfDate 同源，首页展示用）
function monthZhiOf(d: CalDate): number {
  return termIndexOfDate(d).monthZhi;
}

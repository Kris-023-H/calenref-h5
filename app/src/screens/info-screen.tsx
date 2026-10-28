/**
 * screens/info-screen.tsx — 录四柱（当事人 A/B + 时辰待核 + 课期区间 + 宗派 + 业态坐向）。
 * 当事人可「从档案选」跳 people 屏；档案数据来自 app-store。
 */

import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { readPerson } from '../engine/person';
import { eventByKey, isTwoPerson, PERSON_LABEL, PERSON_LABEL_B, hasWuxingLayer, hasSitLayer } from '../data/events';
import { cityById } from '../data/cities';
import { INDUSTRIES, industryById } from '../data/industries';
import { SITS } from '../data/sits';
import { ZHI } from '../engine/calendar/sexagenary';
import { t, termText, offsetMinText } from '../i18n';
import { Chip, Btn, Seg } from '../components/basics';
import { AppBar } from '../components/app-bar';
import { Icon } from '../components/icons';
import { START_OFFSETS, SPANS, WX_LABEL } from './ui-helpers';
import { useNav } from './types';
import type { SchoolKey } from '../engine/schools';
import type { Person, Lang } from '../engine/types';

/** 当前语言的 L10n 取列 */
function locOf(lang: Lang): 'zh' | 'en' | 'zhHant' {
  return lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh';
}

export function InfoScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const draft = useApp((s) => s.draft);
  const setDraft = useApp((s) => s.setDraft);
  const people = useApp((s) => s.people);
  const togglePerson = useApp((s) => s.togglePerson);
  const startScan = useApp((s) => s.startScan);
  const { push, pop } = useNav();
  const ev = eventByKey(draft.eventKey);
  const two = isTwoPerson(draft.eventKey);
  const ind = industryById(draft.industryId);
  const loc = locOf(lang);

  const personA = people.find((p) => p.id === draft.personIds[0]);
  const personB = people.find((p) => p.id === draft.personIds[1]);

  const schoolOptions: Array<{ value: SchoolKey; label: string }> = [
    { value: 'xingjia', label: lang === 'en' ? 'Marry-month' : '行嫁月派' },
    { value: 'bujiang', label: lang === 'en' ? 'Non-jiang' : '不将日派' },
    { value: 'jianchu', label: lang === 'en' ? 'Jianchu' : '建除派' },
  ];

  return (
    <div className="screen">
      <AppBar title={`${termText(ev.name, lang)} · ${lang === 'en' ? 'Pillars' : '录四柱'}`} onBack={() => pop()} actions={<Chip>{ev.group}</Chip>} />
      <h2 className="tt">
        {two ? (lang === 'en' ? 'Both pillars' : '双方四柱') : lang === 'en' ? 'Subject pillars' : '当事人四柱'}
        <small>
          {two
            ? lang === 'en'
              ? 'Marriage reads the woman’s marry-month and checks the man’s clash — both required.'
              : '嫁娶取课以女命定行嫁月、以男命查日辰冲命，两造皆须。'
            : lang === 'en'
              ? 'Birthplace corrects true solar time; one hour off and the hour pillar changes.'
              : '出生地用于真太阳时校正；时刻错一位，时柱即错，四柱全变。'}
        </small>
      </h2>

      <PersonSlot
        lang={lang}
        person={personA}
        title={PERSON_LABEL[draft.eventKey]?.[loc] ?? t('person.title', lang)}
        tag={two ? (lang === 'en' ? 'marry-month' : '取月用女命') : lang === 'en' ? 'year pillar' : '年命'}
        onPick={() => push('people')}
        onClear={() => personA && togglePerson(personA.id)}
      />
      {two && (
        <PersonSlot
          lang={lang}
          person={personB}
          title={PERSON_LABEL_B[draft.eventKey]?.[loc] ?? t('person.title', lang)}
          tag={lang === 'en' ? 'clash check' : '查日辰冲命'}
          onPick={() => push('people')}
          onClear={() => personB && togglePerson(personB.id)}
        />
      )}

      <div className="pblock">
        <div className="ph">
          <div className="pn">{lang === 'en' ? 'T' : '时'}</div>
          <div className="pt">
            {lang === 'en' ? 'Hour unverified' : '时辰待核'}
            <small>{lang === 'en' ? 'elders often remember the date only' : '长辈多只记日期，不记时刻'}</small>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <div
              className={`switch${draft.generic ? ' on' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => setDraft({ generic: !draft.generic })}
              onKeyDown={(e) => e.key === 'Enter' && setDraft({ generic: !draft.generic })}
            >
              <div className="sw" />
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7 }}>
          {lang === 'en' ? (
            <>
              When on, the lesson runs in <b style={{ color: 'var(--ink-2)' }}>generic mode</b> and the report is flagged “hour unverified”.
            </>
          ) : (
            <>
              开启后按<b style={{ color: 'var(--ink-2)' }}>通用模式</b>取课，报告标注「时辰待核」。传统做法是 0–23 时双算取交集。
            </>
          )}
        </div>
      </div>

      <div className="pblock">
        <div className="ph">
          <div className="pn">{lang === 'en' ? 'P' : '期'}</div>
          <div className="pt">
            {lang === 'en' ? 'Lesson window' : '课期区间'}
            <small>{lang === 'en' ? 'a wider window meets more fitting days' : '区间越宽，越可能撞上真正合的日子'}</small>
          </div>
        </div>
        <div className="row2">
          <div className="fld">
            <label>{lang === 'en' ? 'Start from' : '起课自'}</label>
            <div className="unit">
              <select value={String(draft.startOffset)} onChange={(e) => setDraft({ startOffset: Number(e.target.value) })}>
                {START_OFFSETS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label[lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="fld">
            <label>{lang === 'en' ? 'Window' : '课期长度'}</label>
            <div className="unit">
              <select value={String(draft.span)} onChange={(e) => setDraft({ span: Number(e.target.value) })}>
                {SPANS.map((s) => (
                  <option key={s} value={s}>
                    {s} {lang === 'en' ? 'days' : '天'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="pblock">
        <div className="ph">
          <div className="pn">{lang === 'en' ? 'S' : '派'}</div>
          <div className="pt">
            {t('school.title', lang)}
            <small>{lang === 'en' ? 'schools differ — the report gives all three' : '宗派不同，结论会不同——报告给出三派对照'}</small>
          </div>
        </div>
        <Seg options={schoolOptions} value={draft.school} onChange={(v) => setDraft({ school: v })} />
        <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.7 }}>
          {draft.school === 'xingjia'
            ? lang === 'en'
              ? 'Marry-month school: fix the months by the woman’s year branch first, then screen days.'
              : '行嫁月派：先按女命年支定「哪几个月可办」，再筛日课。华人婚俗主流，嫁娶与订盟取此。'
            : draft.school === 'bujiang'
              ? lang === 'en'
                ? 'Non-jiang school: takes yin-yang non-jiang days, lighter on the marry-month.'
                : '不将日派：以阴阳不将日为主，不重行嫁月，适合不讲究女方月份的家庭。'
              : lang === 'en'
                ? 'Jianchu school: only the twelve officers and sha — best cross-cultural fit, common for business.'
                : '建除派：只取建除十二值神与神煞，不取行嫁月，跨文化适用性最好，营生与工程类多用。'}
        </div>
      </div>

      {(hasWuxingLayer(draft.eventKey) || hasSitLayer(draft.eventKey)) && (
        <div className="pblock">
          <div className="ph">
            <div className="pn">{lang === 'en' ? 'B' : '业'}</div>
            <div className="pt">
              {lang === 'en' ? 'Trade & facing' : '业态与坐向'}
              <small>
                {hasWuxingLayer(draft.eventKey)
                  ? lang === 'en'
                    ? 'trade five-phase and facing are the second variable set'
                    : '取业态五行与坐向，是营生课的第二组变量'
                  : lang === 'en'
                    ? 'facing matters; a clash with the mountain is a hard veto'
                    : '重方位与山运，坐向冲山即为硬忌'}
              </small>
            </div>
          </div>
          {hasWuxingLayer(draft.eventKey) && (
            <div className="fld">
              <label>{lang === 'en' ? 'Trade (industry)' : '业态（行业门类）'}</label>
              <div className="unit">
                <select value={draft.industryId ?? ''} onChange={(e) => setDraft({ industryId: e.target.value })}>
                  {INDUSTRIES.map((x) => (
                    <option key={x.id} value={x.id}>
                      {termText(x.category, lang)} · {termText(x.name, lang)}（{WX_LABEL[x.wuxing][lang]}）
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {hasSitLayer(draft.eventKey) && (
            <div className="fld">
              <label>{t('sit.title', lang)}</label>
              <div className="unit">
                <select value={draft.sitKey ?? ''} onChange={(e) => setDraft({ sitKey: e.target.value })}>
                  {SITS.map((x) => (
                    <option key={x.key} value={x.key}>
                      {termText(x.name, lang)}（{ZHI[x.zhi]}
                      {lang === 'en' ? ' mountain' : '山'}）
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div className="indcard" style={{ marginTop: 2 }}>
            <div className="ic-h">
              <b>{termText(ind.name, lang)}</b>
              <span className="ic-cd">{termText(ind.category, lang)}</span>
              <span className="tx-w" style={{ marginLeft: 'auto' }}>
                {WX_LABEL[ind.wuxing][lang]}
              </span>
            </div>
            <div className="ic-note">{ind.note[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh']}</div>
            <div className="ic-grid">
              <div>
                <em>{t('industry.actsLabel', lang)}</em>
                <b>{ind.acts[0]?.[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh'] ?? '—'}</b>
              </div>
              <div>
                <em>{lang === 'en' ? 'Second' : '次动作'}</em>
                <b>{ind.acts[1]?.[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh'] ?? '—'}</b>
              </div>
            </div>
            <div className="ic-bk">
              {t('industry.booksLabel', lang)}：{ind.books.join('　')}
            </div>
          </div>
        </div>
      )}

      <div className="whybar" style={{ marginBottom: 10 }} role="button" tabIndex={0} onClick={() => setDraft({ generic: true })}>
        <Icon name="info" size={13} />
        <div>
          {lang === 'en' ? (
            <>
              <b>No pillars? Still works.</b> Run in generic mode — flagged, not tuned to your year pillar.
            </>
          ) : (
            <>
              <b>不填生辰也能看</b>　直接取通书口径排课，结果标注「通用模式」，不针对年命。
            </>
          )}
        </div>
        <Icon name="right" size={11} className="ar" />
      </div>

      <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 6, lineHeight: 1.7 }}>
        {lang === 'en' ? (
          <>
            Pillar data is computed in this browser only, never uploaded.
            <br />
            Traditional folk reference; no guarantee of outcomes.
          </>
        ) : (
          <>
            四柱资料仅在本机浏览器内计算，不上传服务器。
            <br />
            传统民俗参考，不构成任何结果保证。
          </>
        )}
      </div>

      <div className="ctabar">
        <Btn
          block
          disabled={!draft.generic && draft.personIds.length === 0}
          onClick={() => {
            void startScan().then(() => push('calc'));
          }}
        >
          {lang === 'en' ? 'Run lesson' : '排课'} · {lang === 'en' ? `${draft.span} days` : `课期 ${draft.span} 天`}
        </Btn>
      </div>
    </div>
  );
}

/** 当事人槽位（A/B）：显示档案摘要 + 真太阳时校正 */
function PersonSlot({
  lang,
  person,
  title,
  tag,
  onPick,
  onClear,
}: {
  lang: 'zh' | 'en' | 'zh-Hant';
  person: Person | undefined;
  title: string;
  tag: string;
  onPick: () => void;
  onClear: () => void;
}): JSX.Element {
  if (!person) {
    return (
      <div className="pblock">
        <div className="ph">
          <div className="pn">{tag.slice(0, 1)}</div>
          <div className="pt">
            {title}
            <small>{tag}</small>
          </div>
        </div>
        <Btn variant="gold" block onClick={onPick}>
          {lang === 'en' ? 'Choose from files' : '从档案选'}
        </Btn>
      </div>
    );
  }
  const r = readPerson(person);
  const city = cityById(person.birthCityId);
  return (
    <div className="pblock">
      <div className="ph">
        <div className="pn">{person.name.slice(0, 1) || '当'}</div>
        <div className="pt">
          {person.name}
          <small>{title}</small>
        </div>
        <div className="pd">
          <button type="button" className="pkbtn" onClick={onClear}>
            {lang === 'en' ? 'Change' : '更换'}
          </button>
          {r.zodiac}
          {lang === 'en' ? ' year · true solar ' : '年 · 真太阳时 '}
          {r.trueTime}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <div className="fld">
          <label>{t('person.birthDate', lang)}</label>
          <input className="input" type="date" value={person.birthDate} readOnly />
        </div>
        <div className="fld">
          <label>{t('person.birthTime', lang)}</label>
          <input className="input" type="time" value={person.birthTime} readOnly />
        </div>
      </div>
      <div className="fld">
        <label>{t('person.birthCity', lang)}</label>
        <input className="input" type="text" value={city ? `${lang === 'en' ? city.en : city.zh}（${city.lon}°E）` : person.birthCityId ?? ''} readOnly />
      </div>
      <div className={`tsnote${r.dst ? ' warn' : ''}`}>
        <Icon name="info" size={12} />
        <div>
          {t('person.readingTrue', lang)}：{person.birthTime}（{city ? (lang === 'en' ? city.en : city.zh) : ''}）→ <b>{r.trueTime}</b>（
          {offsetMinText(r.offsetMin, lang)}）
          {r.dst && (
            <>
              <br />
              {lang === 'en'
                ? 'China observed DST from Apr–Sep that year; the birth hour rolls back one hour or the hour pillar is wrong.'
                : '该年 4–9 月实行夏令时，出生时刻须回拨 1 小时，否则时柱即错。'}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * screens/info-screen.tsx — 录出生资料（当事人 A/B + 时辰待核 + 推演区间 + 宗派 + 业态坐向）。
 * 当事人可「从档案选」跳 people 屏；档案数据来自 app-store。
 */

import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { readPerson } from '../engine/person';
import { eventByKey, groupText, isTwoPerson, PERSON_LABEL, PERSON_LABEL_B, hasWuxingLayer, hasSitLayer } from '../data/events';
import { cityById } from '../data/cities';
import { INDUSTRIES, industryById } from '../data/industries';
import { SITS } from '../data/sits';
import { ZHI } from '../engine/calendar/sexagenary';
import { t, offsetMinText, termText, tx } from '../i18n';
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
    { value: 'xingjia', label: tx('婚月派', 'Marriage-month', lang) },
    { value: 'bujiang', label: tx('不将日派', 'Non-jiang', lang) },
    { value: 'jianchu', label: tx('建除派', 'Jianchu', lang) },
  ];

  return (
    <div className="screen">
      <AppBar title={`${termText(ev.name, lang)} · ${tx('录出生资料', 'Birth details', lang)}`} onBack={() => pop()} actions={<Chip>{groupText(ev.group, lang)}</Chip>} />
      <h2 className="tt">
        {two ? (tx('双方出生资料', 'Both profiles', lang)) : tx('当事人出生资料', 'Personal context (optional)', lang)}
        <small>
          {two
            ? tx('嫁娶以女方定婚月、以男方查日辰冲年，两造皆须。', 'Marriage reads the bride’s marriage months and checks the groom’s day clash — both required.', lang)
            : tx('出生地用于真太阳时校正；时刻错一位，时柱即错，干支全变。', 'Birthplace corrects true solar time; one hour off and the whole cycle changes.', lang)}
        </small>
      </h2>

      <PersonSlot
        lang={lang}
        person={personA}
        title={PERSON_LABEL[draft.eventKey]?.[loc] ?? t('person.title', lang)}
        tag={two ? (tx('取月依女方', 'marriage-month', lang)) : tx('出生年', 'birth year', lang)}
        onPick={() => push('people')}
        onClear={() => personA && togglePerson(personA.id)}
      />
      {two && (
        <PersonSlot
          lang={lang}
          person={personB}
          title={PERSON_LABEL_B[draft.eventKey]?.[loc] ?? t('person.title', lang)}
          tag={tx('查日辰冲年', 'clash check', lang)}
          onPick={() => push('people')}
          onClear={() => personB && togglePerson(personB.id)}
        />
      )}

      <div className="pblock">
        <div className="ph">
          <div className="pn">{tx('时', 'T', lang)}</div>
          <div className="pt">
            {tx('时辰待核', 'Hour unverified', lang)}
            <small>{tx('长辈多只记日期，不记时刻', 'elders often remember the date only', lang)}</small>
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
        <div
          style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{
            __html: tx(
              '开启后按<b style="color:var(--ink-2)">通用模式</b>取课，报告标注「时辰待核」。传统做法是 0–23 时双算取交集。',
              'When on, the lesson runs in <b style="color:var(--ink-2)">generic mode</b> and the report is flagged “hour unverified”.',
              lang,
            ),
          }}
        />
      </div>

      <div className="pblock">
        <div className="ph">
          <div className="pn">{tx('期', 'P', lang)}</div>
          <div className="pt">
            {tx('推演区间', 'Date range', lang)}
            <small>{tx('区间越宽，越可能撞上真正合的日子', 'a wider window meets more fitting days', lang)}</small>
          </div>
        </div>
        <div className="row2">
          <div className="fld">
            <label>{tx('起算自', 'Start from', lang)}</label>
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
            <label>{tx('推演天数', 'Window', lang)}</label>
            <div className="unit">
              <select value={String(draft.span)} onChange={(e) => setDraft({ span: Number(e.target.value) })}>
                {SPANS.map((s) => (
                  <option key={s} value={s}>
                    {s} {tx('天', 'days', lang)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="pblock">
        <div className="ph">
          <div className="pn">{tx('派', 'S', lang)}</div>
          <div className="pt">
            {t('school.title', lang)}
            <small>{tx('口径不同，结论会不同——报告给出多口径对照', 'approaches differ — the report gives a multi-approach comparison', lang)}</small>
          </div>
        </div>
        <Seg options={schoolOptions} value={draft.school} onChange={(v) => setDraft({ school: v })} />
        <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.7 }}>
          {draft.school === 'xingjia'
            ? tx('婚月派：先按女方年支定「哪几个月可办」，再筛当日。华人婚俗主流，嫁娶与订盟取此。', 'Marriage-month school: fix the months by the bride’s birth year first, then screen days.', lang)
            : draft.school === 'bujiang'
              ? tx('不将日派：以阴阳不将日为主，不重婚月，适合不讲究女方月份的家庭。', 'Non-jiang school: takes yin-yang non-jiang days, lighter on the marriage months.', lang)
              : tx('建除派：只取建除十二值日，不取婚月，跨文化适用性最好，营生与工程类多用。', 'Jianchu school: only the twelve day officers — best cross-cultural fit, common for business.', lang)}
        </div>
      </div>

      {(hasWuxingLayer(draft.eventKey) || hasSitLayer(draft.eventKey)) && (
        <div className="pblock">
          <div className="ph">
            <div className="pn">{tx('业', 'B', lang)}</div>
            <div className="pt">
              {tx('业态与坐向', 'Trade & facing', lang)}
              <small>
                {hasWuxingLayer(draft.eventKey)
                  ? tx('取业态五行与坐向，是营生课的第二组变量', 'trade five-phase and facing are the second variable set', lang)
                  : tx('重方位与山运，坐向冲山即为硬忌', 'facing matters; a clash with the mountain is a hard veto', lang)}
              </small>
            </div>
          </div>
          {hasWuxingLayer(draft.eventKey) && (
            <div className="fld">
              <label>{tx('业态（行业门类）', 'Trade (industry)', lang)}</label>
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
                      {tx('山', ' mountain', lang)}）
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
                <em>{tx('次动作', 'Second', lang)}</em>
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
        <div
          dangerouslySetInnerHTML={{
            __html: tx(
              '<b>不填生辰也能看</b>　直接取通书口径推演，结果标注「通用模式」，不针对出生年。',
              '<b>No pillars? Still works.</b> Run in generic mode — flagged, not tuned to your year pillar.',
              lang,
            ),
          }}
        />
        <Icon name="right" size={11} className="ar" />
      </div>

      <div
        style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 6, lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{
          __html: tx(
            '出生资料仅在本机浏览器内计算，不上传服务器。<br>传统民俗参考，不构成任何结果保证。',
            'Pillar data is computed in this browser only, never uploaded.<br>Traditional folk reference; no guarantee of outcomes.',
            lang,
          ),
        }}
      />

      <div className="ctabar">
        <Btn
          block
          disabled={!draft.generic && draft.personIds.length === 0}
          onClick={() => {
            void startScan().then(() => push('calc'));
          }}
        >
          {tx('推演', 'Run reading', lang)} · {tx(`推演 ${draft.span} 天`, `${draft.span} days`, lang)}
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
          {tx('从档案选', 'Choose from files', lang)}
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
          <small>
            {person.sex === 'f' ? t('person.female', lang) : t('person.male', lang)}
            {' · '}
            {tx('角色', 'Role', lang)}：{title}
          </small>
        </div>
        <div className="pd">
          <button type="button" className="pkbtn" onClick={onClear}>
            {tx('更换', 'Change', lang)}
          </button>
          {r.zodiac}
          {tx('年 · 真太阳时 ', ' year · true solar ', lang)}
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
        <input className="input" type="text" value={city ? `${tx(city.zh, city.en, lang)}（${city.lon}°E）` : person.birthCityId ?? ''} readOnly />
      </div>
      <div className={`tsnote${r.dst ? ' warn' : ''}`}>
        <Icon name="info" size={12} />
        <div>
          {t('person.readingTrue', lang)}：{person.birthTime}（{city ? tx(city.zh, city.en, lang) : ''}）→ <b>{r.trueTime}</b>（
          {offsetMinText(r.offsetMin, lang)}）
          {r.dst && (
            <>
              <br />
              {tx('该年 4–9 月实行夏令时，出生时刻须回拨 1 小时，否则时柱即错。', 'China observed DST from Apr–Sep that year; the birth hour rolls back one hour or the hour pillar is wrong.', lang)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

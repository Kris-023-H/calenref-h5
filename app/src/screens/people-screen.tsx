/**
 * screens/people-screen.tsx — 当事人档案：列表 + 新增/编辑表单（出生资料预览）。
 * 选人模式（selectFor）下点「用此人」直接回填 info 屏草稿。
 */

import { useState } from 'react';
import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { readPerson, birthGeo } from '../engine/person';
import { dayGZ, monthGZ, yearGZ, ZODIAC, ZHI } from '../engine/calendar/sexagenary';
import { termIndexOfDate } from '../engine/calendar/solar-terms';
import { CITIES, cityById } from '../data/cities';
import { newPersonId, validatePerson } from '../db/repos/person.repo';
import { t, tx } from '../i18n';
import type { MsgKey } from '../i18n';
import { Btn, Seg, Chip, EmptyState } from '../components/basics';
import { AppBar } from '../components/app-bar';
import { Icon } from '../components/icons';
import { useNav, useParams } from './types';
import type { Person } from '../engine/types';

const BLANK: Person = {
  id: '',
  schemaVersion: 5,
  name: '',
  sex: 'f',
  birthDate: '1990-06-15',
  birthTime: '08:00',
  birthCityId: 'beijing',
  note: '',
  createdAt: 0,
};

export function PeopleScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const params = useParams('people', undefined);
  const selectFor = params?.selectFor;
  const people = useApp((s) => s.people);
  const draft = useApp((s) => s.draft);
  const savePerson = useApp((s) => s.savePerson);
  const removePerson = useApp((s) => s.removePerson);
  const setDraft = useApp((s) => s.setDraft);
  const showToast = useUi((s) => s.showToast);
  const { pop, push } = useNav();
  const [form, setForm] = useState<Person | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);

  const inUse = (p: Person): boolean => draft.personIds.includes(p.id);

  // ---------- 表单模式 ----------
  if (form) {
    const r = readPerson(form);
    const dg = dayGZ({ y: r.y, m: r.m, d: r.d });
    const mz = termIndexOfDate({ y: r.y, m: r.m, d: r.d }).monthZhi;
    const hh = Number(r.trueTime.slice(0, 2));
    const hz = Math.floor(((hh + 1) % 24) / 2);
    const city = cityById(form.birthCityId);
    const editing = Boolean(form.id);

    const set = (patch: Partial<Person>): void => setForm({ ...form, ...patch });

    return (
      <div className="screen">
        <AppBar
          title={editing ? t('person.edit', lang) : t('person.add', lang)}
          onBack={() => setForm(null)}
          actions={<Chip>{editing ? t('common.edit', lang) : t('common.add', lang)}</Chip>}
        />
        <h2 className="tt">
          {editing ? (tx('修改这一位', 'Edit this person', lang)) : tx('录入一位当事人', 'Add a person', lang)}
          <small>
            {tx('出生地与时刻决定真太阳时；时刻错一位，时柱即错。', 'Birthplace and time decide true solar time; one hour off and the hour pillar is wrong.', lang)}
          </small>
        </h2>

        <div className="pblock">
          <div className="ph">
            <div className="pn">{editing ? (tx('改', 'E', lang)) : tx('新', 'N', lang)}</div>
            <div className="pt">
              {tx('基本资料', 'Basics', lang)}
              <small>{tx('仅存本机', 'stored on this device only', lang)}</small>
            </div>
            <div className="pd">
              {r.zodiac}
              {tx('年 · 真太阳时 ', ' year · true solar ', lang)}
              {r.trueTime}
            </div>
          </div>
          <div className="fld">
            <label>{t('person.name', lang)}</label>
            <input className="input" type="text" value={form.name} placeholder={t('person.namePh', lang)} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div className="fld">
            <label>{t('person.sex', lang)}</label>
            <Seg
              options={[
                { value: 'f', label: t('person.female', lang) },
                { value: 'm', label: t('person.male', lang) },
              ]}
              value={form.sex}
              onChange={(v) => set({ sex: v })}
            />
          </div>
          <div className="row2">
            <div className="fld">
              <label>{t('person.birthDate', lang)}</label>
              <input className="input" type="date" value={form.birthDate} onChange={(e) => set({ birthDate: e.target.value })} />
            </div>
            <div className="fld">
              <label>{t('person.birthTime', lang)}</label>
              <input className="input" type="time" value={form.birthTime} onChange={(e) => set({ birthTime: e.target.value })} />
            </div>
          </div>
          <div className="fld">
            <label>{t('person.birthCity', lang)}</label>
            <div className="unit">
              <select className="input" value={form.birthCityId ?? ''} onChange={(e) => set({ birthCityId: e.target.value, manualLon: undefined, manualLat: undefined })}>
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {tx(c.zh, c.en, lang)}（{c.lon >= 0 ? 'E' : 'W'} {Math.abs(c.lon).toFixed(2)}°）
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={`tsnote${r.dst ? ' warn' : ''}`}>
            <Icon name="info" size={12} />
            <div>
              {t('person.readingTrue', lang)}：{form.birthTime}（{city ? tx(city.zh, city.en, lang) : ''}）→ <b>{r.trueTime}</b>
              {r.dst && (
                <>
                  <br />
                  {tx('该年 4–9 月实行夏令时，出生时刻须回拨 1 小时，否则时柱即错。', 'China DST that year — the birth hour rolls back one hour.', lang)}
                </>
              )}
            </div>
          </div>
          <div className="fld" style={{ marginTop: 10 }}>
            <label>{t('person.note', lang)}</label>
            <input className="input" type="text" value={form.note ?? ''} placeholder={t('person.notePh', lang)} onChange={(e) => set({ note: e.target.value })} />
          </div>
        </div>

        <div className="card flat" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, letterSpacing: '.16em', color: 'var(--muted)', fontWeight: 700, marginBottom: 9 }}>
            {t('person.readingPillars', lang)}
          </div>
          <div className="rtab" style={{ border: 'none' }}>
            <div className="rtab-row">
              <div>{t('detail.pillarYear', lang)}</div>
              <div>
                <b>{r.yearGZ.text}</b>　{t('person.readingZodiac', lang)} {r.zodiac}
              </div>
            </div>
            <div className="rtab-row">
              <div>{t('detail.pillarMonth', lang)}</div>
              <div>
                <b>{monthGZ(r.yearGZ.gan, mz)}</b>　{ZHI[mz]}
                {tx('月建', ' month', lang)}
              </div>
            </div>
            <div className="rtab-row">
              <div>{t('detail.pillarDay', lang)}</div>
              <div>
                <b>{dg.text}</b>
              </div>
            </div>
            <div className="rtab-row">
              <div>{t('detail.pillarHour', lang)}</div>
              <div>
                <b>{hourGz(dg.gan, hz)}</b>　{ZHI[hz]}
                {tx('时', ' hour', lang)}（{r.trueTime}）
              </div>
            </div>
          </div>
        </div>

        {editing && (
          <button
            type="button"
            className="pe-del"
            onClick={() => {
              if (!confirmDel) {
                setConfirmDel(true);
                return;
              }
              void removePerson(form.id).then(() => {
                setForm(null);
                setConfirmDel(false);
                showToast(tx('已删除该档案', 'Deleted', lang));
              });
            }}
          >
            {confirmDel ? (tx('再点一次确认删除', 'Tap again to confirm', lang)) : t('common.delete', lang)}
          </button>
        )}

        <div className="ctabar">
          <Btn
            block
            variant="gold"
            onClick={() => {
              const rec: Person = editing
                ? { ...form }
                : { ...form, id: newPersonId(), createdAt: Date.now() };
              const v = validatePerson(rec);
              if (!v.ok) {
                showToast(t((v.msgKey ?? 'err.unknown') as MsgKey, lang));
                return;
              }
              void savePerson(rec).then((res) => {
                if (!res.ok) {
                  showToast(t((res.msgKey ?? 'err.unknown') as MsgKey, lang));
                  return;
                }
                setForm(null);
                setConfirmDel(false);
                showToast(editing ? t('common.saved', lang) : tx('已存入档案', 'Saved to files', lang));
              });
            }}
          >
            {editing ? t('common.save', lang) : tx('存入档案', 'Save to files', lang)}
          </Btn>
        </div>
      </div>
    );
  }

  // ---------- 列表模式 ----------
  return (
    <div className="screen">
      <AppBar
        title={t('person.list', lang)}
        onBack={() => (selectFor ? pop() : pop())}
        actions={<Chip>{people.length}</Chip>}
      />
      <h2 className="tt">
        {t('person.list', lang)}
        <small>{tx('出生资料录一次，往后每次查询直接调用，不必重填。', 'Enter birth details once; reuse them in every reading.', lang)}</small>
      </h2>
      {selectFor && (
        <div className="whybar" style={{ marginBottom: 12 }}>
          <Icon name="info" size={13} />
          <div
            dangerouslySetInnerHTML={{
              __html: tx(
                `正在为<b>「${selectFor === 'b' ? '第二位' : '当事人'}」</b>选人，点「用此人」即填入。`,
                `Choosing for <b>“${selectFor === 'b' ? 'second party' : 'subject'}”</b> — tap “use” to fill in.`,
                lang,
              ),
            }}
          />
        </div>
      )}

      <div className="pe-stat">
        <div>
          <b>{people.length}</b>
          <span>{tx('已存档案', 'files', lang)}</span>
        </div>
        <div>
          <b>{people.filter(inUse).length}</b>
          <span>{tx('本次查询在用', 'in this query', lang)}</span>
        </div>
        <div>
          <b>{people.filter((p) => p.sex === 'f').length}</b>
          <span>{tx('女方 · 取月用', 'female', lang)}</span>
        </div>
      </div>

      <div className="pe-head">
        {tx('档案列表', 'Files', lang)}
        <i />
      </div>

      {people.length === 0 ? (
        <EmptyState
          mark="user"
          title={t('person.empty', lang)}
          body={t('person.emptyHint', lang)}
          action={
            <Btn variant="gold" onClick={() => setForm({ ...BLANK })}>
              {tx('录入第一位', 'Add the first', lang)}
            </Btn>
          }
        />
      ) : (
        <div className="persons">
          {people.map((p) => {
            const r = readPerson(p);
            const use = inUse(p);
            return (
              <div
                key={p.id}
                className={`person ${p.sex}${use ? ' inuse' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => setForm({ ...p })}
                onKeyDown={(e) => e.key === 'Enter' && setForm({ ...p })}
              >
                <div className="pa-av">{p.name.slice(0, 1) || '当'}</div>
                <div className="pa-b">
                  <div className="pa-n">
                    {p.name || t('common.unknown', lang)}
                    {use && <em>{tx('本次查询在用', 'in use', lang)}</em>}
                  </div>
                  <div className="pa-m">
                    {p.sex === 'f' ? t('person.female', lang) : t('person.male', lang)} · {p.birthDate.replace(/-/g, '.')} {p.birthTime} ·{' '}
                    {cityById(p.birthCityId) ? tx(cityById(p.birthCityId)!.zh, cityById(p.birthCityId)!.en, lang) : birthGeo(p).cityName}
                  </div>
                  <div className="pa-x">
                    <b>
                      {tx('真太阳时 ', 'true solar ', lang)}
                      {r.trueTime}
                    </b>{' '}
                    · {t('person.readingZodiac', lang)} {r.zodiac}
                    {p.note ? ` · ${p.note}` : ''}
                  </div>
                </div>
                <div className="pa-r">
                  <span className="pa-z">{r.yearGZ.text}年</span>
                  {selectFor ? (
                    <button
                      type="button"
                      className="pa-pick"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDraft({
                          personIds:
                            selectFor === 'b'
                              ? [draft.personIds[0], p.id].filter(Boolean)
                              : [p.id, ...(draft.personIds[1] ? [draft.personIds[1]] : [])].filter(Boolean),
                        });
                        showToast(t('common.saved', lang));
                        pop();
                      }}
                    >
                      {tx('用此人', 'Use', lang)}
                    </button>
                  ) : (
                    <Icon name="right" size={12} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Btn block variant="gold" onClick={() => setForm({ ...BLANK })} style={{ marginTop: 4 }}>
        {t('person.add', lang)}
      </Btn>
      <div
        className="pe-tip"
        dangerouslySetInnerHTML={{
          __html: tx(
            '出生资料仅存于本机浏览器，不上传服务器。<br>嫁娶与订盟须录双方：以女方定婚月，以男方查日辰冲年。',
            'Birth data stays in this browser; never uploaded.<br>Marriage and engagement need both parties.',
            lang,
          ),
        }}
      />
      <Btn variant="ghost" block onClick={() => push('info')} style={{ marginTop: 10 }}>
        {t('nav.back', lang)} · {t('scan.setting', lang)}
      </Btn>
    </div>
  );
}

/** 五鼠遁时干 */
function hourGz(dayGanIdx: number, hourZhi: number): string {
  const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  return GAN[((dayGanIdx % 5) * 2 + hourZhi) % 10] + ZHI[hourZhi];
}

export { yearGZ, ZODIAC };

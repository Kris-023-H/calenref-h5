/**
 * screens/report-screen.tsx — 九章课期报告（结论 / 取用 / 四柱 / 可用清单 / 出局归因 / 动作时点 / 节奏 / AI / 附则）。
 * 报告正文由 session.result 现场组装；未解锁时引导至 pay 屏（权益由 license.repo 判定）。
 */

import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { licenseRepo } from '../db/repos/license.repo';
import { eventByKey } from '../data/events';
import { industryById } from '../data/industries';
import { sitByKey } from '../data/sits';
import { readPerson } from '../engine/person';
import { fourPillarsOf } from '../engine/pillars';
import { addDays } from '../engine/calendar/julian';
import { ZHI, MONTH_NAME } from '../engine/calendar/sexagenary';
import { t, termText, hardReasonText, layerName, layerResultText, jianchuName, isoDate } from '../i18n';
import { RULE_VERSION } from '../engine/types';
import { Ring, Chip, Btn, EmptyState, Bar } from '../components/basics';
import { AppBar, IconBtn } from '../components/app-bar';
import { Icon } from '../components/icons';
import { SectionHead } from '../components/basics';
import { dottedDate, monthDay, weekdayShort, gradeLabel } from './ui-helpers';
import { useNav } from './types';
import type { Lang } from '../engine/types';

export function ReportScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const session = useApp((s) => s.session);
  const cursor = useApp((s) => s.session?.cursor ?? 0);
  const saveReport = useApp((s) => s.saveReport);
  const aiSections = useApp((s) => s.aiSections);
  const openSheet = useUi((s) => s.openSheet);
  const showToast = useUi((s) => s.showToast);
  const { pop, push } = useNav();

  if (!session) {
    return (
      <div className="screen">
        <AppBar title={t('report.title', lang)} onBack={() => pop()} />
        <EmptyState mark="doc" title={t('report.notFound', lang)} />
      </div>
    );
  }

  const s = session.result;
  const ev = eventByKey(s.input.eventKey);
  const ind = industryById(s.input.industryId);
  const sit = sitByKey(s.input.sitKey ?? 'ziwu');
  const list = s.usable;
  const top = list[cursor] ?? list[0] ?? s.days[0];
  const readings = s.input.people.map((p) => readPerson(p));
  const startIso = isoDate(s.input.startDate);
  const endIso = isoDate(addDays(s.input.startDate, s.total - 1));
  const fp = fourPillarsOf(top, top.goodHours[0]?.index ?? 0);

  const checkAccess = (go: () => void): void => {
    void licenseRepo.hasUnlimited().then((unlimited) => {
      if (unlimited) {
        go();
        return;
      }
      void licenseRepo.totalLeft().then((left) => {
        if (left > 0) go();
        else push('pay');
      });
    });
  };

  return (
    <div className="screen">
      <AppBar
        title={t('report.title', lang)}
        onBack={() => pop()}
        actions={
          <>
            <IconBtn name="down" label={lang === 'en' ? 'Export' : '导出'} onClick={() => showToast(lang === 'en' ? 'Document exported' : '已导出文档')} />
            <IconBtn name="share" label={t('share.title', lang)} onClick={() => openSheet('share')} />
          </>
        }
      />

      {/* 封面 */}
      <div className="dhero" style={{ padding: '20px 18px' }}>
        <div style={{ position: 'relative' }}>
          <div className="k">
            {t('report.title', lang)} ／ {t('app.ruleVersion', lang)} {RULE_VERSION}
          </div>
          <div className="serif" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4, margin: '2px 0 4px' }}>
            {termText(ev.name, lang)}
            {lang === 'en' ? ' lesson report' : '课期报告'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gold-2)', letterSpacing: '.1em', marginBottom: 10 }}>
            {termText(ind.name, lang)} ／ {termText(ind.category, lang)}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--on-lacquer-2)', lineHeight: 1.9 }}>
            {lang === 'en' ? 'Subjects' : '当事人'}　
            {readings.length > 0
              ? readings.map((r) => `${r.name}（${r.zodiac}${lang === 'en' ? ' · ' : '年·'}${r.trueTime}）`).join('　')
              : `${t('scan.generic', lang)} · ${lang === 'en' ? 'no pillars' : '未录四柱'}`}
            <br />
            {lang === 'en' ? 'Window' : '课期'}　　{startIso} — {endIso}（{s.total} {lang === 'en' ? 'days' : '天'}）
            <br />
            {lang === 'en' ? 'Facing' : '坐向'}　　{ZHI[sit.zhi]}
            {lang === 'en' ? ' mountain' : '山'}
          </div>
          <div className="dh-meta">
            <span>
              {lang === 'en' ? 'usable ' : '可用 '}
              {list.length} {lang === 'en' ? '' : '日'}
            </span>
            <span>
              {lang === 'en' ? 'excluded ' : '出局 '}
              {s.total - list.length} {lang === 'en' ? '' : '日'}
            </span>
            <span>
              {lang === 'en' ? 'first ' : '首选 '}
              {dottedDate(top.date)}
            </span>
          </div>
        </div>
      </div>

      {/* 一 结论 */}
      <SectionHead index="一" title={t('report.ch1', lang)} note={lang === 'en' ? 'first & alternates' : '首选与备选'} />
      <div className="card" style={{ borderColor: 'rgba(175,137,62,.5)', background: 'linear-gradient(178deg,#FFFBF0,var(--paper-2))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Ring value={top.score} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--gold)', fontWeight: 700 }}>
              {lang === 'en' ? 'FIRST CHOICE · ' : '首 选 课 · '}
              {gradeLabel(top.score, lang)}
            </div>
            <div className="serif" style={{ fontSize: 19, fontWeight: 700, margin: '3px 0 2px' }}>
              {dottedDate(top.date)}　{weekdayShort(top.weekday, lang)}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>
              {top.dayGZ.text}
              {lang === 'en' ? ' Day' : '日'} · {jianchuName(top.jianchu, lang)}
              {lang === 'en' ? ' Day' : '日'} · {lang === 'en' ? 'hour ' : '吉时 '}
              {top.goodHours[0]?.name ?? '—'}
              {lang === 'en' ? '' : '时'}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.85, marginTop: 11, paddingTop: 11, borderTop: '1px dashed var(--line)' }}>
          {top.layers
            .filter((l) => l.cls === 'ok' && ['marryMonth', 'monthBranch', 'jianchu', 'virtues', 'industryWuxing', 'sittingFacing'].includes(l.key))
            .slice(0, 3)
            .map((l) => `「${layerName(l.key, lang)}·${layerResultText(l, lang)}」`)
            .join('　')}
          。{lang === 'en' ? 'All three schools agree in direction: usable.' : '三派结论方向一致，可用。'}
        </div>
      </div>
      {list.length > 1 && (
        <div style={{ display: 'flex', gap: 7, marginTop: 9 }}>
          {list.slice(1, 4).map((d, i) => (
            <div key={dottedDate(d.date)} className="card flat" style={{ flex: 1, padding: 10, textAlign: 'center' }} role="button" tabIndex={0} onClick={() => push('detail')}>
              <div className="serif" style={{ fontSize: 14, fontWeight: 700 }}>
                {monthDay(d.date, lang)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>
                {d.score} · {jianchuName(d.jianchu, lang)}
              </div>
              <span hidden>{i}</span>
            </div>
          ))}
        </div>
      )}

      {/* 二 用事与取用 */}
      <SectionHead index="二" title={t('report.ch3', lang)} note={lang === 'en' ? 'variables' : '取用变量'} />
      <div className="rtab">
        <div className="rtab-row">
          <div>{lang === 'en' ? 'Matter' : '用事'}</div>
          <div>
            <b>{termText(ev.name, lang)}</b>（{ev.group}）
          </div>
        </div>
        <div className="rtab-row">
          <div>{lang === 'en' ? 'Trade' : '业态'}</div>
          <div>
            <b>{termText(ind.name, lang)}</b>　{ind.subs[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh']}
          </div>
        </div>
        <div className="rtab-row">
          <div>{t('industry.wuxingLabel', lang)}</div>
          <div>
            <b>{ind.wuxing}</b>　{t('detail.pillarDay', lang)} {top.dayGZ.text.slice(0, 1)}
          </div>
        </div>
        <div className="rtab-row">
          <div>{t('sit.title', lang)}</div>
          <div>
            <b>{ZHI[sit.zhi]}</b>（{termText(sit.name, lang)}）
          </div>
        </div>
        <div className="rtab-row">
          <div>{t('industry.noteLabel', lang)}</div>
          <div>{ind.note[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh']}</div>
        </div>
        <div className="rtab-row">
          <div>{t('industry.booksLabel', lang)}</div>
          <div>{ind.books.join('　')}</div>
        </div>
      </div>

      {/* 三 四柱 */}
      <SectionHead index="三" title={t('report.ch4', lang)} note={lang === 'en' ? 'pillars' : '四柱排布'} />
      <div className="rtab">
        <div className="rtab-row">
          <div>{t('detail.pillarYear', lang)}</div>
          <div>
            <b>{fp.year}</b>　{lang === 'en' ? 'year' : '岁次'}
          </div>
        </div>
        <div className="rtab-row">
          <div>{t('detail.pillarMonth', lang)}</div>
          <div>
            <b>{fp.month}</b>　{lang === 'en' ? 'month ' : '月建 '}
            {ZHI[top.monthZhi]}（{MONTH_NAME[top.monthZhi]}）
          </div>
        </div>
        <div className="rtab-row">
          <div>{t('detail.pillarDay', lang)}</div>
          <div>
            <b>{fp.day}</b>　{jianchuName(top.jianchu, lang)}
            {lang === 'en' ? ' day' : '日'}
          </div>
        </div>
        <div className="rtab-row">
          <div>{t('detail.pillarHour', lang)}</div>
          <div>
            <b>{fp.hour}</b>　{lang === 'en' ? 'first hour ' : '首选吉时 '}
            {top.goodHours[0]?.name ?? '—'}
            {lang === 'en' ? `（${top.goodHours[0]?.range ?? ''}）` : `时（${top.goodHours[0]?.range ?? ''}）`}
          </div>
        </div>
        <div className="rtab-row">
          <div>{t('common.score', lang)}</div>
          <div>
            <b>{top.score}</b>　{gradeLabel(top.score, lang)}
          </div>
        </div>
      </div>

      {/* 四 可用清单 */}
      <SectionHead index="四" title={lang === 'en' ? 'Usable days' : '可用课期清单'} note={`${list.length} ${lang === 'en' ? 'days' : '日'}`} />
      {list.slice(0, 8).map((d, i) => (
        <div key={dottedDate(d.date)} className="rrow" role="button" tabIndex={0} onClick={() => { push('detail'); }}>
          <div className="rrd">
            <b>{monthDay(d.date, lang)}</b>
            <span>{weekdayShort(d.weekday, lang)}</span>
          </div>
          <div className="rri">
            <b>
              {d.dayGZ.text}
              {lang === 'en' ? ' Day' : '日'} · {jianchuName(d.jianchu, lang)}
              {lang === 'en' ? ' Day' : '日'}
            </b>
            <span>
              {lang === 'en' ? 'hour ' : '吉时 '}
              {d.goodHours[0]?.name ?? '—'}
              {lang === 'en' ? '' : '时'} · {gradeLabel(d.score, lang)}
            </span>
          </div>
          <div className="rrp">
            <b>{d.score}</b>
            <span>{gradeLabel(d.score, lang)}</span>
          </div>
          <span hidden>{i}</span>
        </div>
      ))}
      {list.length > 8 && (
        <div className="hint" style={{ fontSize: 10, textAlign: 'center' }}>
          {lang === 'en' ? `${list.length - 8} more in the appendix (score desc)` : `其余 ${list.length - 8} 日见附录（按课格降序）`}
        </div>
      )}

      {/* 五 出局归因 */}
      <SectionHead index="五" title={lang === 'en' ? 'Exclusion attribution' : '出局归因'} note={lang === 'en' ? 'screening' : '筛选过程'} />
      <div className="card flat">
        {Object.entries(s.byReason).map(([k, n]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--line-2)' }}>
            <Chip tone={k === 'reason.scoreLow' ? 'plain' : 'verm'} style={{ flex: '0 0 auto' }}>
              {reasonLabel(k, lang)}
            </Chip>
            <span style={{ flex: 1, fontSize: 10.5, color: 'var(--muted)' }}>{lang === 'en' ? 'days' : '天'}</span>
            <b className="serif" style={{ fontSize: 14 }}>
              {n}
            </b>
          </div>
        ))}
        <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.75, marginTop: 9 }}>
          {lang === 'en'
            ? 'Excluded ≠ unlucky — it fails this lesson’s taking conditions. Clash of day/person, month-break and mountain-clash are hard vetoes; score below threshold is relaxable.'
            : '出局不等于「不吉」，是不合本课格的取用条件。日辰冲命、月破、冲山为硬性出局；课格评分不足为可放宽项。'}
        </div>
      </div>

      {/* 六 动作时点 */}
      <SectionHead index="六" title={lang === 'en' ? 'Key action hours' : '关键动作时点'} note={lang === 'en' ? 'good hours' : '吉时落点'} />
      <div className="acts">
        {ev.acts.map((a, i) => {
          const h = top.goodHours[i] ?? top.goodHours[0] ?? top.hours[0];
          return (
            <div key={a.zh} className="ac">
              <b>{a[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh']}</b>
              <span>
                {dottedDate(top.date)}　{h?.name ?? '—'}
                {lang === 'en' ? `（${h?.range ?? ''}）` : `时（${h?.range ?? ''}）`}　{i === 0 ? (lang === 'en' ? 'first' : '首取') : lang === 'en' ? 'next' : '次取'}
              </span>
            </div>
          );
        })}
      </div>
      <div className="hint" style={{ fontSize: 10 }}>
        {lang === 'en'
          ? 'Action hours follow good hours. If a slot conflicts with venue timing, change the day, not the hour — changing the hour discards this layer.'
          : '动作时点以吉时为准。若吉时与场地档期冲突，宁可改日，不可改时——改时等于弃掉这一层的取用。'}
      </div>

      {/* 七 节奏 */}
      <SectionHead index="七" title={lang === 'en' ? 'First-month rhythm' : '开市首月节奏'} note={lang === 'en' ? '90 days' : '九十日'} />
      <div className="rhythm">
        {[
          ['D1', lang === 'en' ? 'Open' : '开市', lang === 'en' ? 'first guest' : '首客 · 首单'],
          ['D3', lang === 'en' ? 'Settle' : '稳客', lang === 'en' ? 'repeat & revisit' : '复购与回访'],
          ['D7', lang === 'en' ? 'Review' : '小结', lang === 'en' ? 'week-one data' : '首周数据复盘'],
          ['D15', lang === 'en' ? 'Adjust' : '调整', lang === 'en' ? 'flow & roster' : '动线与排班'],
          ['D30', lang === 'en' ? 'Close' : '定盘', lang === 'en' ? 'monthly settle' : '月度结算'],
          ['D45', lang === 'en' ? 'Expand' : '扩客', lang === 'en' ? 'first ads' : '首轮投放'],
          ['D60', lang === 'en' ? 'Stock' : '固本', lang === 'en' ? 'supply & stock' : '供应与库存'],
          ['D90', lang === 'en' ? 'Re-run' : '再课', lang === 'en' ? 'expansion' : '扩店或二店'],
        ].map((x) => (
          <div key={x[0]}>
            <em>{x[0]}</em>
            <b>{x[1]}</b>
            <span>{x[2]}</span>
          </div>
        ))}
      </div>
      <div className="hint" style={{ fontSize: 10, marginTop: 8 }}>
        {lang === 'en'
          ? `This is the common opening rhythm for ${termText(ind.name, lang)} — unrelated to the day lesson, but equally affects the outcome.`
          : `此为${termText(ind.name, lang)}的通行开市节奏，与日课无关，但同样影响「开市」这件事的完成度。`}
      </div>

      {/* 八 AI */}
      <SectionHead index="八" title={lang === 'en' ? 'AI reading' : 'AI 解读'} note={lang === 'en' ? 'limited' : '限次解读'} />
      {aiSections.length === 4 ? (
        <>
          <div className="aicard">
            <div className="ai-h">
              <b>{t('ai.sec1', lang)}</b>
              <span>AI</span>
            </div>
            <div className="ai-p" dangerouslySetInnerHTML={{ __html: aiSections[0] }} />
          </div>
          <Btn variant="ghost" onClick={() => push('ai')}>
            {lang === 'en' ? 'Full reading & follow-ups' : '查看完整解读'}
          </Btn>
        </>
      ) : (
        <>
          <div className={`aibar${quotaLeft() <= 0 ? ' off' : ''}`}>
            <div className="ab-ic">
              <Icon name="ai" size={14} />
            </div>
            <div className="ab-t">
              <b>{lang === 'en' ? 'AI reads this lesson' : 'AI 解读本课'}</b>
              <span>{lang === 'en' ? 'cites rules · askable · 3/month' : '引规则出处 · 可追问 · 每月 3 次'}</span>
            </div>
            <div className="ab-q">{quotaLeft()}</div>
          </div>
          <Btn variant="gold" onClick={() => push('ai')}>
            {lang === 'en' ? 'Generate reading' : '生成 AI 解读'}
          </Btn>
        </>
      )}

      {/* 九 附则 */}
      <SectionHead index="九" title={t('report.ch9', lang)} note={lang === 'en' ? 'boundaries' : '边界声明'} />
      <div className="card flat">
        <div style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.85 }}>
          {lang === 'en'
            ? 'Every layer of this report is traceable to a specific book: month branch and jianchu to the Xieji Bianfang Shu, solar-term months to the Xingli Kaoyuan, facing and mountain-clash to the Yingzao Fashi and the Luban Jing.'
            : '本报告逐层给出取用依据，每一层均可回溯至具体典籍：月建与建除依《协纪辨方书》，节气月依《星历考原》，坐向与冲山依《营造法式》《鲁班经匠家镜》，业态取用参该业专书。'}
        </div>
      </div>

      <div className="card lacquer" style={{ marginTop: 14, cursor: 'pointer' }} role="button" tabIndex={0} onClick={() => openSheet('elder')}>
        <div style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--gold-2)', fontWeight: 700, marginBottom: 5 }}>
          {lang === 'en' ? 'APPENDIX · BASIS EXCERPT' : '附 · 依据摘录（呈长辈）'}
        </div>
        <div className="serif" style={{ fontSize: 14, fontWeight: 700 }}>
          {lang === 'en' ? 'Three verifiable sources, forwardable' : '三条可核的出处，可直接转发'}
        </div>
      </div>

      <div style={{ fontSize: 9.5, color: 'var(--muted)', lineHeight: 1.8, marginTop: 16, paddingTop: 12, borderTop: '1px dashed var(--line)' }}>
        {lang === 'en'
          ? 'Compiled per the Xieji Bianfang Shu and Xingli Kaoyuan, with trade references from the Yingzao Fashi and Tiangong Kaiwu. Traditional folk reference only — no guarantee of outcomes, no medical or investment advice.'
          : '本报告依《协纪辨方书》《星历考原》取用次第，参《营造法式》《鲁班经匠家镜》《天工开物》等行业专书，属传统民俗参考，不构成任何结果保证，不涉及医疗与投资建议。'}
        <br />
        {t('app.ruleVersion', lang)} {RULE_VERSION} ／ {lang === 'en' ? 'issued ' : '出具于 '}
        {new Date().getFullYear()}.{String(new Date().getMonth() + 1).padStart(2, '0')}.{String(new Date().getDate()).padStart(2, '0')}
      </div>

      <div className="ctabar">
        <div className="btn-row">
          <Btn variant="ghost" style={{ flex: '0 0 42%' }} onClick={() => push('card')}>
            {t('card.title', lang)}
          </Btn>
          <Btn
            variant="gold"
            onClick={() => {
              checkAccess(() => {
                void saveReport().then((res) => {
                  if (res.ok) showToast(t('detail.reportSaved', lang));
                });
              });
            }}
          >
            {session.saved ? t('common.saved', lang) : t('detail.saveReport', lang)}
          </Btn>
        </div>
      </div>
      <div style={{ height: 10 }} />
      <Bar percent={Math.min(100, (list.length / Math.max(1, s.total)) * 100)} />
      <div style={{ fontSize: 9.5, color: 'var(--muted)', marginTop: 6, textAlign: 'center' }}>
        {t('result.statUsable', lang, { n: list.length })} ／ {t('result.statTotal', lang, { n: s.total })}
        {s.generic ? ` · ${t('report.genericFlag', lang)}` : ''}
      </div>
    </div>
  );

  function quotaLeft(): number {
    return useApp.getState().quota.unlimited ? 99 : useApp.getState().quota.freeLeft;
  }
}

function reasonLabel(key: string, lang: Lang): string {
  if (key.startsWith('hard.')) return hardReasonText(key.slice(5) as 'yuepo', lang);
  if (key === 'reason.scoreLow') return lang === 'en' ? 'score below threshold' : '评分不足';
  return key;
}

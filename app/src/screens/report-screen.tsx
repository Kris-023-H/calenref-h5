/**
 * screens/report-screen.tsx — 九章推演报告（结论 / 取用 / 出生资料 / 可用清单 / 出局归因 / 动作时点 / 节奏 / AI / 附则）。
 * 报告正文由 session.result 现场组装；未解锁时引导至 pay 屏（权益由 license.repo 判定）。
 */

import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { licenseRepo } from '../db/repos/license.repo';
import { eventByKey, groupText } from '../data/events';
import { industryById } from '../data/industries';
import { sitByKey } from '../data/sits';
import { readPerson } from '../engine/person';
import { fourPillarsOf } from '../engine/pillars';
import { addDays } from '../engine/calendar/julian';
import { ZHI, MONTH_NAME } from '../engine/calendar/sexagenary';
import { t, hardReasonText, isoDate, jianchuName, layerName, layerResultText, termText, tx } from '../i18n';
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
            <IconBtn name="down" label={tx('导出', 'Export', lang)} onClick={() => showToast(tx('已导出文档', 'Document exported', lang))} />
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
            {tx('推演报告', ' reading report', lang)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gold-2)', letterSpacing: '.1em', marginBottom: 10 }}>
            {termText(ind.name, lang)} ／ {termText(ind.category, lang)}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--on-lacquer-2)', lineHeight: 1.9 }}>
            {tx('当事人', 'Subjects', lang)}　
            {readings.length > 0
              ? readings.map((r) => `${r.name}（${r.zodiac}${tx('年·', ' · ', lang)}${r.trueTime}）`).join('　')
              : `${t('scan.generic', lang)} · ${tx('未录出生资料', 'no birth details', lang)}`}
            <br />
            {tx('推演', 'Window', lang)}　　{startIso} — {endIso}（{s.total} {tx('天', 'days', lang)}）
            <br />
            {tx('坐向', 'Facing', lang)}　　{ZHI[sit.zhi]}
            {tx('方', ' bearing', lang)}
          </div>
          <div className="dh-meta">
            <span>
              {tx('可用 ', 'usable ', lang)}
              {list.length} {tx('日', '', lang)}
            </span>
            <span>
              {tx('出局 ', 'excluded ', lang)}
              {s.total - list.length} {tx('日', '', lang)}
            </span>
            <span>
              {tx('首选 ', 'first ', lang)}
              {dottedDate(top.date)}
            </span>
          </div>
        </div>
      </div>

      {/* 一 结论 */}
      <SectionHead index="一" title={t('report.ch1', lang)} note={tx('首选与备选', 'first & alternates', lang)} />
      <div className="card" style={{ borderColor: 'rgba(175,137,62,.5)', background: 'linear-gradient(178deg,#FFFBF0,var(--paper-2))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Ring value={top.score} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--gold)', fontWeight: 700 }}>
              {tx('首 选 课 · ', 'FIRST CHOICE · ', lang)}
              {gradeLabel(top.score, lang)}
            </div>
            <div className="serif" style={{ fontSize: 19, fontWeight: 700, margin: '3px 0 2px' }}>
              {dottedDate(top.date)}　{weekdayShort(top.weekday, lang)}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>
              {top.dayGZ.text}
              {tx('日', ' Day', lang)} · {jianchuName(top.jianchu, lang)}
              {tx('日', ' Day', lang)} · {tx('时辰 ', 'hour ', lang)}
              {top.goodHours[0]?.name ?? '—'}
              {tx('时', '', lang)}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.85, marginTop: 11, paddingTop: 11, borderTop: '1px dashed var(--line)' }}>
          {top.layers
            .filter((l) => l.cls === 'ok' && ['marryMonth', 'monthBranch', 'jianchu', 'virtues', 'industryWuxing', 'sittingFacing'].includes(l.key))
            .slice(0, 3)
            .map((l) => `「${layerName(l.key, lang)}·${layerResultText(l, lang)}」`)
            .join('　')}
          。{tx('多口径结论方向一致，可用。', 'All approaches agree in direction: usable.', lang)}
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
      <SectionHead index="二" title={t('report.ch3', lang)} note={tx('取用变量', 'variables', lang)} />
      <div className="rtab">
        <div className="rtab-row">
          <div>{tx('用事', 'Matter', lang)}</div>
          <div>
            <b>{termText(ev.name, lang)}</b>（{groupText(ev.group, lang)}）
          </div>
        </div>
        <div className="rtab-row">
          <div>{tx('业态', 'Trade', lang)}</div>
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

      {/* 三 出生资料 */}
      <SectionHead index="三" title={t('report.ch4', lang)} note={tx('干支排布', 'birth details', lang)} />
      <div className="rtab">
        <div className="rtab-row">
          <div>{t('detail.pillarYear', lang)}</div>
          <div>
            <b>{fp.year}</b>　{tx('岁次', 'year', lang)}
          </div>
        </div>
        <div className="rtab-row">
          <div>{t('detail.pillarMonth', lang)}</div>
          <div>
            <b>{fp.month}</b>　{tx('月建 ', 'month ', lang)}
            {ZHI[top.monthZhi]}（{MONTH_NAME[top.monthZhi]}）
          </div>
        </div>
        <div className="rtab-row">
          <div>{t('detail.pillarDay', lang)}</div>
          <div>
            <b>{fp.day}</b>　{jianchuName(top.jianchu, lang)}
            {tx('日', ' day', lang)}
          </div>
        </div>
        <div className="rtab-row">
          <div>{t('detail.pillarHour', lang)}</div>
          <div>
            <b>{fp.hour}</b>　{tx('首选时辰 ', 'first hour ', lang)}
            {top.goodHours[0]?.name ?? '—'}
            {tx(`时（${top.goodHours[0]?.range ?? ''}）`, `（${top.goodHours[0]?.range ?? ''}）`, lang)}
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
      <SectionHead index="四" title={tx('可用日期清单', 'Usable days', lang)} note={`${list.length} ${tx('日', 'days', lang)}`} />
      {list.slice(0, 8).map((d, i) => (
        <div key={dottedDate(d.date)} className="rrow" role="button" tabIndex={0} onClick={() => { push('detail'); }}>
          <div className="rrd">
            <b>{monthDay(d.date, lang)}</b>
            <span>{weekdayShort(d.weekday, lang)}</span>
          </div>
          <div className="rri">
            <b>
              {d.dayGZ.text}
              {tx('日', ' Day', lang)} · {jianchuName(d.jianchu, lang)}
              {tx('日', ' Day', lang)}
            </b>
            <span>
              {tx('时辰 ', 'hour ', lang)}
              {d.goodHours[0]?.name ?? '—'}
              {tx('时', '', lang)} · {gradeLabel(d.score, lang)}
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
          {tx(`其余 ${list.length - 8} 日见附录（按评分降序）`, `${list.length - 8} more in the appendix (score desc)`, lang)}
        </div>
      )}

      {/* 五 出局归因 */}
      <SectionHead index="五" title={tx('出局归因', 'Exclusion attribution', lang)} note={tx('筛选过程', 'screening', lang)} />
      <div className="card flat">
        {Object.entries(s.byReason).map(([k, n]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--line-2)' }}>
            <Chip tone={k === 'reason.scoreLow' ? 'plain' : 'verm'} style={{ flex: '0 0 auto' }}>
              {reasonLabel(k, lang)}
            </Chip>
            <span style={{ flex: 1, fontSize: 10.5, color: 'var(--muted)' }}>{tx('天', 'days', lang)}</span>
            <b className="serif" style={{ fontSize: 14 }}>
              {n}
            </b>
          </div>
        ))}
        <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.75, marginTop: 9 }}>
          {tx('出局不等于「不吉」，是不合本套取用的条件。日辰冲出生年、月内破日、冲朝向为硬性出局；评分不足为可放宽项。', 'Excluded ≠ unlucky — it fails this lesson’s taking conditions. A day clashing a birth year, month-break days and an orientation clash are hard vetoes; score below threshold is relaxable.', lang)}
        </div>
      </div>

      {/* 六 动作时点 */}
      <SectionHead index="六" title={tx('关键动作时点', 'Key action hours', lang)} note={tx('时辰落点', 'good hours', lang)} />
      <div className="acts">
        {ev.acts.map((a, i) => {
          const h = top.goodHours[i] ?? top.goodHours[0] ?? top.hours[0];
          return (
            <div key={a.zh} className="ac">
              <b>{a[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh']}</b>
              <span>
                {dottedDate(top.date)}　{h?.name ?? '—'}
                {tx(`时（${h?.range ?? ''}）`, `（${h?.range ?? ''}）`, lang)}　{i === 0 ? (tx('首取', 'first', lang)) : tx('次取', 'next', lang)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="hint" style={{ fontSize: 10 }}>
        {tx('动作时点以时辰为准。若时辰与场地档期冲突，宁可改日，不可改时——改时等于弃掉这一层的取用。', 'Action hours follow favourable hours. If a slot conflicts with venue timing, change the day, not the hour — changing the hour discards this layer.', lang)}
      </div>

      {/* 七 节奏 */}
      <SectionHead index="七" title={tx('开市首月节奏', 'First-month rhythm', lang)} note={tx('九十日', '90 days', lang)} />
      <div className="rhythm">
        {[
          ['D1', tx('开市', 'Open', lang), tx('首客 · 首单', 'first guest', lang)],
          ['D3', tx('稳客', 'Settle', lang), tx('复购与回访', 'repeat & revisit', lang)],
          ['D7', tx('小结', 'Review', lang), tx('首周数据复盘', 'week-one data', lang)],
          ['D15', tx('调整', 'Adjust', lang), tx('动线与排班', 'flow & roster', lang)],
          ['D30', tx('定盘', 'Close', lang), tx('月度结算', 'monthly settle', lang)],
          ['D45', tx('扩客', 'Expand', lang), tx('首轮投放', 'first ads', lang)],
          ['D60', tx('固本', 'Stock', lang), tx('供应与库存', 'supply & stock', lang)],
          ['D90', tx('再课', 'Re-run', lang), tx('扩店或二店', 'expansion', lang)],
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
          : `此为${termText(ind.name, lang)}的通行开市节奏，与当日无关，但同样影响「开市」这件事的完成度。`}
      </div>

      {/* 八 AI */}
      <SectionHead index="八" title={tx('AI 解读', 'AI reading', lang)} note={tx('限次解读', 'limited', lang)} />
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
            {tx('查看完整解读', 'Full reading & follow-ups', lang)}
          </Btn>
        </>
      ) : (
        <>
          <div className={`aibar${quotaLeft() <= 0 ? ' off' : ''}`}>
            <div className="ab-ic">
              <Icon name="ai" size={14} />
            </div>
            <div className="ab-t">
              <b>{tx('AI 解读本课', 'AI reads this lesson', lang)}</b>
              <span>{tx('引规则出处 · 可追问 · 每月 3 次', 'cites rules · askable · 3/month', lang)}</span>
            </div>
            <div className="ab-q">{quotaLeft()}</div>
          </div>
          <Btn variant="gold" onClick={() => push('ai')}>
            {tx('生成 AI 解读', 'Generate reading', lang)}
          </Btn>
        </>
      )}

      {/* 九 附则 */}
      <SectionHead index="九" title={t('report.ch9', lang)} note={tx('边界声明', 'boundaries', lang)} />
      <div className="card flat">
        <div style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.85 }}>
          {tx('本报告逐层给出取用依据，每一层均可回溯至具体典籍：月建与建除依《协纪辨方书》，节气月依《星历考原》，坐向与朝向相冲依《营造法式》《鲁班经匠家镜》，业态取用参该业专书。', 'Every layer of this report is traceable to a specific book: month branch and jianchu to the Xieji Bianfang Shu, solar-term months to the Xingli Kaoyuan, orientation and orientation clash to the Yingzao Fashi and the Luban Jing.', lang)}
        </div>
      </div>

      <div className="card lacquer" style={{ marginTop: 14, cursor: 'pointer' }} role="button" tabIndex={0} onClick={() => openSheet('elder')}>
        <div style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--gold-2)', fontWeight: 700, marginBottom: 5 }}>
          {tx('附 · 依据摘录（呈长辈）', 'APPENDIX · BASIS EXCERPT', lang)}
        </div>
        <div className="serif" style={{ fontSize: 14, fontWeight: 700 }}>
          {tx('三条可核的出处，可直接转发', 'Three verifiable sources, forwardable', lang)}
        </div>
      </div>

      <div style={{ fontSize: 9.5, color: 'var(--muted)', lineHeight: 1.8, marginTop: 16, paddingTop: 12, borderTop: '1px dashed var(--line)' }}>
        {tx('本报告依《协纪辨方书》《星历考原》取用次第，参《营造法式》《鲁班经匠家镜》《天工开物》等行业专书，属传统民俗参考，不构成任何结果保证，不涉及医疗与投资建议。', 'Compiled per the Xieji Bianfang Shu and Xingli Kaoyuan, with trade references from the Yingzao Fashi and Tiangong Kaiwu. Traditional folk reference only — no guarantee of outcomes, no medical or investment advice.', lang)}
        <br />
        {t('app.ruleVersion', lang)} {RULE_VERSION} ／ {tx('出具于 ', 'issued ', lang)}
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
  if (key === 'reason.scoreLow') return tx('评分不足', 'score below threshold', lang);
  return key;
}

/**
 * screens/article-screen.tsx — 知库长文（导语 + 出处 + 正文 + 试排一课入口 + 相关）。
 * 正文为数据层双语长文（data/kb.ts 的 sub/books；正文取 prototype 结构的第一篇，
 * 其余篇目以导语 + 订阅引导呈现——与原型行为一致）。
 */

import { useSettings } from '../store/settings-store';
import { useUi } from '../store/ui-store';
import { KB_ARTICLES } from '../data/kb';
import { BOOKS } from '../data/books';
import { eventByKey } from '../data/events';
import { t, termText, tx } from '../i18n';
import { Btn, Chip } from '../components/basics';
import { AppBar, IconBtn } from '../components/app-bar';
import { useNav, useNavParams } from './types';

export function ArticleScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const openSheet = useUi((s) => s.openSheet);
  const { pop, push, replace } = useNav();
  const params = useNavParams('article');
  const articleId = params?.articleId;
  const a = (articleId ? KB_ARTICLES.find((x) => String(x.id) === articleId) : undefined) ?? KB_ARTICLES[0];
  const loc = lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh';
  const book = BOOKS.find((b) => b.title === a.books[0]) ?? BOOKS[0];
  const ev = eventByKey('open');
  const related = KB_ARTICLES.filter((x) => x.id !== a.id).slice(0, 5);

  return (
    <div className="screen">
      <AppBar title={termText(a.category, lang)} onBack={() => pop()} actions={<IconBtn name="share" label={t('share.title', lang)} onClick={() => openSheet('share')} />} />
      <div className="eyebrow">
        {termText(a.category, lang)} ／ {t('kb.minutes', lang, { n: a.minutes })}
      </div>
      <h2 className="tt" style={{ fontSize: 24, lineHeight: 1.42, marginBottom: 10 }}>
        {a.title[loc]}
      </h2>
      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 14 }}>{a.sub[loc]}</div>

      <div className="bib" style={{ marginBottom: 16 }}>
        <div className="bib-t">
          <b>{tx('本课出处', 'Source', lang)}</b>
          <em>{a.books.join('　')}</em>
          <span>{tx('可核', 'verifiable', lang)}</span>
        </div>
        <div className="bib-d">{book.desc[loc]}</div>
      </div>

      <div className="article">
        {a.body
          ? a.body[loc]
              .split('\n')
              .filter((para) => para.length > 0)
              .map((para, i) => <p key={`${a.id}-p${i}`}>{para}</p>)
          : (
            <>
              <p>{a.sub[loc]}</p>
              <p>
                {tx('这篇文章是知库 24 篇之一。读完后，可用其中的规则去核对一个具体日子。', 'This article is part of the library of 24. After reading, verify the rule against a concrete day with the engine.', lang)}
              </p>
            </>
          )}
      </div>

      <div className="card lacquer" style={{ marginTop: 18, cursor: 'pointer' }} role="button" tabIndex={0} onClick={() => { push('event'); }}>
        <div style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--gold-2)', fontWeight: 700, marginBottom: 6 }}>
          {tx('试排一课', 'TRY A LESSON', lang)}
        </div>
        <div className="serif" style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 4 }}>
          {tx('录四柱，排一课看看', 'Enter pillars, run a lesson', lang)}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--on-lacquer-2)' }}>
          {tx('90 天课期 · 逐层推演 · 约 3 秒', '90-day window · layer by layer · ~3s', lang)}
        </div>
      </div>

      <div className="rule-h">
        <span>{t('kb.related', lang)}</span>
        <i />
      </div>
      <div className="artlist">
        {related.map((x) => (
          <div key={x.id} className="ai" role="button" tabIndex={0} onClick={() => replace('article', { articleId: String(x.id) })}>
            <div className="an">{String(x.id).padStart(2, '0')}</div>
            <div style={{ flex: 1 }}>
              <div className="at">{x.title[loc]}</div>
              <div className="am">
                {termText(x.category, lang)}
                <i />
                {t('kb.minutes', lang, { n: x.minutes })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 12 }} />
      <Chip tone="gold">
        {termText(ev.name, lang)} · {t('event.actsLabel', lang)}
      </Chip>
      <div style={{ height: 10 }} />
      <Btn variant="ghost" block onClick={() => push('event')}>
        {t('event.start', lang)}
      </Btn>
    </div>
  );
}

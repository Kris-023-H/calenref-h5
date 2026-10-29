/**
 * screens/kb-screen.tsx — 知库（主推 + 分类横滑 + 篇目列表 + 典籍入口）。
 */

import { useState } from 'react';
import { useSettings } from '../store/settings-store';
import { useUi } from '../store/ui-store';
import { KB_ARTICLES, KB_CATS, filterKbArticles } from '../data/kb';
import { BOOKS } from '../data/books';
import { t, termText, tx } from '../i18n';
import type { TermKey } from '../engine/types';
import { Chip } from '../components/basics';
import { AppBar, IconBtn } from '../components/app-bar';
import { Icon } from '../components/icons';
import { ScrollX } from '../components/scroll-x';
import { useNav } from './types';

export function KbScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const openSheet = useUi((s) => s.openSheet);
  const { push } = useNav();
  const loc = (s: string): string => s;
  const [cat, setCat] = useState<TermKey>(KB_CATS[0]);
  const feat = KB_ARTICLES[0];
  const list = filterKbArticles(cat);

  return (
    <div className="screen has-tab">
      <AppBar
        title={t('kb.title', lang)}
        actions={
          <>
            <IconBtn name="book" label={tx('典籍', 'Books', lang)} onClick={() => openSheet('books')} />
            <IconBtn name="grid" onClick={() => openSheet('guide')} />
          </>
        }
      />
      <h2 className="tt">
        {t('kb.title', lang)}
        <small>{tx('按场景检索历法规则，按典籍立据。每一篇都对应一部可核的出处。', 'Look up calendar rules by scenario, with every article traceable to a classical text.', lang)}</small>
      </h2>

      <div className="feat" role="button" tabIndex={0} onClick={() => push('article', { articleId: String(feat.id) })}>
        <div className="fk">
          {tx('本期主推', 'FEATURED', lang)} ／ {termText(feat.category, lang)}
        </div>
        <div className="ft">{feat.title[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh']}</div>
        <div className="fs">
          {t('kb.minutes', lang, { n: feat.minutes })} · {tx('对应：全部场景', 'traceable to every scenario', lang)}
        </div>
      </div>

      <ScrollX items={KB_CATS.map((c) => ({ key: c, label: termText(c, lang) }))} activeKey={cat} onSelect={(k) => setCat(k as TermKey)} />

      <div className="artlist">
        {list.map((a) => (
          <div key={a.id} className="ai" role="button" tabIndex={0} onClick={() => push('article', { articleId: String(a.id) })}>
            <div className="an">{String(a.id).padStart(2, '0')}</div>
            <div style={{ flex: 1 }}>
              <div className="at">{a.title[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh']}</div>
              <div className="am">
                {termText(a.category, lang)}
                <i />
                {t('kb.minutes', lang, { n: a.minutes })}
                <i />
                {a.books[0]}
                {!a.translated && (
                  <>
                    <i />
                    <span style={{ color: 'var(--gold)' }}>{tx('订阅可读', 'subscribers', lang)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card lacquer" style={{ marginTop: 16, cursor: 'pointer' }} role="button" tabIndex={0} onClick={() => openSheet('books')}>
        <div style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--gold-2)', fontWeight: 700, marginBottom: 7 }}>
          {tx('参考典籍 ／ ', 'REFERENCE BOOKS ／ ', lang)}
          {BOOKS.length} {tx('部', '', lang)}
        </div>
        <div className="serif" style={{ fontSize: 14, fontWeight: 700, marginBottom: 5 }}>
          {tx('本次查询参考的典籍与行业专书', 'Books behind these rules', lang)}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--on-lacquer-2)', lineHeight: 1.7 }}>
          {tx('历法总纲 10 部、行业专书 15 部。每条规则都可回溯到具体书目与卷次。', '10 general calendar texts, 15 trade manuals — every rule traceable to a title and chapter.', lang)}
        </div>
      </div>
      <div style={{ height: 10 }} />
      <Chip tone="jade">{t('kb.translated', lang)}</Chip>
      <div style={{ height: 8 }} />
      <Icon name="book" size={14} />
      <span className="sr-only">{loc(t('kb.title', lang))}</span>
    </div>
  );
}

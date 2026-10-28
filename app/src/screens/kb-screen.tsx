/**
 * screens/kb-screen.tsx — 知库（主推 + 分类横滑 + 篇目列表 + 典籍入口）。
 */

import { useSettings } from '../store/settings-store';
import { useUi } from '../store/ui-store';
import { KB_ARTICLES, KB_CATS } from '../data/kb';
import { BOOKS } from '../data/books';
import { t, termText } from '../i18n';
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
  const feat = KB_ARTICLES[0];
  const list = KB_ARTICLES;

  return (
    <div className="screen has-tab">
      <AppBar
        title={t('kb.title', lang)}
        actions={
          <>
            <IconBtn name="book" label={lang === 'en' ? 'Books' : '典籍'} onClick={() => openSheet('books')} />
            <IconBtn name="grid" onClick={() => openSheet('guide')} />
          </>
        }
      />
      <h2 className="tt">
        {t('kb.title', lang)}
        <small>{lang === 'en' ? 'Take lessons by trade; stand on books.' : '按业态取课，按典籍立据。十二类业态，每一篇都对应一部可核的出处。'}</small>
      </h2>

      <div className="feat" role="button" tabIndex={0} onClick={() => push('article')}>
        <div className="fk">
          {lang === 'en' ? 'FEATURED' : '本期主推'} ／ {termText(feat.category, lang)}
        </div>
        <div className="ft">{feat.title[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh']}</div>
        <div className="fs">
          {t('kb.minutes', lang, { n: feat.minutes })} · {lang === 'en' ? 'traceable to every matter' : '对应：全部用事'}
        </div>
      </div>

      <ScrollX items={KB_CATS.map((c) => ({ key: c, label: termText(c, lang) }))} activeKey={KB_CATS[0]} onSelect={() => undefined} />

      <div className="artlist">
        {list.map((a) => (
          <div key={a.id} className="ai" role="button" tabIndex={0} onClick={() => push('article')}>
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
                    <span style={{ color: 'var(--gold)' }}>{lang === 'en' ? 'subscribers' : '订阅可读'}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card lacquer" style={{ marginTop: 16, cursor: 'pointer' }} role="button" tabIndex={0} onClick={() => openSheet('books')}>
        <div style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--gold-2)', fontWeight: 700, marginBottom: 7 }}>
          {lang === 'en' ? 'REFERENCE BOOKS ／ ' : '取用典籍 ／ '}
          {BOOKS.length} {lang === 'en' ? '' : '部'}
        </div>
        <div className="serif" style={{ fontSize: 14, fontWeight: 700, marginBottom: 5 }}>
          {lang === 'en' ? 'Books behind this lesson' : '本课取用的典籍与行业专书'}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--on-lacquer-2)', lineHeight: 1.7 }}>
          {lang === 'en'
            ? '10 general day-selection books, 15 trade manuals — every rule traceable to a title and chapter.'
            : '择日总纲 10 部、行业专书 15 部。每条规则都可回溯到具体书目与卷次。'}
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

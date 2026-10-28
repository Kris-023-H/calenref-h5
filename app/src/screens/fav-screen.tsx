/**
 * screens/fav-screen.tsx — 收藏（日课 + 文章，按收藏时间倒序）。
 * 日课收藏存快照（date/dayGZ/score/grade/eventName），列表免重算；
 * 点开日课：载回对应课期并定位到该日（课期已删则提示）。
 */

import { useState } from 'react';
import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { KB_ARTICLES } from '../data/kb';
import { t, termText, isoDate, gradeText } from '../i18n';
import { Btn, Chip, EmptyState, Seg } from '../components/basics';
import { AppBar, IconBtn } from '../components/app-bar';
import { Icon } from '../components/icons';
import { useNav } from './types';
import { gradeTone, monthDay } from './ui-helpers';
import type { FavoriteRecord } from '../db/types';
import type { Grade } from '../engine/types';

type FavTab = 'all' | 'day' | 'article';

export function FavScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const favorites = useApp((s) => s.favorites);
  const scans = useApp((s) => s.scans);
  const removeFavorite = useApp((s) => s.removeFavorite);
  const loadScan = useApp((s) => s.loadScan);
  const setCursor = useApp((s) => s.setCursor);
  const showToast = useUi((s) => s.showToast);
  const { pop, push } = useNav();
  const [tab, setTab] = useState<FavTab>('all');

  const rows = favorites.filter((f) => (tab === 'all' ? true : f.kind === tab));

  const openDay = (f: FavoriteRecord): void => {
    const scanId = f.refId.split(':')[0];
    const rec = scans.find((x) => x.id === scanId);
    const date = f.snapshot?.date ?? '';
    if (!rec) {
      showToast(t('report.notFound', lang));
      return;
    }
    loadScan(rec.id);
    const idx = rec.result.usable.findIndex((d) => isoDate(d.date) === date);
    if (idx >= 0) setCursor(idx);
    push('detail');
  };

  const openArticle = (f: FavoriteRecord): void => {
    push('article', { articleId: f.refId });
  };

  const remove = (f: FavoriteRecord): void => {
    void removeFavorite(f.id).then(() => showToast(t('fav.removed', lang)));
  };

  return (
    <div className="screen">
      <AppBar
        title={t('fav.title', lang)}
        onBack={() => pop()}
        actions={<Chip>{favorites.length}</Chip>}
      />

      <Seg
        options={[
          { value: 'all', label: t('common.all', lang) },
          { value: 'day', label: t('fav.day', lang) },
          { value: 'article', label: t('fav.article', lang) },
        ]}
        value={tab}
        onChange={setTab}
      />

      {rows.length === 0 ? (
        <EmptyState
          mark="star"
          title={t('fav.empty', lang)}
          body={t('fav.emptyHint', lang)}
          action={
            <Btn variant="gold" onClick={() => push('event')}>
              {t('home.cta', lang)}
            </Btn>
          }
        />
      ) : (
        <div className="replist">
          {rows.map((f) =>
            f.kind === 'article' ? (
              <div
                key={f.id}
                className="rep"
                role="button"
                tabIndex={0}
                onClick={() => openArticle(f)}
                onKeyDown={(e) => e.key === 'Enter' && openArticle(f)}
              >
                <div className="rd" style={{ background: 'var(--teal)' }}>
                  <b>文</b>
                  <span>{lang === 'en' ? 'ART' : '文章'}</span>
                </div>
                <div className="rb">
                  <b>{f.articleTitle ?? KB_ARTICLES.find((a) => String(a.id) === f.refId)?.title[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh'] ?? t('common.unknown', lang)}</b>
                  <span>{t('fav.article', lang)}</span>
                </div>
                <IconBtn name="star" label={t('fav.remove', lang)} onClick={() => remove(f)} />
              </div>
            ) : (
              <div
                key={f.id}
                className="rep"
                role="button"
                tabIndex={0}
                onClick={() => openDay(f)}
                onKeyDown={(e) => e.key === 'Enter' && openDay(f)}
              >
                <div className="rd">
                  <b>{f.snapshot ? f.snapshot.date.slice(8) : '—'}</b>
                  <span>{f.snapshot ? f.snapshot.date.slice(5, 7) : ''}</span>
                </div>
                <div className="rb">
                  <b>
                    {f.snapshot?.dayGZ ?? t('common.unknown', lang)}
                    {lang === 'en' ? ' Day' : '日'}
                  </b>
                  <span>
                    {f.eventKey ? termText(`term.ev.${f.eventKey}`, lang) : f.snapshot?.eventName ?? ''}
                    {f.snapshot ? ` · ${monthDay(parseIso(f.snapshot.date), lang)}` : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Chip tone={f.snapshot ? gradeTone(f.snapshot.score) : 'plain'}>
                    {f.snapshot ? gradeText(f.snapshot.grade as Grade, lang) : t('common.unknown', lang)}
                  </Chip>
                  <IconBtn name="star" label={t('fav.remove', lang)} onClick={() => remove(f)} />
                </div>
              </div>
            ),
          )}
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.7 }}>
        <Icon name="shield" size={11} />
        {lang === 'en' ? 'Favorites live on this device only.' : '收藏仅存本机，不随账户同步。'}
      </div>
      <div style={{ height: 8 }} />
    </div>
  );
}

/** 'YYYY-MM-DD' → CalDate（收藏快照解析） */
function parseIso(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map((x) => Number(x));
  return { y: y || 1970, m: m || 1, d: d || 1 };
}

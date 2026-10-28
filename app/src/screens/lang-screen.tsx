/**
 * screens/lang-screen.tsx — 语言与历法（界面语言 / 历法口径 / 时区）。
 * 语言切换即时生效并持久化（settings-store）；历法三口径：公历 / 干支年 / 佛历（CE+543）。
 * 农历月日为 P1 升级项（PRD 决策），本屏明示。
 */

import { useSettings } from '../store/settings-store';
import { useUi } from '../store/ui-store';
import { t, LANGS, LANG_SELF_NAME, tx } from '../i18n';
import { calPrefLabel, type CalPref } from '../i18n/format';
import { Btn, Seg } from '../components/basics';
import { AppBar } from '../components/app-bar';
import { Icon } from '../components/icons';
import { useNav } from './types';
import type { Lang } from '../engine/types';

/** 常用时区（出海五市场覆盖） */
const TZ_OPTIONS: Array<{ value: number; label: string }> = [
  { value: -8, label: 'UTC-8' },
  { value: -5, label: 'UTC-5' },
  { value: 0, label: 'UTC+0' },
  { value: 7, label: 'UTC+7' },
  { value: 8, label: 'UTC+8' },
  { value: 9, label: 'UTC+9' },
];

export function LangScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const cal = useSettings((s) => s.cal);
  const tz = useSettings((s) => s.tz);
  const setLang = useSettings((s) => s.setLang);
  const setCal = useSettings((s) => s.setCal);
  const setTz = useSettings((s) => s.setTz);
  const showToast = useUi((s) => s.showToast);
  const { pop } = useNav();

  const pickLang = (next: Lang): void => {
    if (next === lang) return;
    void setLang(next).then(() => showToast(t('lang.changed', next)));
  };

  return (
    <div className="screen">
      <AppBar title={t('lang.title', lang)} onBack={() => pop()} />

      {/* ---------- 界面语言 ---------- */}
      <div className="rule-h">
        <span>{t('lang.langTitle', lang)}</span>
        <i />
      </div>
      <div className="menu">
        {LANGS.map((code) => (
          <div
            key={code}
            className={`mi${code === lang ? ' on' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => pickLang(code)}
            onKeyDown={(e) => e.key === 'Enter' && pickLang(code)}
          >
            <div className="mig">
              <Icon name="globe" size={15} />
            </div>
            <div className="mib">
              {LANG_SELF_NAME[code]}
              <small>{code}</small>
            </div>
            {code === lang ? <Icon name="check" size={14} /> : <Icon name="right" size={13} />}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', margin: '8px 2px 0', lineHeight: 1.7 }}>{t('lang.restartHint', lang)}</div>

      {/* ---------- 历法显示 ---------- */}
      <div className="rule-h">
        <span>{t('lang.calTitle', lang)}</span>
        <i />
      </div>
      <Seg
        options={[
          { value: 'greg', label: t('lang.calGreg', lang) },
          { value: 'gan', label: t('lang.calGan', lang) },
          { value: 'buddha', label: t('lang.calBuddha', lang) },
        ]}
        value={cal}
        onChange={(v: CalPref) => void setCal(v)}
      />
      <div style={{ fontSize: 10.5, color: 'var(--muted)', margin: '9px 2px 0', lineHeight: 1.8 }}>
        {cal === 'buddha' && (
          <>
            <Icon name="info" size={11} /> {t('lang.buddhistNote', lang)}
            <br />
          </>
        )}
        {t('lang.lunarNote', lang)}
      </div>

      {/* ---------- 时区 ---------- */}
      <div className="rule-h">
        <span>{tx('时区', 'Time zone', lang)}</span>
        <i />
      </div>
      <Seg options={TZ_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))} value={String(tz)} onChange={(v) => void setTz(Number(v))} />
      <div style={{ fontSize: 10, color: 'var(--muted)', margin: '9px 2px 0', lineHeight: 1.7 }}>
        {lang === 'en'
          ? 'Lessons and reminders use this zone. It is auto-detected on first launch and can be corrected here.'
          : '课期与提醒均按此时区计算。首次启动自动探测，可在此修正。'}
      </div>

      <div style={{ height: 14 }} />
      <Btn variant="ghost" block onClick={() => pop()}>
        {t('nav.done', lang)}
      </Btn>
      <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>
        {tx(`当前：${LANG_SELF_NAME[lang]} · ${calPrefLabel(cal, lang)} · UTC${tz >= 0 ? '+' : ''}${tz}`, `Current: ${LANG_SELF_NAME[lang]} · ${calPrefLabel(cal, lang)} · UTC${tz >= 0 ? '+' : ''}${tz}`, lang)}
      </div>
    </div>
  );
}

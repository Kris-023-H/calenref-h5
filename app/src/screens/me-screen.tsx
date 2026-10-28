/**
 * screens/me-screen.tsx — 我的（Tab）：本机账户 + 统计 + 功能菜单 + 设置区 + 关于。
 * 账号为「本机账户」：无注册登录，数据不出设备（PRD 出海合规口径）。
 * 设置区内嵌本屏：匿名统计开关、导出/导入备份、清除数据、存储占用、规则版本。
 */

import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { RULE_VERSION } from '../engine/types';
import { t, bytesText, LANG_SELF_NAME } from '../i18n';
import { LEGAL_PAGES, LEGAL_TITLE_KEY } from '../data/legal';
import { SITE } from '../data/site';
import { clearConsent } from '../services/consent';
import { Btn, Chip, Seg } from '../components/basics';
import { AppBar } from '../components/app-bar';
import { BrandMark, Icon, type IconName } from '../components/icons';
import { useNav } from './types';

/** 清除数据的二次确认（两段式，不引原生 confirm） */
type ConfirmStep = 'idle' | 'once' | 'twice';

export function MeScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const analyticsOn = useSettings((s) => s.analyticsOn);
  const setAnalytics = useSettings((s) => s.setAnalytics);
  const people = useApp((s) => s.people);
  const scans = useApp((s) => s.scans);
  const licenses = useApp((s) => s.licenses);
  const exportData = useApp((s) => s.exportData);
  const importData = useApp((s) => s.importData);
  const clearData = useApp((s) => s.clearData);
  const storageBytes = useApp((s) => s.storageBytes);
  const showToast = useUi((s) => s.showToast);
  const { push } = useNav();

  const [confirm, setConfirm] = useState<ConfirmStep>('idle');
  const [storage, setStorage] = useState<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void storageBytes().then(setStorage);
  }, [storageBytes, scans.length, people.length]);

  const usableDays = scans.reduce((n, r) => n + r.result.usable.length, 0);
  const paid = licenses.some((l) => l.left === -1 || l.left > 0);

  const menu: Array<{ icon: IconName; label: string; sub: string; onClick: () => void }> = [
    {
      icon: 'user',
      label: t('me.people', lang),
      sub: `${people.length} ${lang === 'en' ? 'files' : '份档案'}`,
      onClick: () => push('people'),
    },
    {
      icon: 'doc',
      label: t('me.reports', lang),
      sub: `${scans.length} ${lang === 'en' ? 'lessons' : '课课期'}`,
      onClick: () => push('reports'),
    },
    {
      icon: 'star',
      label: t('me.fav', lang),
      sub: lang === 'en' ? 'days & articles' : '日课与文章',
      onClick: () => push('fav'),
    },
    {
      icon: 'bell',
      label: t('me.remind', lang),
      sub: lang === 'en' ? 'on this device' : '仅存本机',
      onClick: () => push('remind'),
    },
    {
      icon: 'globe',
      label: t('me.lang', lang),
      sub: LANG_SELF_NAME[lang],
      onClick: () => push('lang'),
    },
  ];

  const doExport = (): void => {
    void exportData().then((res) => {
      if (!res.ok) {
        showToast(t('err.unknown', lang));
        return;
      }
      const blob = new Blob([res.value], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'zj-backup-v1.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast(t('settings.exported', lang));
    });
  };

  const doImport = (file: File): void => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      void importData(text).then((res) => {
        showToast(res.ok ? t('settings.imported', lang) : t('settings.importFail', lang));
      });
    };
    reader.readAsText(file);
  };

  const doClear = (): void => {
    if (confirm === 'idle') {
      setConfirm('once');
      return;
    }
    if (confirm === 'once') {
      setConfirm('twice');
      return;
    }
    void clearData().then(() => {
      setConfirm('idle');
      showToast(t('settings.cleared', lang));
    });
  };

  return (
    <div className="screen has-tab">
      <AppBar
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span className="applogo">
              <BrandMark size={20} tone="gold" />
            </span>
            <BrandMark showMark={false} text={t('me.title', lang)} tone="ink" titleSize={15} />
          </div>
        }
        actions={<Chip tone={paid ? 'gold' : 'plain'}>{paid ? t('pay.paid', lang) : t('me.guest', lang)}</Chip>}
      />

      {/* ---------- 本机账户 ---------- */}
      <div className="card flat" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 15,
              background: 'linear-gradient(160deg, var(--gold-2), var(--gold))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <Icon name="user" size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="serif" style={{ fontSize: 15.5, fontWeight: 700 }}>
              {t('me.guest', lang)}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>{t('me.localOnly', lang)}</div>
          </div>
          <Icon name="shield" size={16} />
        </div>
      </div>

      {/* ---------- 统计 ---------- */}
      <div className="pe-stat" style={{ marginBottom: 14 }}>
        <div>
          <b>{scans.length}</b>
          <span>{t('me.statScans', lang)}</span>
        </div>
        <div>
          <b>{scans.length}</b>
          <span>{t('me.statReports', lang)}</span>
        </div>
        <div>
          <b>{usableDays}</b>
          <span>{t('me.statDays', lang)}</span>
        </div>
      </div>

      {/* ---------- 功能菜单 ---------- */}
      <div className="menu">
        {menu.map((m) => (
          <div key={m.label} className="mi" role="button" tabIndex={0} onClick={m.onClick} onKeyDown={(e) => e.key === 'Enter' && m.onClick()}>
            <div className="mig">
              <Icon name={m.icon} size={15} />
            </div>
            <div className="mib">
              {m.label}
              <small>{m.sub}</small>
            </div>
            <Icon name="right" size={13} />
          </div>
        ))}
      </div>

      {/* ---------- 设置 ---------- */}
      <div className="rule-h">
        <span>{t('settings.title', lang)}</span>
        <i />
      </div>
      <div className="card flat">
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{t('settings.analytics', lang)}</div>
        <Seg
          options={[
            { value: 'on', label: lang === 'en' ? 'On' : '开启' },
            { value: 'off', label: lang === 'en' ? 'Off' : '关闭' },
          ]}
          value={analyticsOn ? 'on' : 'off'}
          onChange={(v) => void setAnalytics(v === 'on')}
        />
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 7, lineHeight: 1.7 }}>
          {analyticsOn ? t('settings.analyticsOn', lang) : t('settings.analyticsOff', lang)}
        </div>

        {/* Cookie 同意（可撤回，撤回后横幅重新出现） */}
        <div style={{ marginTop: 8 }}>
          <Btn
            variant="ghost"
            onClick={() => {
              clearConsent();
              showToast(t('cookie.changed', lang));
            }}
          >
            {t('cookie.reopen', lang)}
          </Btn>
        </div>

        <div className="divider" />

        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <Btn variant="secondary" icon="down" onClick={doExport}>
            {t('settings.export', lang)}
          </Btn>
          <Btn variant="secondary" icon="doc" onClick={() => fileRef.current?.click()}>
            {t('settings.import', lang)}
          </Btn>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) doImport(f);
              e.target.value = '';
            }}
          />
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8, lineHeight: 1.7 }}>
          {t('settings.storageUsing', lang, { size: bytesText(storage, lang) })} · {t('settings.ruleVersion', lang, { version: RULE_VERSION })}
        </div>

        <div className="divider" />

        <Btn variant="ghost" block onClick={doClear}>
          {confirm === 'idle' ? t('settings.clear', lang) : confirm === 'once' ? t('settings.clearConfirm', lang) : lang === 'en' ? 'Tap a third time to erase' : '再点一次，永久清除'}
        </Btn>
      </div>

      {/* ---------- 关于 ---------- */}
      <div className="rule-h">
        <span>{t('about.title', lang)}</span>
        <i />
      </div>
      <div className="card flat">
        <div style={{ fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.85 }}>{t('about.body', lang)}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.8, marginTop: 9 }}>{t('about.rules', lang)}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.8, marginTop: 6 }}>{t('about.privacy', lang)}</div>
        <div className="divider" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="send" size={13} />
          <div style={{ flex: 1, fontSize: 11.5, fontWeight: 700 }}>{t('about.feedback', lang)}</div>
          <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{t('about.feedbackBody', lang)}</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 12, letterSpacing: '.12em' }}>
          {t('app.name', lang)} · {t('app.nameEn', lang)} · {t('app.slogan', lang)}
        </div>

        {/* ---------- 页脚：法务四链 + 版权（支付平台审核会逐页点开） ---------- */}
        <div className="legal-links">
          {LEGAL_PAGES.map((p) => (
            <button key={p} type="button" onClick={() => push('legal', { page: p })}>
              {t(LEGAL_TITLE_KEY[p], lang)}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 9.5, color: 'var(--muted)', textAlign: 'center', marginTop: 8, lineHeight: 1.7 }}>
          {t('footer.rights', lang, { year: new Date().getFullYear(), entity: SITE.entity })}
        </div>
      </div>
      <div style={{ height: 8 }} />
    </div>
  );
}

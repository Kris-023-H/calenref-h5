/**
 * components/tab-bar.tsx — 底部五 Tab（今日 / 排期 / 报告 / 知库 / 我的）。
 * 选中态由 nav.tab 驱动；非 Tab 栈顶屏幕时整栏隐藏。
 */

import { TAB_SCREENS, isTabScreen, type ScreenKey } from '../router/screens';
import { Icon, type IconName } from './icons';
import { t } from '../i18n';
import type { Lang } from '../engine/types';

const TAB_META: Record<string, { icon: IconName; msgKey: 'tab.home' | 'tab.kb' | 'tab.reports' | 'tab.me' }> = {
  home: { icon: 'home', msgKey: 'tab.home' },
  event: { icon: 'compass', msgKey: 'tab.kb' },
  reports: { icon: 'doc', msgKey: 'tab.reports' },
  kb: { icon: 'book', msgKey: 'tab.kb' },
  me: { icon: 'user', msgKey: 'tab.me' },
};

/** 排期 Tab 的文案在语言包中没有专用键，沿用 event.title */
const TAB_LABEL: Record<string, (lang: Lang) => string> = {
  home: (l) => t('tab.home', l),
  event: (l) => t('event.title', l),
  reports: (l) => t('tab.reports', l),
  kb: (l) => t('tab.kb', l),
  me: (l) => t('tab.me', l),
};

export function TabBar({
  current,
  activeTab,
  lang,
  onSelect,
}: {
  current: ScreenKey;
  activeTab: ScreenKey;
  lang: Lang;
  onSelect: (tab: ScreenKey) => void;
}): JSX.Element | null {
  if (!isTabScreen(current)) return null;
  return (
    <nav className="tabbar">
      {TAB_SCREENS.map((key) => {
        const meta = TAB_META[key];
        const on = key === activeTab;
        return (
          <button
            key={key}
            type="button"
            className={on ? 'on' : ''}
            aria-current={on ? 'page' : undefined}
            onClick={() => onSelect(key)}
          >
            <Icon name={meta.icon} size={21} />
            <span>{TAB_LABEL[key](lang)}</span>
          </button>
        );
      })}
    </nav>
  );
}

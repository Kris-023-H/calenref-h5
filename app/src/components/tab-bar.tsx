/**
 * components/tab-bar.tsx — 底部五 Tab（首页 / 场景库 / 我的查询 / 知识库 / 我的）。
 * 选中态由 nav.tab 驱动；非 Tab 栈顶屏幕时整栏隐藏。
 */

import { TAB_SCREENS, isTabScreen, type ScreenKey } from '../router/screens';
import { Icon, type IconName } from './icons';
import { t } from '../i18n';
import type { Lang } from '../engine/types';

const TAB_META: Record<string, { icon: IconName; msgKey: 'tab.home' | 'tab.scenarios' | 'tab.kb' | 'tab.reports' | 'tab.me' }> = {
  home: { icon: 'home', msgKey: 'tab.home' },
  event: { icon: 'compass', msgKey: 'tab.scenarios' },
  reports: { icon: 'doc', msgKey: 'tab.reports' },
  kb: { icon: 'book', msgKey: 'tab.kb' },
  me: { icon: 'user', msgKey: 'tab.me' },
};

/** 五个 Tab 各有独立文案键：场景库不能用 event.title（那是页面标题，比 Tab 长） */
const TAB_LABEL: Record<string, (lang: Lang) => string> = {
  home: (l) => t('tab.home', l),
  event: (l) => t('tab.scenarios', l),
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

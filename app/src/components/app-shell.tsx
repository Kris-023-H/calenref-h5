/**
 * components/app-shell.tsx — 应用外壳：状态栏 + 屏幕容器（方向感知切换）+ TabBar + Toast。
 * 屏幕栈由 app-store 持有；本组件只负责渲染与动画类名。
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { useApp } from '../store/app-store';
import { useSettings } from '../store/settings-store';
import { useUi } from '../store/ui-store';
import { TabBar } from './tab-bar';
import { Toast } from './basics';
import { CookieBar } from './cookie-bar';
import { currentScreen } from '../router/nav';

/** 状态栏时钟（真实时间，仅装饰） */
function useClock(): string {
  const ref = useRef<string>('');
  useEffect(() => {
    const tick = (): void => {
      const d = new Date();
      ref.current = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
      const el = document.getElementById('statusTime');
      if (el) el.textContent = ref.current;
    };
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return ref.current;
}

export function AppShell({ children }: { children: ReactNode }): JSX.Element {
  const nav = useApp((s) => s.nav);
  const switchTab = useApp((s) => s.switchTab);
  const lang = useSettings((s) => s.lang);
  const toast = useUi((s) => s.toast);
  const hideToast = useUi((s) => s.hideToast);
  const bodyRef = useRef<HTMLDivElement>(null);
  const entry = currentScreen(nav);
  useClock();

  // 方向感知动画：forward → enter-r，back → enter-l，tab → 无动画
  const animClass = nav.direction === 'forward' ? 'enter-r' : nav.direction === 'back' ? 'enter-l' : 'noanim';

  // 切换屏幕时回到顶部（原型 render 行为）
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [entry.key]);

  // Toast 自动消失
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(hideToast, 1900);
    return () => window.clearTimeout(timer);
  }, [toast, hideToast]);

  return (
    <div className="app-shell">
      <div className="status-bar">
        <span id="statusTime">9:41</span>
        <span className="st-r">●●● ⌁ ▮</span>
      </div>
      <div className="app-body" ref={bodyRef}>
        <div className={`screen ${animClass}`} key={entry.key} data-screen={entry.key}>
          {children}
        </div>
      </div>
      <Toast message={toast} />
      <CookieBar />
      <TabBar current={entry.key} activeTab={nav.tab} lang={lang} onSelect={(tab) => switchTab(tab)} />
    </div>
  );
}

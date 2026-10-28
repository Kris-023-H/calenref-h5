/**
 * router/nav.ts — 屏幕栈导航器（自研，约 120 行，不引路由库）。
 * push / pop / replace / switchTab / resetTo；方向感知（enter-r / enter-l）由
 * AppShell 依据本次导航动作选择动画类。
 */

import type { ScreenKey } from './screens';

export interface NavEntry {
  key: ScreenKey;
  params?: unknown;
}

export type NavDirection = 'forward' | 'back' | 'tab';

export interface NavState {
  stack: NavEntry[];
  tab: ScreenKey;
  /** 最近一次导航方向（驱动切换动画） */
  direction: NavDirection;
}

export const initialNav: NavState = {
  stack: [{ key: 'splash', params: undefined }],
  tab: 'home',
  direction: 'forward',
};

type Action =
  | { type: 'push'; key: ScreenKey; params?: unknown }
  | { type: 'pop' }
  | { type: 'replace'; key: ScreenKey; params?: unknown }
  | { type: 'switchTab'; tab: ScreenKey }
  | { type: 'resetTo'; key: ScreenKey; params?: unknown };

export function navReducer(state: NavState, action: Action): NavState {
  switch (action.type) {
    case 'push':
      return {
        ...state,
        stack: [...state.stack, { key: action.key, params: action.params }],
        direction: 'forward',
      };
    case 'pop':
      if (state.stack.length <= 1) return state;
      return { ...state, stack: state.stack.slice(0, -1), direction: 'back' };
    case 'replace':
      return {
        ...state,
        stack: [...state.stack.slice(0, -1), { key: action.key, params: action.params }],
        direction: 'forward',
      };
    case 'switchTab':
      // Tab 是「并列的根」，不是压在栈上的页：切 Tab 必须把栈重置为该屏，
      // 否则 currentScreen 仍返回旧栈顶，界面看起来「点了没反应」。
      return { stack: [{ key: action.tab, params: undefined }], tab: action.tab, direction: 'tab' };
    case 'resetTo':
      return { stack: [{ key: action.key, params: action.params }], tab: state.tab, direction: 'forward' };
    default:
      return state;
  }
}

/** 当前栈顶 */
export function currentScreen(state: NavState): NavEntry {
  return state.stack[state.stack.length - 1];
}

/** 可否返回 */
export function canGoBack(state: NavState): boolean {
  return state.stack.length > 1;
}

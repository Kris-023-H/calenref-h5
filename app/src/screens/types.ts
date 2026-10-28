/**
 * screens/types.ts — 屏幕公共 props 与导航辅助。
 * 屏幕组件由 screen-router.tsx 按 ScreenKey 渲染，参数取自导航栈条目。
 */

import { useApp } from '../store/app-store';
import type { ScreenParams } from '../router/screens';
import { paramsOf } from '../router/screens';
import { currentScreen } from '../router/nav';

export interface ScreenProps<K extends keyof ScreenParams = keyof ScreenParams> {
  params: ScreenParams[K] | undefined;
}

/** 导航动作集合（屏幕内跳转统一走这里） */
export function useNav() {
  const push = useApp((s) => s.push);
  const pop = useApp((s) => s.pop);
  const replace = useApp((s) => s.replace);
  const switchTab = useApp((s) => s.switchTab);
  const resetTo = useApp((s) => s.resetTo);
  return { push, pop, replace, switchTab, resetTo };
}

/** 类型安全取参（调用方持有 params 时使用） */
export function useParams<K extends keyof ScreenParams>(key: K, params: unknown): ScreenParams[K] | undefined {
  return paramsOf(key, params);
}

/** 从导航栈顶取当前屏参数（无 props 屏幕自取参） */
export function useNavParams<K extends keyof ScreenParams>(key: K): ScreenParams[K] | undefined {
  const nav = useApp((s) => s.nav);
  const entry = currentScreen(nav);
  return paramsOf(key, entry.params);
}

/**
 * tests/router/nav.test.ts — 屏幕栈导航器回归。
 *
 * 重点回归：`switchTab` 必须把栈重置为该 Tab 屏。曾经的实现只改 state.tab 不动 stack，
 * 导致底部五 Tab 点击后高亮变了、界面不换（currentScreen 仍返回旧栈顶）——
 * 这是纯 UI 层缺陷，引擎与服务层测试都发现不了。
 */

import { describe, expect, it } from 'vitest';
import { canGoBack, currentScreen, initialNav, navReducer, type NavState } from '../../src/router/nav';

const at = (key: NavState['stack'][number]['key'], params?: unknown): NavState => ({
  stack: [{ key, params }],
  tab: 'home',
  direction: 'forward',
});

describe('navReducer — push / pop / replace', () => {
  it('push 入栈并标记 forward', () => {
    const s = navReducer(at('home'), { type: 'push', key: 'event' });
    expect(s.stack.map((e) => e.key)).toEqual(['home', 'event']);
    expect(s.direction).toBe('forward');
    expect(canGoBack(s)).toBe(true);
  });

  it('pop 出栈，栈底不可再 pop', () => {
    const s = navReducer(navReducer(at('home'), { type: 'push', key: 'detail' }), { type: 'pop' });
    expect(s.stack.map((e) => e.key)).toEqual(['home']);
    expect(s.direction).toBe('back');
    expect(navReducer(s, { type: 'pop' })).toBe(s);
  });

  it('replace 换掉栈顶、不增加深度', () => {
    const s = navReducer(navReducer(at('home'), { type: 'push', key: 'result' }), {
      type: 'replace',
      key: 'detail',
      params: { scanId: 's1', date: '2026-10-28' },
    });
    expect(s.stack.map((e) => e.key)).toEqual(['home', 'detail']);
    expect(s.stack[1].params).toEqual({ scanId: 's1', date: '2026-10-28' });
  });

  it('参数随条目传递', () => {
    const s = navReducer(at('home'), { type: 'push', key: 'legal', params: { page: 'refund' } });
    expect(currentScreen(s).params).toEqual({ page: 'refund' });
  });
});

describe('navReducer — switchTab（Tab 是并列的根）', () => {
  it('切 Tab 后栈顶就是该 Tab 屏', () => {
    let s = navReducer(initialNav, { type: 'switchTab', tab: 'kb' });
    expect(currentScreen(s).key).toBe('kb');
    expect(s.tab).toBe('kb');
    expect(s.direction).toBe('tab');
    expect(canGoBack(s)).toBe(false);
  });

  it('从深栈切 Tab 会把栈压平（不留旧路径）', () => {
    let s: NavState = navReducer(at('home'), { type: 'push', key: 'event' });
    s = navReducer(s, { type: 'push', key: 'calc' });
    s = navReducer(s, { type: 'switchTab', tab: 'me' });
    expect(s.stack.map((e) => e.key)).toEqual(['me']);
    expect(currentScreen(s).key).toBe('me');
  });

  it('五个 Tab 都能到达', () => {
    for (const tab of ['home', 'event', 'reports', 'kb', 'me'] as const) {
      const s = navReducer(initialNav, { type: 'switchTab', tab });
      expect(currentScreen(s).key).toBe(tab);
    }
  });
});

describe('navReducer — resetTo', () => {
  it('重置为单屏并清空历史', () => {
    const s = navReducer(at('splash'), { type: 'resetTo', key: 'onboard' });
    expect(s.stack.map((e) => e.key)).toEqual(['onboard']);
    expect(canGoBack(s)).toBe(false);
  });
});

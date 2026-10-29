/**
 * components/error-boundary.tsx — 全局错误边界。
 *
 * 任一屏渲染抛错时，React 会卸载整棵树导致白屏。这里兜住异常，
 * 给出可读的提示与「刷新」按钮；异常只打控制台，不上报远端（隐私优先）。
 */
import { Component, type ReactNode } from 'react';
import { useSettings } from '../store/settings-store';
import { tx } from '../i18n';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(err: unknown): void {
    // 仅本机留痕，便于用户反馈时排查；不采集到远端
    console.error('[ErrorBoundary]', err);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    const lang = useSettings.getState().lang;
    return (
      <div style={{ padding: '56px 24px', textAlign: 'center', color: 'var(--ink, #191710)' }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>
          {tx('出了点问题', 'Something went wrong', lang)}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted, #6d6450)', lineHeight: 1.8, marginBottom: 20 }}>
          {tx('本页遇到异常，数据仍保存在本机，可刷新重试。', 'This screen hit an error. Your data stays on this device — try reloading.', lang)}
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: '1px solid var(--line, #d8cdb8)',
            background: 'var(--card, #fffdf8)',
            color: 'var(--ink, #191710)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {tx('刷新页面', 'Reload', lang)}
        </button>
      </div>
    );
  }
}

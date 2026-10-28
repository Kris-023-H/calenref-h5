import type { Config } from 'tailwindcss';

// 设计 token 全部来自 src/styles/tokens.css 的 CSS 变量；
// Tailwind 只承担布局 / 间距 / 字号原子类，视觉表面（卡片、课帖、罗盘）走组件样式。
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        'paper-2': 'var(--paper-2)',
        'paper-3': 'var(--paper-3)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        'line-2': 'var(--line-2)',
        verm: 'var(--verm)',
        'verm-2': 'var(--verm-2)',
        'verm-soft': 'var(--verm-soft)',
        gold: 'var(--gold)',
        'gold-2': 'var(--gold-2)',
        'gold-soft': 'var(--gold-soft)',
        jade: 'var(--jade)',
        'jade-soft': 'var(--jade-soft)',
        teal: 'var(--teal)',
        'teal-2': 'var(--teal-2)',
        saffron: 'var(--saffron)',
        lacquer: 'var(--lacquer)',
      },
      fontFamily: {
        serif: ['"Songti SC"', '"Source Han Serif SC"', '"Noto Serif SC"', '"Noto Serif JP"', '"Hiragino Mincho ProN"', 'Georgia', 'serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', '"Noto Sans"', 'sans-serif'],
      },
      transitionTimingFunction: {
        ease: 'cubic-bezier(.22,.61,.36,1)',
        spring: 'cubic-bezier(.34,1.4,.5,1)',
      },
    },
  },
  plugins: [],
};

export default config;

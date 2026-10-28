/**
 * tests/entry/pwa-register.test.ts — 工程师补测（QA Round 1 缺陷 #1 回归）。
 * vite.config.ts 设 injectRegister:null 关闭插件自动注入，src/main.tsx 必须
 * 显式 import 并调用 registerSW({ immediate: true })，否则 dist/sw.js 生成
 * 却不激活、断网即失效（PRD 验收 #13）。静态断言守护，防再被删。
 * （vitest 为 node 环境，无法 import virtual: 模块，故读源码断言。）
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MAIN_SRC = readFileSync(join(process.cwd(), 'src', 'main.tsx'), 'utf-8');

describe('PWA 注册回归 — main.tsx 显式注册 service worker', () => {
  it("import { registerSW } from 'virtual:pwa-register'", () => {
    expect(MAIN_SRC).toMatch(/import\s*\{\s*registerSW\s*\}\s*from\s*'virtual:pwa-register'/);
  });

  it('启动时调用 registerSW({ immediate: true })', () => {
    expect(MAIN_SRC).toMatch(/registerSW\(\s*\{\s*immediate:\s*true\s*\}\s*\)/);
  });

  it('注册调用有 try/catch 降级保护（dev 或不支持 SW 的宿主不阻断首屏）', () => {
    expect(MAIN_SRC).toMatch(/try\s*\{[\s\S]*registerSW\([\s\S]*\}\s*catch\s*\{/);
  });
});

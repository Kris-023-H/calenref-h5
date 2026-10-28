/**
 * scripts/probe-lang.mjs — 用裸 CDP 驱动 Edge，实测「切英文」前后 DOM 是否真为空。
 * 用法：node scripts/probe-lang.mjs [baseUrl]
 * 依赖：Node 22 自带 WebSocket / fetch，无需额外包。
 */

const BASE = process.argv[2] || 'http://localhost:4173/';
const PORT = 9333;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\144.0.3719.93\\msedge.exe';

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const profile = mkdtempSync(join(tmpdir(), 'edgeprobe-'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const child = spawn(
  EDGE,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--disable-extensions',
    '--window-size=430,932',
    '--lang=zh-CN',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

let wsUrl = '';
for (let i = 0; i < 40; i++) {
  await sleep(250);
  try {
    const r = await fetch(`http://localhost:${PORT}/json/version`);
    const j = await r.json();
    if (j.webSocketDebuggerUrl) {
      wsUrl = j.webSocketDebuggerUrl;
      break;
    }
  } catch {
    /* not up yet */
  }
}
if (!wsUrl) {
  console.error('浏览器未就绪');
  child.kill();
  process.exit(1);
}

const ws = new WebSocket(wsUrl);
let seq = 0;
const pending = new Map();
const logs = [];

ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    return;
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    logs.push(`[EXC] ${d.text} ${d.exception?.description || ''}`.slice(0, 400));
  }
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    logs.push(`[ERR] ${msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(' ')}`.slice(0, 400));
  }
  if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    logs.push(`[LOG] ${msg.params.entry.text}`.slice(0, 400));
  }
});

const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

await new Promise((r) => ws.addEventListener('open', r));

// 建一个 target 并 attach，拿到 sessionId 才能在 page 上发命令
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);

await S('Runtime.enable');
await S('Log.enable');
await S('Page.enable');
await S('Network.enable');
await S('Network.setBypassServiceWorker', { bypass: true });
await S('Page.navigate', { url: BASE });
await sleep(3500);

const evaluate = async (expression) => {
  const r = await S('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) return { error: r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '') };
  return r.result.value;
};

const snapshot = async (label) => {
  const v = await evaluate(`(() => ({
    href: location.href,
    rootChildren: document.querySelector('#root')?.childElementCount ?? -1,
    rootHtmlLen: document.querySelector('#root')?.innerHTML.length ?? -1,
    bodyTextLen: document.body.innerText.length,
    bodyText: document.body.innerText.replace(/\\n+/g, ' | ').slice(0, 160)
  }))()`);
  console.log(`» ${label}:`, typeof v === 'object' ? JSON.stringify(v) : v);
  return v;
};

// 按文案点击：优先精确匹配，且取「最深」的命中节点（避免点到外层容器）
const clickText = async (text) => {
  const r = await evaluate(`(() => {
    const want = ${JSON.stringify(text)};
    const all = Array.from(document.querySelectorAll('button, [role=button], a, div, span, li'));
    const txt = (n) => (n.innerText || '').replace(/\\s+/g, ' ').trim();
    const exact = all.filter((n) => txt(n) === want);
    const pool = exact.length ? exact : all.filter((n) => txt(n).includes(want));
    if (!pool.length) return 'MISS';
    // 最深：没有任何后代也在 pool 里
    const deepest = pool.filter((n) => !pool.some((m) => m !== n && n.contains(m)));
    const hit = deepest[deepest.length - 1] || pool[pool.length - 1];
    hit.click();
    return 'OK(' + pool.length + '/' + deepest.length + ')';
  })()`);
  return r;
};

console.log('=== 初始 ===');
await snapshot('load');

for (const step of ['仅必要', '跳过', '我的']) {
  const r = await clickText(step);
  console.log(`click "${step}" ->`, r);
  await sleep(1200);
  await snapshot(`after ${step}`);
}

const langHit = await clickText('语言与历法');
console.log('click "语言与历法" ->', langHit);
await sleep(1200);
await snapshot('lang screen');

const enHit = await clickText('English');
console.log('click "English" ->', enHit);
await sleep(1500);
await snapshot('after English');

const doneHit = (await clickText('Done')) === 'MISS' ? await clickText('完成') : 'OK';
console.log('click "完成" ->', doneHit);
await sleep(600);
await snapshot('done +0.6s');
await sleep(2000);
await snapshot('done +2.6s');
await sleep(3000);
await snapshot('done +5.6s');

console.log('=== 异常/报错 ===');
console.log(logs.length ? logs.join('\n') : '（无）');

ws.close();
child.kill();
await sleep(500);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  /* ignore */
}
process.exit(0);

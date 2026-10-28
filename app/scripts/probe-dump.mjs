/**
 * scripts/probe-dump.mjs — 切到指定语言后，打印某屏完整可见文本（定位残留用）。
 * 用法：node scripts/probe-dump.mjs en home
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const LANG = process.argv[2] || 'en';
const SCREEN = process.argv[3] || 'home';
const BASE = process.argv[4] || 'http://localhost:4173/';
const PORT = 9335;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\144.0.3719.93\\msedge.exe';

const profile = mkdtempSync(join(tmpdir(), 'edgedump-'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const child = spawn(
  EDGE,
  ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', '--window-size=430,932', 'about:blank'],
  { stdio: 'ignore' },
);

let wsUrl = '';
for (let i = 0; i < 40; i++) {
  await sleep(250);
  try {
    const j = await (await fetch(`http://localhost:${PORT}/json/version`)).json();
    if (j.webSocketDebuggerUrl) {
      wsUrl = j.webSocketDebuggerUrl;
      break;
    }
  } catch {
    /* wait */
  }
}
const ws = new WebSocket(wsUrl);
let seq = 0;
const pending = new Map();
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
await new Promise((r) => ws.addEventListener('open', r));
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);
await S('Runtime.enable');
await S('Page.enable');
await S('Network.enable');
await S('Network.setBypassServiceWorker', { bypass: true });

const ev = async (expression) => {
  const r = await S('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return r.exceptionDetails ? `__ERR__ ${r.exceptionDetails.text}` : r.result.value;
};
const click = (t) =>
  ev(`(() => {
    const want = ${JSON.stringify(t)};
    const all = Array.from(document.querySelectorAll('button,[role=button],a,div,span,li'));
    const txt = (n) => (n.innerText || '').replace(/\\s+/g,' ').trim();
    const exact = all.filter((n) => txt(n) === want);
    const pool = exact.length ? exact : all.filter((n) => txt(n).includes(want));
    if (!pool.length) return 'MISS';
    const d = pool.filter((n) => !pool.some((m) => m !== n && n.contains(m)));
    (d[d.length - 1] || pool[pool.length - 1]).click();
    return 'OK';
  })()`);

await S('Page.navigate', { url: BASE });
await sleep(3000);
await click('仅必要');
await sleep(500);
await click('跳过');
await sleep(1200);
await click('我的');
await sleep(1100);
await click('语言与历法');
await sleep(1200);
await click(LANG);
await sleep(1500);
const doneLabel = LANG === 'en' ? 'Done' : '完成';
await click(doneLabel);
await sleep(1400);

if (SCREEN === 'home') {
  await S('Page.navigate', { url: BASE });
  await sleep(2600);
}

console.log(await ev(`document.body.innerText`));
ws.close();
child.kill();
await sleep(400);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  /* ignore */
}
process.exit(0);

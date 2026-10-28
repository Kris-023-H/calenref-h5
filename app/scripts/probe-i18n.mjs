/**
 * scripts/probe-i18n.mjs — 三语界面实测：逐屏抓取可见文本，做字符级泄漏检查。
 *
 *   英文界面   → 不应出现任何汉字（干支/节气等专名除外，单独列出人工判读）
 *   繁体界面   → 不应出现任何「有繁体对应字」的简体字（用 zh-hant.ts 的 CHARS 表判定）
 *   简体界面   → 基线，仅记录
 *
 * 用法：node scripts/probe-i18n.mjs [baseUrl]
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.argv[2] || 'http://localhost:4173/';
const PORT = 9334;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\144.0.3719.93\\msedge.exe';

/* ---------- 从 zh-hant.ts 抽出简→繁映射的「简体键」集合 ---------- */
const src = readFileSync(new URL('../src/i18n/zh-hant.ts', import.meta.url), 'utf8');
const block = src.slice(src.indexOf('const CHARS'), src.indexOf('export function s2t'));
const SIMP_CHARS = [...block.matchAll(/'([^']+)':\s*'([^']+)'/g)].map((m) => m[1]).filter((k) => k.length === 1);

/* ---------- 浏览器启动 ---------- */
const profile = mkdtempSync(join(tmpdir(), 'edgei18n-'));
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
    'about:blank',
  ],
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
    /* not up */
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
const errors = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
    return;
  }
  if (m.method === 'Runtime.exceptionThrown') errors.push(`[EXC] ${m.params.exceptionDetails.text}`);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')
    errors.push(`[ERR] ${m.params.args.map((a) => a.value ?? a.description ?? a.type).join(' ')}`);
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

const evaluate = async (expression) => {
  const r = await S('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) return `__EVALERR__ ${r.exceptionDetails.text}`;
  return r.result.value;
};

const clickText = async (text) =>
  evaluate(`(() => {
    const want = ${JSON.stringify(text)};
    const all = Array.from(document.querySelectorAll('button,[role=button],a,div,span,li'));
    const txt = (n) => (n.innerText || '').replace(/\\s+/g,' ').trim();
    const exact = all.filter((n) => txt(n) === want);
    const pool = exact.length ? exact : all.filter((n) => txt(n).includes(want));
    if (!pool.length) return 'MISS';
    const deepest = pool.filter((n) => !pool.some((m) => m !== n && n.contains(m)));
    (deepest[deepest.length - 1] || pool[pool.length - 1]).click();
    return 'OK';
  })()`);

const bodyText = () => evaluate(`document.body.innerText.replace(/\\n+/g,' ').trim()`);
const back = () => evaluate(`(() => { const b = document.querySelector('.ab-back, [data-back], header button'); if (b) { b.click(); return 'OK'; } window.history.back(); return 'HIST'; })()`);

/* ---------- 扫描单屏文本 ---------- */
const CJK = /[\u4e00-\u9fff]/;
function analyze(label, text, lang) {
  const chars = [...text];
  if (lang === 'en') {
    const cjk = [...new Set(chars.filter((c) => CJK.test(c)))];
    if (!cjk.length) return null;
    // 取每处汉字的上下文，便于人工判读是否为专名
    const ctx = [];
    for (let i = 0; i < chars.length; i++) {
      if (CJK.test(chars[i])) {
        const s = chars.slice(Math.max(0, i - 8), i + 9).join('');
        if (!ctx.some((c) => c.includes(chars[i]))) ctx.push(s);
      }
    }
    return { label, kind: '英文界面残留汉字', chars: cjk, samples: ctx.slice(0, 6) };
  }
  if (lang === 'zh-Hant') {
    const simp = [...new Set(chars.filter((c) => SIMP_CHARS.includes(c)))];
    if (!simp.length) return null;
    const ctx = [];
    for (let i = 0; i < chars.length; i++) {
      if (SIMP_CHARS.includes(chars[i])) {
        const s = chars.slice(Math.max(0, i - 8), i + 9).join('');
        if (!ctx.some((c) => c.includes(chars[i]))) ctx.push(s);
      }
    }
    return { label, kind: '繁体界面残留简体', chars: simp, samples: ctx.slice(0, 6) };
  }
  return null;
}

/* ---------- 每种语言的走查路线 ---------- */
const ROUTES = {
  zh: {
    lang: '简体中文',
    done: '完成',
    screens: ['当事人档案', '我的报告', '我的收藏', '择日提醒'],
    kb: '知库',
    legal: '隐私政策',
  },
  en: {
    lang: 'English',
    done: 'Done',
    screens: ['Profiles', 'My reports', 'Favorites', 'Reminders'],
    kb: 'Library',
    legal: 'Privacy Policy',
  },
  'zh-Hant': {
    lang: '繁體中文',
    done: '完成',
    screens: ['當事人檔案', '我的報告', '我的收藏', '擇日提醒'],
    kb: '知庫',
    legal: '隱私政策',
  },
};

const findings = [];

async function walk(langKey) {
  const R = ROUTES[langKey];
  // 每轮独立：清空该源下的 IndexedDB / localStorage，避免上一轮语言残留
  await S('Storage.clearDataForOrigin', { origin: new URL(BASE).origin, storageTypes: 'all' });
  await S('Page.navigate', { url: BASE });
  await sleep(3000);
  await clickText('仅必要');
  await sleep(600);
  await clickText('跳过');
  await sleep(1400);

  // 起始一定是简体（存储已清），所以入口按简体文案点
  await clickText('我的');
  await sleep(1200);
  await clickText('语言与历法');
  await sleep(1300);

  // 切到目标语言
  await clickText(R.lang);
  await sleep(1600);
  const langTxt = await bodyText();
  const f2 = analyze('lang 屏（切换后）', langTxt, langKey);
  if (f2) findings.push(f2);

  await clickText(R.done);
  await sleep(1600);

  // 「我的」屏
  const meTxt = await bodyText();
  const f1 = analyze('me', meTxt, langKey);
  if (f1) findings.push(f1);

  // 子页
  for (const s of R.screens) {
    const hit = await clickText(s);
    await sleep(1400);
    if (hit === 'OK') {
      const txt = await bodyText();
      const f = analyze(s, txt, langKey);
      if (f) findings.push(f);
      await back();
      await sleep(1100);
    }
  }

  // 回首页：直接重载（已完成引导，落地即首页）
  await S('Page.navigate', { url: BASE });
  await sleep(2600);
  const homeTxt = await bodyText();
  const f0 = analyze('home', homeTxt, langKey);
  if (f0) findings.push(f0);

  // 知库
  const kbHit = await clickText(R.kb);
  await sleep(1500);
  if (kbHit === 'OK') {
    const kbTxt = await bodyText();
    const f = analyze('kb', kbTxt, langKey);
    if (f) findings.push(f);
    await back();
    await sleep(1200);
  }

  // 法务深链（审核方会直接打开这几页）
  for (const p of ['privacy', 'terms', 'refund']) {
    await S('Page.navigate', { url: `${BASE}?legal=${p}` });
    await sleep(2400);
    const txt = await bodyText();
    const f = analyze(`legal:${p}`, txt, langKey);
    if (f) findings.push(f);
  }

  console.log(`[${langKey}] lang=${langTxt.length} me=${meTxt.length} home=${homeTxt.length} 字`);
}

for (const k of ['zh', 'en', 'zh-Hant']) await walk(k);

console.log('\n=== 泄漏检查 ===');
if (!findings.length) console.log('（无）');
for (const f of findings) {
  console.log(`\n· ${f.label} — ${f.kind}`);
  console.log(`  字符: ${f.chars.join(' ')}`);
  for (const s of f.samples) console.log(`  「${s}」`);
}

console.log('\n=== JS 异常 ===');
console.log(errors.length ? [...new Set(errors)].join('\n') : '（无）');

ws.close();
child.kill();
await sleep(400);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  /* ignore */
}
process.exit(0);

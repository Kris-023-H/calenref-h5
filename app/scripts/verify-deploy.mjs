/**
 * 部署后自检：不能只看接口 200，必须确认页面真的能渲染。
 *
 * 用法：node scripts/verify-deploy.mjs https://calenref.kris-188h.workers.dev
 * 退出码：0 全通过 / 1 有失败项（CI 会红）
 *
 * 检查项（源自 2026-10-28 线上白屏事故 + 2026-10-29 Creem 二次复核）：
 *   1. index.html 引用的是 /assets/index-<hash>.js，不是 /src/main.tsx
 *   2. 该 js 真的能取到（200）
 *   3. HTML 里没有 __SITE_URL__ / __ENTITY__ 残留
 *   4. robots.txt / sitemap.xml / og 图 / manifest.webmanifest 200
 *   5. 法务四页 200 **且返回体含法务正文**（不能是 6KB 空壳 index.html）
 *   6. /api/verify 与 /api/healthz 由 Worker 接管
 */
const base = (process.argv[2] ?? '').replace(/\/+$/, '');
if (!base) {
  console.error('用法：node scripts/verify-deploy.mjs <站点根地址>');
  process.exit(2);
}

const results = [];
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? '✓' : '✗'} ${name}${detail ? '  — ' + detail : ''}`);
};

async function get(path) {
  const res = await fetch(base + path, { redirect: 'follow' });
  const text = res.status === 200 ? await res.text() : '';
  return { status: res.status, text };
}

const home = await get('/');
const assetRef = home.text.match(/src="([^"]*\/assets\/index-[^"]*\.js)"/)?.[1] ?? '';
ok('首页引用构建产物', !!assetRef && !home.text.includes('/src/main.tsx'), assetRef || '仍在引用 /src/main.tsx');

if (assetRef) {
  const js = await get(assetRef);
  ok('构建产物可取到', js.status === 200, `HTTP ${js.status}`);
} else {
  ok('构建产物可取到', false, '无产物引用');
}

ok(
  'SEO 占位符已替换',
  !home.text.includes('__SITE_URL__') && !home.text.includes('__ENTITY__'),
  home.text.includes('__SITE_URL__') ? '仍有 __SITE_URL__' : 'OK',
);

for (const p of ['/robots.txt', '/sitemap.xml', '/og-1200x630.png', '/manifest.webmanifest']) {
  const r = await get(p);
  ok(`${p} 可访问`, r.status === 200, `HTTP ${r.status}`);
}

// 法务四页：200 只是及格线，返回体必须真的含正文（否则审核方看到的是空壳首页）
const LEGAL = [
  { path: '/privacy', must: ['隐私政策', 'Privacy Policy'] },
  { path: '/terms', must: ['服务条款', 'Terms of Service'] },
  { path: '/refund', must: ['退款政策', 'Refund Policy'] },
  { path: '/cookies', must: ['Cookie 政策', 'Cookie Policy'] },
];
for (const { path, must } of LEGAL) {
  const r = await get(path);
  const missing = must.filter((m) => !r.text.includes(m));
  const isShell = r.text.includes('/src/main.tsx') || r.text.length < 2000;
  ok(
    `法务页 ${path}`,
    r.status === 200 && missing.length === 0 && !isShell,
    r.status !== 200
      ? `HTTP ${r.status}`
      : missing.length
        ? `返回体缺少：${missing.join('、')}（可能是 SPA 空壳）`
        : `${r.text.length}B`,
  );
}

const verify = await get('/api/verify?ref=zj_00000000');
// 无效 ref 现返回 404 JSON（不再 SPA 回退成 200 HTML）；200/404 都证明 Worker 接管了 /api/*
ok('/api/verify 由 Worker 接管', verify.status === 200 || verify.status === 404, `HTTP ${verify.status}`);

const health = await get('/api/healthz');
let healthOk = false;
try {
  const h = JSON.parse(health.text);
  healthOk = health.status === 200 && h.ok === true;
  ok(
    '/api/healthz 可用',
    healthOk,
    `HTTP ${health.status} · checkout=${h.checkout?.configured} · kv=${h.kv?.bound} · redeem=${h.redeem?.configured} · webhook=${h.webhook?.endpoint}`,
  );
} catch {
  ok('/api/healthz 可用', false, `HTTP ${health.status} 非 JSON`);
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} 项通过`);
if (failed.length) {
  console.log('失败项：' + failed.map((f) => f.name).join('、'));
  process.exit(1);
}

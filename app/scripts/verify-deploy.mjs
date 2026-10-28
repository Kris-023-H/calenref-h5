/**
 * 部署后自检：不能只看接口 200，必须确认页面真的能渲染。
 *
 * 用法：node scripts/verify-deploy.mjs https://zeji-h5.kris-188h.workers.dev
 * 退出码：0 全通过 / 1 有失败项（CI 会红）
 *
 * 检查项（源自 2026-10-28 线上白屏事故）：
 *   1. index.html 引用的是 /assets/index-<hash>.js，不是 /src/main.tsx
 *   2. 该 js 真的能取到（200）
 *   3. HTML 里没有 __SITE_URL__ / __ENTITY__ 残留
 *   4. robots.txt / sitemap.xml / og 图 200
 *   5. 法务四页深链 200（SPA 回退生效）
 *   6. /api/verify 有响应（Worker 接管了 /api/*）
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

for (const p of ['/robots.txt', '/sitemap.xml', '/og-1200x630.png']) {
  const r = await get(p);
  ok(`${p} 可访问`, r.status === 200, `HTTP ${r.status}`);
}

for (const p of ['/privacy', '/terms', '/refund', '/cookie']) {
  const r = await get(p);
  ok(`法务深链 ${p}`, r.status === 200, `HTTP ${r.status}`);
}

const verify = await get('/api/verify?ref=zj_00000000');
ok('/api/verify 由 Worker 接管', verify.status === 200, `HTTP ${verify.status}`);

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} 项通过`);
if (failed.length) {
  console.log('失败项：' + failed.map((f) => f.name).join('、'));
  process.exit(1);
}

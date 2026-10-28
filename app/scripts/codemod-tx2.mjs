/**
 * scripts/codemod-tx2.mjs — 把残留的多行 `lang === 'en' ? 'EN' : '中文'` 收敛为 tx()。
 * 跳过「取字段」用法（分支是 'en' / 'zh' / 'zhHant' 这类键名）。
 * 用法：node scripts/codemod-tx2.mjs [--dry]
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const DRY = process.argv.includes('--dry');

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (p === join(SRC, 'i18n')) continue; // i18n 内部自持 tx，不参与
      walk(p);
    } else if (/\.tsx?$/.test(p)) files.push(p);
  }
})(SRC);

const RE = /lang === 'en'\s*\?\s*'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'/g;
const KEYS = new Set(['en', 'zh', 'zhHant']);

/** 计算到 src/i18n 的相对导入路径 */
function i18nPath(file) {
  const rel = relative(join(file, '..'), join(SRC, 'i18n')).replace(/\\/g, '/');
  return rel.startsWith('.') ? rel : `./${rel}`;
}

let total = 0;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  let n = 0;
  let out = src.replace(RE, (m, en, zh) => {
    if (KEYS.has(en) || KEYS.has(zh)) return m; // 取字段，不是文案
    n++;
    return `tx('${zh}', '${en}', lang)`;
  });
  if (!n) continue;

  // 确保 tx 已导入
  const importRe = /import \{([^}]*)\} from '([^']*i18n)';/;
  const im = out.match(importRe);
  if (im && !/\btx\b/.test(im[1])) {
    const names = im[1].trim();
    out = out.replace(importRe, `import {${names}${names.endsWith(',') ? '' : ','} tx } from '${im[2]}';`);
  } else if (!im) {
    const line = `import { tx } from '${i18nPath(f)}';\n`;
    out = out.replace(/^(\/\*\*[\s\S]*?\*\/\s*\n)?/, `$1${line}`);
    console.log(`  ! ${f} 无 i18n 导入，已插入：${i18nPath(f)}`);
  }

  total += n;
  console.log(`${DRY ? '[dry] ' : ''}${relative(SRC, f)}  ${n} 处`);
  if (!DRY) writeFileSync(f, out, 'utf8');
}
console.log(`合计 ${total} 处`);

/**
 * scripts/gen-icons.mjs — 生成 PWA / favicon 图标（圭表 Logo，零依赖纯 Node）。
 *
 * 用法：node scripts/gen-icons.mjs
 * 输出：public/icons/ 下 icon.svg、icon-96/192/512.png、icon-maskable-512.png、
 *       apple-touch-icon.png（manifest 引用见 src/lib/pwa-manifest.ts）。
 *
 * 实现说明：无 sharp/canvas 依赖——内置最小软光栅化器（src-over 混合 +
 * 圆形笔刷描线）与最小 PNG 编码器（zlib + CRC32）。Logo 与
 * src/components/icons.tsx 的 GuibiaoLogo 逐路径一致（viewBox 40×40）。
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

/** 设计变量（与 src/styles/tokens.css 一致） */
const GOLD = '#D8BC78';
const GOLD_DEEP = '#AF893E';
const LACQUER = '#22180F';

// ---------------------------------------------------------------- PNG 编码

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** RGBA Buffer → PNG（filter 0，zlib deflate） */
function encodePNG(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- 软光栅化

function hexRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/** src-over 混合写入单像素 */
function blend(buf, size, x, y, [r, g, b], alpha) {
  if (x < 0 || y < 0 || x >= size || y >= size || alpha <= 0) return;
  const i = (y * size + x) * 4;
  const sa = alpha;
  const da = buf[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa <= 0) return;
  buf[i] = Math.round((r * sa + buf[i] * da * (1 - sa)) / oa);
  buf[i + 1] = Math.round((g * sa + buf[i + 1] * da * (1 - sa)) / oa);
  buf[i + 2] = Math.round((b * sa + buf[i + 2] * da * (1 - sa)) / oa);
  buf[i + 3] = Math.round(oa * 255);
}

function fillCircle(buf, size, cx, cy, r, color, alpha = 1) {
  const [er, eg, eb] = hexRgb(color);
  const r2 = r * r;
  for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(size - 1, Math.ceil(cy + r)); y += 1) {
    for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(size - 1, Math.ceil(cx + r)); x += 1) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r2) blend(buf, size, x, y, [er, eg, eb], alpha);
    }
  }
}

/** 圆形笔刷沿线盖印（等效 round-cap 描线） */
function strokeLine(buf, size, x0, y0, x1, y1, w, color, alpha = 1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(len / Math.max(0.5, w / 4)));
  for (let i = 0; i <= steps; i += 1) {
    fillCircle(buf, size, x0 + (dx * i) / steps, y0 + (dy * i) / steps, w / 2, color, alpha);
  }
}

function fillRoundRect(buf, size, x0, y0, x1, y1, r, color, alpha = 1) {
  const [er, eg, eb] = hexRgb(color);
  for (let y = Math.floor(y0); y < Math.ceil(y1); y += 1) {
    for (let x = Math.floor(x0); x < Math.ceil(x1); x += 1) {
      const cx = Math.min(Math.max(x + 0.5, x0 + r), x1 - r);
      const cy = Math.min(Math.max(y + 0.5, y0 + r), y1 - r);
      const inside = x + 0.5 >= x0 && x + 0.5 <= x1 && y + 0.5 >= y0 && y + 0.5 <= y1 &&
        (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r;
      if (inside) blend(buf, size, x, y, [er, eg, eb], alpha);
    }
  }
}

// ---------------------------------------------------------------- 圭表 Logo

/**
 * 绘制圭表（viewBox 40×40，与 GuibiaoLogo 一致）。
 * @param scale Logo 缩放（1 = 占满画布）
 * @param detailed 是否绘外环点线（小尺寸省略，等效组件 size>=26 分支）
 */
function drawGuibiao(buf, size, { scale = 1, detailed = true, color = GOLD }) {
  const s = (size / 40) * scale;
  const u = (n) => n * s; // 用户单位 → 像素
  if (detailed) {
    // 外环点线（dasharray 1.2 8.01 → 点珠近似）
    const rOut = u(17.6);
    for (let a = 0; a < 360; a += 9.4) {
      const rad = (a * Math.PI) / 180;
      fillCircle(buf, size, 20 * s + rOut * Math.cos(rad), 20 * s + rOut * Math.sin(rad), Math.max(0.6, u(0.55)), color, 0.3);
    }
  }
  // 内环（圆周盖印描线）
  const rIn = u(detailed ? 15.2 : 16.4);
  const stepsIn = 720;
  for (let i = 0; i <= stepsIn; i += 1) {
    const rad = (i / stepsIn) * Math.PI * 2;
    fillCircle(buf, size, 20 * s + rIn * Math.cos(rad), 20 * s + rIn * Math.sin(rad), Math.max(0.5, u(0.5)), color, 0.16);
  }
  // 圭面（地平）
  strokeLine(buf, size, u(6.4), u(29.2), u(33.6), u(29.2), u(1.7), color, 1);
  // 表（立柱）
  strokeLine(buf, size, u(16.6), u(10.4), u(16.6), u(29.2), u(2.1), color, 1);
  // 表影（透明度 0.4）
  strokeLine(buf, size, u(16.6), u(29.2), u(26.4), u(29.2), u(3.6), color, 0.4);
  // 日（实心点）
  fillCircle(buf, size, u(28.2), u(12.2), u(3.1), color, 1);
}

/** 标准图标：漆底圆角方 + 金 Logo（小尺寸省略外环、加粗描边） */
function renderIcon(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4, 0);
  if (maskable) {
    // maskable：全出血方底，Logo 收进 60% 安全区
    fillRoundRect(buf, size, 0, 0, size, size, 0, LACQUER, 1);
    drawGuibiao(buf, size, { scale: 0.62, detailed: size >= 96 });
  } else {
    const radius = size * 0.22;
    fillRoundRect(buf, size, 0, 0, size, size, radius, LACQUER, 1);
    drawGuibiao(buf, size, { scale: 1, detailed: size >= 26 });
  }
  return encodePNG(size, size, buf);
}

// ---------------------------------------------------------------- 输出

mkdirSync(OUT_DIR, { recursive: true });

const outputs = [
  ['icon-96.png', 96, {}],
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-maskable-512.png', 512, { maskable: true }],
  ['apple-touch-icon.png', 180, {}],
];

for (const [name, size, opts] of outputs) {
  const png = renderIcon(size, opts);
  writeFileSync(join(OUT_DIR, name), png);
  console.log(`✓ ${name} (${size}×${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}

// 矢量 favicon（与 GuibiaoLogo 同路径，漆底圆角方）
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
  <rect width="40" height="40" rx="9" fill="${LACQUER}"/>
  <g fill="none" stroke="${GOLD}" stroke-width="1.4" stroke-linecap="round">
    <circle cx="20" cy="20" r="15.2" stroke-opacity=".16"/>
    <path d="M6.4 29.2h27.2" stroke-width="1.7"/>
    <path d="M16.6 10.4v18.8" stroke-width="2.1"/>
    <path d="M16.6 29.2h9.8" stroke-width="3.6" stroke-opacity=".4"/>
  </g>
  <circle cx="28.2" cy="12.2" r="3.1" fill="${GOLD}"/>
</svg>
`;
writeFileSync(join(OUT_DIR, 'icon.svg'), svg.trim() + '\n');
console.log('✓ icon.svg (vector favicon)');
console.log(`done → ${OUT_DIR}`);

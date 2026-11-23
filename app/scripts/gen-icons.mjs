/**
 * scripts/gen-icons.mjs — 生成 PWA / favicon 图标（历书 Logo，零依赖纯 Node）。
 *
 * 用法：node scripts/gen-icons.mjs
 * 输出：public/icons/ 下 icon.svg、icon-96/192/512.png、icon-maskable-512.png、
 *       apple-touch-icon.png（manifest 引用见 src/lib/pwa-manifest.ts）。
 *
 * 第三轮改版（Calen / 历知）：
 *   第一版是「圭表 + 日影」（立柱 + 地平线 + 太阳）—— 传统测日工具，读起来是择日器。
 *   第二版是「环形知识图谱」—— 又滑向 AI 科技图，与数字内容产品的定位错位。
 *   这一版是**历书页 + 日期徽标**：一页写着条目的参考、角上一枚日期标记。
 *   没有放射线、没有刻度环、没有节点网络 —— 它看起来就是一本可查的历书。
 *
 * 实现说明：无 sharp/canvas 依赖——内置最小软光栅化器（src-over 混合 +
 * 圆形笔刷描线）与最小 PNG 编码器（zlib + CRC32）。Logo 与
 * src/components/icons.tsx 的 AlmanacLogo 逐路径一致（viewBox 40×40）。
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

/**
 * 圆周描线（可指定角度区间与虚线节距）。
 * 外圈刻度与内圈图谱边都用它；虚线按弧长切分，避免角度越小、节距越密的畸变。
 */
function strokeArc(buf, size, cx, cy, r, w, color, { alpha = 1, from = 0, to = 360, dash = 0, gap = 0 } = {}) {
  const span = to - from;
  const steps = Math.max(12, Math.ceil((span / 360) * r * 10));
  for (let i = 0; i <= steps; i += 1) {
    const deg = from + (span * i) / steps;
    if (dash > 0) {
      // 弧长是像素，dash/gap 是用户单位 → 先换算再取模，否则在 512px 下会退化成锯齿
      const arcLen = ((deg - from) * Math.PI * r) / 180;
      if (arcLen % (dash + gap) > dash) continue;
    }
    const rad = (deg * Math.PI) / 180;
    fillCircle(buf, size, cx + r * Math.cos(rad), cy + r * Math.sin(rad), Math.max(0.45, w / 2), color, alpha);
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

// ---------------------------------------------------------------- 圭表测影 Logo

/**
 * 品牌图标：圭表测影（v3.7 主理人拍板回退，与原型 LOGO() 及
 * src/components/icons.tsx 的 AlmanacLogo 逐路径一致，viewBox 40×40）。
 *
 * 元素：外圈刻度环（虚线）+ 内圈 + 水平基准线（圭）+ 垂直表杆（表）
 *       + 半透明投影（影）+ 朱色日轮。
 * Creem 审核期曾改为「日历格 + 日期格阵」降类目风险，现已弃用。
 */
const VERM = '#B23A2B';

/**
 * 绘制圭表测影（viewBox 40×40，与 AlmanacLogo 一致）。
 * @param scale Logo 缩放（1 = 占满画布）
 * @param detailed 大尺寸（≥26）画外圈刻度环；小尺寸省略并加粗描边
 */
function drawGnomon(buf, size, { scale = 1, detailed = true, color = GOLD } = {}) {
  const s = (size / 40) * scale;
  const u = (n) => n * s;          // 长度
  const off = (size - 40 * s) / 2; // 居中偏移
  const p = (n) => off + n * s;    // 坐标
  // 小尺寸加粗（与 AlmanacLogo 的 k 系数同源：k = clamp(40/size)）
  const k = Math.max(1, Math.min(2.6, 40 / (size * scale)));
  const sw = (n) => u(n * k);

  // ① 外圈刻度环（虚线，起始角与原型 -90° 对齐到 12 点方向）
  if (detailed) {
    strokeArc(buf, size, p(20), p(20), u(17.6), Math.max(0.8, sw(1)), color, {
      alpha: 0.3, from: -90, to: 270, dash: u(1.2), gap: u(8.01),
    });
  }
  // ② 内圈
  strokeArc(buf, size, p(20), p(20), u(detailed ? 15.2 : 16.4), Math.max(0.8, sw(1)), color, {
    alpha: 0.16, from: -90, to: 270,
  });
  // ③ 圭：水平基准线
  strokeLine(buf, size, p(6.4), p(29.2), p(33.6), p(29.2), Math.max(1, sw(1.7)), color, 1);
  // ④ 表：垂直表杆
  strokeLine(buf, size, p(16.6), p(10.4), p(16.6), p(29.2), Math.max(1.2, sw(2.1)), color, 1);
  // ⑤ 影：投影（半透明）
  strokeLine(buf, size, p(16.6), p(29.2), p(26.4), p(29.2), Math.max(1.6, sw(3.6)), color, 0.4);
  // ⑥ 日轮（朱色）
  fillCircle(buf, size, p(28.2), p(12.2), sw(3.1), VERM, 1);
}

/** 标准图标：漆底圆角方 + 金色圭表测影（小尺寸省略外圈、加粗描边） */
function renderIcon(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4, 0);
  if (maskable) {
    fillRoundRect(buf, size, 0, 0, size, size, 0, LACQUER, 1);
    drawGnomon(buf, size, { scale: 0.92, detailed: size >= 96 });
  } else {
    const radius = size * 0.22;
    fillRoundRect(buf, size, 0, 0, size, size, radius, LACQUER, 1);
    drawGnomon(buf, size, { scale: 1, detailed: size >= 26 });
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

// 矢量 favicon（与 AlmanacLogo 圭表测影同几何，漆底圆角方）
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
  <rect width="40" height="40" rx="9" fill="${LACQUER}"/>
  <circle cx="20" cy="20" r="17.6" fill="none" stroke="${GOLD}" stroke-opacity=".30" stroke-width="1" stroke-dasharray="1.2 8.01"/>
  <circle cx="20" cy="20" r="15.2" fill="none" stroke="${GOLD}" stroke-opacity=".16" stroke-width="1"/>
  <path d="M6.4 29.2h27.2" fill="none" stroke="${GOLD}" stroke-width="1.7" stroke-linecap="round"/>
  <path d="M16.6 10.4v18.8" fill="none" stroke="${GOLD}" stroke-width="2.1" stroke-linecap="round"/>
  <path d="M16.6 29.2h9.8" fill="none" stroke="${GOLD}" stroke-width="3.6" stroke-linecap="round" stroke-opacity=".40"/>
  <circle cx="28.2" cy="12.2" r="3.1" fill="${VERM}"/>
</svg>
`;
writeFileSync(join(OUT_DIR, 'icon.svg'), svg.trim() + '\n');
console.log('✓ icon.svg (vector favicon)');
console.log(`done → ${OUT_DIR}`);

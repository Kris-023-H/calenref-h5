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

// ---------------------------------------------------------------- 历书 Logo

/**
 * 日历格几何（用户单位，40×40 画布）。
 *
 * 五个版本的取舍都写在这里，免得下次又绕回去：
 *   ① 圭表 + 日影        → 传统测日工具，读起来是择日器（类目风险最高）；
 *   ② 节点 + 边          → 科技拓扑图，滑向 AI 视觉（Restricted 风险）；
 *   ③ 文档页 + 三条目录行 → 干净但像备忘录，没有历法特征；
 *   ④ 日历格 + 单个圆点   → 96px 下退化成「卡片 + 镜头」，像相机；
 *   ⑤ 日历格 + 日期格阵（当前）→ 顶部月份条 + 3×3 日期格，首格朱色标当日。
 *      零科技符号、零刻度环，它说的是「这是一本可查的历法」。
 *      格用圆角方块而非圆点：圆点在 2×3 排布下读成骰子/键盘，方块才是日期格。
 */
const CAL = { x0: 10.8, y0: 9.6, x1: 29.2, y1: 30.4, r: 3.2 };
const STROKE_W = 1.5;
/** 顶部月份条的下沿 */
const HEAD_Y = 14.4;
/** 日期格阵：3×3 方格，首格为「当日」朱色标记 */
const GRID = { cell: 2.35, gapX: 2.45, gapY: 2.1, r: 0.5, cols: 3, rows: 3 };
const VERM = '#B23A2B';

/**
 * 日期格阵的左上角与步距（用户单位）；格阵在内框里水平/垂直居中。
 * 行距比列距略紧：内框 15.4×14.5 近方，等距会让上下留白不足 1.5 单位，
 * 44px 下格阵会贴住外框（实测像素级粘连），所以纵向单独收一档。
 */
function gridBox() {
  const inner = {
    x0: CAL.x0 + STROKE_W,
    x1: CAL.x1 - STROKE_W,
    y0: HEAD_Y,
    y1: CAL.y1 - STROKE_W,
  };
  const pitchX = GRID.cell + GRID.gapX;
  const pitchY = GRID.cell + GRID.gapY;
  const spanX = GRID.cell * GRID.cols + GRID.gapX * (GRID.cols - 1);
  const spanY = GRID.cell * GRID.rows + GRID.gapY * (GRID.rows - 1);
  return {
    pitchX,
    pitchY,
    x: inner.x0 + (inner.x1 - inner.x0 - spanX) / 2,
    y: inner.y0 + (inner.y1 - inner.y0 - spanY) / 2,
  };
}

/**
 * 绘制日历格（viewBox 40×40，与 AlmanacLogo 一致）。
 * @param scale Logo 缩放（1 = 占满画布）
 * @param detailed 小尺寸（<26）把描边与标记加粗一档，抵消缩小时的灰化
 */
function drawCard(buf, size, { scale = 1, detailed = true, color = GOLD } = {}) {
  const s = (size / 40) * scale;
  /** 长度（描边宽、圆角半径）—— 不带偏移 */
  const u = (n) => n * s;
  /** 坐标 —— 带居中偏移；maskable 缩到 0.62 时靠它把图案摆回正中 */
  const off = (size - 40 * s) / 2;
  const p = (n) => off + n * s;
  const boost = detailed ? 1 : 1.22;
  const sw = u(STROKE_W * boost);

  // ① 铺金整块 → ② 漆色内缩挖出描边（圆角严格同心）
  fillRoundRect(buf, size, p(CAL.x0), p(CAL.y0), p(CAL.x1), p(CAL.y1), u(CAL.r), color, 1);
  fillRoundRect(
    buf, size,
    p(CAL.x0) + sw, p(CAL.y0) + sw, p(CAL.x1) - sw, p(CAL.y1) - sw,
    Math.max(0, u(CAL.r) - sw), LACQUER, 1,
  );

  // ③ 顶部月份条：上沿跟随外框圆角，下沿切平
  fillRoundRect(buf, size, p(CAL.x0), p(CAL.y0), p(CAL.x1), p(HEAD_Y), u(CAL.r), color, 1);
  fillRoundRect(buf, size, p(CAL.x0), p(CAL.y0 + CAL.r), p(CAL.x1), p(HEAD_Y), 0, color, 1);

  // ④ 日期格阵；首格朱色，标「当日」
  const box = gridBox();
  for (let ri = 0; ri < GRID.rows; ri += 1) {
    for (let ci = 0; ci < GRID.cols; ci += 1) {
      const x = box.x + ci * box.pitchX;
      const y = box.y + ri * box.pitchY;
      const today = ri === 0 && ci === 0;
      fillRoundRect(
        buf, size,
        p(x), p(y), p(x + GRID.cell), p(y + GRID.cell), u(GRID.r),
        today ? VERM : color, 1,
      );
    }
  }
}

/** 标准图标：漆底圆角方 + 金 Logo（小尺寸省略外圈、加粗描边） */
function renderIcon(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4, 0);
  if (maskable) {
    // maskable：全出血方底，Logo 收进安全区。安全区是中央 80% 的圆（半径 40%），
    // 本图案半对角线 = √(9.2²+10.4²) ≈ 13.9/40，故 scale 0.92 时只占 32%，留足余量。
    fillRoundRect(buf, size, 0, 0, size, size, 0, LACQUER, 1);
    drawCard(buf, size, { scale: 0.92, detailed: size >= 96 });
  } else {
    const radius = size * 0.22;
    fillRoundRect(buf, size, 0, 0, size, size, radius, LACQUER, 1);
    drawCard(buf, size, { scale: 1, detailed: size >= 26 });
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

// 矢量 favicon（与 AlmanacLogo 同几何，漆底圆角方）
const gbox = gridBox();
const gridCells = [];
for (let ri = 0; ri < GRID.rows; ri += 1) {
  for (let ci = 0; ci < GRID.cols; ci += 1) {
    const x = gbox.x + ci * gbox.pitchX;
    const y = gbox.y + ri * gbox.pitchY;
    const today = ri === 0 && ci === 0;
    gridCells.push(
      `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${GRID.cell}" height="${GRID.cell}" rx="${GRID.r}" fill="${today ? VERM : GOLD}"/>`,
    );
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
  <rect width="40" height="40" rx="9" fill="${LACQUER}"/>
  <rect x="${CAL.x0}" y="${CAL.y0}" width="${(CAL.x1 - CAL.x0).toFixed(1)}" height="${(CAL.y1 - CAL.y0).toFixed(1)}" rx="${CAL.r}"
        fill="none" stroke="${GOLD}" stroke-width="${STROKE_W}"/>
  <path d="M${CAL.x0} ${HEAD_Y}V${CAL.y0 + CAL.r}A${CAL.r} ${CAL.r} 0 0 1 ${CAL.x0 + CAL.r} ${CAL.y0}H${CAL.x1 - CAL.r}A${CAL.r} ${CAL.r} 0 0 1 ${CAL.x1} ${CAL.y0 + CAL.r}V${HEAD_Y}Z"
        fill="${GOLD}"/>
  ${gridCells.join('\n  ')}
</svg>
`;
writeFileSync(join(OUT_DIR, 'icon.svg'), svg.trim() + '\n');
console.log('✓ icon.svg (vector favicon)');
console.log(`done → ${OUT_DIR}`);

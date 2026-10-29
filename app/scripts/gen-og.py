#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
scripts/gen-og.py — 生成 1200×630 的 OG / Twitter 分享图。

为什么不用 Canva 导图：分享图会随文案微调反复重出，留在脚本里可复现、可版本化；
字体用系统宋体（宣纸+宋体的品牌调性），不引入外部字体文件。

第四轮改版（CalenRef / 历知）：
  旧图的眉题是「三元择日」、主标题是「择吉」、英文名是 ZEJI —— 整张图都在说
  「我是择日工具」。新图换成「历知 / CALENREF / 按场景查阅传统历法规则」，
  右侧罗盘线稿换成历书日历格（与 public/icons/icon.svg 同几何）。
  印章字由「吉」改「历」：保留中式印记的视觉，去掉吉凶暗示。

用法：
    python scripts/gen-og.py
输出：
    public/og-1200x630.png
"""

from __future__ import annotations

import math
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1200, 630
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "og-1200x630.png")

# 品牌色（与 src/styles/tokens.css 对齐）
PAPER_TOP = (251, 247, 238)
PAPER_BOT = (226, 215, 195)
INK = (25, 23, 16)
INK_2 = (65, 59, 46)
MUTED = (138, 131, 115)
GOLD = (175, 137, 62)
GOLD_SOFT = (214, 195, 156)
VERM = (178, 58, 43)
CREAM = (255, 253, 246)

FONT_DIR = r"C:\Windows\Fonts"
F_SERIF = os.path.join(FONT_DIR, "simsun.ttc")
F_SANS = os.path.join(FONT_DIR, "msyh.ttc")
F_SANS_BD = os.path.join(FONT_DIR, "msyhbd.ttc")


def load(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size, index=0)


def paper_background() -> Image.Image:
    """宣纸底：竖向渐变 + 左上柔光。"""
    img = Image.new("RGB", (W, H), PAPER_TOP)
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / (H - 1)
        d.line(
            [(0, y), (W, y)],
            fill=tuple(int(PAPER_TOP[i] + (PAPER_BOT[i] - PAPER_TOP[i]) * t) for i in range(3)),
        )

    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).ellipse(
        [int(-W * 0.15), int(-H * 0.55), int(W * 0.72), int(H * 0.78)], fill=105
    )
    glow = glow.filter(ImageFilter.GaussianBlur(130))
    return Image.composite(Image.new("RGB", (W, H), CREAM), img, glow)


def draw_almanac(img: Image.Image) -> None:
    """
    右上：历书日历格（与 public/icons/icon.svg 同几何，放大 k 倍）。

    只画三个元素：外框、顶部月份条、3×3 日期格，首格朱色标「当日」。
    旧版这里是罗盘线稿，后来改成环形知识图谱 —— 前者像择日器，后者像 AI 产品，
    两种误读都会把商店类目带偏；日历格说的是「这是一本可查的历法」。
    """
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    # 与 gen-icons.mjs / icons.tsx 的 ALMANAC 保持一致（40×40 用户单位）
    cal = dict(x0=10.8, y0=9.6, x1=29.2, y1=30.4, r=3.2)
    head_y = 14.4
    stroke = 1.5
    cell = dict(size=2.35, gap_x=2.45, gap_y=2.1, r=0.5)

    k = 15.5
    cx, cy = 950, 302

    def px(n: float) -> float:
        return cx + (n - 20) * k

    def py(n: float) -> float:
        return cy + (n - 20) * k

    # 外框：outline 由外沿向内画，故直接给外沿坐标
    d.rounded_rectangle(
        [px(cal["x0"]), py(cal["y0"]), px(cal["x1"]), py(cal["y1"])],
        radius=cal["r"] * k,
        outline=GOLD + (255,),
        width=int(round(stroke * k)),
    )

    # 顶部月份条：上两角圆、下两角平
    d.rounded_rectangle(
        [px(cal["x0"]), py(cal["y0"]), px(cal["x1"]), py(head_y)],
        radius=cal["r"] * k,
        corners=(True, True, False, False),
        fill=GOLD + (255,),
    )

    # 日期格阵（内框居中）
    inner_x0, inner_x1 = cal["x0"] + stroke, cal["x1"] - stroke
    inner_y0, inner_y1 = head_y, cal["y1"] - stroke
    span_x = cell["size"] * 3 + cell["gap_x"] * 2
    span_y = cell["size"] * 3 + cell["gap_y"] * 2
    gx = inner_x0 + (inner_x1 - inner_x0 - span_x) / 2
    gy = inner_y0 + (inner_y1 - inner_y0 - span_y) / 2

    for ri in range(3):
        for ci in range(3):
            x = gx + ci * (cell["size"] + cell["gap_x"])
            y = gy + ri * (cell["size"] + cell["gap_y"])
            fill = VERM if (ri == 0 and ci == 0) else GOLD
            d.rounded_rectangle(
                [px(x), py(y), px(x + cell["size"]), py(y + cell["size"])],
                radius=cell["r"] * k,
                fill=fill + (255,),
            )

    img.paste(Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB"), (0, 0))


def draw_spaced(d: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, font, fill, spacing: int) -> int:
    """手工字距（Pillow 无 letter-spacing）。返回总宽度。"""
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=font, fill=fill)
        x += d.textlength(ch, font=font) + spacing
    return int(x - xy[0])


def draw_seal(img: Image.Image) -> None:
    """右下朱印：圆角方 + 反白「历」（品牌字，不含吉凶义）。"""
    size, x, y = 76, W - 152, H - 138
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle([x, y, x + size, y + size], radius=14, fill=VERM + (238,))
    f = load(F_SERIF, 44)
    bbox = d.textbbox((0, 0), "历", font=f)
    d.text(
        (x + (size - (bbox[2] - bbox[0])) / 2 - bbox[0], y + (size - (bbox[3] - bbox[1])) / 2 - bbox[1] - 2),
        "历",
        font=f,
        fill=(250, 244, 232),
    )
    img.paste(Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB"), (0, 0))


def main() -> None:
    img = paper_background()
    draw_almanac(img)
    draw_seal(img)

    d = ImageDraw.Draw(img)
    left = 96

    # 顶部眉题
    f_eyebrow = load(F_SANS, 25)
    draw_spaced(d, (left, 80), "传统历法参考 · 26 部经典文献", f_eyebrow, GOLD, 3)

    # 主标题（手工收紧字距：宋体单字宽，默认排版两个字之间会空）
    f_title = load(F_SERIF, 178)
    tx = left - 6
    for ch in "历知":
        d.text((tx, 124), ch, font=f_title, fill=INK)
        tx += d.textlength(ch, font=f_title) - 8

    # 英文名（字距拉开的无衬线小字）
    f_latin = load(F_SANS, 24)
    draw_spaced(d, (left + 4, 326), "C A L E N R E F", f_latin, MUTED, 6)

    # 主标语
    f_slogan = load(F_SERIF, 50)
    d.text((left + 2, 376), "按场景查阅传统历法规则", font=f_slogan, fill=INK_2)

    # 说明行
    f_desc = load(F_SANS, 25)
    d.text((left + 3, 450), "输入场景，检索历法规则与日期参考 · 不提供预测", font=f_desc, fill=MUTED)

    # 页脚
    f_foot = load(F_SANS, 22)
    d.text((left + 3, H - 74), "全部计算在本机完成 · 免注册免登录 · 中英双语", font=f_foot, fill=MUTED)

    img.save(OUT, "PNG", optimize=True)
    print(f"written: {OUT} ({os.path.getsize(OUT) // 1024} KB, {W}x{H})")


if __name__ == "__main__":
    main()

#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
scripts/gen-og.py — 生成 1200×630 的 OG / Twitter 分享图。

为什么不用 Canva 导图：分享图会随文案微调反复重出，留在脚本里可复现、可版本化；
字体用系统宋体（宣纸+宋体的品牌调性），不引入外部字体文件。

用法：
    python scripts/gen-og.py
输出：
    public/og-1200x630.png
"""

from __future__ import annotations

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


def draw_compass(img: Image.Image) -> None:
    """右上罗盘线稿：双环 + 24 向刻度 + 圭表竖线。"""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    cx, cy = 928, 296
    r_out, r_in = 208, 176

    d.ellipse([cx - r_out, cy - r_out, cx + r_out, cy + r_out], outline=GOLD_SOFT + (255,), width=2)
    d.ellipse([cx - r_in, cy - r_in, cx + r_in, cy + r_in], outline=GOLD_SOFT + (170,), width=1)

    import math

    for i in range(24):
        ang = math.radians(i * 15 - 90)
        major = i % 6 == 0
        r1 = r_in - (16 if major else 9)
        r2 = r_in - 1
        d.line(
            [
                (cx + r1 * math.cos(ang), cy + r1 * math.sin(ang)),
                (cx + r2 * math.cos(ang), cy + r2 * math.sin(ang)),
            ],
            fill=GOLD + ((220,) if major else (120,)),
            width=3 if major else 1,
        )

    # 圭表：贯穿中心的竖线（表）与底部横线（圭）
    d.line([(cx, cy - r_out - 46), (cx, cy + r_out + 26)], fill=GOLD + (95,), width=1)
    d.line([(cx - 74, cy + r_out + 26), (cx + 74, cy + r_out + 26)], fill=GOLD + (95,), width=1)
    d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=VERM + (235,))

    img.paste(Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB"), (0, 0))


def draw_spaced(d: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, font, fill, spacing: int) -> int:
    """手工字距（Pillow 无 letter-spacing）。返回总宽度。"""
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=font, fill=fill)
        x += d.textlength(ch, font=font) + spacing
    return int(x - xy[0])


def draw_seal(img: Image.Image) -> None:
    """右下朱印：圆角方 + 反白「吉」。"""
    size, x, y = 76, W - 152, H - 138
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle([x, y, x + size, y + size], radius=14, fill=VERM + (238,))
    f = load(F_SERIF, 44)
    bbox = d.textbbox((0, 0), "吉", font=f)
    d.text(
        (x + (size - (bbox[2] - bbox[0])) / 2 - bbox[0], y + (size - (bbox[3] - bbox[1])) / 2 - bbox[1] - 2),
        "吉",
        font=f,
        fill=(250, 244, 232),
    )
    img.paste(Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB"), (0, 0))


def main() -> None:
    img = paper_background()
    draw_compass(img)
    draw_seal(img)

    d = ImageDraw.Draw(img)
    left = 96

    # 顶部眉题
    f_eyebrow = load(F_SANS, 25)
    draw_spaced(d, (left, 80), "三元择日 · 人 · 事 · 日", f_eyebrow, GOLD, 4)

    # 主标题（手工收紧字距：宋体单字宽，默认排版两个字之间会空）
    f_title = load(F_SERIF, 178)
    tx = left - 6
    for ch in "择吉":
        d.text((tx, 124), ch, font=f_title, fill=INK)
        tx += d.textlength(ch, font=f_title) - 8

    # 英文名（字距拉开的无衬线小字）
    f_latin = load(F_SANS, 24)
    draw_spaced(d, (left + 4, 326), "Z E J I", f_latin, MUTED, 6)

    # 主标语
    f_slogan = load(F_SERIF, 50)
    d.text((left + 2, 368), "一事一议，因事择日", font=f_slogan, fill=INK_2)

    # 说明行
    f_desc = load(F_SANS, 25)
    d.text((left + 3, 450), "通书说这一天怎么样，择吉说这一天对你这件事怎么样", font=f_desc, fill=MUTED)

    # 页脚
    f_foot = load(F_SANS, 22)
    d.text((left + 3, H - 74), "出生资料只留在你的设备 · 免注册免登录 · 中英双语", font=f_foot, fill=MUTED)

    img.save(OUT, "PNG", optimize=True)
    print(f"written: {OUT} ({os.path.getsize(OUT) // 1024} KB, {W}x{H})")


if __name__ == "__main__":
    main()

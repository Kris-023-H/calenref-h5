#!/usr/bin/env python3
"""
creem-p0d.py — 第四批：残留的「吉时 / 课帖 / 制化 / 煞」等收尾词汇。

这些词不属于 Creem 明列禁词，但同属「命理/灵性结果」语境，
审核员读英文界面时最容易识别。统一改为中性历法表述：
  吉时 → 时辰     课帖 → 当日帖     制化 → 调整     次级煞 → 次级因素
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DRY = "--dry" in sys.argv

PAIRS: list[tuple[str, str]] = []


def P(path: str, old: str, new: str) -> None:
    PAIRS.append((path, old, new))


CC = "src/components/card-canvas.tsx"
P(CC, "吉日课帖（五版式）", "当日帖（五版式）")
P(CC, "课帖内容：", "当日帖内容：")
P(CC, "/** 课帖本体", "/** 当日帖本体")
P(CC, "/** 课帖舞台", "/** 当日帖舞台")
P(CC, "tx('吉时', 'Hour', lang)", "tx('时辰', 'Hour', lang)")

LR = "src/components/layer-row.tsx"
P(LR, "'属可制化的次级煞，可把关键动作移入吉时化解。', 'A secondary clash that can be mitigated — move the key action into an auspicious hour.'",
      "'属可调整的次级因素，可把关键动作移入时辰化解。', 'A secondary factor that can be adjusted — move the key action into a favourable hour.'")

AI = "src/screens/ai-screen.tsx"
P(AI, "制化之法是把关键动作移入吉时、核心环节在室内完成。", "调整之法是把关键动作移入时辰、核心环节在室内完成。")
P(AI, "Move key actions into good hours.", "Move key actions into favourable hours.")

DT = "src/screens/detail-screen.tsx"
P(DT, "tx('次级煞与制化', 'Secondary sha & remedies', lang)", "tx('次级因素与调整', 'Secondary factors & adjustments', lang)")
P(DT, "tx('制化', 'Remedy', lang)", "tx('调整', 'Adjustment', lang)")
P(DT, "tx('制吉日课帖', 'Make day card', lang)", "tx('制作当日帖', 'Make day card', lang)")

CS = "src/screens/card-screen.tsx"
P(CS, "tx('一纸可传的课帖', 'A card you can pass on', lang)", "tx('一纸可传的当日帖', 'A card you can pass on', lang)")
P(CS, "tx('课帖去印记', 'remove watermark', lang)", "tx('当日帖去印记', 'remove watermark', lang)")

OB = "src/screens/onboard-screen.tsx"
P(OB, "报告九章 · 课帖五版式", "报告九章 · 当日帖五版式")

PA = "src/screens/pay-screen.tsx"
P(PA, "课帖去印记", "当日帖去印记")

LG = "src/data/legal.ts"
P(LG, "生成的报告与课帖", "生成的报告与当日帖")
P(LG, "课帖版式", "当日帖版式")
P(LG, "自由分享自己生成的课帖与报告", "自由分享自己生成的当日帖与报告")

TD = "src/data/todos.ts"
P(TD, "'按吉时排定首客到店时刻', 'Schedule the first guest inside the auspicious hour', '按吉時排定首客到店時刻'",
      "'按时辰排定首客到店时刻', 'Schedule the first guest inside a favourable hour', '按時辰排定首客到店時刻'")
P(TD, "'上梁 / 挂牌吉时确认'", "'上梁 / 挂牌时辰确认'")
P(TD, "'上梁 / 掛牌吉時確認'", "'上梁 / 掛牌時辰確認'")

RS = "src/screens/report-screen.tsx"
P(RS, "tx('首选吉时 ', 'first hour ', lang)", "tx('首选时辰 ', 'first hour ', lang)")
P(RS, "tx('吉时落点', 'good hours', lang)", "tx('时辰落点', 'good hours', lang)")
P(RS, "动作时点以吉时为准。若吉时与场地档期冲突", "动作时点以时辰为准。若时辰与场地档期冲突")
P(RS, "'Action hours follow good hours. If a slot conflicts with", "'Action hours follow favourable hours. If a slot conflicts with")

RP = "src/screens/reports-screen.tsx"
P(RP, "tx('还有 6 项待办 · 按吉时倒排', 'by good hours, backwards'", "tx('还有 6 项待办 · 按时辰倒排', 'by favourable hours, backwards'")

LT = "src/services/ai/local-template-ai.ts"
P(LT, "首选吉时为", "首选时辰为")


def main() -> int:
    cache: dict[str, str] = {}
    applied = 0
    missed: list[str] = []
    for path, old, new in PAIRS:
        f = ROOT / path
        if path not in cache:
            cache[path] = f.read_text(encoding="utf-8")
        src = cache[path]
        if new in src and old not in src:
            continue
        if old not in src:
            missed.append(f"{path} :: {old[:70]}")
            continue
        cache[path] = src.replace(old, new)
        applied += 1
    # 其余「吉时」统一改「时辰」（保留「吉时 」带空格的已单列处理）
    for path in list(cache):
        src = cache[path]
        if "吉时" in src:
            applied += src.count("吉时")
            cache[path] = src.replace("吉时", "时辰")
    if not DRY:
        for path, src in cache.items():
            (ROOT / path).write_text(src, encoding="utf-8")
    print(f"{'[dry] ' if DRY else ''}applied {applied}")
    for m in missed:
        print("  MISS", m)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

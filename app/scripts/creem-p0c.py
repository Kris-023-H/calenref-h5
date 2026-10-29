#!/usr/bin/env python3
"""
creem-p0c.py — 第三批：替换后的收尾与质量修正。

第二批的批量替换留下三类问题，本脚本逐条修正：
  1. 繁体串里混入简体（如「整月传统条目全錯」）；
  2. 语感不通的机械替换（如「90 天推演只剩 5 天」「试排一课」）；
  3. 漏网的具体短语（「这一课」「起课自」「值神」「女命」等）。

每条都是完整字符串替换，命中即改，未命中不报错（幂等）。
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DRY = "--dry" in sys.argv

PAIRS: list[tuple[str, str, str]] = []


def P(path: str, old: str, new: str) -> None:
    PAIRS.append((path, old, new))


KB = "src/data/kb.ts"
# ---- 繁体串混入简体 ----
P(KB, "擇日，是另一回事。", "曆法參考，是另一回事。")
P(KB, "擇日以當事人的出生资料為體、以用事為用", "曆法參考以當事人的出生資料為據、以用事為用")
P(KB, "或者拿擇日的結論", "或者拿曆法參考的結論")
P(KB, "「起一課」出來的課期報告，才是擇日口徑", "「起一局」出來的推演報告，才是曆法參考口徑")
P(KB, "而你在擇吉 App 裡看到的結果，是按你的出生资料", "而你在本應用裡看到的結果，是按你的出生資料")
P(KB, "屬兔的人，地支是卯。传统婚月以年支相推", "屬兔的人，地支是卯。傳統婚月以年支相推")
P(KB, "整月传统条目全錯", "整月傳統條目全錯")
P(KB, "按月取的传统条目用節氣月", "按月取的傳統條目用節氣月")
P(KB, "華人看建除與传统条目。", "華人看建除與傳統條目。")
P(KB, "對甲是上吉", "對甲是優選")
P(KB, "推出來的上吉日", "推出來的優選日")
# ---- 简体串语感 ----
P(KB, "择日，是另一回事。", "历法参考，是另一回事。")
P(KB, "择日以当事人的出生资料为体、以用事为用", "历法参考以当事人的出生资料为据、以用事为用")
P(KB, "或者拿择日的结论", "或者拿历法参考的结论")
P(KB, "「起一课」出来的推演报告，才是择日口径", "「起一局」出来的推演报告，才是历法参考口径")
P(KB, "而你在择吉 App 里看到的结果，是按你的出生资料", "而你在本应用里看到的结果，是按你的出生资料")
P(KB, "对甲是上吉", "对甲是优选")
P(KB, "推出来的上吉日", "推出来的优选日")
# ---- 标题 ----
P(KB, "title: l('通书、黄历、择日：三个词不是一件事', 'Almanac, Huangli, and Date Selection: Three Different Things', '通書、黃曆、擇日：三個詞不是一件事')",
      "title: l('通书、黄历、历法参考：三个词不是一件事', 'Almanac, Huangli, and Calendar Reference: Three Different Things', '通書、黃曆、曆法參考：三個詞不是一件事')")
P(KB, "'医美机构开诊择日：生气与洁净'", "'医美机构开诊：生气与洁净'")
P(KB, "'醫美機構開診擇日：生氣與潔淨'", "'醫美機構開診：生氣與潔淨'")
P(KB, "'中国择日与韩国择日：都在躲什么', 'Chinese and Korean Date Selection: What Each Avoids', '中國擇日與韓國擇日：都在躲什麼'",
      "'中国历法与韩国历法：都在躲什么', 'Chinese and Korean Calendars: What Each Avoids', '中國曆法與韓國曆法：都在躲什麼'")
P(KB, "'日本六曜与东南亚择日传统'", "'日本六曜与东南亚历法传统'")
P(KB, "'日本六曜與東南亞擇日傳統'", "'日本六曜與東南亞曆法傳統'")
P(KB, "'《天工开物》与百工择日'", "'《天工开物》与百工历法'")
P(KB, "'《天工開物》與百工擇日'", "'《天工開物》與百工曆法'")
P(KB, "恰好是百工择日的底本", "恰好是百工历法的底本")
P(KB, "title: l('90 天推演只剩 5 天：一份完整的出局归因', 'Ninety Days Down to Five: A Complete Exclusion Reasoning', '90 天課期只剩 5 天：一份完整的出局歸因')",
      "title: l('90 天区间只剩 5 天：一份完整的出局归因', 'Ninety Days Down to Five: A Complete Exclusion Reasoning', '90 天區間只剩 5 天：一份完整的出局歸因')")
P(KB, "'1988 年夏天出生的人，出生资料可能一直错了一小时'", "'1988 年夏天出生的人，出生时辰可能一直错了一小时'")
P(KB, "'Born in a Chinese Summer, 1986–1991? Your Chart May Be Off by an Hour'", "'Born in a Chinese Summer, 1986–1991? Your Birth Hour May Be Off by an Hour'")
P(KB, "'1988 年夏天出生的人，出生资料可能一直錯了一小時'", "'1988 年夏天出生的人，出生時辰可能一直錯了一小時'")
P(KB, "'四库全书所收择日第一书。读它要按", "'四库全书所收历法第一书。读它要按")

BK = "src/data/books.ts"
P(BK, "'三十六卷，四库全书所收择日第一书。本产品的传统条目取用、建除、天德月德口径均以此为准。'",
      "'三十六卷，四库全书所收历法第一书。本产品的传统条目取用、建除、天德月德口径均以此为准。'")
P(BK, "'三十六卷，四庫全書所收擇日第一書。本產品的传统条目取用、建除、天德月德口徑均以此為準。'",
      "'三十六卷，四庫全書所收曆法第一書。本產品的傳統條目取用、建除、天德月德口徑均以此為準。'")
P(BK, "'克择（择日）专经，重造命与补龙扶山。'", "'传统历法专经，重营造择时与方位。'")
P(BK, "'克擇（擇日）專經，重造命與補龍扶山。'", "'傳統曆法專經，重營造擇時與方位。'")
P(BK, "'民俗宜忌汇编，多用于日常小事，专业择日仅作参照。'", "'民俗宜忌汇编，多用于日常小事，专业历法参考仅作参照。'")
P(BK, "'民俗宜忌匯編，多用於日常小事，專業擇日僅作參照。'", "'民俗宜忌匯編，多用於日常小事，專業曆法參考僅作參照。'")
P(BK, "'匠家择日与尺寸法度，上梁、安门、起造的专门依据。'", "'匠家历法与尺寸法度，上梁、安门、起造的专门依据。'")
P(BK, "'匠家擇日與尺寸法度，上樑、安門、起造的專門依據。'", "'匠家曆法與尺寸法度，上樑、安門、起造的專門依據。'")
P(BK, "'冠婚丧祭四礼程式，家庭择日的礼仪时序依据。'", "'冠婚丧祭四礼程式，家庭历法参考的礼仪时序依据。'")
P(BK, "'冠婚喪祭四禮程式，家庭擇日的禮儀時序依據。'", "'冠婚喪祭四禮程式，家庭曆法參考的禮儀時序依據。'")
P(BK, "'干支历法總集，用於定當事人出生年與用神。'", "'干支曆法總集，用於定當事人出生年與用神。'")

LG = "src/data/legal.ts"
P(LG, "发起择日、开始 AI 解读、点击购买", "发起推演、开始 AI 解读、点击购买")
P(LG, "'以「择日结果不符合预期」「事后认为不准确」为由——本服务是文化参考工具，不承诺结果（见《服务条款》第 2 条）'",
      "'以「历法参考结果不符合预期」「事后认为不准确」为由——本服务是文化参考工具，不承诺结果（见《服务条款》第 2 条）'")

TD = "src/data/todos.ts"
P(TD, "'另起一课'", "'另推一次'")
P(TD, "'另起一課'", "'另推一次'")

# ---------------- screens ----------------
AI = "src/screens/ai-screen.tsx"
P(AI, "就这一课继续问", "就本次继续问")
P(AI, "这一课还有别的要注意的吗", "本次还有别的要注意的吗")
P(AI, "this lesson’s computed basis", "this reading’s computed basis")
P(AI, "answers only from this lesson", "answers only from this reading")

AR = "src/screens/article-screen.tsx"
P(AR, "'试排一课', 'TRY A LESSON'", "'试推一次', 'TRY A READING'")
P(AR, "录出生资料，排一课看看", "录出生资料，推演一次看看")
P(AR, "'90 天推演 · 逐层推演 · 约 3 秒'", "'90 天区间 · 逐层推演 · 约 3 秒'")

CA = "src/screens/calc-screen.tsx"
P(CA, "tx(`起课 ${draft.startOffset} 日后`", "tx(`自 ${draft.startOffset} 日后起算`")

HO = "src/screens/home-screen.tsx"
P(HO, "按建除十二值神排", "按建除十二值日排")

IN = "src/screens/info-screen.tsx"
P(IN, "'嫁娶取课以女命定婚月、以男命查日辰冲年，两造皆须。'", "'嫁娶以女方定婚月、以男方查日辰冲年，两造皆须。'")
P(IN, "'Marriage reads the woman’s marry-month and checks the man’s clash — both required.'",
      "'Marriage reads the bride’s marriage months and checks the groom’s day clash — both required.'")
P(IN, "'出生地用于真太阳时校正；时刻错一位，时柱即错，干支全变。', 'Birthplace corrects true solar time; one hour off and the hour pillar changes.'",
      "'出生地用于真太阳时校正；时刻错一位，时柱即错，干支全变。', 'Birthplace corrects true solar time; one hour off and the whole cycle changes.'")
P(IN, "tx('取月用女命', 'marriage-month', lang)", "tx('取月依女方', 'marriage-month', lang)")
P(IN, "tx('起课自', 'Start from', lang)", "tx('起算自', 'Start from', lang)")
P(IN, "先按女命年支定「哪几个月可办」", "先按女方年支定「哪几个月可办」")
P(IN, "'Marry-month school: fix the months by the woman’s year branch first, then screen days.'",
      "'Marriage-month school: fix the months by the bride’s birth year first, then screen days.'")
P(IN, "'Non-jiang school: takes yin-yang non-jiang days, lighter on the marry-month.'",
      "'Non-jiang school: takes yin-yang non-jiang days, lighter on the marriage months.'")
P(IN, "只取建除十二值神与传统条目", "只取建除十二值日")
P(IN, "'Jianchu school: only the twelve officers and sha — best cross-cultural fit, common for business.'",
      "'Jianchu school: only the twelve day officers — best cross-cultural fit, common for business.'")

OB = "src/screens/onboard-screen.tsx"
P(OB, "是按建除十二值神排的", "是按建除十二值日排的")
P(OB, "tx('三元定一课', 'Person + Matter + Day', lang)", "tx('三层定一次', 'Person + Matter + Day', lang)")
P(OB, "日子再「黄道」也无用", "日子再好也无用")
P(OB, "First the person (pillars), then the matter", "First the person (birth details), then the matter")
P(OB, "'交付的是推演，<br>不是一句宜忌'", "'交付的是一份推演，<br>不是一句话'")
P(OB, "'A lesson period,\\nnot one word'", "'A full reading,\\nnot one word'")

PA = "src/screens/pay-screen.tsx"
P(PA, "本产品提供传统择日规则的工程化推演", "本产品提供传统历法规则的工程化推演")
P(PA, "this product engineers traditional day-selection", "this product engineers the traditional calendar")

PE = "src/screens/people-screen.tsx"
P(PE, "往后每起一课直接取用", "往后每次推演直接取用")
P(PE, "tx('女命 · 取月用', 'female', lang)", "tx('女方 · 取月用', 'female', lang)")
P(PE, "以女命定婚月，以男命查日辰冲年", "以女方定婚月，以男方查日辰冲年")

RE = "src/screens/reports-screen.tsx"
P(RE, "每一课都留档", "每一次推演都留档")
P(RE, "tx('起第一课', 'Start first lesson', lang)", "tx('开始第一次推演', 'Start first reading', lang)")

SH = "src/screens/share-screen.tsx"
P(SH, "也可由此起自己的一课。", "也可由此推演自己的一次。")


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
            missed.append(f"{path} :: {old[:64]}")
            continue
        cache[path] = src.replace(old, new)
        applied += 1

    if not DRY:
        for path, src in cache.items():
            (ROOT / path).write_text(src, encoding="utf-8")

    print(f"{'[dry] ' if DRY else ''}applied {applied}/{len(PAIRS)}")
    for m in missed:
        print("  MISS", m)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

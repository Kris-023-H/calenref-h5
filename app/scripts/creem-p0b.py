#!/usr/bin/env python3
"""
creem-p0b.py — Creem 审核整改第二批：界面与数据层的用户可见文案。

第一批（creem-p0.py）已处理 i18n 三语包、index.html、manifest、splash、home、页脚。
本批处理 screens / data / components / services 里内联的 `tx()` 文案与 L10n 数据，
外加 i18n/glossary.ts 术语表。

关键约束：
  - EventGroup 内部字面量（'经营择日' 等）由 PROTECT 保护，绝不能改（引擎与测试依赖）；
  - 英文规则一律限定在引号内（如 `'Pillars'`），避免命中 `data.pillars` 这类代码标识符；
  - 规则按「先具体、后泛化」排列，泛化规则放在最后。

用法：python scripts/creem-p0b.py [--dry]
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DRY = "--dry" in sys.argv

PROTECT = ["'经营择日'", "'工程择日'", "'家庭择日'"]
PH = "\u0000G%d\u0000"

TARGET_DIRS = ["src/screens", "src/data", "src/components", "src/services"]
EXTRA_FILES: list[str] = []  # 术语表按三元组单独处理，不走通用规则

RULES: list[tuple[str, str]] = []


def R(old: str, new: str) -> None:
    RULES.append((old, new))


# ============ 1. 品牌与「择吉」 ============
R("人 · 事 · 日 三元择吉", "人 · 事 · 日 三层历法参考")
R("三元择日规则引擎", "传统历法规则引擎")
R("三元择吉", "三层历法参考")
R("择吉的本体是", "本工具的本体是")
R("进入择吉", "进入应用")
R("择吉 App", "本应用")
R("「择吉」", "「本应用」")
R("择吉报告", "历法参考报告")
R("择吉常识", "通书常识")
R("择吉依中国传统择日之法", "本应用依据中国传统历法")
R("择日学的基本前提", "传统历法取用的基本前提")
R("择日总纲", "历法总纲")
R("择日文献", "历法文献")
R("择日记录", "历法参考记录")
R("代客择日收费服务", "代客提供历法参考的收费服务")
R("发起一次择日推演", "发起一次历法推演")
R("发起择日推演", "发起历法推演")
R("为他人择日", "为他人做历法参考")
R("所有择日结论", "所有历法参考结论")
R("择日结论", "历法参考结论")
R("择日提醒", "日期提醒")
R("择日流程", "推演流程")
R("择日第一书", "历法第一书")

# ============ 2. 课期 / 排课 / 日课 ============
R("天课期，", "天，")
R("天课期", "天推演")
R("课课期", "份推演")
R("课期报告", "推演报告")
R("课期筛选", "推演筛选")
R("课期区间", "推演区间")
R("课期长度", "推演天数")
R("课期窗口", "推演区间")
R("课期与提醒", "日期与提醒")
R("历史课期", "历史推演")
R("可用课期清单", "可用日期清单")
R("改课期条件", "改推演条件")
R("出具课期报告", "出具推演报告")
R("完整清单见课期报告", "完整清单见推演报告")
R("按课期倒排", "按推演区间倒排")
R("课期已删", "推演已删")
R("本课格的取用条件", "本套取用的条件")
R("本课已算出的依据", "本次已算出的依据")
R("本课已算出的层", "本次已算出的层")
R("课期", "推演")
R("排课动画", "推演动画")
R("排课入口", "推演入口")
R("不重新排课", "不重新推演")
R("排课", "推演")
R("日课四柱", "当日干支")
R("同一日课", "同一天")
R("日课卡", "当日卡")
R("日课详解", "当日详解")
R("日课", "当日")

# ============ 3. 四柱 / 年命 / 命理 ============
R("四柱年命", "出生年干支")
R("按你的四柱年命", "按你的出生资料")
R("双方四柱合参一报", "双方出生资料合参一报")
R("双方四柱", "双方出生资料")
R("当事人四柱", "当事人出生资料")
R("负责人四柱", "负责人出生资料")
R("主事人四柱", "主事人出生资料")
R("业主四柱", "业主出生资料")
R("户主四柱", "户主出生资料")
R("母亲四柱", "母亲出生资料")
R("母命四柱", "母亲出生资料")
R("录四柱", "录出生资料")
R("四柱资料", "出生资料")
R("四柱读取", "干支读取")
R("四柱排布", "干支排布")
R("四柱预览", "出生资料预览")
R("四柱全变", "干支全变")
R("四柱命理", "干支历法")
R("四柱八字", "干支纪年")
R("四柱", "出生资料")
R("女命行嫁月", "传统婚月")
R("行嫁月派", "婚月派")
R("行嫁月", "婚月")
R("日辰冲命", "日辰冲年")
R("冲命", "冲年")
R("年命", "出生年")
R("命主", "当事人")
R("八字", "干支")
R("三宗派", "三派对照")
R("神煞边界声明", "传统条目边界声明")
R("不引入新神煞", "不引入未纳入的传统条目")
R("不引入未纳入神煞", "不引入未纳入的传统条目")
R("神煞取用", "传统条目取用")
R("整月神煞全错", "整月传统条目全错")
R("神煞", "传统条目")
R("吉凶", "宜忌")

# ============ 4. 英文内联文案（限定引号，避免命中标识符） ============
R("'Subject pillars'", "'Personal context (optional)'")
R("'Both pillars'", "'Both profiles'")
R("'Enter pillars, run a lesson'", "'Enter birth details, run a reading'")
R("'Enter pillars once; reuse them in every lesson.'", "'Enter birth details once; reuse them in every reading.'")
R("'By your own pillars'", "'By your own birth details'")
R("'no pillars'", "'no birth details'")
R("'year pillar'", "'birth year'")
R("'Year pillar'", "'Birth year'")
R("'Pillars'", "'Birth details'")
R("'pillars'", "'birth details'")
R("'Marry-month school'", "'Marriage-month school'")
R("'Marry-month'", "'Marriage-month'")
R("'marry-month'", "'marriage-month'")
R("'lesson report'", "'reading report'")
R("' lesson report'", "' reading report'")
R("'Lesson window'", "'Date range'")
R("'Run lesson'", "'Run reading'")
R("'run a lesson'", "'run a reading'")
R("'lessons'", "'readings'")
R("'lesson'", "'reading'")
R("'day-chart'", "'day reference'")
R("'day selection'", "'calendar reference'")
R("'day-selection'", "'calendar-reference'")
R("'Date Selection'", "'Calendar Reference'")
R("'Date selection'", "'Calendar reference'")
R("'day selection'", "'calendar reference'")

# ============ 5. 术语表（glossary.ts 独立文件） ============
G = [
    ("{ key: 'term.core.marry', zh: '行嫁月', en: 'Marriage months', zhHant: '行嫁月', pinyin: 'Xíngjià yuè', note: '女命大利小利月；婚嫁择日之纲' },",
     "{ key: 'term.core.marry', zh: '传统婚月', en: 'Traditional marriage months', zhHant: '傳統婚月', pinyin: 'Chuántǒng hūnyuè', note: '传统婚期月；婚嫁取用之纲' },"),
    ("{ key: 'term.core.chongming', zh: '日辰冲命', en: 'Day pillar clashing the life chart', zhHant: '日辰沖命', pinyin: 'Rìchén chōng mìng', note: '日支与年命相冲，硬排除项' },",
     "{ key: 'term.core.chongming', zh: '日辰冲年', en: 'Day clashing a birth year', zhHant: '日辰沖年', pinyin: 'Rìchén chōng nián', note: '日支与出生年相冲，硬排除项' },"),
    ("note: '坐山与朝向；工程择日之体'", "note: '坐山与朝向；工程取用之体'"),
    ("{ key: 'term.bookcat.zonggang', zh: '总纲 · 择吉通论', en: 'General principles', zhHant: '總綱 · 擇吉通論' },",
     "{ key: 'term.bookcat.zonggang', zh: '总纲 · 历法通论', en: 'General principles', zhHant: '總綱 · 曆法通論' },"),
    ("{ key: 'term.bookcat.tongshu', zh: '通书 · 择吉通书', en: 'Almanacs', zhHant: '通書 · 擇吉通書' },",
     "{ key: 'term.bookcat.tongshu', zh: '通书 · 历法通书', en: 'Almanacs', zhHant: '通書 · 曆法通書' },"),
    ("{ key: 'term.bookcat.yaojue', zh: '要诀 · 择日口诀', en: 'Key methods', zhHant: '要訣 · 擇日口訣' },",
     "{ key: 'term.bookcat.yaojue', zh: '要诀 · 历法口诀', en: 'Key methods', zhHant: '要訣 · 曆法口訣' },"),
    ("{ key: 'term.bookcat.mingli', zh: '命理 · 四柱八字', en: 'Four Pillars', zhHant: '命理 · 四柱八字' },",
     "{ key: 'term.bookcat.mingli', zh: '历法 · 干支纪年', en: 'Sexagenary cycle', zhHant: '曆法 · 干支紀年' },"),
    ("{ key: 'term.school.xingjia', zh: '行嫁月派', en: 'Marriage-month school', zhHant: '行嫁月派', pinyin: 'Xíngjià pài' },",
     "{ key: 'term.school.xingjia', zh: '婚月派', en: 'Marriage-month school', zhHant: '婚月派', pinyin: 'Hūnyuè pài' },"),

]


def protect(src: str) -> tuple[str, list[str]]:
    saved: list[str] = []
    for i, lit in enumerate(PROTECT):
        saved.append(lit if lit in src else "")
        if saved[-1]:
            src = src.replace(lit, PH % i)
    return src, saved


def restore(src: str, saved: list[str]) -> str:
    for i, lit in enumerate(saved):
        if lit:
            src = src.replace(PH % i, lit)
    return src


def main() -> int:
    files = sorted(
        p for d in TARGET_DIRS for p in (ROOT / d).rglob("*") if p.suffix in (".ts", ".tsx") and p.is_file()
    )
    files += [ROOT / f for f in EXTRA_FILES]

    total = 0
    touched = 0
    for f in files:
        raw = f.read_text(encoding="utf-8")
        src, saved = protect(raw)
        hits = 0
        for old, new in RULES:
            if old in src:
                hits += src.count(old)
                src = src.replace(old, new)
        src = restore(src, saved)
        if src != raw:
            touched += 1
            total += hits
            if not DRY:
                f.write_text(src, encoding="utf-8")
            print(f"  {f.relative_to(ROOT)}  ({hits})")

    # 术语表单独按三元组处理
    gp = ROOT / "src/i18n/glossary.ts"
    gs = gp.read_text(encoding="utf-8")
    ghits = 0
    for old, new in G:
        if old in gs:
            ghits += gs.count(old)
            gs = gs.replace(old, new)
    if ghits:
        if not DRY:
            gp.write_text(gs, encoding="utf-8")
        print(f"  src/i18n/glossary.ts  ({ghits})")

    print(f"\n{'[dry] ' if DRY else ''}{total + ghits} replacement(s) in {touched} file(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

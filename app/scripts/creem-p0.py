#!/usr/bin/env python3
"""
creem-p0.py — Creem 支付审核 P0 整改（产品定位 + 类别风险）。

依据 Creem 禁售类目「Metaphysical, fortune-telling, and spiritual outcome services」，
把产品从「择吉算命工具」重新表述为「中国传统历法文化参考工具」。

覆盖清单 P0-1（产品名/副标题/标语/页脚）与 P0-3（核心玄学词汇替换）。
设计为幂等：每条规则若已生效则跳过；若目标串既未生效又不存在则报错，避免静默漏改。

用法：python scripts/creem-p0.py [--dry]
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DRY = "--dry" in sys.argv

# (相对路径, 旧串, 新串)
RULES: list[tuple[str, str, str]] = []


def R(path: str, old: str, new: str) -> None:
    RULES.append((path, old, new))


# =====================================================================
# P0-1 产品名称与定位 — 简中
# =====================================================================
Z = "src/i18n/zh.ts"
R(Z, "'app.name': '择吉',", "'app.name': '中华历法',")
R(Z, "'app.nameEn': 'Zeji',", "'app.nameEn': 'Chinese Date Planner',")
R(Z, "'app.slogan': '一事一议，因事择日',", "'app.slogan': '为重要的日子做传统历法参考',")
R(
    Z,
    "'app.sloganEn': 'One matter, one reading — choose the day for the matter',",
    "'app.sloganEn': 'Plan important dates with traditional Chinese calendar context',",
)
R(Z, "'onboard.s1Title': '为每一件大事\\n挑一个对的日子',", "'onboard.s1Title': '为重要的日子\\n做传统历法参考',")
R(Z, "按中国传统择日法则，逐日演算八重取用", "按中国传统历法规则，逐日演算八重取用")
R(Z, "四柱以真太阳时为准", "出生时刻以真太阳时为准")

# =====================================================================
# P0-3 核心玄学词汇替换 — 简中
# =====================================================================
R(Z, "'home.cta': '开始择日',", "'home.cta': '开始推演',")
R(Z, "'home.noRecent': '还没有报告，去择一次日',", "'home.noRecent': '还没有报告，先推演一次',")
R(Z, "'home.kbEntry': '知库 · 择吉常识',", "'home.kbEntry': '历法知识 · 通书常识',")
R(Z, "'home.todayJianchu': '值神',", "'home.todayJianchu': '值日',")
R(Z, "'event.twoPerson': '须提供双方四柱',", "'event.twoPerson': '须提供双方出生资料',")
R(Z, "'person.emptyHint': '择日以四柱为体，先录入至少一位当事人',", "'person.emptyHint': '历法参考以出生资料为据，先录入至少一位当事人',")
R(Z, "'person.reading': '四柱读取',", "'person.reading': '干支读取',")
R(Z, "'person.readingYearGZ': '年命',", "'person.readingYearGZ': '出生年干支',")
R(Z, "'person.readingPillars': '四柱',", "'person.readingPillars': '干支',")
R(Z, "'person.needTwo': '嫁娶 / 订婚须录入双方四柱',", "'person.needTwo': '嫁娶 / 订婚须录入双方出生资料',")
R(Z, "婚嫁取行嫁月派，经营工程取建除派", "婚嫁取婚月派，经营工程取建除派")
R(Z, "'scan.genericHint': '未录四柱时按通用模式演算", "'scan.genericHint': '未录出生资料时按通用模式演算")
R(Z, "'calc.step1': '排四柱 · 定节气月',", "'calc.step1': '排干支 · 定节气月',")
R(Z, "'calc.step2': '查建除十二值神',", "'calc.step2': '查建除十二值日',")
R(Z, "'calc.step5': '配吉时 · 合多口径',", "'calc.step5': '配时辰 · 合多口径',")
R(Z, "'result.filterUpper': '上吉',", "'result.filterUpper': '优选',")
R(Z, "'result.filterMid': '中吉',", "'result.filterMid': '良好',")
R(Z, "'result.genericBody': '未录入四柱，仅排除", "'result.genericBody': '未录入出生资料，仅排除")
R(Z, "精确到个人年命需补录档案", "精确到个人出生年需补录档案")
R(Z, "'detail.title': '日课详解',", "'detail.title': '当日详解',")
R(Z, "'detail.forEvent': '{event} 日课',", "'detail.forEvent': '{event} 当日',")
R(Z, "'detail.pillarsTitle': '四柱',", "'detail.pillarsTitle': '干支',")
R(Z, "'detail.hoursTitle': '吉凶时辰',", "'detail.hoursTitle': '时辰宜忌',")
R(
    Z,
    "'detail.hardBody': '该日触犯硬忌，不进入可用之日。硬忌包括：月破、日辰冲命、冲山、四离四绝、妨夫月。',",
    "'detail.hardBody': '该日触犯硬性排除条件，不进入可用之日。包括：月破、日辰冲年、冲山、四离四绝、妨婚月。',",
)
R(Z, "'detail.reportTitle': '择吉报告',", "'detail.reportTitle': '历法参考报告',")
R(Z, "含推演依据、当事人四柱、逐层取用与多口径参考", "含推演依据、当事人出生资料、逐层取用与多口径参考")
R(Z, "'detail.genericNotice': '通用模式：未计入个人四柱，", "'detail.genericNotice': '通用模式：未计入个人出生资料，")
R(Z, "'card.pillars': '四柱',", "'card.pillars': '干支',")
R(Z, "'card.score': '课格评分',", "'card.score': '评分',")
R(Z, "'card.brand': '择吉 · Zeji',", "'card.brand': '中华历法 · Chinese Date Planner',")
R(Z, "'card.watermark': '由「择吉」推演生成',", "'card.watermark': '由「中华历法」生成',")
R(Z, "'pay.sku.pair': '双人合课',", "'pay.sku.pair': '双人合参',")
R(Z, "'pay.sku.pairDesc': '双方四柱合参一报',", "'pay.sku.pairDesc': '双方出生资料合参一报',")
R(Z, "'sku.pair': '双人合课',", "'sku.pair': '双人合参',")
R(Z, "'reports.emptyHint': '完成一次择日推演即可生成九章报告',", "'reports.emptyHint': '完成一次推演即可生成九章报告',")
R(Z, "'report.title': '择吉报告',", "'report.title': '历法参考报告',")
R(Z, "'report.ch2': '二、当事人四柱',", "'report.ch2': '二、当事人出生资料',")
R(Z, "'report.ch4': '四、日课四柱与节气月',", "'report.ch4': '四、当日干支与节气月',")
R(Z, "'report.ch6': '六、吉凶时辰',", "'report.ch6': '六、时辰宜忌',")
R(Z, "'report.forDate': '日课：{date}',", "'report.forDate': '日期：{date}',")
R(Z, "'report.score': '课格评分：{score} 分',", "'report.score': '评分：{score} 分',")
R(Z, "'report.genericFlag': '通用模式（未录入个人四柱）',", "'report.genericFlag': '通用模式（未录入个人出生资料）',")
R(Z, "'ai.b2': '择日为传统民俗推演，结果因人、因事、因地而异。',", "'ai.b2': '本工具为传统历法文化参考，结果因人、因事、因地而异。',")
R(Z, "'kb.title': '知库',", "'kb.title': '历法知识',")
R(Z, "'article.back': '返回知库',", "'article.back': '返回历法知识',")
R(Z, "'fav.day': '日课',", "'fav.day': '当日',")
R(Z, "'me.remind': '择日提醒',", "'me.remind': '日期提醒',")
R(Z, "'me.about': '关于择吉',", "'me.about': '关于本应用',")
R(Z, "'remind.title': '择日提醒',", "'remind.title': '日期提醒',")
R(Z, "'about.title': '关于择吉',", "'about.title': '关于本应用',")
R(
    Z,
    "'about.body': '择吉依中国传统择日之法，以当事人四柱为体、用事为用，按八重取用逐日演算，并附多口径参考。全部推演在本地完成。',",
    "'about.body': '本应用依据中国传统历法，以当事人出生资料为据、用事为纲，按八重取用逐日演算，并附多口径参考。全部推演在本地完成。',",
)
R(Z, "'grade.shangji': '上吉',", "'grade.shangji': '优选',")
R(Z, "'grade.zhongji': '中吉',", "'grade.zhongji': '良好',")
R(Z, "'grade.buyong': '不用',", "'grade.buyong': '不取',")
R(Z, "'grade.shangjiDesc': '多口径同过，课格上乘',", "'grade.shangjiDesc': '多口径同过，评分上乘',")
R(Z, "'grade.buyongDesc': '触硬忌或评分不足，不宜',", "'grade.buyongDesc': '触硬性排除条件或评分不足，不取',")
R(Z, "'layer.marryMonth': '女命行嫁月',", "'layer.marryMonth': '传统婚月',")
R(Z, "'layer.jianchu': '建除十二值神',", "'layer.jianchu': '建除十二值日',")
R(Z, "'layer.dayClashYear': '日辰冲命',", "'layer.dayClashYear': '日辰冲年',")
R(Z, "'layer.goodHours': '日课吉时',", "'layer.goodHours': '当日时辰',")
R(Z, "'eng.marry.bad2': '妨夫月，婚嫁硬忌出局',", "'eng.marry.bad2': '妨婚月，婚嫁硬性排除',")
R(Z, "'eng.marry.bad': '翁姑月 / 女父母月，婚嫁不宜',", "'eng.marry.bad': '翁姑月 / 女父母月，婚嫁不取',")
R(Z, "'eng.jianchu.man': '满日：主丰盈，吉',", "'eng.jianchu.man': '满日：主丰盈，宜',")
R(Z, "'eng.jianchu.ding': '定日：主安定，吉',", "'eng.jianchu.ding': '定日：主安定，宜',")
R(Z, "'eng.jianchu.cheng': '成日：主成就，吉',", "'eng.jianchu.cheng': '成日：主成就，宜',")
R(Z, "'eng.jianchu.kai': '开日：主开通，吉',", "'eng.jianchu.kai': '开日：主开通，宜',")
R(Z, "'eng.jianchu.po': '破日：月破，硬忌出局',", "'eng.jianchu.po': '破日：月破，硬性排除',")
R(Z, "'eng.sit.chongshan': '冲山：日支冲坐山，硬忌出局',", "'eng.sit.chongshan': '冲山：日支冲坐山，硬性排除',")
R(Z, "'eng.dayClash.hit': '日辰冲命：日支冲年命（{names}），硬忌出局',", "'eng.dayClash.hit': '日辰冲年：日支冲出生年（{names}），硬性排除',")
R(Z, "'eng.dayClash.ok': '日辰不冲命，可取',", "'eng.dayClash.ok': '日辰不冲年，可取',")
R(Z, "'eng.lijue.li': '四离：二分二至前一日，节气离绝，硬忌出局',", "'eng.lijue.li': '四离：二分二至前一日，节气离绝，硬性排除',")
R(Z, "'eng.lijue.jue': '四绝：四立前一日，节气离绝，硬忌出局',", "'eng.lijue.jue': '四绝：四立前一日，节气离绝，硬性排除',")
R(Z, "'eng.virtues.tiande': '天德贵人当值，吉',", "'eng.virtues.tiande': '天德当值，宜',")
R(Z, "'eng.virtues.yuede': '月德贵人当值，吉',", "'eng.virtues.yuede': '月德当值，宜',")
R(Z, "'eng.goodHours.ok': '日课有 {count} 个吉时，首选 {first}',", "'eng.goodHours.ok': '当日有 {count} 个可用时辰，首选 {first}',")
R(Z, "'eng.goodHours.none': '本日无标注吉时',", "'eng.goodHours.none': '本日无标注时辰',")
R(Z, "'hard.yuepoLong': '月破：日支与月建相冲，诸事不宜，硬性出局',", "'hard.yuepoLong': '月破：日支与月建相冲，诸事不宜，硬性排除',")
R(Z, "'hard.chongming': '日辰冲命',", "'hard.chongming': '日辰冲年',")
R(Z, "'hard.chongmingLong': '日辰冲命：日支冲当事人年命，硬性出局',", "'hard.chongmingLong': '日辰冲年：日支冲当事人出生年，硬性排除',")
R(Z, "'hard.chongshanLong': '冲山：日支冲坐山，方位失据，硬性出局',", "'hard.chongshanLong': '冲山：日支冲坐山，方位失据，硬性排除',")
R(Z, "'hard.lijueLong': '四离四绝：交节前一日，气行离绝，硬性出局',", "'hard.lijueLong': '四离四绝：交节前一日，气行离绝，硬性排除',")
R(Z, "'hard.fangfu': '妨夫月',", "'hard.fangfu': '妨婚月',")
R(Z, "'hard.fangfuLong': '妨夫月：女命行嫁月之硬忌，婚嫁出局',", "'hard.fangfuLong': '妨婚月：传统婚月之硬性排除，婚嫁不取',")
R(Z, "'reason.scoreLowLong': '课格评分 {score} 分，未过 {min} 分阈值',", "'reason.scoreLowLong': '评分 {score} 分，未过 {min} 分阈值',")
R(
    Z,
    "'legal.disclaimer': '择吉内容源于传统历法与民俗文献，仅供文化参考与个人安排之用，不构成医疗、法律、财务或投资建议。',",
    "'legal.disclaimer': '本应用内容源于传统历法与民俗文献，仅供文化参考与个人安排之用，不构成医疗、法律、财务或投资建议。',",
)
R(Z, "'share.qrHint': '扫码打开同一日课',", "'share.qrHint': '扫码打开同一天',")

# =====================================================================
# P0-1 / P0-3 — 英文包
# =====================================================================
E = "src/i18n/en.ts"
R(E, "'app.name': 'Zeji',", "'app.name': 'Chinese Date Planner',")
R(E, "'app.nameEn': 'Zeji',", "'app.nameEn': 'Chinese Date Planner',")
R(
    E,
    "'app.slogan': 'One matter, one reading — choose the day for the matter',",
    "'app.slogan': 'Plan important dates with traditional Chinese calendar context',",
)
R(
    E,
    "'app.sloganEn': 'One matter, one reading — choose the day for the matter',",
    "'app.sloganEn': 'Plan important dates with traditional Chinese calendar context',",
)
R(E, "'onboard.s1Title': 'For every big move,\\npick a day that fits',", "'onboard.s1Title': 'A traditional Chinese calendar\\nreference for planning dates',")
R(E, "by classical Chinese date selection.", "grounded in the traditional Chinese calendar.")
R(E, "the Four Pillars are cast on true solar time.", "the birth hour is corrected to true solar time.")
R(E, "'home.cta': 'Choose a day',", "'home.cta': 'Run a reading',")
R(E, "'home.kbEntry': 'Library · date-selection basics',", "'home.kbEntry': 'Traditional Almanac Studies',")
R(E, "'home.todayJianchu': 'Value spirit',", "'home.todayJianchu': 'Day officer',")
R(E, "'tab.kb': 'Library',", "'tab.kb': 'Knowledge',")
R(E, '"Requires both parties\' Four Pillars"', '"Requires both profiles"')
R(E, "'person.emptyHint': 'Readings rest on the Four Pillars — add at least one profile first',", "'person.emptyHint': 'Readings rest on birth details — add at least one profile first',")
R(E, "'person.reading': 'Four Pillars reading',", "'person.reading': 'Birth details reading',")
R(E, "'person.readingYearGZ': 'Year pillar',", "'person.readingYearGZ': 'Birth year (sexagenary)',")
R(E, "'person.readingZodiac': 'Zodiac',", "'person.readingZodiac': 'Birth-year animal',")
R(E, "'person.readingPillars': 'Four Pillars',", "'person.readingPillars': 'Sexagenary cycle',")
R(E, "'person.needTwo': 'Marriage and engagement require both parties\\' Four Pillars',", "'person.needTwo': 'Marriage and engagement require both profiles',")
R(E, "Primary approach: marriage-month for weddings", "Primary approach: traditional marriage months for weddings")
R(E, "'scan.genericHint': 'Without Four Pillars, the generic mode", "'scan.genericHint': 'Without birth details, the generic mode")
R(E, "'calc.step1': 'Casting pillars · fixing the solar month',", "'calc.step1': 'Casting the sexagenary cycle · fixing the solar month',")
R(E, "'calc.step2': 'Checking the twelve value spirits',", "'calc.step2': 'Checking the twelve day officers',")
R(E, "'calc.step5': 'Matching auspicious hours · approaches',", "'calc.step5': 'Matching favourable hours · approaches',")
R(E, "'result.genericBody': 'No Four Pillars on file: only universal taboos were excluded. Add a profile for readings keyed to a person.',", "'result.genericBody': 'No birth details on file: only universal calendar exclusions were applied. Add a profile for readings keyed to a person.',")
R(E, "'detail.pillarsTitle': 'Four Pillars',", "'detail.pillarsTitle': 'Sexagenary cycle',")
R(E, "'detail.hoursTitle': 'Hours',", "'detail.hoursTitle': 'Hours — favourable & unfavourable',")
R(E, "'detail.hardBody': 'This day breaks a hard taboo and is excluded. Hard taboos: month-break, day clashing the life chart, mountain clash, the four departures, and the husband-harming month.',", "'detail.hardBody': 'This day hits a hard exclusion and is left out. Hard exclusions: month-break, a day clashing a birth year, mountain clash, the four departures, and the traditional marriage-month exclusion.',")
R(E, "'detail.reportBody': 'A nine-chapter report with the reasoning, the profiles, each layer, and the three-school comparison.',", "'detail.reportBody': 'A nine-chapter report with the reasoning, the profiles, each layer, and a comparison across traditional calendar schools.',")
R(E, "'detail.genericNotice': 'Generic mode: personal pillars not included; for reference only.',", "'detail.genericNotice': 'Generic mode: personal birth details not included; for reference only.',")
R(E, "'card.pillars': 'Four Pillars',", "'card.pillars': 'Sexagenary cycle',")
R(E, "'card.brand': 'Zeji',", "'card.brand': 'Chinese Date Planner',")
R(E, "'card.watermark': 'Generated by Zeji',", "'card.watermark': 'Generated by Chinese Date Planner',")
R(E, "'pay.sub': 'One full nine-chapter report with the three-school comparison',", "'pay.sub': 'One full nine-chapter report with the traditional-school comparison',")
R(E, "'pay.sku.pairDesc': 'One report for both charts',", "'pay.sku.pairDesc': 'One report for both profiles',")
R(E, "'report.title': 'Zeji report',", "'report.title': 'Calendar reference report',")
R(E, "'report.ch4': 'IV. The day pillars and solar month',", "'report.ch4': 'IV. The day sexagenary cycle and solar month',")
R(E, "'report.ch6': 'VI. Auspicious hours',", "'report.ch6': 'VI. Favourable and unfavourable hours',")
R(E, "'report.genericFlag': 'Generic mode (no personal pillars)',", "'report.genericFlag': 'Generic mode (no personal birth details)',")
R(E, "'ai.b2': 'Date selection is a folk tradition; results vary by person, occasion, and place.',", "'ai.b2': 'This is a traditional calendar and cultural reference; results vary by person, occasion, and place.',")
R(E, "'kb.title': 'Library',", "'kb.title': 'Calendar Knowledge',")
R(E, "'kb.empty': 'The library is empty',", "'kb.empty': 'Nothing here yet',")
R(E, "'article.back': 'Back to library',", "'article.back': 'Back to Calendar Knowledge',")
R(E, "'me.about': 'About Zeji',", "'me.about': 'About this app',")
R(E, "'about.title': 'About Zeji',", "'about.title': 'About this app',")
R(
    E,
    "'about.body': 'Zeji follows classical Chinese date selection: the profiles\\' Four Pillars are the body, the occasion is the use, and every day is read through eight layers with a three-school comparison. All readings run locally.',",
    "'about.body': 'This app draws on the traditional Chinese calendar: each profile\\'s birth details set the context, the occasion sets the frame, and every day is read through eight layers with a comparison across traditional calendar schools. All readings run locally.',",
)
R(E, "'grade.buyongDesc': 'Breaks a hard taboo or scores too low',", "'grade.buyongDesc': 'Hits a hard exclusion or scores too low',")
R(E, "'layer.jianchu': 'Twelve value spirits',", "'layer.jianchu': 'Twelve day officers',")
R(E, "'layer.dayClashYear': 'Day clashing the life chart',", "'layer.dayClashYear': 'Day clashing a birth year',")
R(E, "'layer.goodHours': 'Auspicious hours',", "'layer.goodHours': 'Favourable hours',")
R(E, "'eng.marry.bad': 'In-law or parents month — marriage ill-advised',", "'eng.marry.bad': 'In-law or parents month — marriage not recommended',")
R(E, "'eng.marry.bad2': 'Husband-harming month — hard exclusion for marriage',", "'eng.marry.bad2': 'Traditional marriage-month exclusion — marriage not taken',")
R(E, "'eng.marry.warn': 'An even month — neither great benefit nor taboo',", "'eng.marry.warn': 'An even month — neither great benefit nor exclusion',")
R(E, "'eng.jianchu.man': 'Fullness day — abundance; auspicious',", "'eng.jianchu.man': 'Fullness day — abundance; favourable',")
R(E, "'eng.jianchu.ding': 'Stability day — settling; auspicious',", "'eng.jianchu.ding': 'Stability day — settling; favourable',")
R(E, "'eng.jianchu.cheng': 'Completion day — achievement; auspicious',", "'eng.jianchu.cheng': 'Completion day — achievement; favourable',")
R(E, "'eng.jianchu.kai': 'Opening day — opening up; auspicious',", "'eng.jianchu.kai': 'Opening day — opening up; favourable',")
R(E, "'eng.dayClash.hit': 'Day clashing the life chart — the day branch clashes {names}\\'s year branch; hard exclusion',", "'eng.dayClash.hit': 'Day clashing a birth year — the day branch clashes {names}\\'s birth year; hard exclusion',")
R(E, "'eng.dayClash.ok': 'The day does not clash the life chart — usable',", "'eng.dayClash.ok': 'The day does not clash a birth year — usable',")
R(E, "'eng.virtues.tiande': 'Heavenly virtue is present — auspicious',", "'eng.virtues.tiande': 'Heavenly virtue is present — favourable',")
R(E, "'eng.virtues.yuede': 'Monthly virtue is present — auspicious',", "'eng.virtues.yuede': 'Monthly virtue is present — favourable',")
R(E, "'eng.goodHours.ok': '{count} auspicious hours today — first choice {first}',", "'eng.goodHours.ok': '{count} favourable hours today — first choice {first}',")
R(E, "'eng.goodHours.none': 'No marked auspicious hours today',", "'eng.goodHours.none': 'No marked favourable hours today',")
R(E, "'hard.chongming': 'Day clashing the life chart',", "'hard.chongming': 'Day clashing a birth year',")
R(E, "'hard.chongmingLong': 'Day clashing the life chart: the day branch clashes a profile\\'s year branch — hard exclusion',", "'hard.chongmingLong': 'Day clashing a birth year: the day branch clashes a profile\\'s birth year — hard exclusion',")
R(E, "'hard.fangfu': 'Husband-harming month',", "'hard.fangfu': 'Traditional marriage-month exclusion',")
R(E, "'hard.fangfuLong': 'Husband-harming month: a hard taboo in the marriage-month table',", "'hard.fangfuLong': 'Traditional marriage-month exclusion: a hard rule in the marriage-month table',")

# =====================================================================
# P0-1 页脚 / 站点常量 / PWA manifest
# =====================================================================
S = "src/data/site.ts"
R(S, "  nameZh: '择吉',", "  nameZh: '中华历法',")
R(S, "  nameEn: 'Zeji',", "  nameEn: 'Chinese Date Planner',")
R(S, "  entity: 'LuckyTimely',", "  entity: 'LuckyTimely',\n  /** 产品一句话说明：支付平台审核要求站点明确「非占卜/灵性服务」 */\n  tagline: 'Traditional culture digital reference',")
R(S, "  effectiveDate: '2026-10-28',", "  effectiveDate: '2026-10-29',")

M = "src/lib/pwa-manifest.ts"
R(
    M,
    "  zh: { name: '择吉 · 人·事·日', short: '择吉', desc: '传统择日规则的工程化推演：人·事·日三元，八重取用，本机演算。' },",
    "  zh: { name: '中华历法 · 历法参考', short: '中华历法', desc: '中国传统历法文化参考工具：人·事·日三层，八重取用，本机演算，不构成命理预测。' },",
)
R(
    M,
    "  en: { name: 'Zeji · Day Selection', short: 'Zeji', desc: 'Engineered Chinese day selection: person, matter, day — computed on device.' },",
    "  en: { name: 'Chinese Date Planner', short: 'Date Planner', desc: 'A traditional Chinese calendar reference for planning dates — computed on device, no fortune-telling.' },",
)
R(
    M,
    "  'zh-Hant': { name: '擇吉 · 人·事·日', short: '擇吉', desc: '傳統擇日規則的工程化推演：人·事·日三元，八重取用，本機演算。' },",
    "  'zh-Hant': { name: '中華曆法 · 曆法參考', short: '中華曆法', desc: '中國傳統曆法文化參考工具：人·事·日三層，八重取用，本機演算，不構成命理預測。' },",
)

# =====================================================================
# P0-2 首页第一屏免责声明（轮盘下方、进入按钮上方）
# =====================================================================
C = "src/components/compass-intro.tsx"
R(C, "<div className=\"brand\">{tx('择 吉', 'ZEJI', lang)}</div>", "<div className=\"brand\">{tx('中 华 历 法', 'CHINESE DATE PLANNER', lang)}</div>")
R(
    C,
    "<div className=\"foot\">{tx('东北亚 · 东南亚 ／ 三元择日规则引擎', 'NE & SE Asia · Three-fold day selection', lang)}</div>",
    "<div className=\"foot\">{tx('东北亚 · 东南亚 ／ 传统历法规则引擎', 'NE & SE Asia · Traditional calendar engine', lang)}</div>",
)
R(
    C,
    "      <div className=\"line\" />\n      <div className=\"tap\">",
    "      <div className=\"line\" />\n"
    "      <div className=\"disc\">\n"
    "        {tx(\n"
    "          '免责声明：本产品为中国传统历法文化参考工具，仅供学习娱乐，不构成命理预测或灵性指导。',\n"
    "          'Disclaimer: Traditional Chinese cultural calendar reference for educational use. Not a fortune-telling or spiritual service. No prediction of outcomes.',\n"
    "          lang,\n"
    "        )}\n"
    "      </div>\n"
    "      <div className=\"tap\">",
)

# =====================================================================
# 首页 AppBar 副标 + 常驻免责一行
# =====================================================================
H = "src/screens/home-screen.tsx"
R(H, "sub={tx('三元择日', 'Threefold', lang)}", "sub={tx('历法参考', 'Calendar reference', lang)}")
R(
    H,
    "      <div className=\"whybar\"",
    "      <div className=\"home-disc\">\n"
    "        {tx(\n"
    "          '中国传统历法文化参考工具 · 仅供学习娱乐，不构成命理预测',\n"
    "          'Traditional Chinese calendar reference for educational use · No fortune-telling or predictions',\n"
    "          lang,\n"
    "        )}\n"
    "      </div>\n\n"
    "      <div className=\"whybar\"",
)
R(H, "const article = KB_ARTICLES[0];", "const article = KB_ARTICLES[0];")
R(H, "{tx('进行中的课期', 'Active lesson periods', lang)}", "{tx('进行中的推演', 'Active readings', lang)}")
R(H, "{draft.span} {tx('天课期', 'days', lang)}", "{draft.span} {tx('天', 'days', lang)}")
R(H, "{tx('起一课', 'Start a lesson', lang)}", "{tx('起一局', 'Start a reading', lang)}")
R(H, "<em>{tx('知库', 'Library', lang)}</em>", "<em>{tx('历法知识', 'Knowledge', lang)}</em>")

# =====================================================================
# 页脚品牌 + 一行说明（me-screen 底部）
# =====================================================================
MS = "src/screens/me-screen.tsx"
R(
    MS,
    "          {t('app.name', lang)} · {t('app.nameEn', lang)} · {t('app.slogan', lang)}\n        </div>",
    "          {t('app.name', lang)} · {t('app.nameEn', lang)} · {t('app.slogan', lang)}\n        </div>\n"
    "        <div style={{ fontSize: 9.5, color: 'var(--muted)', textAlign: 'center', marginTop: 4, letterSpacing: '.04em' }}>\n"
    "          {SITE.tagline}\n"
    "        </div>",
)

# =====================================================================
# index.html — 标题 / 描述 / 关键词 / JSON-LD
# =====================================================================
I = "index.html"
R(I, "<title>择吉 · 人事日 — 为每一件大事挑一个对的日子</title>", "<title>中华历法 · Chinese Date Planner — 为重要的日子做传统历法参考</title>")
R(
    I,
    '  <meta name="description" content="择吉是一款免登录的三元择日工具：通书告诉你「这一天怎么样」，择吉告诉你「这一天对你这件事怎么样」。按人事日三层推演，出生资料只留在你的设备上。" />',
    '  <meta name="description" content="中华历法（Chinese Date Planner）是一款免登录的中国传统历法文化参考工具：查阅通书宜忌，并按人、事、日三层做历法参考。全部推演在本机完成，出生资料只留在你的设备上。" />',
)
R(
    I,
    '  <meta name="keywords" content="择吉,择日,通书,黄历,四柱,八字,婚嫁择日,开业择日,搬家择日,Zeji,date selection" />',
    '  <meta name="keywords" content="traditional chinese calendar,almanac,chinese date planner,tong shu,sexagenary cycle,cultural reference,solar terms" />',
)
R(I, '<meta property="og:site_name" content="择吉 Zeji" />', '<meta property="og:site_name" content="Chinese Date Planner" />')
R(
    I,
    '<meta property="og:title" content="择吉 · 人事日 — 为每一件大事挑一个对的日子" />',
    '<meta property="og:title" content="Chinese Date Planner — traditional Chinese calendar reference" />',
)
R(
    I,
    '<meta property="og:description" content="免登录的三元择日工具：按人事日三层推演，为婚嫁、开业、搬迁、动土挑一个对的日子。出生资料只留在你的设备上。" />',
    '<meta property="og:description" content="A free, no-login traditional Chinese calendar reference. Plan important dates with almanac context and person / matter / day layers. Birth details stay on your device." />',
)
R(I, '<meta property="og:image:alt" content="择吉 · 人事日 — 一事一议，因事择日" />', '<meta property="og:image:alt" content="Chinese Date Planner — traditional Chinese calendar reference" />')
R(
    I,
    '<meta name="twitter:title" content="择吉 · 人事日 — 为每一件大事挑一个对的日子" />',
    '<meta name="twitter:title" content="Chinese Date Planner — traditional Chinese calendar reference" />',
)
R(
    I,
    '<meta name="twitter:description" content="免登录的三元择日工具：按人事日三层推演，为婚嫁、开业、搬迁、动土挑一个对的日子。" />',
    '<meta name="twitter:description" content="A free, no-login traditional Chinese calendar reference for planning important dates." />',
)
R(I, '<meta name="twitter:image:alt" content="择吉 · 人事日" />', '<meta name="twitter:image:alt" content="Chinese Date Planner" />')
R(I, '"alternateName": "择吉",', '"alternateName": "Chinese Date Planner",')
R(I, '"name": "择吉 Zeji",', '"name": "Chinese Date Planner",')
R(I, '"alternateName": "择吉 · 人事日",', '"alternateName": "中华历法",')
R(I, '"applicationCategory": "LifestyleApplication",', '"applicationCategory": "EducationalApplication",')
R(I, '"applicationSubCategory": "Date selection",', '"applicationSubCategory": "Cultural calendar reference",')
R(
    I,
    '"description": "免登录的三元择日工具。按人事日三层推演课格，为婚嫁、开业、搬迁、动土等用事挑日子；出生资料只留在本机。",',
    '"description": "A free, no-login traditional Chinese calendar and cultural reference. Look up almanac guidance and read person / matter / day layers for planning important dates. Birth details stay on this device.",',
)
R(
    I,
    '"description": "单次完整九章报告（按币种分别定价）"',
    '"description": "One complete nine-chapter cultural reference report (priced per currency)"',
)
R(I, '"三元择日：人事日三层课格推演",', '"Traditional calendar reference: person, matter and day layers",')
R(I, '"真太阳时校正与节气精算",', '"True solar time correction and precise solar terms",')
R(I, '"中英双语与繁体中文",', '"English, Simplified and Traditional Chinese",')
R(I, '"离线可用，免注册免登录"', '"Works offline, no sign-up or login"')
R(I, '"name": "择吉 Zeji",', '"name": "Chinese Date Planner",')


def main() -> int:
    changed = 0
    missing: list[str] = []
    cache: dict[str, str] = {}

    for path, old, new in RULES:
        if old == new:
            continue
        f = ROOT / path
        if path not in cache:
            cache[path] = f.read_text(encoding="utf-8")
        src = cache[path]
        if new in src and old not in src:
            continue  # 已生效
        if old not in src:
            missing.append(f"{path} :: {old[:70]}")
            continue
        cache[path] = src.replace(old, new, 1)
        changed += 1

    for path, src in cache.items():
        if DRY:
            continue
        (ROOT / path).write_text(src, encoding="utf-8")

    print(f"applied {changed} rule(s){' [dry]' if DRY else ''}")
    if missing:
        print(f"\n!! {len(missing)} rule(s) NOT FOUND:")
        for m in missing:
            print("   -", m)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

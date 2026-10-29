#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Batch A：按测试报告修正文案 / viewport / 三宗派诚实化 / Stripe→Creem。
每条替换若命中 0 次会打印 MISS，便于核对。"""
import io, os, sys
sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PAIRS = [
    # ---- index.html：viewport 允许缩放（BUG-15）+ JSON-LD featureList 去掉“三种宗派”（BUG-03）
    ('index.html',
     'content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover"',
     'content="width=device-width, initial-scale=1.0, viewport-fit=cover"'),
    ('index.html', '"三种宗派口径可选"', '"多口径参考对照"'),

    # ---- zh.ts：三宗派 → 多口径（BUG-03）；Stripe → Creem（BUG-07）；offlineNote 改服务端
    ('src/i18n/zh.ts', "'school.title': '三宗派对照',", "'school.title': '多口径对照',"),
    ('src/i18n/zh.ts', "'school.adviceConsistent': '三派同过阈值，取之可决',", "'school.adviceConsistent': '多口径同过阈值，取之可决',"),
    ('src/i18n/zh.ts', "'school.adviceConservative': '三派有分歧，宜取交集再议',", "'school.adviceConservative': '多口径有分歧，宜取交集再议',"),
    ('src/i18n/zh.ts', "'school.adviceAggressive': '三派皆未过阈值，此日不宜',", "'school.adviceAggressive': '多口径皆未过阈值，此日不宜',"),
    ('src/i18n/zh.ts', "'school.defaultHint': '默认宗派：婚嫁取行嫁月派，经营工程取建除派',", "'school.defaultHint': '主口径：婚嫁取行嫁月派，经营工程取建除派；其余为经验修正参考',"),
    ('src/i18n/zh.ts', "'calc.step5': '配吉时 · 合三宗派',", "'calc.step5': '配吉时 · 合多口径',"),
    ('src/i18n/zh.ts', "'detail.schoolsTitle': '三宗派对照',", "'detail.schoolsTitle': '多口径对照',"),
    ('src/i18n/zh.ts', "'detail.reportBody': '九章完整报告，含推演依据、当事人四柱、逐层取用与三宗派对照。',", "'detail.reportBody': '九章完整报告，含推演依据、当事人四柱、逐层取用与多口径参考。',"),
    ('src/i18n/zh.ts', "'pay.sub': '单次报告含九章详解与三宗派对照',", "'pay.sub': '单次报告含九章详解与多口径参考',"),
    ('src/i18n/zh.ts', "'report.ch7': '七、三宗派对照',", "'report.ch7': '七、多口径对照',"),
    ('src/i18n/zh.ts', "'about.body': '择吉依中国传统择日之法，以当事人四柱为体、用事为用，按八重取用逐日演算，并附三宗派对照。全部推演在本地完成。',", "'about.body': '择吉依中国传统择日之法，以当事人四柱为体、用事为用，按八重取用逐日演算，并附多口径参考。全部推演在本地完成。',"),
    ('src/i18n/zh.ts', "'grade.shangjiDesc': '三派同过，课格上乘',", "'grade.shangjiDesc': '多口径同过，课格上乘',"),
    ('src/i18n/zh.ts', "'pay.privacy': '支付由 Stripe 处理，本机不接触卡号',", "'pay.privacy': '支付由 Creem 处理（Merchant of Record），本机不接触卡号',"),
    ('src/i18n/zh.ts', "'pay.offlineNote': '离线兑换码经本机校验；联网校验为上线升级项',", "'pay.offlineNote': '兑换码经服务端核验，一码一用',"),

    # ---- en.ts
    ('src/i18n/en.ts', "'school.title': 'Three schools compared',", "'school.title': 'Multiple approaches compared',"),
    ('src/i18n/en.ts', "'school.adviceConsistent': 'All three schools clear the bar — the day is sound',", "'school.adviceConsistent': 'All approaches clear the bar — the day is sound',"),
    ('src/i18n/en.ts', "'school.adviceConservative': 'The schools differ — take the overlap and look again',", "'school.adviceConservative': 'Approaches differ — take the overlap and look again',"),
    ('src/i18n/en.ts', "'school.adviceAggressive': 'No school clears the bar — not this day',", "'school.adviceAggressive': 'No approach clears the bar — not this day',"),
    ('src/i18n/en.ts', "'school.defaultHint': 'Default school: marriage-month for weddings, Jian-chu for business and engineering',", "'school.defaultHint': 'Primary approach: marriage-month for weddings, Jian-chu for business and engineering; others are reference adjustments',"),
    ('src/i18n/en.ts', "'calc.step5': 'Matching auspicious hours · three schools',", "'calc.step5': 'Matching auspicious hours · approaches',"),
    ('src/i18n/en.ts', "'detail.schoolsTitle': 'Three schools compared',", "'detail.schoolsTitle': 'Multiple approaches compared',"),
    ('src/i18n/en.ts', "'report.ch7': 'VII. Three schools compared',", "'report.ch7': 'VII. Multiple approaches compared',"),
    ('src/i18n/en.ts', "'grade.shangjiDesc': 'All three schools clear the bar — a top reading',", "'grade.shangjiDesc': 'All approaches clear the bar — a top reading',"),
    ('src/i18n/en.ts', "'pay.privacy': 'Payments run through Stripe; card numbers never touch this device',", "'pay.privacy': 'Payments run through Creem (Merchant of Record); card numbers never touch this device',"),
    ('src/i18n/en.ts', "'pay.offlineNote': 'Redeem codes are verified on-device; online verification is a launch upgrade',", "'pay.offlineNote': 'Redeem codes are verified server-side, one use per code',"),

    # ---- kb.ts（含手写繁体行）
    ('src/data/kb.ts', '这正是本产品给三宗派对照的原因。', '这正是本产品给出多口径参考的原因。'),
    ('src/data/kb.ts', '這正是本產品給三宗派對照的原因。', '這正是本產品給出多口徑參考的原因。'),

    # ---- 组件内联文案
    ('src/screens/detail-screen.tsx', "{tx('三派', '3 schools', lang)}", "{tx('多口径', 'multi-approach', lang)}"),
    ('src/screens/info-screen.tsx',
     "{tx('宗派不同，结论会不同——报告给出三派对照', 'schools differ — the report gives all three', lang)}",
     "{tx('口径不同，结论会不同——报告给出多口径对照', 'approaches differ — the report gives a multi-approach comparison', lang)}"),
    ('src/screens/report-screen.tsx',
     "{tx('三派结论方向一致，可用。', 'All three schools agree in direction: usable.', lang)}",
     "{tx('多口径结论方向一致，可用。', 'All approaches agree in direction: usable.', lang)}"),
    ('src/screens/result-screen.tsx', "{tx('换宗派再看', 'Try generic', lang)}", "{tx('换口径再看', 'Try generic', lang)}"),
]

total = 0
miss = 0
for rel, old, new in PAIRS:
    path = os.path.join(ROOT, rel)
    s = io.open(path, encoding='utf-8').read()
    n = s.count(old)
    if n == 0:
        print(f'MISS  {rel}  ::  {old[:40]}')
        miss += 1
        continue
    s = s.replace(old, new)
    io.open(path, 'w', encoding='utf-8', newline='').write(s)
    total += n
    print(f'ok {n:>2}  {rel}  ::  {old[:36]}')

print(f'\n替换 {total} 处，未命中 {miss} 条')

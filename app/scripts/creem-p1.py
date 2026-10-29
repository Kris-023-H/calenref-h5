#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
creem-p1.py — Creem 二次整改 P1：高危词清零（用户可见文案层）。

原则：
  1. 只改**用户看得见的文案**（i18n 语言包 + 界面内联字符串 + 数据文件里的显示名）。
     引擎内部标识符、注释、测试夹具不动（改名成本极高且审核看不到）。
  2. 按 key 整行替换，不做子串替换 —— 上一轮吃过「子串替换把繁体串塞进简体字」的亏。
  3. 繁体包由 zh 派生（s2t），只改 zh 即可；zh-hant.ts 里手写的三语串（kb/books 等）单独处理。
  4. 幂等：找不到目标行就跳过并打印，不报错，可重复执行。

用法：python scripts/creem-p1.py
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------- 1. 语言包

ZH = {
    # 五行 → 行业属性
    'industry.pick': '业态决定行业属性取用',
    'industry.wuxingLabel': '行业属性',
    'calc.step3': '校行业属性生克取用',
    'layer.industryWuxing': '行业属性取用',
    'eng.wx.bihe': '同属：业态与当日天干同属性',
    'eng.wx.deqi': '相生：当日天干生业态',
    'eng.wx.xieqi': '外泄：业态生当日天干',
    'eng.wx.shouzhi': '受制：当日天干克业态',
    'eng.wx.haoqi': '内耗：业态克当日天干',
    # 坐山 / 山向 → 建筑朝向
    'sit.pick': '工程与迁址须定建筑朝向',
    'sit.help': '朝向指宅院正面所对方向；不确定时可取正南兜底，不影响其他条目的核对。',
    'sit.zhiLabel': '朝向',
    'layer.sittingFacing': '建筑朝向',
    'eng.sit.sanhe': '三合：日支与建筑朝向三合',
    'eng.sit.liuhe': '六合：日支与建筑朝向六合',
    'eng.sit.chongshan': '相冲：日支与建筑朝向相冲，硬性排除',
    'eng.sit.ping': '平和：日支与建筑朝向无生克',
    'hard.chongshan': '冲朝向',
    'hard.chongshanLong': '相冲：日支与建筑朝向相冲，方位失据，硬性排除',
    # 月害 → 月支关系
    'layer.monthHarm': '月支关系',
    'eng.monthHarm.hit': '月支关系：日支与月建相害',
    'eng.monthHarm.ok': '月支关系无碍',
    # 四离四绝 → 节气交界日
    'layer.liJue': '节气交界日',
    'scan.genericHint': '未录出生资料时按通用模式演算：只核对月内破日与节气交界日等通用条目，可用日更多。',
    'result.genericBody': '未录入出生资料，仅排除月内破日与节气交界日等通用条目；按个人出生年核对需补录档案。',
    'detail.hardBody': '该日命中硬性排除条件，不进入可用之日。包括：月内破日、日辰冲出生年、冲建筑朝向、节气交界日、婚月不宜。',
    'eng.lijue.li': '节气交界日（二分二至前一日），硬性排除',
    'eng.lijue.jue': '节气交界日（四立前一日），硬性排除',
    'eng.lijue.ok': '非节气交界日',
    'hard.lijue': '节气交界日',
    'hard.lijueLong': '节气交界日：交节前一日，属文献所列不宜之日，硬性排除',
    # 天德月德 → 传统历法标记
    'layer.virtues': '传统历法标记',
    'eng.virtues.tiande': '传统历法标记：天德当值',
    'eng.virtues.yuede': '传统历法标记：月德当值',
    'eng.virtues.none': '无天德月德标记',
    # 合参 → 对照
    'pay.sku.pair': '双人对照',
    'pay.sku.pairDesc': '双方出生资料对照一报',
    'sku.pair': '双人对照',
    # 妨夫 → 婚月不宜
    'hard.fangfu': '婚月不宜',
    'hard.fangfuLong': '婚月不宜：传统婚月表列为不宜，婚嫁不取',
    # 冲年 → 冲出生年（年命是命理术语，出生年是事实描述）
    'hard.chongming': '日辰冲出生年',
    'hard.chongmingLong': '日辰冲出生年：日支冲当事人出生年，硬性排除',
}

EN = {
    'industry.pick': 'The industry sets the attribute reading',
    'industry.wuxingLabel': 'Industry attribute',
    'calc.step3': 'Weighing the industry attribute',
    'layer.industryWuxing': 'Industry attribute',
    'eng.wx.bihe': 'Same type — the industry and the day stem share one attribute',
    'eng.wx.deqi': 'Supported — the day stem feeds the industry',
    'eng.wx.xieqi': 'Leaking — the industry feeds the day stem',
    'eng.wx.shouzhi': 'Controlled — the day stem controls the industry',
    'eng.wx.haoqi': 'Depleting — the industry controls the day stem',
    'sit.pick': 'Engineering and relocation need a building orientation',
    'sit.help': 'Orientation is the direction the site faces. If unsure, due south is a safe fallback and does not affect other checks.',
    'sit.zhiLabel': 'Orientation',
    'layer.sittingFacing': 'Building orientation',
    'eng.sit.sanhe': 'Triple harmony — the day branch harmonizes with the building orientation',
    'eng.sit.liuhe': 'Six harmony — the day branch pairs with the building orientation',
    'eng.sit.chongshan': 'Clash — the day branch clashes the building orientation; hard exclusion',
    'eng.sit.ping': 'Neutral — no relation between the day branch and the building orientation',
    'hard.chongshan': 'Orientation clash',
    'hard.chongshanLong': 'Orientation clash: the day branch clashes the building orientation — hard exclusion',
    'layer.monthHarm': 'Month-branch relation',
    'eng.monthHarm.hit': 'Month-branch relation — the day branch harms the month; noted',
    'eng.monthHarm.ok': 'No month-branch issue',
    'layer.liJue': 'Solar-term boundary',
    'scan.genericHint': 'Without birth details, generic mode checks only universal calendar entries such as month-break days and solar-term boundary days — more usable days.',
    'result.genericBody': 'No birth details on file: only universal calendar entries (month-break, solar-term boundaries) were applied. Add a profile for readings keyed to a person.',
    'detail.hardBody': 'This day hits a hard exclusion and is left out. Exclusions: month-break days, a day clashing a birth year, a clash with the building orientation, solar-term boundary days, and marriage-month exclusions.',
    'eng.lijue.li': 'Solar-term boundary (eve of an equinox or solstice) — hard exclusion',
    'eng.lijue.jue': 'Solar-term boundary (eve of a season start) — hard exclusion',
    'eng.lijue.ok': 'Not a solar-term boundary day',
    'hard.lijue': 'Solar-term boundary',
    'hard.lijueLong': 'Solar-term boundary: the eve of a solar-term change, listed as unsuitable in the literature — hard exclusion',
    'layer.virtues': 'Traditional calendar markers',
    'eng.virtues.tiande': 'Traditional marker: heavenly virtue present',
    'eng.virtues.yuede': 'Traditional marker: monthly virtue present',
    'eng.virtues.none': 'No heavenly or monthly virtue marker',
    'pay.sku.pair': 'Two-person comparison',
    'pay.sku.pairDesc': 'One report comparing both profiles',
    'sku.pair': 'Two-person comparison',
    'hard.fangfu': 'Marriage-month exclusion',
    'hard.fangfuLong': 'Marriage-month exclusion: listed as unsuitable in the traditional month table',
    'hard.chongming': 'Day clashing a birth year',
    'hard.chongmingLong': "Day clashing a birth year: the day branch clashes a profile's birth year — hard exclusion",
}

LINE_RE = re.compile(r"^(\s*)'([^']+)':\s*(.*)$")


def patch_pack(path, table, label):
    """按 key 整行替换语言包条目（保留缩进与尾逗号）"""
    with io.open(path, encoding='utf-8') as f:
        lines = f.read().split('\n')
    done = set()
    for i, line in enumerate(lines):
        m = LINE_RE.match(line)
        if not m:
            continue
        key = m.group(2)
        if key not in table:
            continue
        indent, _, rest = m.group(1), m.group(2), m.group(3)
        # 只处理单行字符串值（值里含未转义引号或跨行的一律跳过，避免破坏结构）
        if not (rest.startswith("'") and rest.rstrip().endswith("',")):
            print('  SKIP(多行) %s' % key)
            continue
        value = table[key].replace("\\", "\\\\").replace("'", "\\'")
        lines[i] = "%s'%s': '%s'," % (indent, key, value)
        done.add(key)
    with io.open(path, 'w', encoding='utf-8', newline='') as f:
        f.write('\n'.join(lines))
    missing = sorted(set(table) - done)
    print('%s：改 %d 条' % (label, len(done)))
    if missing:
        print('  MISS: %s' % ', '.join(missing))


def main():
    patch_pack(os.path.join(ROOT, 'src/i18n/zh.ts'), ZH, 'zh.ts')
    patch_pack(os.path.join(ROOT, 'src/i18n/en.ts'), EN, 'en.ts')


if __name__ == '__main__':
    main()

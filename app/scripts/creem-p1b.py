#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
creem-p1b.py — P1 第二批：界面内联文案与术语表的高危词替换（精确整串，不做通配）。

为什么不用「五行→行业属性」这种通配：上一轮吃过子串替换的亏（把繁体串里塞进简体字、
把「坐山山向」换成「建筑朝向朝向」）。这里每条都是完整片段，找不到就报 MISS 让人看。

用法：python scripts/creem-p1b.py
"""
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 文件 → [(旧串, 新串), ...]
PATCHES = {
    'src/screens/ai-screen.tsx': [
        ('风险与化解 → 执行建议', '风险与调整 → 执行建议'),
        ('若不在八重课格之内', '若不在八重条目之内'),
    ],
    'src/screens/detail-screen.tsx': [
        ('（≥94 上吉 · ≥86 中吉 · ≥80 可用）', '（≥94 优选 · ≥86 良好 · ≥80 可用）'),
        ('≥94 supreme · ≥86 high · ≥80 usable', '≥94 preferred · ≥86 good · ≥80 usable'),
        ('三派对照 + 制化', '三派对照 + 调和'),
    ],
    'src/screens/event-screen.tsx': [
        ('用事决定取哪一套课格。', '用事决定取哪一套条目。'),
        ("tx('课格', 'Layers', lang)", "tx('条目', 'Layers', lang)"),
    ],
    'src/screens/info-screen.tsx': [
        ('取业态五行与坐向，是营生课的第二组变量', '取行业属性与朝向，是营生类条目的第二组变量'),
        ('trade five-phase and facing are the second variable set', 'industry attribute and orientation are the second variable set'),
    ],
    'src/screens/onboard-screen.tsx': [
        ('通书答「今天怎么样」，课格答「今天对你这件事怎么样」', '通书答「今天怎么样」，条目答「今天对你这件事怎么样」'),
        ('a day lesson answers', 'the entry set answers'),
        ('业态决定五行取用与关键动作时点', '业态决定行业属性取用与关键动作时点'),
        ('同一个日子的课格不同', '同一个日子的条目不同'),
        ('Your trade decides the five-phase taking', 'Your trade decides the attribute taking'),
        ('嫁娶、入宅不看业态五行，看的是传统婚月与坐向', '嫁娶、入宅不看行业属性，看的是传统婚月与朝向'),
        ('read the marry-month and facing instead', 'read the traditional marriage-month table and orientation instead'),
    ],
    'src/screens/pay-screen.tsx': [
        ('双方出生资料合参一报', '双方出生资料对照一报'),
    ],
    'src/screens/report-screen.tsx': [
        ('按课格降序', '按评分降序'),
        ('日辰冲年、月破、冲山为硬性出局；课格评分不足为可放宽项',
         '日辰冲出生年、月内破日、冲朝向为硬性出局；评分不足为可放宽项'),
        ('Clash of day/person, month-break and mountain-clash are hard vetoes',
         'A day clashing a birth year, month-break days and an orientation clash are hard vetoes'),
    ],
    'src/screens/result-screen.tsx': [
        ("tx('课格 ≥ 85', 'Score ≥ 85', lang)", "tx('评分 ≥ 85', 'Score ≥ 85', lang)"),
        ("tx('（课格）', ' (lesson)', lang)", "tx('（条目）', ' (entries)', lang)"),
        ("tx('课格 ', 'lesson ', lang)", "tx('评分 ', 'score ', lang)"),
        ('金色为课格最高', '金色为评分最高'),
        ('干支值神、课格分、吉时与层摘要', '干支值神、评分、吉时与层摘要'),
    ],
    'src/screens/ui-helpers.ts': [
        ('日期/干支/五行/评分的本地化格式', '日期/干支/行业属性/评分的本地化格式'),
        ('五行标签（0 木 1 火 2 土 3 金 4 水）', '行业属性标签（0 木 1 火 2 土 3 金 4 水）'),
        ('课格等级词', '评分等级词'),
        ('课格等级 chip 色调', '评分等级 chip 色调'),
    ],
    'src/components/layer-row.tsx': [
        ('属可调整的次级因素，可把关键动作移入时辰化解。', '属可调整的次级因素，可把关键动作移入较优时辰。'),
    ],
    'src/components/tab-bar.tsx': [
        ("tx('择日', 'Plan', lang)", "tx('排期', 'Plan', lang)"),
    ],
    'src/services/ai/local-template-ai.ts': [
        ('结论口径 / 业态适配 / 风险与化解 / 执行建议', '结论口径 / 业态适配 / 风险与调整 / 执行建议'),
        ('课格评分 ${day.score}', '评分 ${day.score}'),
        ('此用事不取业态五行层', '此用事不取行业属性层'),
    ],
    'src/data/events.ts': [
        ('以负责人出生资料为体，业态五行为用', '以负责人出生资料为体，业态属性为用'),
        ('以負責人出生資料為體，業態五行為用', '以負責人出生資料為體，業態屬性為用'),
        ('以业主出生资料配坐山，重方位与山运', '以业主出生资料配建筑朝向，重方位与山运'),
        ('以業主出生資料配坐山，重方位與山運', '以業主出生資料配建築朝向，重方位與山運'),
        ('以母命胎元与婴儿生辰为限', '以母亲预产期与婴儿出生时刻为限'),
        ('以母命胎元與嬰兒生辰為限', '以母親預產期與嬰兒出生時刻為限'),
        ("l('先人 · 山向', 'Ancestors · mountain orientation', '先人 · 山向')",
         "l('先人 · 墓位朝向', 'Ancestors · burial orientation', '先人 · 墓位朝向')"),
        ("l('先人信息 + 山向', 'Ancestral details + mountain orientation', '先人信息 + 山向')",
         "l('先人信息 + 墓位朝向', 'Ancestral details + burial orientation', '先人信息 + 墓位朝向')"),
    ],
    'src/data/todos.ts': [
        ('业态定五行，坐向定方位', '业态定行业属性，坐向定方位'),
        ('Industry fixes the five phases; orientation fixes direction', 'Industry fixes the attribute; orientation fixes direction'),
        ('核定母亲出生资料与胎元', '核定母亲出生资料与预产期'),
        ("Fix the mother's Four Pillars and fetal origin", "Fix the mother's birth details and due date"),
        ('剖腹产取课以母命为体', '择期生产以母亲资料为参照'),
        ("Scheduled-birth selection takes the mother's chart as the body", "Scheduled delivery planning uses the mother's details as the reference"),
        ('核定母親出生資料與胎元', '核定母親出生資料與預產期'),
        ('剖腹產取課以母命為體', '擇期生產以母親資料為參照'),
    ],
    'src/data/legal.ts': [
        ('排盘与课格推演全部在你的设备本地完成', '全部历法计算在你的设备本地完成'),
        ('为他人做历法参考（如合参双方出生资料）时', '为他人做历法参考（如对照双方出生资料）时'),
        ('单次报告、AI 解读次数包、双人合参、年度不限次', '单次报告、AI 解读次数包、双人对照、年度不限次'),
    ],
    'src/data/prices.ts': [
        ('// $11.9 双人合参', '// $11.9 双人对照'),
    ],
    'src/i18n/glossary.ts': [
        ("zh: '子山午向', en: 'Zi Mountain, Wu Facing (due south)', zhHant: '子山午向', pinyin: 'Zǐ shān wǔ xiàng'",
         "zh: '正南', en: 'Due south', zhHant: '正南', pinyin: 'Zhèngnán'"),
        ("zh: '午山子向', en: 'Wu Mountain, Zi Facing (due north)', zhHant: '午山子向', pinyin: 'Wǔ shān zǐ xiàng'",
         "zh: '正北', en: 'Due north', zhHant: '正北', pinyin: 'Zhèngběi'"),
        ("zh: '卯山酉向', en: 'Mao Mountain, You Facing (due west)', zhHant: '卯山酉向', pinyin: 'Mǎo shān yǒu xiàng'",
         "zh: '正西', en: 'Due west', zhHant: '正西', pinyin: 'Zhèngxī'"),
        ("zh: '酉山卯向', en: 'You Mountain, Mao Facing (due east)', zhHant: '酉山卯向', pinyin: 'Yǒu shān mǎo xiàng'",
         "zh: '正东', en: 'Due east', zhHant: '正東', pinyin: 'Zhèngdōng'"),
        ("zh: '艮山坤向', en: 'Gen Mountain, Kun Facing (southwest)', zhHant: '艮山坤向', pinyin: 'Gèn shān kūn xiàng'",
         "zh: '西南', en: 'Southwest', zhHant: '西南', pinyin: 'Xīnán'"),
        ("zh: '坤山艮向', en: 'Kun Mountain, Gen Facing (northeast)', zhHant: '坤山艮向', pinyin: 'Kūn shān gèn xiàng'",
         "zh: '东北', en: 'Northeast', zhHant: '東北', pinyin: 'Dōngběi'"),
        ("zh: '巽山乾向', en: 'Xun Mountain, Qian Facing (northwest)', zhHant: '巽山乾向', pinyin: 'Xùn shān qián xiàng'",
         "zh: '西北', en: 'Northwest', zhHant: '西北', pinyin: 'Xīběi'"),
        ("zh: '乾山巽向', en: 'Qian Mountain, Xun Facing (southeast)', zhHant: '乾山巽向', pinyin: 'Qián shān xùn xiàng'",
         "zh: '东南', en: 'Southeast', zhHant: '東南', pinyin: 'Dōngnán'"),
        ("zh: '五行', en: 'Five Phases', zhHant: '五行', pinyin: 'Wǔxíng', note: '木火土金水；业态取用之主轴'",
         "zh: '行业属性', en: 'Industry attribute', zhHant: '行業屬性', pinyin: 'Hángyè shǔxìng', note: '按行业门类归入木火土金水五类，用于取用对照'"),
        ("zh: '山向', en: 'Mountain & facing', zhHant: '山向', pinyin: 'Shānxiàng', note: '坐山与朝向；工程取用之体'",
         "zh: '朝向', en: 'Orientation', zhHant: '朝向', pinyin: 'Cháoxiàng', note: '宅院正面所对方向；工程类条目取用'"),
        ("zh: '坐向', en: 'Sitting orientation', zhHant: '坐向', pinyin: 'Zuòxiàng', note: '宅穴坐山所向；八山三合取用'",
         "zh: '坐向', en: 'Sitting & facing', zhHant: '坐向', pinyin: 'Zuòxiàng', note: '宅院背面与正面所指方向'"),
    ],
    'src/data/sits.ts': [
        ('data/sits.ts — 坐向 8 向（子山午向等，zhi 索引）。', 'data/sits.ts — 建筑朝向 8 向（正南/正北…，zhi 索引）。'),
        ('坐山取地支；「X山Y向」文本由 UI 按 ZHI 拼装（子山午向 = 坐子向午）。',
         '朝向取地支；显示名走术语表（term.sit.*），这里只留地支索引。'),
        ('/** 坐山地支索引（0=子 … 11=亥） */', '/** 朝向地支索引（0=子 … 11=亥） */'),
    ],
}


def main():
    total = 0
    miss = []
    for rel, pairs in PATCHES.items():
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            miss.append('%s（文件不存在）' % rel)
            continue
        with io.open(path, encoding='utf-8') as f:
            text = f.read()
        before = text
        for old, new in pairs:
            if old in text:
                text = text.replace(old, new)
                total += 1
            else:
                miss.append('%s :: %s' % (rel, old[:40]))
        if text != before:
            with io.open(path, 'w', encoding='utf-8', newline='') as f:
                f.write(text)
    print('替换 %d 处' % total)
    if miss:
        print('MISS %d 处：' % len(miss))
        for m in miss:
            print('  ' + m)


if __name__ == '__main__':
    main()

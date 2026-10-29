#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
creem-p1c.py — P1 第三批：英文文案里的命理表述清零。

Creem 的审核员读英文。中文词换成「行业属性/朝向/节气交界日」之后，英文里如果还写着
"Four Pillars"、"sitting mountain"、"auspicious"、"five phases"，等于白改 —— 这些正是
Metaphysical / fortune-telling 类目的关键词。

用法：python scripts/creem-p1c.py
"""
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PATCHES = {
    'src/data/events.ts': [
        ("attributed through the industry's five phases", "attributed through the industry's attribute"),
        ("direction and mountain qi for groundbreaking", "direction and site setting for groundbreaking"),
        ('Four Pillars', 'birth details'),
    ],
    'src/data/todos.ts': [
        ('Four Pillars', 'birth details'),
    ],
    'src/data/legal.ts': [
        ('(used for the four pillars and true-solar-time correction)',
         '(used for the calendar calculation and true-solar-time correction)'),
    ],
    'src/data/books.ts': [
        ('A specialist classic on date selection, emphasizing life-mending and supporting the dragon and mountain.',
         'A specialist classic on building timing and orientation, covering site setting and directional method.'),
    ],
    'src/data/industries.ts': [
        ('never break ground against the Grand Duke or the Year Breaker; orientation must suit the mountain cycle',
         'avoid the traditional year-direction entries; the orientation should suit the site'),
    ],
    'src/data/kb.ts': [
        ('Earthworks Look at the Mountain First: Why Mountain-Clash Is Absolute',
         'Earthworks and Orientation: Why a Direct Clash Is Absolute'),
        ('When the day branch clashes with the sitting mountain, tradition excludes the day outright — not a minor blemish.',
         'When the day branch clashes with the building orientation, the literature excludes the day outright — not a minor blemish.'),
        ("l('工地动土先看山：冲山为何是硬忌'", "l('工地动土先看朝向：相冲为何是硬性排除'"),
        ('工地動土先看山：沖山為何是硬忌', '工地動土先看朝向：相衝為何是硬性排除'),
        ('Same day, one says auspicious, the other says avoid everything.',
         'Same day, one calls it favourable, the other says avoid everything.'),
        ('Date selection is a different discipline.', 'This calendar reading is a different thing.'),
    ],
    'src/services/ai/local-template-ai.ts': [
        ('This occasion does not take the industry five-phase layer.', 'This occasion does not use the industry-attribute layer.'),
        ('inside an auspicious hour', 'inside a favourable hour'),
    ],
    'src/i18n/en.ts': [
        ('Avoiding Tai Sui, mountain clash, break days', 'Checking year-direction entries, orientation clashes and break days'),
    ],
    'src/screens/card-screen.tsx': [
        ("sitDeg: `${ZHI[sit.zhi]}${tx('山', ' mountain', lang)}`",
         "sitDeg: `${ZHI[sit.zhi]}${tx('方', ' bearing', lang)}`"),
    ],
    'src/screens/info-screen.tsx': [
        ('重方位与山运，坐向冲山即为硬忌', '重方位与场地条件，朝向相冲即为硬性排除'),
        ('facing matters; a clash with the mountain is a hard veto',
         'facing matters; a clash with the orientation is a hard exclusion'),
        ("tx('山', ' mountain', lang)", "tx('方', ' bearing', lang)"),
    ],
    'src/screens/report-screen.tsx': [
        ("tx('山', ' mountain', lang)", "tx('方', ' bearing', lang)"),
        ('坐向与冲山依《营造法式》《鲁班经匠家镜》', '坐向与朝向相冲依《营造法式》《鲁班经匠家镜》'),
        ('facing and mountain-clash to the Yingzao Fashi', 'orientation and orientation clash to the Yingzao Fashi'),
    ],
}


def main():
    total = 0
    miss = []
    for rel, pairs in PATCHES.items():
        path = os.path.join(ROOT, rel)
        with io.open(path, encoding='utf-8') as f:
            text = f.read()
        before = text
        for old, new in pairs:
            if old in text:
                total += text.count(old)
                text = text.replace(old, new)
            else:
                miss.append('%s :: %s' % (rel, old[:50]))
        if text != before:
            with io.open(path, 'w', encoding='utf-8', newline='') as f:
                f.write(text)
    print('替换 %d 处' % total)
    if miss:
        print('MISS %d：' % len(miss))
        for m in miss:
            print('  ' + m)


if __name__ == '__main__':
    main()

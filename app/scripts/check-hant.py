#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check-hant.py — 繁简混用检测（针对手写的第三语串）。

为什么需要：zh-Hant 语言包由 s2t() 从 zh 派生，不会混。真正会混的是 kb.ts / books.ts /
events.ts / todos.ts 这类 `l(zh, en, hant)` 三语并列的数据文件 —— 繁体串是手写的，
批量替换时很容易把简体字塞进去（上一轮出现过「本產品的传统条目」这种）。

判定方法：
  1. 从 src/i18n/zh-hant.ts 的 CHARS 表取出「简→繁」字对；
  2. 抽出源码里的单引号字符串字面量；
  3. 若某个串里出现了繁体字（CHARS 的值），说明它本意是繁体串 ——
     此时若又出现简体字（CHARS 的键），即为混用，报错。

用法：python scripts/check-hant.py   （有混用则退出码 1）
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCAN_DIRS = ['src']
EXTS = ('.ts', '.tsx')


def load_chars():
    path = os.path.join(ROOT, 'src/i18n/zh-hant.ts')
    text = io.open(path, encoding='utf-8').read()
    body = text[text.index('const CHARS'):text.index('const PHRASES_PRE')]
    pairs = re.findall(r"'(.+?)':\s*'(.+?)'", body)
    simp = set()
    trad = set()
    for s, t in pairs:
        if len(s) == 1 and len(t) == 1 and s != t:
            simp.add(s)
            trad.add(t)
    return simp, trad


LITERAL = re.compile(r"'((?:[^'\\\n]|\\.)*)'")

# 这些字的简繁对应是「一情多义」，繁体串里保留简体写法才是对的（s2t 有词組覆写处理它们）：
#   采 — 納采（不是納採）      里 — 鄰里（不是鄰裡）      托 — 托育（不是託育）
CONTEXT_DEPENDENT = set('采里托台面只系')


def main():
    simp, trad = load_chars()
    simp_only = simp - trad
    offenders = []
    for base, _, files in os.walk(os.path.join(ROOT, 'src')):
        for name in files:
            if not name.endswith(EXTS):
                continue
            path = os.path.join(base, name)
            rel = os.path.relpath(path, ROOT).replace('\\', '/')
            for lineno, line in enumerate(io.open(path, encoding='utf-8'), 1):
                for m in LITERAL.finditer(line):
                    s = m.group(1)
                    has_trad = any(ch in trad for ch in s)
                    if not has_trad:
                        continue
                    bad = [ch for ch in s if ch in simp_only and ch not in CONTEXT_DEPENDENT]
                    if bad:
                        offenders.append((rel, lineno, ''.join(bad), s[:60]))
    if not offenders:
        print('繁简混用：0 处 ✓')
        return 0
    print('繁简混用：%d 处' % len(offenders))
    for rel, lineno, bad, snippet in offenders:
        print('  %s:%d  简体字[%s]  %s' % (rel, lineno, bad, snippet))
    return 1


if __name__ == '__main__':
    sys.exit(main())

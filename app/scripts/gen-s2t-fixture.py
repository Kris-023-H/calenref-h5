#!/usr/bin/env python3
"""scripts/gen-s2t-fixture.py — 生成 tests/fixtures/s2t-expected.json。

收集「运行时真正会经过 s2t() 的字」：
  1. src/i18n/zh.ts 全量（key 与值）
  2. 所有 tx(...) 的第一参（单引号与模板字面量）
  3. 残留 `lang === 'en' ? 'EN' : '中文'` 三元里的中文分支

再用 OpenCC s2t 判定哪些字「有繁体形」，只把这些字写进 fixture。
测试只断言「不再是简体原形」，不断言具体异体写法。

依赖：pip install opencc-python-reimplemented
用法：python scripts/gen-s2t-fixture.py
"""

import io
import json
import os
import re
import sys

from opencc import OpenCC

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CJK = lambda ch: '\u4e00' <= ch <= '\u9fff'  # noqa: E731

TX_RE = re.compile(r"tx\(\s*(?:'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`)")
TRI_RE = re.compile(r"lang === 'en'\s*\?\s*'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'")


def main() -> int:
    cc = OpenCC('s2t')
    used: set[str] = set()

    zh = io.open(os.path.join(ROOT, 'src/i18n/zh.ts'), encoding='utf-8').read()
    used.update(ch for ch in zh if CJK(ch))

    for root, _dirs, files in os.walk(os.path.join(ROOT, 'src')):
        if 'i18n' in root.replace('\\', '/'):
            continue
        for name in files:
            if not name.endswith(('.ts', '.tsx')):
                continue
            src = io.open(os.path.join(root, name), encoding='utf-8').read()
            for m in TX_RE.finditer(src):
                used.update(ch for ch in (m.group(1) or m.group(2) or '') if CJK(ch))
            for m in TRI_RE.finditer(src):
                used.update(ch for ch in m.group(2) if CJK(ch))

    need = sorted(ch for ch in used if len(cc.convert(ch)) == 1 and cc.convert(ch) != ch)
    out = os.path.join(ROOT, 'tests/fixtures/s2t-expected.json')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    io.open(out, 'w', encoding='utf-8').write(json.dumps(need, ensure_ascii=False, indent=0))
    print(f'运行时经 s2t 的汉字 {len(used)} 个，其中需要转换 {len(need)} 个 → {out}')
    return 0


if __name__ == '__main__':
    sys.exit(main())

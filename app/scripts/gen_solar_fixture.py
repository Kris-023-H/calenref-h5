#!/usr/bin/env python3
"""生成 tests/fixtures/solar-terms-1900-2100.csv —— 节气交接时刻对拍数据集。

用途：与 src/engine/calendar/solar-terms.ts（Meeus 第 25/27 章实现）逐条对拍，
      保证 1900–2100 年二十四节气交接时刻（东八区民用历）正确。
      数据集仅用于测试，不进 bundle。

数据源（--source 指定，默认自动探测）：
  sxtwl         寿星天文历 C 库（原计划主源；本机无 C++ 编译器时装不上，
                见 README「上线前部署项」；有编译器时优先用它复算）
  lunar-python  同为寿星天文历算法家族，纯 Python 轮子无需编译（当前实际数据源）

两个库与引擎的 Meeus 实现互为独立算法家族，可交叉验算。

运行（托管 venv，禁止全局 pip）：
  C:/Users/Administrator/.workbuddy-ai/binaries/python/envs/default/bin/python \\
      scripts/gen_solar_fixture.py [--source sxtwl|lunar-python]
"""

from __future__ import annotations

import argparse
import csv
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "tests", "fixtures", "solar-terms-1900-2100.csv")

START_YEAR = 1900
END_YEAR = 2100

# 二十四节气（日历序，自小寒起）—— 与 engine/calendar/solar-terms.ts 同序
TERMS = [
    "小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨",
    "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑",
    "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至",
]

Row = tuple[int, int, str, str, int]  # (year, index, name, date, minutes)


def rows_from_sxtwl() -> list[Row]:
    """sxtwl：逐日 hasJieQi / getJieQiJD，JD2DD 转北京时。"""
    import sxtwl  # type: ignore

    out: list[Row] = []
    for y in range(START_YEAR, END_YEAR + 1):
        found: dict[int, Row] = {}
        for m in range(1, 13):
            for d in range(1, 32):
                try:
                    day = sxtwl.fromSolar(y, m, d)
                except Exception:
                    continue  # 月末越界等
                if not day.hasJieQi():
                    continue
                idx = day.getJieQi()  # 0=立春? sxtwl 序：0 小寒 … 23 冬至
                t = sxtwl.JD2DD(day.getJieQiJD())
                found[idx] = (
                    y,
                    idx,
                    TERMS[idx],
                    f"{t.Y:04d}-{t.M:02d}-{t.D:02d}",
                    t.h * 60 + t.m,
                )
        for idx in range(24):
            if idx not in found:
                raise RuntimeError(f"sxtwl: {y} 年缺少节气 {TERMS[idx]}")
            out.append(found[idx])
    return out


def rows_from_lunar_python() -> list[Row]:
    """lunar-python：寿星天文历。

    注意：getJieQiTable() 覆盖的是「所属农历年」的节气序列（冬至(y-1) … 大雪(y)），
    因此对每个公历年 y 需合并 June(y) 与 June(y+1) 两张表，再按公历年份筛选，
    否则 idx=23（冬至）会错拿上一年的值。
    """
    from lunar_python import Solar  # type: ignore

    TERM_SET = set(TERMS)

    def table(y: int) -> list[tuple[str, Solar]]:
        """返回 (中文节气名, Solar) 列表；表同时含拼音键，只取中文键。"""
        lunar = Solar.fromYmd(y, 6, 15).getLunar()
        return [(k, v) for k, v in lunar.getJieQiTable().items() if k in TERM_SET and isinstance(v, Solar)]

    out: list[Row] = []
    for y in range(START_YEAR, END_YEAR + 1):
        # 两张表覆盖 冬至(y-1)…大雪(y+1)；按公历年份筛选出属于 y 的 24 项
        by_name: dict[str, Solar] = {}
        for name, solar in table(y) + table(y + 1):
            if solar.getYear() == y:
                by_name[name] = solar
        for idx, name in enumerate(TERMS):
            solar = by_name.get(name)
            if solar is None:
                raise RuntimeError(f"lunar-python: {y} 年缺少节气 {name}")
            out.append(
                (
                    y,
                    idx,
                    name,
                    f"{solar.getYear():04d}-{solar.getMonth():02d}-{solar.getDay():02d}",
                    solar.getHour() * 60 + solar.getMinute(),
                )
            )
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", choices=["auto", "sxtwl", "lunar-python"], default="auto")
    args = ap.parse_args()

    source = args.source
    if source in ("auto", "sxtwl"):
        try:
            import sxtwl  # noqa: F401

            rows = rows_from_sxtwl()
            source = "sxtwl"
        except Exception as e:  # 未安装 / API 变更 / 缺编译器
            if source == "sxtwl":
                print(f"sxtwl 不可用：{e}", file=sys.stderr)
                return 2
            print(f"sxtwl 不可用（{e}），回落 lunar-python", file=sys.stderr)
            source = "lunar-python"
    if source == "lunar-python":
        rows = rows_from_lunar_python()

    rows.sort(key=lambda r: (r[0], r[1]))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["year", "index", "name", "date", "minutes"])
        for y, idx, name, date, minutes in rows:
            w.writerow([y, idx, name, date, minutes])
    print(f"source={source} rows={len(rows)} -> {os.path.normpath(OUT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

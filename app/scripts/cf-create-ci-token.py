#!/usr/bin/env python3
"""创建 Cloudflare CI 专用 API Token（作用域最小化）。

为什么不用 Global API Key 部署：
Global API Key 是账号级全量权限，泄一次等于交出整个 Cloudflare 账号
（含其他 Worker、域名、DNS、账单）。CI 只需要部署 Worker + 读写自己的 KV，
所以这里开一个只带这几项权限的专用 Token，泄漏影响面仅限本项目。

Token 值只写本机文件 ~/.calenref-ci-token，不打印到 stdout、不进 git。
"""
import json
import os
import urllib.error
import urllib.request

TOKEN_FILE = os.path.expanduser("~/.cf-calenref-token")
OUT_FILE = os.path.expanduser("~/.calenref-ci-token")
ACCOUNT = "bbd93e37b6abc18544496250c33bfde7"

with open(TOKEN_FILE, encoding="utf-8") as f:
    key = f.read().strip()

HEADERS = {"X-Auth-Email": "kris.188h@gmail.com", "X-Auth-Key": key}


def api(path, method="GET", body=None):
    data = json.dumps(body).encode() if body is not None else None
    h = dict(HEADERS)
    if data:
        h["Content-Type"] = "application/json"
    req = urllib.request.Request(
        f"https://api.cloudflare.com/client/v4{path}", headers=h, data=data, method=method
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raw = e.read().decode(errors="replace")
        try:
            return json.loads(raw)
        except Exception:  # noqa: BLE001
            return {"success": False, "raw": raw[:400]}


PERMS = {
    # 部署 Worker 脚本本体（含静态资源）
    "e086da7e2179491d91ee5f35b3ca210a": "Workers Scripts Write",
    # 部署时绑定 KV 命名空间需要读元数据
    "96800ebd1a004f5b92266eed9e3dcf13": "Workers KV Storage Metadata Read",
    # 订单 KV 的读写
    "8b47d2786a534c08a1f94ee8f9f599ef": "Workers KV Storage Read",
    "f7f0eda5697f475c90846e879bab8666": "Workers KV Storage Write",
    # 部署要确认账号
    "c1fde68c7bcc44588cbb6ddbc16d6480": "Account Settings Read",
}

body = {
    "name": "calenref-ci-deploy",
    "policies": [
        {
            "effect": "allow",
            "resources": {
                f"com.cloudflare.api.account.{ACCOUNT}": "*",
            },
            "permission_groups": [
                {"id": pid, "name": name} for pid, name in PERMS.items()
            ],
        }
    ],
}

print("创建 CI 专用 Token…")
d = api("/user/tokens", "POST", body)
if not d.get("success"):
    print("失败：", json.dumps(d.get("errors") or d.get("raw"), ensure_ascii=False)[:500])
    raise SystemExit(1)

result = d["result"]
value = result["value"]
with open(OUT_FILE, "w", encoding="utf-8") as f:
    f.write(value)

print(f"✓ Token 已创建：{result['id']}")
print(f"  权限：{'、'.join(PERMS.values())}")
print(f"  值已写入 {OUT_FILE}（仅本机，不进 git）")
print(f"  长度：{len(value)}")

#!/usr/bin/env bash
# 生产部署 + 部署后自检（一键）
#
# 为什么从文件读 token：令牌明文出现在命令行/脚本里会被安全策略替换成同格式假串，
# 导致认证失败。把真实令牌放进 ~/.cf-calenref-token（仅本机，不进 git），脚本运行时再读。
#
# 用法：bash scripts/deploy-prod.sh
set -euo pipefail

cd "$(dirname "$0")/.."

TOKEN_FILE="${CF_TOKEN_FILE:-$HOME/.cf-calenref-token}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-bbd93e37b6abc18544496250c33bfde7}"
SITE_URL="https://calenref.kris-188h.workers.dev"

if [ ! -f "$TOKEN_FILE" ]; then
  echo "缺少令牌文件：$TOKEN_FILE"
  echo "请把 Cloudflare API Token 写入该文件（只一行，无空格换行）后重试。"
  exit 2
fi
CF_TOKEN="$(tr -d '\r\n ' < "$TOKEN_FILE")"

# 令牌类型：cfut_/cfat_ = API Token（Bearer）；cfk_ = Global API Key（X-Auth-Email + X-Auth-Key）
CF_EMAIL="${CF_EMAIL:-kris.188h@gmail.com}"
case "$CF_TOKEN" in
  cfk_*)
    export CLOUDFLARE_EMAIL="$CF_EMAIL"
    export CLOUDFLARE_API_KEY="$CF_TOKEN"
    unset CLOUDFLARE_API_TOKEN || true
    echo "认证方式：Global API Key（$CF_EMAIL）"
    ;;
  *)
    export CLOUDFLARE_API_TOKEN="$CF_TOKEN"
    echo "认证方式：API Token（Bearer）"
    ;;
esac

echo "==> 1/3 构建（VITE_SITE_URL=$SITE_URL）"
VITE_SITE_URL="$SITE_URL" npm run build

echo "==> 2/3 部署到 Cloudflare Workers"
CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID" npx wrangler deploy

# 密钥只从本机文件读，不进 git。
# wrangler 4.x 的 deploy **不会** 删除已存在的 secret（--keep-vars 只管 vars），
# 这里仍做一次「确保存在」的补挂：万一本地文件有更新就覆盖上去，
# 缺文件时保留线上已有的（不覆盖 = 不破坏）。
GUMROAD_TOKEN_FILE="${GUMROAD_TOKEN_FILE:-$HOME/.calenref-gumroad-token}"
GUMROAD_PING_FILE="${GUMROAD_PING_FILE:-$HOME/.calenref-gumroad-ping-secret}"
REDEEM_KEY_FILE="${REDEEM_KEY_FILE:-$HOME/.calenref-redeem-secret}"
echo "==> 2.5/3 确保 secrets 就位"
if [ -f "$GUMROAD_TOKEN_FILE" ]; then
  tr -d '\r\n ' < "$GUMROAD_TOKEN_FILE" | CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID" npx wrangler secret put GUMROAD_ACCESS_TOKEN >/dev/null 2>&1 \
    && echo "  GUMROAD_ACCESS_TOKEN ✓" || echo "  GUMROAD_ACCESS_TOKEN ✗（检查 $GUMROAD_TOKEN_FILE）"
else
  echo "  ⚠ 缺少 $GUMROAD_TOKEN_FILE，保留线上已有的 GUMROAD_ACCESS_TOKEN"
fi
if [ -f "$GUMROAD_PING_FILE" ]; then
  tr -d '\r\n ' < "$GUMROAD_PING_FILE" | CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID" npx wrangler secret put GUMROAD_PING_SECRET >/dev/null 2>&1 \
    && echo "  GUMROAD_PING_SECRET ✓" || echo "  GUMROAD_PING_SECRET ✗（检查 $GUMROAD_PING_FILE）"
else
  echo "  ⚠ 缺少 $GUMROAD_PING_FILE，保留线上已有的 GUMROAD_PING_SECRET"
fi
if [ -f "$REDEEM_KEY_FILE" ]; then
  tr -d '\r\n ' < "$REDEEM_KEY_FILE" | CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID" npx wrangler secret put REDEEM_SECRET >/dev/null 2>&1 \
    && echo "  REDEEM_SECRET ✓" || echo "  REDEEM_SECRET ✗（检查 $REDEEM_KEY_FILE）"
else
  echo "  ⚠ 缺少 $REDEEM_KEY_FILE，保留线上已有的 REDEEM_SECRET"
fi

echo "==> 3/3 等边缘节点传播 90s 后自检"
sleep 90
node scripts/verify-deploy.mjs "$SITE_URL"

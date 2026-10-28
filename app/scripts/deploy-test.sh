#!/usr/bin/env bash
# 测试环境部署 + 自检（独立 Worker，接 Creem 测试环境）
# 令牌从 ~/.cf-zeji-token 读（cfk_ = Global API Key，走 X-Auth-Email + X-Auth-Key）
set -euo pipefail

cd "$(dirname "$0")/.."

TOKEN_FILE="${CF_TOKEN_FILE:-$HOME/.cf-zeji-token}"
ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-bbd93e37b6abc18544496250c33bfde7}"
SITE_URL="https://zeji-h5-test.kris-188h.workers.dev"

if [ ! -f "$TOKEN_FILE" ]; then
  echo "缺少令牌文件：$TOKEN_FILE"
  exit 2
fi
CF_TOKEN="$(tr -d '\r\n ' < "$TOKEN_FILE")"

case "$CF_TOKEN" in
  cfk_*)
    export CLOUDFLARE_EMAIL="${CF_EMAIL:-kris.188h@gmail.com}"
    export CLOUDFLARE_API_KEY="$CF_TOKEN"
    unset CLOUDFLARE_API_TOKEN || true
    echo "认证方式：Global API Key"
    ;;
  *)
    export CLOUDFLARE_API_TOKEN="$CF_TOKEN"
    echo "认证方式：API Token（Bearer）"
    ;;
esac

echo "==> 1/3 构建到 dist-test（VITE_SITE_URL=$SITE_URL）"
VITE_SITE_URL="$SITE_URL" npx vite build --outDir dist-test

echo "==> 2/3 部署 zeji-h5-test"
CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID" npx wrangler deploy --config wrangler.test.toml

echo "==> 3/3 等 60s 后自检"
sleep 60
node scripts/verify-deploy.mjs "$SITE_URL"

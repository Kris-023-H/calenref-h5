#!/usr/bin/env node
/**
 * scripts/gen-redeem.mjs — 签发兑换码（运营 / 客服发放）。
 *
 * 用法：
 *   REDEEM_SECRET='<与 Worker 相同的密钥>' node scripts/gen-redeem.mjs <sku> [seq]
 *   sku ∈ once | ai10 | pair | year；seq 为流水号（默认 1，建议自增便于对账）
 *
 * 算法与 src/services/pay/redeem-crypto.ts 完全一致：
 *   payload = skuCode(1) + seq(8 hex) + nonce(4 hex)
 *   tag     = base32( HMAC_SHA256(secret, payload)[0:5] )
 * 密钥只在本地环境变量里，不写进仓库。
 */
import { createHmac } from 'node:crypto';

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const SKU_CODES = { once: 'A', ai10: 'B', pair: 'C', year: 'D' };

function b32encode(bytes) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function hex(n, len) {
  return n.toString(16).toUpperCase().padStart(len, '0');
}

const [, , skuArg, seqArg] = process.argv;
const secret = process.env.REDEEM_SECRET;

if (!secret) {
  console.error('缺少 REDEEM_SECRET 环境变量（须与 Worker secret 一致）');
  process.exit(1);
}
const skuCode = SKU_CODES[skuArg];
if (!skuCode) {
  console.error('sku 须为 once | ai10 | pair | year');
  process.exit(1);
}

const seq = Number(seqArg ?? 1);
const payload = `${skuCode}${hex(seq, 8)}${hex(Math.floor(Math.random() * 65536), 4)}`;
const sig = createHmac('sha256', Buffer.from(secret, 'latin1')).update(Buffer.from(payload, 'latin1')).digest();
const tag = b32encode(sig.subarray(0, 5));
const code = `ZJ-${skuCode}-${b32encode(Buffer.from(payload, 'latin1'))}-${tag}`;

console.log(code);

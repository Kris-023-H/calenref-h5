/**
 * services/pay/redeem.ts — 兑换码离线校验（HMAC-SHA-256）+ 写入凭证。
 *
 * 码格式：ZJ-<sku>-<base32(payload)>-<base32(hmac)>
 *   payload = sku(1) + seq(4 hex) + nonce(2 hex)
 *   hmac   = HMAC_SHA256(key, payload) 取前 5 字节
 * 已知限制（README 明示）：密钥随包分发，可被提取后离线造码；
 * 联网核验（Cloudflare Worker）为上线升级项。v1 只服务真品兑换与测试发放。
 */

import type { Sku } from '../../data/prices';
import { SKU_LEFT } from '../../data/prices';
import { licenseRepo } from '../../db/repos/license.repo';
import { ok, err, type Result } from '../../lib/result';

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** 开发期默认密钥；生产经 .env VITE_REDEEM_KEY 覆盖 */
function redeemKey(): string {
  const fromEnv = import.meta.env.VITE_REDEEM_KEY;
  return typeof fromEnv === 'string' && fromEnv.length > 0 ? fromEnv : 'zeji-redeem-dev-key';
}

const SKU_CODES: Record<Sku, string> = { once: 'A', ai10: 'B', pair: 'C', year: 'D' };
const SKU_BY_CODE: Record<string, Sku> = { A: 'once', B: 'ai10', C: 'pair', D: 'year' };

function toBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

function fromBytes(b: Uint8Array): string {
  let out = '';
  for (const n of b) out += String.fromCharCode(n);
  return out;
}

/** base32 编码（无填充，仅用 A–Z2–7） */
function b32encode(bytes: Uint8Array): string {
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

/** base32 解码 */
function b32decode(text: string): Uint8Array {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of text.toUpperCase()) {
    const idx = B32.indexOf(ch);
    if (idx < 0) throw new Error('bad base32');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

/** HMAC-SHA-256（Web Crypto，离线可用） */
async function hmacSha256(key: string, message: string): Promise<Uint8Array> {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.subtle) throw new Error('webcrypto unavailable');
  const keyBuf = await cryptoObj.subtle.importKey(
    'raw',
    toBytes(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await cryptoObj.subtle.sign('HMAC', keyBuf, toBytes(message));
  return new Uint8Array(sig);
}

function hex(n: number, len: number): string {
  return n.toString(16).toUpperCase().padStart(len, '0');
}

function parseHex(s: string): number {
  return parseInt(s, 16);
}

/** 生成兑换码（运营发放 / 测试用；密钥同校验） */
export async function generateRedeemCode(sku: Sku, seq: number): Promise<string> {
  const skuCode = SKU_CODES[sku];
  const payload = `${skuCode}${hex(seq, 8)}${hex(Math.floor(Math.random() * 65536), 4)}`;
  const sig = await hmacSha256(redeemKey(), payload);
  const tag = b32encode(sig.slice(0, 5));
  return `ZJ-${skuCode}-${b32encode(toBytes(payload))}-${tag}`;
}

export interface RedeemOk {
  sku: Sku;
  left: number;
}

/** 校验并入库：格式错 / 签名错 / 已用 → Err */
export async function redeemCode(codeRaw: string): Promise<Result<RedeemOk>> {
  const code = codeRaw.trim().toUpperCase();
  const parts = code.split('-');
  if (parts.length !== 4 || parts[0] !== 'ZJ') return err('redeemFail', 'pay.redeemFail');
  const [, skuCode, payloadB32, tag] = parts;
  const sku = SKU_BY_CODE[skuCode];
  if (!sku) return err('redeemFail', 'pay.redeemFail');

  let payload: string;
  try {
    payload = fromBytes(b32decode(payloadB32));
  } catch {
    return err('redeemFail', 'pay.redeemFail');
  }
  if (!/^[A-D][0-9A-F]{8}[0-9A-F]{4}$/.test(payload)) return err('redeemFail', 'pay.redeemFail');

  // 验签
  let sig: Uint8Array;
  try {
    sig = await hmacSha256(redeemKey(), payload);
  } catch {
    return err('unknown', 'err.unknown');
  }
  const expectTag = b32encode(sig.slice(0, 5));
  if (expectTag !== tag) return err('redeemFail', 'pay.redeemFail');

  // 防重放：同一 payload 只接受一次（license.id 固定）
  const id = `lic_${payload}`;
  const existing = (await licenseRepo.list()).find((r) => r.id === id);
  if (existing) return err('redeemFail', 'pay.redeemFail');

  const left = SKU_LEFT[sku];
  await licenseRepo.save({ id, code: code.slice(0, 12), sku, left, boundAt: Date.now(), source: 'redeem' });
  return ok({ sku, left });
}

export { parseHex };

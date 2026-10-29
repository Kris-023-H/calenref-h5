/**
 * services/pay/redeem-crypto.ts — 兑换码编解码与签名（纯函数，浏览器 / Worker / Node 通用）。
 *
 * 码格式：ZJ-<skuCode>-<base32(payload)>-<base32(tag)>
 *   payload = skuCode(1) + seq(8 hex) + nonce(4 hex)  —— 共 13 字符
 *   tag     = HMAC_SHA256(key, payload) 取前 5 字节，再 base32
 *
 * 安全要点：
 *   · SKU 以 payload[0] 为唯一真源（服务端据此发权益），前缀字母仅作展示；
 *     两者不一致即拒绝 —— 堵住「把 ZJ-D- 改成 ZJ-B- 越权领更大权益」。
 *   · 签名密钥只在 Worker（REDEEM_SECRET），客户端不持有，无法离线造码。
 */

import type { Sku } from '../../data/prices';

export const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export const SKU_CODES: Record<Sku, string> = { once: 'A', ai10: 'B', pair: 'C', year: 'D' };
export const SKU_BY_CODE: Record<string, Sku> = { A: 'once', B: 'ai10', C: 'pair', D: 'year' };

/** 载荷格式：1 位 SKU 字母 + 12 位十六进制 */
export const PAYLOAD_RE = /^[A-D][0-9A-F]{12}$/;

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

/** base32 编码（无填充，A–Z2–7） */
export function b32encode(bytes: Uint8Array): string {
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
export function b32decode(text: string): Uint8Array {
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

/** HMAC-SHA-256（Web Crypto；浏览器 / Worker / Node 18+ 均有 globalThis.crypto） */
export async function hmacSha256(key: string, message: string): Promise<Uint8Array> {
  const c = globalThis.crypto;
  if (!c?.subtle) throw new Error('webcrypto unavailable');
  const keyBuf = await c.subtle.importKey('raw', toBytes(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await c.subtle.sign('HMAC', keyBuf, toBytes(message));
  return new Uint8Array(sig);
}

export function hex(n: number, len: number): string {
  return n.toString(16).toUpperCase().padStart(len, '0');
}

/** 签发兑换码（运营脚本 / 测试用；密钥须与 Worker 的 REDEEM_SECRET 一致） */
export async function generateCode(sku: Sku, seq: number, key: string): Promise<string> {
  const code = SKU_CODES[sku];
  const payload = `${code}${hex(seq, 8)}${hex(Math.floor(Math.random() * 65536), 4)}`;
  const tag = b32encode((await hmacSha256(key, payload)).slice(0, 5));
  return `ZJ-${code}-${b32encode(toBytes(payload))}-${tag}`;
}

export interface ParsedCode {
  /** 前缀字母（仅展示） */
  skuCode: string;
  /** 13 字符载荷，payload[0] 为权威 SKU */
  payload: string;
  /** base32 签名 */
  tag: string;
}

/** 解析并做格式校验（不解签） */
export function parseCode(codeRaw: string): ParsedCode | null {
  const code = codeRaw.trim().toUpperCase();
  const parts = code.split('-');
  if (parts.length !== 4 || parts[0] !== 'ZJ') return null;
  const [, skuCode, payloadB32, tag] = parts;
  if (!SKU_BY_CODE[skuCode]) return null;
  let payload: string;
  try {
    payload = fromBytes(b32decode(payloadB32));
  } catch {
    return null;
  }
  if (!PAYLOAD_RE.test(payload)) return null;
  return { skuCode, payload, tag };
}

/** 验签；通过返回权威 SKU（取自 payload[0]），否则 null */
export async function verifyCode(parsed: ParsedCode, key: string): Promise<Sku | null> {
  // 前缀与载荷首字母必须一致，否则视为篡改（越权）
  if (parsed.skuCode !== parsed.payload[0]) return null;
  let sig: Uint8Array;
  try {
    sig = await hmacSha256(key, parsed.payload);
  } catch {
    return null;
  }
  if (b32encode(sig.slice(0, 5)) !== parsed.tag) return null;
  return SKU_BY_CODE[parsed.payload[0]] ?? null;
}

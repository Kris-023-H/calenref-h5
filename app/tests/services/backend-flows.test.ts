/**
 * tests/services/backend-flows.test.ts — QA 独立补测（严过关）。
 * 覆盖需要存储后端的服务流（fake-indexeddb）：
 *   applyPaymentReturn：success 写凭证 / cancel 不写 / 同 sessionId 防重放 / 无 sku 不写；
 *   redeemCode：有效 / 格式错 / sku 码错 / 签名错 / 重复使用（重放）；
 *   quotaRepo：跨（时区）自然月重置 + 用尽返回 ok(false) 不穿底。
 * 依据 PRD §3.1 / §4.2 / §9 #4 #5 #6。
 */
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getBackend, setBackendForTests, STORES } from '../../src/db/backend';
import { licenseRepo } from '../../src/db/repos/license.repo';
import { quotaRepo } from '../../src/db/repos/quota.repo';
import { applyPaymentReturn } from '../../src/services/pay/creem';
import { redeemCode } from '../../src/services/pay/redeem';
import { generateCode, parseCode, verifyCode } from '../../src/services/pay/redeem-crypto';
import { tzMonthKey } from '../../src/services/timezone';

/**
 * 模拟 Worker 的核验端点 /api/verify。
 * paid 的键是 ref，值是该单对应的 sku（false 表示未付）。
 */
function mockVerify(paid: Record<string, string | false>): void {
  vi.stubGlobal('fetch', async (input: string | URL) => {
    const url = String(input);
    const ref = new URL(url, 'https://example.test').searchParams.get('ref') ?? '';
    const sku = paid[ref];
    return {
      ok: true,
      json: async () => (sku ? { paid: true, sku } : { paid: false }),
    } as Response;
  });
}

async function clearAll(): Promise<void> {
  const b = await getBackend();
  for (const s of STORES) await b.clear(s);
}

beforeEach(async () => {
  setBackendForTests(null);
  await clearAll();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('applyPaymentReturn — 核验后写凭证 + 防重放', () => {
  it('Worker 确认已付 → 写本机凭证（左次按 SKU_LEFT）', async () => {
    mockVerify({ r_ai10: 'ai10' });
    const wrote = await applyPaymentReturn({ status: 'success', sku: 'ai10', ref: 'r_ai10' });
    expect(wrote).toBe(true);
    const rows = await licenseRepo.list();
    expect(rows).toHaveLength(1);
    expect(rows[0].sku).toBe('ai10');
    expect(rows[0].left).toBe(10);
    expect(rows[0].source).toBe('creem');
  });

  it('cancel → 不写凭证，也不发核验请求', async () => {
    const spy = vi.fn();
    vi.stubGlobal('fetch', spy);
    const wrote = await applyPaymentReturn({ status: 'cancel' });
    expect(wrote).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    expect(await licenseRepo.list()).toHaveLength(0);
  });

  it('success 但无 ref → 不写（不再采信客户端传入的 sku）', async () => {
    const wrote = await applyPaymentReturn({ status: 'success', sku: 'year' });
    expect(wrote).toBe(false);
    expect(await licenseRepo.list()).toHaveLength(0);
  });

  it('Worker 回未付 → 不写凭证', async () => {
    vi.useFakeTimers();
    mockVerify({});
    const p = applyPaymentReturn({ status: 'success', sku: 'once', ref: 'r_unpaid' });
    await vi.advanceTimersByTimeAsync(8000);
    expect(await p).toBe(false);
    expect(await licenseRepo.list()).toHaveLength(0);
  });

  it('同一 ref 重复回跳 → 防重放，只落一次', async () => {
    mockVerify({ r_dup: 'year' });
    expect(await applyPaymentReturn({ status: 'success', sku: 'year', ref: 'r_dup' })).toBe(true);
    expect(await applyPaymentReturn({ status: 'success', sku: 'year', ref: 'r_dup' })).toBe(false);
    expect(await licenseRepo.list()).toHaveLength(1);
  });
});

describe('redeemCode — 服务端验签 + 一次性核销', () => {
  const SECRET = 'test-redeem-secret';

  /** 模拟 Worker 的 /api/redeem：验签（密钥只在服务端）+ 一码一用 */
  function mockRedeemServer(): void {
    const used = new Set<string>();
    vi.stubGlobal('fetch', async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (!url.endsWith('/api/redeem')) {
        return { ok: false, status: 404, json: async () => ({}) } as Response;
      }
      let code = '';
      try {
        code = (JSON.parse(String(init?.body ?? '{}')) as { code?: string }).code ?? '';
      } catch {
        return { ok: false, status: 400, json: async () => ({ ok: false, error: 'bad_json' }) } as Response;
      }
      const parsed = parseCode(code);
      if (!parsed) return { ok: false, status: 400, json: async () => ({ ok: false, error: 'invalid' }) } as Response;
      const sku = await verifyCode(parsed, SECRET);
      if (!sku) return { ok: false, status: 400, json: async () => ({ ok: false, error: 'invalid' }) } as Response;
      const licenseId = `lic_${parsed.payload}`;
      if (used.has(licenseId)) {
        return { ok: false, status: 409, json: async () => ({ ok: false, error: 'used' }) } as Response;
      }
      used.add(licenseId);
      return { ok: true, status: 200, json: async () => ({ ok: true, sku, licenseId }) } as Response;
    });
  }

  beforeEach(() => mockRedeemServer());

  it('有效 code → 写入正确 SKU 与次数', async () => {
    const code = await generateCode('ai10', 12345, SECRET);
    const res = await redeemCode(code);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.sku).toBe('ai10');
      expect(res.value.left).toBe(10);
    }
    expect(await licenseRepo.list()).toHaveLength(1);
  });

  it('pair / year 权益正确', async () => {
    const pair = await redeemCode(await generateCode('pair', 1, SECRET));
    expect(pair.ok && pair.value.left).toBe(1);
    const year = await redeemCode(await generateCode('year', 2, SECRET));
    expect(year.ok && year.value.left).toBe(-1);
  });

  it('格式错 / sku 码错 / 签名错 → err（不静默失败）', async () => {
    expect((await redeemCode('garbage')).ok).toBe(false);
    expect((await redeemCode('ZJ-Z-AAAA-BBBBB')).ok).toBe(false); // sku 码 Z 非法
    const good = await generateCode('once', 7, SECRET);
    const tampered = good.slice(0, -1) + (good.slice(-1) === 'A' ? 'B' : 'A');
    expect((await redeemCode(tampered)).ok).toBe(false);
    expect(await licenseRepo.list()).toHaveLength(0); // 无一落库
  });

  it('重复使用同一 code → 第二次 err（重放防护）', async () => {
    const code = await generateCode('ai10', 999, SECRET);
    expect((await redeemCode(code)).ok).toBe(true);
    expect((await redeemCode(code)).ok).toBe(false);
    expect(await licenseRepo.list()).toHaveLength(1);
  });

  it('篡改前缀字母越权（ZJ-D-→ZJ-B-）→ err（SKU 以载荷为准）', async () => {
    const yearCode = await generateCode('year', 42, SECRET); // ZJ-D-…
    const forged = 'ZJ-B-' + yearCode.split('-').slice(2).join('-'); // 前缀改 B，载荷仍是 D
    expect((await redeemCode(forged)).ok).toBe(false);
    expect(await licenseRepo.list()).toHaveLength(0);
  });
});

describe('quotaRepo — 跨（时区）自然月重置', () => {
  it('tzMonthKey：同一时刻不同时区可归不同自然月', () => {
    // 2026-10-31 20:00 UTC
    const nowMs = Date.UTC(2026, 9, 31, 20, 0, 0);
    expect(tzMonthKey(nowMs, -8)).toBe('2026-10'); // 洛杉矶仍是 10 月
    expect(tzMonthKey(nowMs, 8)).toBe('2026-11'); // 东八区已入 11 月
    expect(tzMonthKey(nowMs, 0)).toBe('2026-10');
  });

  it('初始 3 次/月；逐次扣减；用尽后 ok(false) 不穿底', async () => {
    expect(await quotaRepo.freeLeft('2026-10')).toBe(3);
    expect((await quotaRepo.consumeFree('2026-10')).value).toBe(true);
    expect(await quotaRepo.freeLeft('2026-10')).toBe(2);
    expect((await quotaRepo.consumeFree('2026-10')).value).toBe(true);
    expect((await quotaRepo.consumeFree('2026-10')).value).toBe(true);
    expect(await quotaRepo.freeLeft('2026-10')).toBe(0);
    const exhausted = await quotaRepo.consumeFree('2026-10');
    expect(exhausted.ok).toBe(true);
    expect(exhausted.value).toBe(false); // 已用尽，返回 false 而非扣成负数
    expect(await quotaRepo.freeLeft('2026-10')).toBe(0);
  });

  it('跨自然月 → freeLeft 自动重置为 3', async () => {
    await quotaRepo.consumeFree('2026-10');
    await quotaRepo.consumeFree('2026-10');
    expect(await quotaRepo.freeLeft('2026-10')).toBe(1);
    // 进入新自然月（时区月 key 变化）→ 重置
    expect(await quotaRepo.freeLeft('2026-11')).toBe(3);
  });
});

/**
 * tests/services/backend-flows.test.ts — QA 独立补测（严过关）。
 * 覆盖需要存储后端的服务流（fake-indexeddb）：
 *   applyPaymentReturn：success 写凭证 / cancel 不写 / 同 sessionId 防重放 / 无 sku 不写；
 *   redeemCode：有效 / 格式错 / sku 码错 / 签名错 / 重复使用（重放）；
 *   quotaRepo：跨（时区）自然月重置 + 用尽返回 ok(false) 不穿底。
 * 依据 PRD §3.1 / §4.2 / §9 #4 #5 #6。
 */
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { getBackend, setBackendForTests, STORES } from '../../src/db/backend';
import { licenseRepo } from '../../src/db/repos/license.repo';
import { quotaRepo } from '../../src/db/repos/quota.repo';
import { applyPaymentReturn } from '../../src/services/pay/stripe';
import { generateRedeemCode, redeemCode } from '../../src/services/pay/redeem';
import { tzMonthKey } from '../../src/services/timezone';

async function clearAll(): Promise<void> {
  const b = await getBackend();
  for (const s of STORES) await b.clear(s);
}

beforeEach(async () => {
  setBackendForTests(null);
  await clearAll();
});

describe('applyPaymentReturn — 回跳写凭证 + 防重放', () => {
  it('success 且带 sku → 写本机凭证（左次按 SKU_LEFT）', async () => {
    const wrote = await applyPaymentReturn({ status: 'success', sku: 'ai10', sessionId: 'cs_a' });
    expect(wrote).toBe(true);
    const rows = await licenseRepo.list();
    expect(rows).toHaveLength(1);
    expect(rows[0].sku).toBe('ai10');
    expect(rows[0].left).toBe(10);
    expect(rows[0].source).toBe('stripe');
  });

  it('cancel → 不写凭证', async () => {
    const wrote = await applyPaymentReturn({ status: 'cancel' });
    expect(wrote).toBe(false);
    expect(await licenseRepo.list()).toHaveLength(0);
  });

  it('success 但无 sku → 不写', async () => {
    const wrote = await applyPaymentReturn({ status: 'success', sessionId: 'cs_b' });
    expect(wrote).toBe(false);
    expect(await licenseRepo.list()).toHaveLength(0);
  });

  it('同一 sessionId 重复回跳 → 防重放，只落一次', async () => {
    expect(await applyPaymentReturn({ status: 'success', sku: 'year', sessionId: 'cs_dup' })).toBe(true);
    expect(await applyPaymentReturn({ status: 'success', sku: 'year', sessionId: 'cs_dup' })).toBe(false);
    expect(await licenseRepo.list()).toHaveLength(1);
  });
});

describe('redeemCode — 兑换码离线校验', () => {
  it('有效 code → 写入正确 SKU 与次数', async () => {
    const code = await generateRedeemCode('ai10', 12345);
    const res = await redeemCode(code);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.sku).toBe('ai10');
      expect(res.value.left).toBe(10);
    }
    expect(await licenseRepo.list()).toHaveLength(1);
  });

  it('pair / year 权益正确', async () => {
    const pair = await redeemCode(await generateRedeemCode('pair', 1));
    expect(pair.ok && pair.value.left).toBe(1);
    const year = await redeemCode(await generateRedeemCode('year', 2));
    expect(year.ok && year.value.left).toBe(-1);
  });

  it('格式错 / sku 码错 / 签名错 → err（不静默失败）', async () => {
    expect((await redeemCode('garbage')).ok).toBe(false);
    expect((await redeemCode('ZJ-Z-AAAA-BBBBB')).ok).toBe(false); // sku 码 Z 非法
    const good = await generateRedeemCode('once', 7);
    const tampered = good.slice(0, -1) + (good.slice(-1) === 'A' ? 'B' : 'A');
    expect((await redeemCode(tampered)).ok).toBe(false);
    expect(await licenseRepo.list()).toHaveLength(0); // 无一落库
  });

  it('重复使用同一 code → 第二次 err（重放防护）', async () => {
    const code = await generateRedeemCode('ai10', 999);
    expect((await redeemCode(code)).ok).toBe(true);
    expect((await redeemCode(code)).ok).toBe(false);
    expect(await licenseRepo.list()).toHaveLength(1);
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

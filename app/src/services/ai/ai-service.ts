/**
 * services/ai/ai-service.ts — 释义摘要接口 + 配额/缓存编排。
 * 双实现：LocalTemplateAiService（默认，离线模板）与 RemoteAiService（默认关闭，
 * 上线前部署推理端点后经 .env 打开）。编排层统一处理配额扣减与缓存命中。
 */

import type { DayResult, Lang, ScanResult } from '../../engine/types';
import { aiCacheRepo } from '../../db/repos/ai-cache.repo';
import { quotaRepo } from '../../db/repos/quota.repo';
import { licenseRepo } from '../../db/repos/license.repo';
import { tzMonthKey } from '../timezone';
import { ok, err, type Result } from '../../lib/result';

export interface AiRequest {
  scan: ScanResult;
  /** 解读对象：默认首个可用日 */
  day: DayResult;
  lang: Lang;
  scanId: string;
  tzHours: number;
  nowMs: number;
}

export interface AiService {
  readonly kind: 'local' | 'remote';
  generate(req: AiRequest): Promise<Result<string[]>>;
}

/** 配额状态（界面配额条用） */
export interface QuotaState {
  freeLeft: number;
  paidLeft: number;
  unlimited: boolean;
}

export async function quotaState(tzHours: number, nowMs: number): Promise<QuotaState> {
  const monthKey = tzMonthKey(nowMs, tzHours);
  const [freeLeft, paidLeft, unlimited] = await Promise.all([
    quotaRepo.freeLeft(monthKey),
    licenseRepo.totalLeft(),
    licenseRepo.hasUnlimited(),
  ]);
  return { freeLeft, paidLeft, unlimited };
}

/**
 * 解读编排：缓存 → 配额 → 生成 → 缓存。
 * 返回 sections（四段）或配额不足错误（err.quota）。
 */
export async function runAiReading(service: AiService, req: AiRequest): Promise<Result<string[]>> {
  const cacheId = `${req.scanId}:${req.scan.ruleVersion}:${req.lang}`;
  const cached = await aiCacheRepo.get(cacheId);
  if (cached && cached.sections.length === 4) return ok(cached.sections);

  // 配额：付费（不清零）优先，免费次之
  const monthKey = tzMonthKey(req.nowMs, req.tzHours);
  const unlimited = await licenseRepo.hasUnlimited();
  if (!unlimited) {
    const paidLeft = await licenseRepo.totalLeft();
    if (paidLeft > 0) {
      await licenseRepo.consumeOne();
    } else {
      const consumed = await quotaRepo.consumeFree(monthKey);
      if (!consumed.ok || !consumed.value) return err('quota', 'ai.noQuota');
    }
  }

  const gen = await service.generate(req);
  if (!gen.ok) return gen;
  await aiCacheRepo.save(cacheId, gen.value);
  return gen;
}

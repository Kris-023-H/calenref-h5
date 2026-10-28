/**
 * db/repos/ai-cache.repo.ts — AI 解读本机缓存。
 * 键：scanId:ruleVersion:lang —— 规则版本或语言变化即重生成（可核原则）。
 */

import { getBackend } from '../backend';
import { SCHEMA_VERSION, type AiCacheRecord } from '../types';
import { ok, type Result } from '../../lib/result';

const STORE = 'aiCache' as const;

export function aiCacheId(scanId: string, ruleVersion: string, lang: string): string {
  return `${scanId}:${ruleVersion}:${lang}`;
}

export const aiCacheRepo = {
  async get(id: string): Promise<AiCacheRecord | undefined> {
    const b = await getBackend();
    return b.get<AiCacheRecord>(STORE, id);
  },

  async save(id: string, sections: string[]): Promise<Result<AiCacheRecord>> {
    const record: AiCacheRecord = { id, schemaVersion: SCHEMA_VERSION, createdAt: Date.now(), sections };
    const b = await getBackend();
    await b.put(STORE, record);
    return ok(record);
  },

  async remove(id: string): Promise<Result<void>> {
    const b = await getBackend();
    await b.del(STORE, id);
    return ok(undefined);
  },
};

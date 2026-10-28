/**
 * services/ai/remote-ai.ts — RemoteAiService：fetch 推理端点（上线升级项）。
 * 默认关闭（.env VITE_AI_ENDPOINT 为空时走本地模板）。
 * 输出校验：必须四段且不含结果性预测红线词，越界即降级为「本课未纳入此项」。
 */

import type { AiRequest, AiService } from './ai-service';
import { ok, err, type Result } from '../../lib/result';
import { LocalTemplateAiService, buildLocalReading } from './local-template-ai';

/** 红线词（中英）：结果性预测 / 医疗投资建议——出现即降级 */
const RED_LINES = [
  '一定发财',
  '必定',
  '保证赚',
  '稳赚',
  '包赚',
  '婚姻必然',
  '必然幸福',
  '肯定离',
  '医疗建议',
  '投资建议',
  'guaranteed profit',
  'will definitely',
  'guaranteed to earn',
  'medical advice',
  'investment advice',
];

function validateSections(sections: unknown): Result<string[]> {
  if (!Array.isArray(sections) || sections.length !== 4) {
    return err('unknown', 'ai.error');
  }
  const out: string[] = [];
  for (const s of sections) {
    if (typeof s !== 'string' || s.length < 10) return err('unknown', 'ai.error');
    for (const w of RED_LINES) {
      if (s.includes(w)) return err('unknown', 'ai.error');
    }
    out.push(s);
  }
  return ok(out);
}

export class RemoteAiService implements AiService {
  readonly kind = 'remote' as const;

  constructor(private endpoint: string) {}

  async generate(req: AiRequest): Promise<Result<string[]>> {
    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang: req.lang,
          eventKey: req.scan.input.eventKey,
          day: {
            date: req.day.date,
            dayGZ: req.day.dayGZ.text,
            jianchu: req.day.jianchu,
            score: req.day.score,
            layers: req.day.layers.map((l) => ({ key: l.key, resultKey: l.resultKey, cls: l.cls, delta: l.delta })),
          },
        }),
      });
      if (!res.ok) return err('network', 'ai.error');
      const body: unknown = await res.json();
      const sections = (body as { sections?: unknown })?.sections;
      const validated = validateSections(sections);
      // 校验不过：降级本地模板（不把异常抛给 UI）
      return validated.ok ? validated : ok(buildLocalReading(req));
    } catch {
      return err('network', 'ai.error');
    }
  }
}

/** 按环境变量选实现：端点为空 → 本地模板（v1 默认） */
export function resolveAiService(): AiService {
  const endpoint = import.meta.env.VITE_AI_ENDPOINT;
  if (endpoint && typeof endpoint === 'string' && endpoint.length > 0) return new RemoteAiService(endpoint);
  return new LocalTemplateAiService();
}

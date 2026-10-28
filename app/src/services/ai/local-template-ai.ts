import { tx } from '../../i18n';
/**
 * services/ai/local-template-ai.ts — LocalTemplateAiService：离线模板四段解读。
 * 结构固定（PRD v3.5 §8）：结论口径 / 业态适配 / 风险与化解 / 执行建议。
 * 五硬边界：不重新排课、不引入未纳入神煞、不输出结果性预测、不涉医疗投资、
 * 每条可指向报告章节——模板只引用已算出的层结果，天然满足。
 */

import type { DayResult, Industry, Lang, ScanResult } from '../../engine/types';
import { eventByKey } from '../../data/events';
import { industryById } from '../../data/industries';
import { readPerson } from '../../engine/person';
import { termText } from '../../i18n/glossary';
import { layerName, layerResultText, gradeText } from '../../i18n/engine-text';
import { ok, type Result } from '../../lib/result';
import type { AiRequest, AiService } from './ai-service';

const HOUR_SLOTS = [
  { zh: '辰时 07–09', en: 'Chen hour 07–09' },
  { zh: '巳时 09–11', en: 'Si hour 09–11' },
  { zh: '午时 11–13', en: 'Wu hour 11–13' },
];

const WX_NAMES = ['木', '火', '土', '金', '水'];

function peopleText(scan: ScanResult, lang: Lang): string {
  return scan.input.people
    .map((p) => {
      const zodiac = readPerson(p).zodiac;
      return tx(`${p.name}（属${zodiac}）`, `${p.name} (${zodiac})`, lang);
    })
    .join(tx('与', ' & ', lang));
}

function hourText(h: DayResult['goodHours'][number], lang: Lang): string {
  return `${h.name}${tx('时', ' hour', lang)}（${h.range}）`;
}

/** 四段解读（模板双语；HTML 仅 <b>，TypeWriter 可安全保留） */
export function buildLocalReading(req: AiRequest): string[] {
  const { scan, day, lang } = req;
  const ev = eventByKey(scan.input.eventKey);
  const evName = termText(ev.name, lang);
  const industry: Industry | undefined = scan.input.industryId ? industryById(scan.input.industryId) : undefined;
  const indName = industry ? termText(industry.name, lang) : '';
  const wxLayer = day.layers.find((l) => l.key === 'industryWuxing');
  const jcLayer = day.layers.find((l) => l.key === 'jianchu');
  const first = day.goodHours[0] ?? day.hours[0];
  const second = day.goodHours[1];
  const acts = ev.acts.map((a) => (lang === 'en' ? a.en : lang === 'zh-Hant' ? a.zhHant : a.zh));
  const bad = day.layers.filter((l) => l.cls === 'warn' || l.cls === 'bad');
  const grade = gradeText(day.grade, lang);
  const jcText = jcLayer ? layerResultText(jcLayer, lang) : '';

  const sec1 =
    lang === 'en'
      ? `This reading answers one question: whether <b>${day.dayGZ.text} day (${jcText})</b> fits <b>${evName}</b> for the charts of ${peopleText(scan, 'en')}. Score ${day.score} — ${grade}. It does not predict how business will go; it only says whether the day fits this rule set.`
      : `这份报告算的是「${evName}」这一件事${indName ? `在「${indName}」业态下、` : ''}以${peopleText(scan, lang)}年命为约束的日课，结论是<b>${day.dayGZ.text}日可用</b>，课格评分 ${day.score}（${grade}）。它不预测生意好坏，只回答「这一天合不合这套规则」。`;

  const sec2 =
    lang === 'en'
      ? `${indName ? `“${indName}” belongs to ${industry ? WX_NAMES[industry.wuxing] : ''}; ` : ''}the day stem is ${day.dayGZ.text[0]}. ${wxLayer ? layerResultText(wxLayer, 'en') : 'This occasion does not take the industry five-phase layer.'} ${industry ? industry.note.en : ''}`
      : `${indName ? `「${indName}」属${industry ? WX_NAMES[industry.wuxing] : ''}，` : ''}本日日干${day.dayGZ.text[0]}，${wxLayer ? layerResultText(wxLayer, lang) : '此用事不取业态五行层'}。${industry ? industry.note.zh : ''}`;

  const sec3 =
    lang === 'en'
      ? bad.length
        ? `Secondary factors: <b>${bad.map((b) => `${layerName(b.key, 'en')} · ${layerResultText(b, 'en')}`).join('; ')}</b>. These are not reasons to move the date — the traditional remedy is to place the first key action inside an auspicious hour, keep the core step indoors, and do a dry run the day before.`
        : `All layers run clean — a rare day. Lock it in; do not let “wait and see” cost it.`
      : bad.length
        ? `次级因素有：<b>${bad.map((b) => `${layerName(b.key, lang)} · ${layerResultText(b, lang)}`).join('、')}</b>。这些不构成改期理由，传统做法是——把「${acts[0] ?? ''}」放在吉时内、在室内完成核心环节、并在前一日先做一次「预演」以应「先动后正」。`
        : '七至八层皆顺，无次级瑕疵。这是少见的好日子，建议直接锁定，不要为了「再等等」错过。';

  const slots = HOUR_SLOTS.map((s) => (lang === 'en' ? s.en : s.zh));
  const actSeq = acts.map((a, i) => `${a}（${slots[i] ?? slots[slots.length - 1]}）`).join(' → ');
  const sec4 =
    lang === 'en'
      ? `Key actions in order: <b>${actSeq}</b>. First-choice hour: ${hourText(first, 'en')}; second choice: ${second ? hourText(second, 'en') : 'none'}. Keep the first week steady rather than heavy on spend — the usual opening rhythm, and just as important as the day itself.`
      : `关键动作按此时序落：<b>${actSeq}</b>。首选吉时为 ${hourText(first, lang)}，次选 ${second ? hourText(second, lang) : '无'}。开市首周不做大额投入，以「稳客」为主——这是开业期的通行节奏，与日课无关，但同样重要。`;

  return [sec1, sec2, sec3, sec4];
}

export class LocalTemplateAiService implements AiService {
  readonly kind = 'local' as const;

  async generate(req: AiRequest): Promise<Result<string[]>> {
    return ok(buildLocalReading(req));
  }
}

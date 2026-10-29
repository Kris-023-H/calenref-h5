/**
 * data/jc-tables.ts — 建除分组分值表 + 十二值神专业释义。
 * 分值表为引擎取用（纯数字）；释义为术语固化的长文，随语言三列直排。
 */

import type { EventGroup, L10n } from '../engine/types';

/** 建除分组分值表（与高保真原型逐值一致） */
export const JC_POINTS: Record<EventGroup, number[]> = {
  家庭择日: [2, 6, 3, -4, 11, -5, -30, -8, 12, -3, 8, -14],
  经营择日: [5, 3, 5, -3, 7, 2, -30, -6, 11, 8, 12, -12],
  工程择日: [4, 5, 2, -4, 8, -3, -30, -9, 11, 2, 9, -10],
  生命礼: [2, 6, 4, -3, 6, 0, -28, -6, 9, 4, 7, -8],
};

/** 值神 key 序列（i18n reason code 用） */
export const JC_KEYS = ['jian', 'chu', 'man', 'ping', 'ding', 'zhi', 'po', 'wei', 'cheng', 'shou', 'kai', 'bi'] as const;

/** 十二值神专业释义（术语固化，三语） */
export const JC_DESC: Record<string, L10n> = {
  建: {
    zh: '建者健也，主建始。宜出行、上任、会友，不宜动土开仓。',
    en: 'Establish: strength and beginnings. Favors travel, appointments, gatherings; not earth-breaking or opening stores.',
    zhHant: '建者健也，主建始。宜出行、上任、會友，不宜動土開倉。',
  },
  除: {
    zh: '除者除旧，主去故。宜疗病、扫舍、除服，不宜嫁娶远行。',
    en: 'Remove: clearing away the old. Favors healing, cleansing, letting go; not marriage or long journeys.',
    zhHant: '除者除舊，主去故。宜療病、掃舍、除服，不宜嫁娶遠行。',
  },
  满: {
    zh: '满者盈也，主丰盈。宜祭祀、祈福、开市，不宜安葬赴任。',
    en: 'Fullness: abundance. Favors offerings, blessings, opening for business; not burials or taking office.',
    zhHant: '滿者盈也，主豐盈。宜祭祀、祈福、開市，不宜安葬赴任。',
  },
  平: {
    zh: '平者均也，主平常。宜修造、涂泥、平治，不宜开市嫁娶。',
    en: 'Balance: the even and ordinary. Favors repairs and leveling work; not openings or marriage.',
    zhHant: '平者均也，主平常。宜修造、塗泥、平治，不宜開市嫁娶。',
  },
  定: {
    zh: '定者定也，主安定。宜嫁娶、订盟、入宅，是婚嫁与迁居首选。',
    en: 'Stability: settling into place. Favors marriage, engagements, moving in — first choice for weddings and relocations.',
    zhHant: '定者定也，主安定。宜嫁娶、訂盟、入宅，是婚嫁與遷居首選。',
  },
  执: {
    zh: '执者执持，主固守。宜捕捉、造屋、收养，不宜开市出行。',
    en: 'Holding: firm retention. Favors building and taking in; not openings or travel.',
    zhHant: '執者執持，主固守。宜捕捉、造屋、收養，不宜開市出行。',
  },
  破: {
    zh: '破者破败，即月破。主冲破，百事不宜，当日直接出局。',
    en: 'Break: rupture — the Month Break. Everything is ill-suited; the day-chart is excluded outright.',
    zhHant: '破者破敗，即月破。主沖破，百事不宜，日課直接出局。',
  },
  危: {
    zh: '危者危殆，主高危。宜安床、祭祀、静守，忌登高远行。',
    en: 'Danger: heightened risk. Favors rest, offerings, stillness; not climbing or long journeys.',
    zhHant: '危者危殆，主高危。宜安床、祭祀、靜守，忌登高遠行。',
  },
  成: {
    zh: '成者成就，主万事可成。宜开市、嫁娶、入宅，百业首选。',
    en: 'Completion: all matters can be brought to fruition. Favors openings, marriage, moving in — the all-purpose choice.',
    zhHant: '成者成就，主萬事可成。宜開市、嫁娶、入宅，百業首選。',
  },
  收: {
    zh: '收者收成，主收纳。宜纳财、进人口、栽种，不宜开市出行。',
    en: 'Harvest: gathering in. Favors accounting, new members, planting; not openings or travel.',
    zhHant: '收者收成，主收納。宜納財、進人口、栽種，不宜開市出行。',
  },
  开: {
    zh: '开者开启，主生发。宜开市、出行、祈福，忌安葬破土。',
    en: 'Open: beginning and growth. Favors openings, travel, blessings; not burials or earth-breaking.',
    zhHant: '開者開啟，主生發。宜開市、出行、祈福，忌安葬破土。',
  },
  闭: {
    zh: '闭者闭塞，主收藏。宜筑堤、埋葬、塞穴，忌开市出行就医。',
    en: 'Close: sealing and storing. Favors dikes and burials; not openings, travel, or medical visits.',
    zhHant: '閉者閉塞，主收藏。宜築堤、埋葬、塞穴，忌開市出行就醫。',
  },
};

/** 通用黄历宜忌（建除口径 · 对所有人一致；首页通书宜忌用） */
export const JC_YI: Record<string, string> = {
  建: '出行 上任 会友',
  除: '疗病 扫舍 除旧',
  满: '祭祀 祈福 开市',
  平: '修造 涂泥 平治',
  定: '嫁娶 订盟 入宅',
  执: '捕捉 造屋 收养',
  破: '诸事不宜',
  危: '安床 祭祀 静守',
  成: '开市 嫁娶 入宅',
  收: '纳财 进人口 栽种',
  开: '开市 出行 祈福',
  闭: '筑堤 埋葬 塞穴',
};

export const JC_JI: Record<string, string> = {
  建: '动土 开仓',
  除: '嫁娶 远行',
  满: '安葬 赴任',
  平: '开市 嫁娶',
  定: '诉讼 远行',
  执: '开市 出行',
  破: '诸事不宜',
  危: '登高 行船',
  成: '诉讼 争讼',
  收: '开市 出行',
  开: '安葬 破土',
  闭: '开市 出行 就医',
};

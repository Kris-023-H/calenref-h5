/**
 * i18n/glossary.ts — 术语表：一概念一译名（zh / en / zh-Hant 三列）。
 * 界面、报告、AI 解读、知库标题四处共用；新术语先入本表再使用。
 * 译名原则（出海增量 PRD §2.2）：音译 + 意译双轨；干支保留拼音 + 释义；
 * 释义优先于直译；结果性词汇红线词中英共用同一份禁词清单。
 *
 * 使用方式：数据层只写术语 key 字面量（TermKey），界面文案一律经
 * `termText(key, lang)` 取出，禁止在数据与组件里手写译名。
 */

import type { Lang } from '../engine/types';

export interface GlossaryEntry {
  key: string;
  zh: string;
  en: string;
  zhHant: string;
  /** 拼音（核心术语） */
  pinyin?: string;
  note?: string;
}

/** 二十四节气（日历序，自小寒起；与 engine/calendar/solar-terms.ts 同序） */
export const GLOSSARY: GlossaryEntry[] = [
  // ---------- 节气 jq（24） ----------
  { key: 'term.jq.xiaohan', zh: '小寒', en: 'Minor Cold', zhHant: '小寒', pinyin: 'Xiǎohán' },
  { key: 'term.jq.dahan', zh: '大寒', en: 'Major Cold', zhHant: '大寒', pinyin: 'Dàhán' },
  { key: 'term.jq.lichun', zh: '立春', en: 'Start of Spring', zhHant: '立春', pinyin: 'Lìchūn' },
  { key: 'term.jq.yushui', zh: '雨水', en: 'Rain Water', zhHant: '雨水', pinyin: 'Yǔshuǐ' },
  { key: 'term.jq.jingzhe', zh: '惊蛰', en: 'Awakening of Insects', zhHant: '驚蟄', pinyin: 'Jīngzhé' },
  { key: 'term.jq.chunfen', zh: '春分', en: 'Spring Equinox', zhHant: '春分', pinyin: 'Chūnfēn' },
  { key: 'term.jq.qingming', zh: '清明', en: 'Pure Brightness', zhHant: '清明', pinyin: 'Qīngmíng' },
  { key: 'term.jq.guyu', zh: '谷雨', en: 'Grain Rain', zhHant: '穀雨', pinyin: 'Gǔyǔ' },
  { key: 'term.jq.lixia', zh: '立夏', en: 'Start of Summer', zhHant: '立夏', pinyin: 'Lìxià' },
  { key: 'term.jq.xiaoman', zh: '小满', en: 'Grain Buds', zhHant: '小滿', pinyin: 'Xiǎomǎn' },
  { key: 'term.jq.mangzhong', zh: '芒种', en: 'Grain in Ear', zhHant: '芒種', pinyin: 'Mángzhòng' },
  { key: 'term.jq.xiazhi', zh: '夏至', en: 'Summer Solstice', zhHant: '夏至', pinyin: 'Xiàzhì' },
  { key: 'term.jq.xiaoshu', zh: '小暑', en: 'Minor Heat', zhHant: '小暑', pinyin: 'Xiǎoshǔ' },
  { key: 'term.jq.dashu', zh: '大暑', en: 'Major Heat', zhHant: '大暑', pinyin: 'Dàshǔ' },
  { key: 'term.jq.liqiu', zh: '立秋', en: 'Start of Autumn', zhHant: '立秋', pinyin: 'Lìqiū' },
  { key: 'term.jq.chushu', zh: '处暑', en: 'End of Heat', zhHant: '處暑', pinyin: 'Chǔshǔ' },
  { key: 'term.jq.bailu', zh: '白露', en: 'White Dew', zhHant: '白露', pinyin: 'Báilù' },
  { key: 'term.jq.qiufen', zh: '秋分', en: 'Autumn Equinox', zhHant: '秋分', pinyin: 'Qiūfēn' },
  { key: 'term.jq.hanlu', zh: '寒露', en: 'Cold Dew', zhHant: '寒露', pinyin: 'Hánlù' },
  { key: 'term.jq.shuangjiang', zh: '霜降', zhHant: '霜降', en: "Frost's Descent", pinyin: 'Shuāngjiàng' },
  { key: 'term.jq.lidong', zh: '立冬', en: 'Start of Winter', zhHant: '立冬', pinyin: 'Lìdōng' },
  { key: 'term.jq.xiaoxue', zh: '小雪', en: 'Minor Snow', zhHant: '小雪', pinyin: 'Xiǎoxuě' },
  { key: 'term.jq.daxue', zh: '大雪', en: 'Major Snow', zhHant: '大雪', pinyin: 'Dàxuě' },
  { key: 'term.jq.dongzhi', zh: '冬至', en: 'Winter Solstice', zhHant: '冬至', pinyin: 'Dōngzhì' },

  // ---------- 坐向 sit（8） ----------
  { key: 'term.sit.ziwu', zh: '正南', en: 'Due south', zhHant: '正南', pinyin: 'Zhèngnán' },
  { key: 'term.sit.wuzi', zh: '正北', en: 'Due north', zhHant: '正北', pinyin: 'Zhèngběi' },
  { key: 'term.sit.maoyou', zh: '正西', en: 'Due west', zhHant: '正西', pinyin: 'Zhèngxī' },
  { key: 'term.sit.youmao', zh: '正东', en: 'Due east', zhHant: '正東', pinyin: 'Zhèngdōng' },
  { key: 'term.sit.genkun', zh: '西南', en: 'Southwest', zhHant: '西南', pinyin: 'Xīnán' },
  { key: 'term.sit.kungen', zh: '东北', en: 'Northeast', zhHant: '東北', pinyin: 'Dōngběi' },
  { key: 'term.sit.xunqian', zh: '西北', en: 'Northwest', zhHant: '西北', pinyin: 'Xīběi' },
  { key: 'term.sit.qianxun', zh: '东南', en: 'Southeast', zhHant: '東南', pinyin: 'Dōngnán' },

  // ---------- 业态 ind（12） ----------
  { key: 'term.ind.catering', zh: '餐饮', en: 'Catering & dining', zhHant: '餐飲' },
  { key: 'term.ind.retail', zh: '零售', en: 'Retail', zhHant: '零售' },
  { key: 'term.ind.medical', zh: '医疗', en: 'Healthcare', zhHant: '醫療' },
  { key: 'term.ind.education', zh: '教育培训', en: 'Education & training', zhHant: '教育培訓' },
  { key: 'term.ind.construction', zh: '建筑工程', en: 'Construction & engineering', zhHant: '建築工程' },
  { key: 'term.ind.realestate', zh: '房地产', en: 'Real estate', zhHant: '房地產' },
  { key: 'term.ind.manufacturing', zh: '制造业', en: 'Manufacturing', zhHant: '製造業' },
  { key: 'term.ind.logistics', zh: '交通物流', en: 'Transport & logistics', zhHant: '交通物流' },
  { key: 'term.ind.finance', zh: '金融', en: 'Finance', zhHant: '金融' },
  { key: 'term.ind.media', zh: '文化传媒', en: 'Culture & media', zhHant: '文化傳媒' },
  { key: 'term.ind.jewelry', zh: '珠宝', en: 'Jewelry', zhHant: '珠寶' },
  { key: 'term.ind.agriculture', zh: '农林牧渔', en: 'Agriculture, forestry & fishing', zhHant: '農林牧漁' },

  // ---------- 行业门类 indcat（11） ----------
  { key: 'term.indcat.zhusuo', zh: '住宿和餐饮业', en: 'Accommodation & food services', zhHant: '住宿和餐飲業' },
  { key: 'term.indcat.pifa', zh: '批发和零售业', en: 'Wholesale & retail trade', zhHant: '批發和零售業' },
  { key: 'term.indcat.weisheng', zh: '卫生和社会工作', en: 'Health & social work', zhHant: '衛生和社會工作' },
  { key: 'term.indcat.jiaoyu', zh: '教育', en: 'Education', zhHant: '教育' },
  { key: 'term.indcat.jianzhuye', zh: '建筑业', en: 'Construction', zhHant: '建築業' },
  { key: 'term.indcat.fangdichan', zh: '房地产业', en: 'Real estate', zhHant: '房地產業' },
  { key: 'term.indcat.zhizao', zh: '制造业', en: 'Manufacturing', zhHant: '製造業' },
  { key: 'term.indcat.jiaotong', zh: '交通运输、仓储和邮政业', en: 'Transport, storage & postal services', zhHant: '交通運輸、倉儲和郵政業' },
  { key: 'term.indcat.jinrong', zh: '金融业', en: 'Financial services', zhHant: '金融業' },
  { key: 'term.indcat.wenhua', zh: '文化、体育和娱乐业', en: 'Culture, sports & entertainment', zhHant: '文化、體育和娛樂業' },
  { key: 'term.indcat.nonglin', zh: '农、林、牧、渔业', en: 'Agriculture, forestry, husbandry & fishing', zhHant: '農、林、牧、漁業' },

  // ---------- 用事 ev（18） ----------
  { key: 'term.ev.open', zh: '开业开市', en: 'Opening for business', zhHant: '開業開市' },
  { key: 'term.ev.sign', zh: '签约定盟', en: 'Signing & agreements', zhHant: '簽約定盟' },
  { key: 'term.ev.account', zh: '开户立账', en: 'Opening accounts', zhHant: '開戶立賬' },
  { key: 'term.ev.launch', zh: '发布上市', en: 'Launch & listing', zhHant: '發布上市' },
  { key: 'term.ev.recruit', zh: '招聘入职', en: 'Hiring & onboarding', zhHant: '招聘入職' },
  { key: 'term.ev.expo', zh: '展会参展', en: 'Trade fairs', zhHant: '展會參展' },
  { key: 'term.ev.office', zh: '乔迁新址', en: 'Office relocation', zhHant: '喬遷新址' },
  { key: 'term.ev.close', zh: '结业交割', en: 'Closing & delivery', zhHant: '結業交割' },
  { key: 'term.ev.ground', zh: '破土动工', en: 'Groundbreaking', zhHant: '破土動工' },
  { key: 'term.ev.beam', zh: '上梁立柱', en: 'Beam setting', zhHant: '上梁立柱' },
  { key: 'term.ev.fitout', zh: '装修进场', en: 'Fit-out', zhHant: '裝修進場' },
  { key: 'term.ev.marry', zh: '嫁娶结婚', en: 'Marriage', zhHant: '嫁娶結婚' },
  { key: 'term.ev.engage', zh: '订婚纳采', en: 'Engagement', zhHant: '訂婚納采' },
  { key: 'term.ev.cert', zh: '登记领证', en: 'Registry & certificates', zhHant: '登記領證' },
  { key: 'term.ev.move', zh: '入宅迁居', en: 'Moving in', zhHant: '入宅遷居' },
  { key: 'term.ev.birth', zh: '生产分娩', en: 'Childbirth', zhHant: '生產分娩' },
  { key: 'term.ev.full', zh: '满月抓周', en: 'Full month', zhHant: '滿月抓週' },
  { key: 'term.ev.rite', zh: '寿诞祭祀', en: 'Birthdays & rites', zhHant: '壽誕祭祀' },

  // ---------- 取用核心 core（6） ----------
  { key: 'term.core.wuxing', zh: '行业属性', en: 'Industry attribute', zhHant: '行業屬性', pinyin: 'Hángyè shǔxìng', note: '按行业门类归入木火土金水五类，用于取用对照' },
  { key: 'term.core.taijing', zh: '当年地支', en: 'Year branch', zhHant: '當年地支', pinyin: 'Dāngnián dìzhī', note: '与出生年地支相同的年份；旧时通书列为需要留意的年份' },
  { key: 'term.core.marry', zh: '传统婚月', en: 'Traditional marriage months', zhHant: '傳統婚月', pinyin: 'Chuántǒng hūnyuè', note: '传统婚期月；婚嫁取用之纲' },
  { key: 'term.core.chongming', zh: '日辰冲年', en: 'Day clashing a birth year', zhHant: '日辰沖年', pinyin: 'Rìchén chōng nián', note: '日支与出生年相冲，硬排除项' },
  { key: 'term.core.shanxiang', zh: '朝向', en: 'Orientation', zhHant: '朝向', pinyin: 'Cháoxiàng', note: '宅院正面所对方向；工程类条目取用' },
  { key: 'term.core.sit', zh: '坐向', en: 'Sitting & facing', zhHant: '坐向', pinyin: 'Zuòxiàng', note: '宅院背面与正面所指方向' },

  // ---------- 知库门类 kbcat（13） ----------
  { key: 'term.kbcat.all', zh: '全部', en: 'All', zhHant: '全部' },
  { key: 'term.kbcat.xueli', zh: '学历教育', en: 'Schooling', zhHant: '學歷教育' },
  { key: 'term.kbcat.hunjia', zh: '婚嫁', en: 'Weddings', zhHant: '婚嫁' },
  { key: 'term.kbcat.canyin', zh: '餐饮', en: 'Catering', zhHant: '餐飲' },
  { key: 'term.kbcat.lingshou', zh: '零售', en: 'Retail', zhHant: '零售' },
  { key: 'term.kbcat.yimei', zh: '医美', en: 'Beauty & wellness', zhHant: '醫美' },
  { key: 'term.kbcat.jiaoyu', zh: '教育培训', en: 'Education & training', zhHant: '教育培訓' },
  { key: 'term.kbcat.gongcheng', zh: '工程', en: 'Engineering', zhHant: '工程' },
  { key: 'term.kbcat.zhizao', zh: '制造', en: 'Manufacturing', zhHant: '製造' },
  { key: 'term.kbcat.wuliu', zh: '物流', en: 'Logistics', zhHant: '物流' },
  { key: 'term.kbcat.jinrong', zh: '金融', en: 'Finance', zhHant: '金融' },
  { key: 'term.kbcat.chuanmei', zh: '传媒', en: 'Media', zhHant: '傳媒' },
  { key: 'term.kbcat.dianji', zh: '电竞', en: 'Esports', zhHant: '電競' },

  // ---------- 书目门类 bookcat（17） ----------
  { key: 'term.bookcat.zonggang', zh: '总纲 · 历法通论', en: 'General principles', zhHant: '總綱 · 曆法通論' },
  { key: 'term.bookcat.lifa', zh: '历法 · 节气历算', en: 'Calendrics', zhHant: '曆法 · 節氣曆算' },
  { key: 'term.bookcat.tongshu', zh: '通书 · 历法通书', en: 'Almanacs', zhHant: '通書 · 曆法通書' },
  { key: 'term.bookcat.yaojue', zh: '要诀 · 历法口诀', en: 'Key methods', zhHant: '要訣 · 曆法口訣' },
  { key: 'term.bookcat.mingli', zh: '历法 · 干支纪年', en: 'Sexagenary cycle', zhHant: '曆法 · 干支紀年' },
  { key: 'term.bookcat.canyin', zh: '饮膳 · 餐饮', en: 'Culinary', zhHant: '飲膳 · 餐飲' },
  { key: 'term.bookcat.shangmao', zh: '商贸 · 经商', en: 'Commerce', zhHant: '商貿 · 經商' },
  { key: 'term.bookcat.jianzhu', zh: '建筑 · 营造', en: 'Architecture', zhHant: '建築 · 營造' },
  { key: 'term.bookcat.zhaiye', zh: '宅业 · 阳宅', en: 'Dwellings & trade sites', zhHant: '宅業 · 陽宅' },
  { key: 'term.bookcat.jiaoyu', zh: '教育 · 文运', en: 'Education', zhHant: '教育 · 文運' },
  { key: 'term.bookcat.zhizao', zh: '制造 · 百工', en: 'Crafts', zhHant: '製造 · 百工' },
  { key: 'term.bookcat.nonglin', zh: '农林 · 农时', en: 'Farming', zhHant: '農林 · 農時' },
  { key: 'term.bookcat.jinrong', zh: '金融 · 钱法', en: 'Finance', zhHant: '金融 · 錢法' },
  { key: 'term.bookcat.yimei', zh: '医美 · 保养', en: 'Wellness', zhHant: '醫美 · 保養' },
  { key: 'term.bookcat.zhubao', zh: '珠宝 · 首饰', en: 'Jewelry', zhHant: '珠寶 · 首飾' },
  { key: 'term.bookcat.zhuanjing', zh: '专著 · 专题', en: 'Monographs', zhHant: '專著 · 專題' },
  { key: 'term.bookcat.minsu', zh: '民俗 · 风俗', en: 'Folklore', zhHant: '民俗 · 風俗' },
  { key: 'term.bookcat.lizhi', zh: '励志 · 商道', en: 'Business ethos', zhHant: '勵志 · 商道' },

  // ---------- 宗派 school（3） ----------
  { key: 'term.school.xingjia', zh: '婚月派', en: 'Marriage-month school', zhHant: '婚月派', pinyin: 'Hūnyuè pài' },
  { key: 'term.school.bujiang', zh: '不将日派', en: 'Bu-jiang day school', zhHant: '不將日派', pinyin: 'Bùjiāng pài' },
  { key: 'term.school.jianchu', zh: '建除派', en: 'Jian-chu school', zhHant: '建除派', pinyin: 'Jiànchú pài' },
] as const;

/** 术语 key 联合类型（自本表派生，单一事实源） */
export type TermKey = (typeof GLOSSARY)[number]['key'];

const BY_KEY: Record<string, GlossaryEntry> = {};
for (const entry of GLOSSARY) {
  BY_KEY[entry.key] = entry;
}

/** 取术语条目；未命中返回 undefined（调用方应兜底） */
export function termOf(key: string): GlossaryEntry | undefined {
  return BY_KEY[key];
}

/** 取术语译名；未命中回退到 key 本身（开发期可暴露漏译） */
export function termText(key: string, lang: Lang): string {
  const entry = BY_KEY[key];
  if (!entry) return key;
  if (lang === 'en') return entry.en;
  if (lang === 'zh-Hant') return entry.zhHant;
  return entry.zh;
}

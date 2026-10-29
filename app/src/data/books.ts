/**
 * data/books.ts — 25+ 部典籍索引（历法总纲 + 行业专书）。
 * 书目保留中文原名（PRD §2.2：音译 + 英译注），类别走术语表。
 */

import type { L10n, TermKey } from '../engine/types';

const l = (zh: string, en: string, zhHant: string): L10n => ({ zh, en, zhHant });

export interface BookDef {
  id: string;
  /** 书目原名（中文，保留不译） */
  title: string;
  /** 拼音 / 英译注 */
  pinyin: string;
  en: string;
  author: L10n;
  category: TermKey;
  desc: L10n;
}

export const BOOKS: BookDef[] = [
  {
    id: 'xiejibianfang',
    title: '《协纪辨方书》',
    pinyin: 'Xieji Bianfang Shu',
    en: 'Treatise on Harmonizing Times and Distinguishing Directions',
    author: l('清 · 允禄等奉敕撰', 'Qing dynasty, commissioned under Yunlu', '清 · 允祿等奉敕撰'),
    category: 'term.bookcat.zonggang',
    desc: l(
      '三十六卷，四库全书所收历法第一书。本产品的传统条目取用、建除、天德月德口径均以此为准。',
      'Thirty-six volumes — the foremost Qing-era treatise on date selection. This product\'s deity, Jianchu, and virtue rules follow it.',
      '三十六卷，四庫全書所收曆法第一書。本產品的傳統條目取用、建除、天德月德口徑均以此為準。',
    ),
  },
  {
    id: 'xiangji',
    title: '《象吉通书》',
    pinyin: 'Xiangji Tongshu',
    en: 'Xiangji Almanac',
    author: l('清 · 魏鉴', 'Qing dynasty, Wei Jian', '清 · 魏鑑'),
    category: 'term.bookcat.tongshu',
    desc: l(
      '民间通行最广的通书之一，月表与当日断语多出于此。',
      'One of the most widely circulated almanacs; its monthly tables and day-chart verdicts are widely quoted.',
      '民間通行最廣的通書之一，月表與日課斷語多出於此。',
    ),
  },
  {
    id: 'aotou',
    title: '《鳌头通书》',
    pinyin: 'Aotou Tongshu',
    en: 'Aotou Almanac',
    author: l('清 · 熊宗立', 'Qing dynasty, Xiong Zongli', '清 · 熊宗立'),
    category: 'term.bookcat.tongshu',
    desc: l(
      '大全类通书，含逐日宜忌与造葬条目，适合查具体事类。',
      'A comprehensive almanac with day-by-day entries and burial chapters — useful for specific occasions.',
      '大全類通書，含逐日宜忌與造葬條目，適合查具體事類。',
    ),
  },
  {
    id: 'kezexuanji',
    title: '《克择璇玑经》',
    pinyin: 'Kezhe Xuanji Jing',
    en: 'Classic of Selection and the Jade Sphere',
    author: l('传 · 晋 · 郭璞', 'Attributed to Guo Pu, Jin dynasty', '傳 · 晉 · 郭璞'),
    category: 'term.bookcat.zhuanjing',
    desc: l(
      '传统历法专经，重营造择时与方位。',
      'A specialist classic on date selection, emphasizing life-mending and supporting the dragon and mountain.',
      '傳統曆法專經，重營造擇時與方位。',
    ),
  },
  {
    id: 'xuanzejing',
    title: '《选择宗镜》',
    pinyin: 'Xuanze Zongjing',
    en: 'Mirror of Selection',
    author: l('明 · 万民英', 'Ming dynasty, Wan Minying', '明 · 萬民英'),
    category: 'term.bookcat.zhuanjing',
    desc: l(
      '以「造命」为纲，主张当日可补命之不足。',
      'Takes "shaping the fate" as its thread: a day-chart can supplement what the birth chart lacks.',
      '以「造命」為綱，主張日課可補命之不足。',
    ),
  },
  {
    id: 'xinglikaoyuan',
    title: '《星历考原》',
    pinyin: 'Xingli Kaoyuan',
    en: 'Investigation of Star Calendars',
    author: l('清 · 李光地', 'Qing dynasty, Li Guangdi', '清 · 李光地'),
    category: 'term.bookcat.lifa',
    desc: l(
      '考订星历源流，是理解「节气月与农历月」错位的关键文献。',
      'The key text for understanding the offset between solar-term months and lunar months.',
      '考訂星曆源流，是理解「節氣月與農曆月」錯位的關鍵文獻。',
    ),
  },
  {
    id: 'yuxianji',
    title: '《玉匣记》',
    pinyin: 'Yuxia Ji',
    en: 'Jade-Casket Notes',
    author: l('传 · 许真君', 'Attributed to Xu Xun', '傳 · 許真君'),
    category: 'term.bookcat.minsu',
    desc: l(
      '民俗宜忌汇编，多用于日常小事，专业历法参考仅作参照。',
      'A folk compilation of daily taboos; professional selection treats it as reference only.',
      '民俗宜忌匯編，多用於日常小事，專業曆法參考僅作參照。',
    ),
  },
  {
    id: 'donggong',
    title: '《董公历法要览》',
    pinyin: 'Donggong Zeri Yaolan',
    en: 'Dong\'s Compendium of Date Selection',
    author: l('清 · 董德彰', 'Qing dynasty, Dong Dezhang', '清 · 董德彰'),
    category: 'term.bookcat.yaojue',
    desc: l(
      '以简驭繁的历法口诀体系，民间流传极广。',
      'A mnemonic system that reduces calendar reading to essentials — extremely popular in folk practice.',
      '以簡馭繁的曆法口訣體系，民間流傳極廣。',
    ),
  },
  {
    id: 'sanming',
    title: '《三命通会》',
    pinyin: 'Sanming Tonghui',
    en: 'Comprehensive Treatise on the Three Fates',
    author: l('明 · 万民英', 'Ming dynasty, Wan Minying', '明 · 萬民英'),
    category: 'term.bookcat.mingli',
    desc: l(
      '干支历法总集，用于定当事人出生年与用神。',
      'The comprehensive collection of Four-Pillars theory, used to fix the principal\'s year branch and useful spirits.',
      '干支曆法總集，用於定當事人出生年與用神。',
    ),
  },
  {
    id: 'yuanhai',
    title: '《渊海子平》',
    pinyin: 'Yuanhai Ziping',
    en: 'Deep Sea of Ziping',
    author: l('宋 · 徐升', 'Song dynasty, Xu Sheng', '宋 · 徐昇'),
    category: 'term.bookcat.mingli',
    desc: l(
      '子平术奠基之作，出生年与日主旺衰取法于此。',
      'The founding text of Ziping methodology: year-branch and day-master strength are derived here.',
      '子平術奠基之作，出生年與日主旺衰取法於此。',
    ),
  },
  {
    id: 'yingzaofashi',
    title: '《营造法式》',
    pinyin: 'Yingzao Fashi',
    en: 'Treatise on Architectural Methods',
    author: l('宋 · 李诫', 'Song dynasty, Li Jie', '宋 · 李誡'),
    category: 'term.bookcat.jianzhu',
    desc: l(
      '古代建筑营造规范，动土、上梁的工序与时序依据。',
      'The Song building code: sequence and timing for groundbreaking and beam-setting.',
      '古代建築營造規範，動土、上梁的工序與時序依據。',
    ),
  },
  {
    id: 'lubanjing',
    title: '《鲁班经匠家镜》',
    pinyin: 'Luban Jing Jiangjia Jing',
    en: 'Lu Ban\'s Mirror for Craftsmen',
    author: l('明 · 午荣编', 'Ming dynasty, compiled by Wu Rong', '明 · 午榮編'),
    category: 'term.bookcat.jianzhu',
    desc: l(
      '匠家历法与尺寸法度，上梁、安门、起造的专门依据。',
      'The craftsman\'s standard for dates and measurements — the authority for beams, gates, and foundations.',
      '匠家曆法與尺寸法度，上梁、安門、起造的專門依據。',
    ),
  },
  {
    id: 'yangzhai',
    title: '《阳宅十书》',
    pinyin: 'Yangzhai Shishu',
    en: 'Ten Books on Yang Dwellings',
    author: l('明 · 王君荣', 'Ming dynasty, Wang Junrong', '明 · 王君榮'),
    category: 'term.bookcat.zhaiye',
    desc: l(
      '阳宅形法与坐向宜忌，房地产与门店选址的方位依据。',
      'Form and orientation for yang dwellings — the directional basis for property and store siting.',
      '陽宅形法與坐向宜忌，房地產與門店選址的方位依據。',
    ),
  },
  {
    id: 'yuanye',
    title: '《园冶》',
    pinyin: 'Yuan Ye',
    en: 'The Craft of Gardens',
    author: l('明 · 计成', 'Ming dynasty, Ji Cheng', '明 · 計成'),
    category: 'term.bookcat.zhaiye',
    desc: l(
      '造园与空间经营之书，用于门店动线与门向。',
      'On gardens and the management of space — applied to store circulation and door facing.',
      '造園與空間經營之書，用於門店動線與門向。',
    ),
  },
  {
    id: 'tiangong',
    title: '《天工开物》',
    pinyin: 'Tiangong Kaiwu',
    en: 'The Creations of Nature and Man',
    author: l('明 · 宋应星', 'Ming dynasty, Song Yingxing', '明 · 宋應星'),
    category: 'term.bookcat.zhizao',
    desc: l(
      '百工技艺总录，开炉、试机、首件的工序与节气关系。',
      'The encyclopedia of crafts: sequence and solar-term timing for furnaces, trials, and first units.',
      '百工技藝總錄，開爐、試機、首件的工序與節氣關係。',
    ),
  },
  {
    id: 'kaogongji',
    title: '《考工记》',
    pinyin: 'Kaogong Ji',
    en: 'Records of Examining Crafts',
    author: l('先秦 · 佚名', 'Pre-Qin, anonymous', '先秦 · 佚名'),
    category: 'term.bookcat.zhizao',
    desc: l(
      '百工之祖，器作成败的天时与材性论述。',
      'The ancestor of craft texts: on timing and material character in the success of a piece.',
      '百工之祖，器作成敗的天時與材性論述。',
    ),
  },
  {
    id: 'yinshan',
    title: '《饮膳正要》',
    pinyin: 'Yinshan Zhengyao',
    en: 'Principles of Correct Diet',
    author: l('元 · 忽思慧', 'Yuan dynasty, Hu Sihui', '元 · 忽思慧'),
    category: 'term.bookcat.canyin',
    desc: l(
      '宫廷饮膳与食疗，餐饮业态的时令与火候依据。',
      'Imperial diet and dietetics: the seasonal and heat-control basis for the dining trade.',
      '宮廷飲膳與食療，餐飲業態的時令與火候依據。',
    ),
  },
  {
    id: 'suiyuan',
    title: '《随园食单》',
    pinyin: 'Suiyuan Shidan',
    en: 'Suiyuan Menu',
    author: l('清 · 袁枚', 'Qing dynasty, Yuan Mei', '清 · 袁枚'),
    category: 'term.bookcat.canyin',
    desc: l(
      '饮食之道的经典，用于餐饮开市的「鲜」「时」二字。',
      'The classic of gastronomy: freshness and seasonality for a dining opening.',
      '飲食之道的經典，用於餐飲開市的「鮮」「時」二字。',
    ),
  },
  {
    id: 'huangdi',
    title: '《黄帝内经·素问》',
    pinyin: 'Huangdi Neijing · Suwen',
    en: 'Yellow Emperor\'s Inner Canon · Basic Questions',
    author: l('先秦 · 佚名', 'Pre-Qin, anonymous', '先秦 · 佚名'),
    category: 'term.bookcat.yimei',
    desc: l(
      '四气调神与生气通天，医美健康业态的时序依据。',
      'On aligning with the four qi and the vitality that permeates heaven — the timing basis for health services.',
      '四氣調神與生氣通天，醫美健康業態的時序依據。',
    ),
  },
  {
    id: 'yizong',
    title: '《医宗金鉴》',
    pinyin: 'Yizong Jinjian',
    en: 'Golden Mirror of the Medical Lineage',
    author: l('清 · 吴谦等', 'Qing dynasty, Wu Qian et al.', '清 · 吳謙等'),
    category: 'term.bookcat.yimei',
    desc: l(
      '官修医书，针灸与外科时序取法于此。',
      'The official Qing medical compendium: timing for acupuncture and surgery.',
      '官修醫書，針灸與外科時序取法於此。',
    ),
  },
  {
    id: 'xueji',
    title: '《学记》',
    pinyin: 'Xueji',
    en: 'On Teaching and Learning',
    author: l('礼记 · 篇名', 'A chapter of the Book of Rites', '禮記 · 篇名'),
    category: 'term.bookcat.jiaoyu',
    desc: l(
      '教学之序，用于教培业态的开课与分期。',
      'On the order of teaching: openings and term staging for education.',
      '教學之序，用於教培業態的開課與分期。',
    ),
  },
  {
    id: 'zhuzi',
    title: '《朱子家礼》',
    pinyin: 'Zhuzi Jiali',
    en: 'Master Zhu\'s Family Rituals',
    author: l('宋 · 朱熹', 'Song dynasty, Zhu Xi', '宋 · 朱熹'),
    category: 'term.bookcat.lizhi',
    desc: l(
      '冠婚丧祭四礼程式，家庭历法参考的礼仪时序依据。',
      'The four family rites — capping, wedding, funeral, sacrifice — and their timing.',
      '冠婚喪祭四禮程式，家庭曆法參考的禮儀時序依據。',
    ),
  },
  {
    id: 'yili',
    title: '《仪礼·士昏礼》',
    pinyin: 'Yili · Shihunli',
    en: 'Ceremonies and Rites · The Officer\'s Wedding',
    author: l('先秦 · 佚名', 'Pre-Qin, anonymous', '先秦 · 佚名'),
    category: 'term.bookcat.lizhi',
    desc: l(
      '嫁娶六礼的最早完整记载，纳采、问名、亲迎各有其时。',
      'The earliest complete record of the six wedding rites, each with its proper time.',
      '嫁娶六禮的最早完整記載，納采、問名、親迎各有其時。',
    ),
  },
  {
    id: 'qimin',
    title: '《齐民要术》',
    pinyin: 'Qimin Yaoshu',
    en: 'Essential Techniques for the People',
    author: l('北魏 · 贾思勰', 'Northern Wei, Jia Sixie', '北魏 · 賈思勰'),
    category: 'term.bookcat.nonglin',
    desc: l(
      '农事与物候，农林牧渔业态须合七十二候。',
      'Farming and phenology: agriculture must align with the seventy-two pentads.',
      '農事與物候，農林牧漁業態須合七十二候。',
    ),
  },
  {
    id: 'guanzi',
    title: '《管子·轻重》',
    pinyin: 'Guanzi · Qingzhong',
    en: 'Guanzi · Light and Heavy',
    author: l('先秦 · 管仲学派', 'Pre-Qin, Guan Zhong school', '先秦 · 管仲學派'),
    category: 'term.bookcat.shangmao',
    desc: l(
      '轻重之术与货殖时序，商贸物流业态的经营节奏依据。',
      'On balancing and trade timing — the operating rhythm for commerce and logistics.',
      '輕重之術與貨殖時序，商貿物流業態的經營節奏依據。',
    ),
  },
  {
    id: 'gegu',
    title: '《格古要论》',
    pinyin: 'Gegu Yaolun',
    en: 'Essential Discourses on Antiques',
    author: l('明 · 曹昭', 'Ming dynasty, Cao Zhao', '明 · 曹昭'),
    category: 'term.bookcat.zhubao',
    desc: l(
      '古物珠宝鉴别与藏显之道，珠宝业态的展陈依据。',
      'On authenticating and displaying valuables — the display basis for jewelry.',
      '古物珠寶鑑別與藏顯之道，珠寶業態的展陳依據。',
    ),
  },
];

/** 行业专书 = 总纲之外的部数（知库页统计用） */
export const BOOKS_ZONGGANG_COUNT = BOOKS.filter((b) => b.category === 'term.bookcat.zonggang').length;

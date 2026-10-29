/**
 * data/industries.ts — 12 业态（按国民经济行业门类 + 五行取用）。
 * 名称与所属门类走术语表；细分 / 关键动作 / 业态要点为双语长文（L10n）。
 * 行业门类代码字母不进界面（PRD v3.5 §12.5），界面用门类名。
 */

import type { Industry, L10n } from '../engine/types';

const l = (zh: string, en: string, zhHant: string): L10n => ({ zh, en, zhHant });

export const INDUSTRIES: Industry[] = [
  {
    id: 'catering',
    name: 'term.ind.catering',
    category: 'term.indcat.zhusuo',
    wuxing: 1,
    subs: l('正餐 / 茶饮 / 烘焙 / 团餐', 'Full-service / tea / bakery / group dining', '正餐 / 茶飲 / 烘焙 / 團餐'),
    acts: [
      l('开炉点火', 'Light the stove', '開爐點火'),
      l('挂招牌', 'Hang the signboard', '掛招牌'),
      l('首位客人', 'First guest', '首位客人'),
    ],
    books: ['《饮膳正要》', '《随园食单》'],
    note: l(
      '灶火为业之根，开炉一刻即「开市」，重火德与厨位坐向。',
      'The stove fire is the root of the trade: lighting it is the opening. Fire virtue and the kitchen orientation lead.',
      '灶火為業之根，開爐一刻即「開市」，重火德與廚位坐向。',
    ),
  },
  {
    id: 'retail',
    name: 'term.ind.retail',
    category: 'term.indcat.pifa',
    wuxing: 2,
    subs: l('服饰 / 数码 / 便利 / 免税', 'Apparel / electronics / convenience / duty-free', '服飾 / 數碼 / 便利 / 免稅'),
    acts: [
      l('开门迎客', 'Open the doors', '開門迎客'),
      l('上首批货', 'Stock the first batch', '上首批貨'),
      l('首单成交', 'First sale closed', '首單成交'),
    ],
    books: ['《天工开物·乃服》', '《考工记》'],
    note: l(
      '货殖之业重「聚」，门向与收银位为要，忌开日冲库。',
      'Trade gathers: the door facing and the till position matter. Avoid store-clash on Open days.',
      '貨殖之業重「聚」，門向與收銀位為要，忌開日沖庫。',
    ),
  },
  {
    id: 'medical',
    name: 'term.ind.medical',
    category: 'term.indcat.weisheng',
    wuxing: 0,
    subs: l('医美 / 口腔 / 中医馆 / 康养', 'Aesthetics / dental / TCM / wellness', '醫美 / 口腔 / 中醫館 / 康養'),
    acts: [
      l('揭牌', 'Unveil the plaque', '揭牌'),
      l('开诊', 'Open the clinic', '開診'),
      l('首诊接待', 'First patient', '首診接待'),
    ],
    books: ['《黄帝内经·素问》', '《医宗金鉴》'],
    note: l(
      '医者属木主生，重「生气」与洁净，忌月厌、节气交界日。',
      'Medicine belongs to Wood and governs life: vitality and cleanliness lead. Avoid month-avoidance days and solar-term boundaries.',
      '醫者屬木主生，重「生氣」與潔淨，忌月厭、節氣交界日。',
    ),
  },
  {
    id: 'education',
    name: 'term.ind.education',
    category: 'term.indcat.jiaoyu',
    wuxing: 0,
    subs: l('教培 / 职教 / 托育 / 研学', 'Tutoring / vocational / childcare / study tours', '教培 / 職教 / 托育 / 研學'),
    acts: [
      l('揭牌', 'Unveil the plaque', '揭牌'),
      l('开课', 'First class', '開課'),
      l('首堂课', 'Opening lesson', '首堂課'),
    ],
    books: ['《学记》', '《朱子家礼》'],
    note: l(
      '文教属木，重「启」与「序」，开日、成日为佳。',
      'Education belongs to Wood: commencement and sequence lead. Open and Complete days are preferred.',
      '文教屬木，重「啟」與「序」，開日、成日為佳。',
    ),
  },
  {
    id: 'construction',
    name: 'term.ind.construction',
    category: 'term.indcat.jianzhuye',
    wuxing: 2,
    subs: l('装饰 / 施工 / 建材 / 幕墙', 'Fit-out / contracting / materials / curtain wall', '裝飾 / 施工 / 建材 / 幕牆'),
    acts: [l('破土', 'Break ground', '破土'), l('奠基', 'Lay the foundation', '奠基'), l('首锤', 'First strike', '首錘')],
    books: ['《营造法式》', '《鲁班经匠家镜》'],
    note: l(
      '土木之业重方位，传统年向条目不可动，朝向须合场地条件。',
      'Earthworks are about direction: avoid the traditional year-direction entries; the orientation should suit the site.',
      '土木之業重方位，傳統年向條目不可動，朝向須合場地條件。',
    ),
  },
  {
    id: 'realestate',
    name: 'term.ind.realestate',
    category: 'term.indcat.fangdichan',
    wuxing: 2,
    subs: l('开发 / 中介 / 物业 / 长租', 'Development / agency / property / long-lease', '開發 / 中介 / 物業 / 長租'),
    acts: [l('开盘', 'Launch sales', '開盤'), l('交付', 'Hand over', '交付'), l('入伙', 'Move-in', '入伙')],
    books: ['《阳宅十书》', '《园冶》'],
    note: l(
      '宅业重「向」，开盘取生旺之向，交付取定日、成日。',
      'Property is about facing: launch toward the vital direction; deliver on Stability or Completion days.',
      '宅業重「向」，開盤取生旺之向，交付取定日、成日。',
    ),
  },
  {
    id: 'manufacturing',
    name: 'term.ind.manufacturing',
    category: 'term.indcat.zhizao',
    wuxing: 3,
    subs: l('五金 / 电子 / 食品加工 / 新材', 'Hardware / electronics / food processing / new materials', '五金 / 電子 / 食品加工 / 新材'),
    acts: [l('开炉', 'Fire the furnace', '開爐'), l('试机', 'Trial run', '試機'), l('首件下线', 'First unit off the line', '首件下線')],
    books: ['《天工开物》', '《考工记》'],
    note: l(
      '金工之业重「器成」，成日、开日为宜，忌破日动炉。',
      'Metalwork is about finished goods: Completion and Open days suit the furnace; never fire up on a Break day.',
      '金工之業重「器成」，成日、開日為宜，忌破日動爐。',
    ),
  },
  {
    id: 'logistics',
    name: 'term.ind.logistics',
    category: 'term.indcat.jiaotong',
    wuxing: 4,
    subs: l('快递 / 冷链 / 货运 / 跨境仓', 'Parcel / cold chain / freight / cross-border warehouse', '快遞 / 冷鏈 / 貨運 / 跨境倉'),
    acts: [l('发车', 'First dispatch', '發車'), l('开仓', 'Open the warehouse', '開倉'), l('首单出库', 'First outbound order', '首單出庫')],
    books: ['《史记·货殖列传》', '《管子·轻重》'],
    note: l(
      '流通属水主行，重「动」与「通」，开日、除日为宜。',
      'Distribution belongs to Water and governs movement: Open and Remove days suit dispatch.',
      '流通屬水主行，重「動」與「通」，開日、除日為宜。',
    ),
  },
  {
    id: 'finance',
    name: 'term.ind.finance',
    category: 'term.indcat.jinrong',
    wuxing: 3,
    subs: l('银行 / 保险 / 证券 / 支付', 'Banking / insurance / securities / payments', '銀行 / 保險 / 證券 / 支付'),
    acts: [l('开账', 'Open the books', '開賬'), l('首笔交易', 'First transaction', '首筆交易'), l('挂牌', 'List the plaque', '掛牌')],
    books: ['《管子·轻重》', '《史记·平准书》'],
    note: l(
      '金部重「信」与「守」，定日、成日为宜，忌破日开账。',
      'Finance governs trust and custody: Stability and Completion days suit the books; never open accounts on a Break day.',
      '金部重「信」與「守」，定日、成日為宜，忌破日開賬。',
    ),
  },
  {
    id: 'media',
    name: 'term.ind.media',
    category: 'term.indcat.wenhua',
    wuxing: 1,
    subs: l('直播 / 短视频 / 设计 / 影视', 'Livestream / short video / design / film', '直播 / 短視頻 / 設計 / 影視'),
    acts: [l('上线', 'Go live', '上線'), l('首播', 'First broadcast', '首播'), l('首发推送', 'First push', '首發推送')],
    books: ['《文心雕龙》', '《历代名画记》'],
    note: l(
      '声光之业属火主显，重「发」与「扬」，开日、成日为宜。',
      'Light and sound belong to Fire and govern visibility: Open and Completion days suit launches.',
      '聲光之業屬火主顯，重「發」與「揚」，開日、成日為宜。',
    ),
  },
  {
    id: 'jewelry',
    name: 'term.ind.jewelry',
    category: 'term.indcat.pifa',
    wuxing: 3,
    subs: l('珠宝 / 钟表 / 奢品 / 典当', 'Jewelry / watches / luxury / pawn', '珠寶 / 鐘錶 / 奢品 / 典當'),
    acts: [l('开柜', 'Open the case', '開櫃'), l('首售', 'First sale', '首售'), l('展陈亮灯', 'Light the display', '展陳亮燈')],
    books: ['《格古要论》', '《天工开物·珠玉》'],
    note: l(
      '珠玉属金主贵，重「藏」与「显」，忌月支相害、闭日开柜。',
      'Gems belong to Metal and govern value: concealment and display both matter. Avoid month-branch harm and Close days.',
      '珠玉屬金主貴，重「藏」與「顯」，忌月支相害、閉日開櫃。',
    ),
  },
  {
    id: 'agriculture',
    name: 'term.ind.agriculture',
    category: 'term.indcat.nonglin',
    wuxing: 0,
    subs: l('种植 / 养殖 / 农旅 / 花木', 'Crops / livestock / agri-tourism / nursery', '種植 / 養殖 / 農旅 / 花木'),
    acts: [l('开耕', 'First plowing', '開耕'), l('下种', 'Sowing', '下種'), l('开园', 'Open the grounds', '開園')],
    books: ['《齐民要术》', '《农政全书》'],
    note: l(
      '农事属木主长，重节气与物候，须合月建与七十二候。',
      'Farming belongs to Wood and governs growth: follow the solar terms and the seventy-two pentads, aligned with the month branch.',
      '農事屬木主長，重節氣與物候，須合月建與七十二候。',
    ),
  },
];

const IND_MAP = new Map(INDUSTRIES.map((i) => [i.id, i]));

export function industryById(id: string | undefined): Industry {
  if (id && IND_MAP.has(id)) return IND_MAP.get(id)!;
  return INDUSTRIES[0];
}

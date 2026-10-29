/**
 * data/events.ts — 18 用事四组（经营择日 / 工程择日 / 家庭择日 / 生命礼）。
 * 用事决定计分表：家庭 7 重、经营与工程 8 重；嫁娶订婚须双方。
 * 名称与取用核心走术语表（TermKey），描述与关键动作为双语长文（L10n）。
 */

import type { EventDef, EventGroup, Lang, L10n } from '../engine/types';

const l = (zh: string, en: string, zhHant: string): L10n => ({ zh, en, zhHant });

export const EVENT_GROUPS: EventGroup[] = ['经营择日', '工程择日', '家庭择日', '生命礼'];

export const GROUP_LABEL: Record<EventGroup, L10n> = {
  经营择日: l('商业与工作场景', 'Business & work', '商業與工作場景'),
  工程择日: l('建筑与装修场景', 'Building & renovation', '建築與裝修場景'),
  家庭择日: l('家庭与生活场景', 'Family & life', '家庭與生活場景'),
  生命礼: l('人生重要节点场景', 'Life milestones', '人生重要節點場景'),
};

/** 取分组显示名：EventGroup 内部 key 仅作标识符，界面一律走本表 */
export function groupText(group: EventGroup, lang: Lang): string {
  const g = GROUP_LABEL[group];
  if (!g) return group;
  return lang === 'en' ? g.en : lang === 'zh-Hant' ? g.zhHant : g.zh;
}

export const GROUP_DESC: Record<EventGroup, L10n> = {
  经营择日: l(
    '输入当事人出生年份参考，系统检索传统历法中商业开业、签约等场景的对应规则',
    "Enter the principal's birth year for reference; the system looks up traditional calendar rules for openings, signings and similar business scenarios.",
    '輸入當事人出生年份參考，系統檢索傳統曆法中商業開業、簽約等場景的對應規則',
  ),
  工程择日: l(
    '输入业主出生年份与建筑朝向，检索传统历法中破土、上梁、装修等场景的对应规则',
    "Enter the owner's birth year and the building's orientation; the system looks up traditional calendar rules for groundbreaking, beam-setting and fit-out.",
    '輸入業主出生年份與建築朝向，檢索傳統曆法中破土、上梁、裝修等場景的對應規則',
  ),
  家庭择日: l(
    '输入户主出生年份，检索传统历法中婚嫁、迁居等场景的对应规则',
    "Enter the household head's birth year; the system looks up traditional calendar rules for weddings and relocation.",
    '輸入戶主出生年份，檢索傳統曆法中婚嫁、遷居等場景的對應規則',
  ),
  生命礼: l(
    '输入母亲预产期与婴儿出生时刻，检索传统历法中生产择期相关的规则与医学安全窗提示',
    "Enter the mother's due date and the infant's birth hour; the system looks up traditional calendar rules for scheduled delivery, within medical safety windows.",
    '輸入母親預產期與嬰兒出生時刻，檢索傳統曆法中生產擇期相關的規則與醫學安全窗提示',
  ),
};

export const EVENTS: EventDef[] = [
  // 经营择日
  {
    key: 'open',
    group: '经营择日',
    name: 'term.ev.open',
    sub: l('门店 / 公司开张', 'Store or company opening', '門店 / 公司開張'),
    need: l('负责人出生资料 + 业态 + 坐向', "Principal's birth details + industry + orientation", '負責人出生资料 + 業態 + 坐向'),
    acts: [
      l('挂招牌', 'Hang the signboard', '掛招牌'),
      l('开炉 / 开门', 'Light the stove / open the doors', '開爐 / 開門'),
      l('首客接待', 'Receive the first guest', '首客接待'),
    ],
    core: 'term.core.wuxing',
    layers: 8,
    twoPerson: false,
  },
  {
    key: 'sign',
    group: '经营择日',
    name: 'term.ev.sign',
    sub: l('合同 / 融资 / 租赁', 'Contracts, financing, leases', '合同 / 融資 / 租賃'),
    need: l('主事人出生资料 + 时辰', "Lead's birth details + hour", '主事人出生资料 + 時辰'),
    acts: [l('落笔', 'Sign', '落筆'), l('交换文本', 'Exchange documents', '交換文本'), l('盖章', 'Affix the seal', '蓋章')],
    core: 'term.core.wuxing',
    layers: 8,
    twoPerson: false,
  },
  {
    key: 'account',
    group: '经营择日',
    name: 'term.ev.account',
    sub: l('开户 / 首笔 / 年结', 'Account opening, first entry, year-end', '開戶 / 首筆 / 年結'),
    need: l('主事人出生资料', "Lead's birth details", '主事人出生资料'),
    acts: [l('开账', 'Open the books', '開賬'), l('首笔入账', 'First entry', '首筆入賬'), l('封账', 'Close the books', '封賬')],
    core: 'term.core.wuxing',
    layers: 8,
    twoPerson: false,
  },
  {
    key: 'launch',
    group: '经营择日',
    name: 'term.ev.launch',
    sub: l('首发 / 上线 / 开播', 'Launch, release, first stream', '首發 / 上線 / 開播'),
    need: l('主事人出生资料 + 发布渠道', "Lead's birth details + channel", '主事人出生资料 + 發布渠道'),
    acts: [l('上线', 'Go live', '上線'), l('首发推送', 'First push', '首發推送'), l('首场直播', 'First livestream', '首場直播')],
    core: 'term.core.wuxing',
    layers: 8,
    twoPerson: false,
  },
  {
    key: 'recruit',
    group: '经营择日',
    name: 'term.ev.recruit',
    sub: l('开工首日 / 团队组建', 'First workday, team formation', '開工首日 / 團隊組建'),
    need: l('负责人出生资料', "Principal's birth details", '負責人出生资料'),
    acts: [l('开工讲话', 'Kick-off address', '開工講話'), l('首批入职', 'First hires onboard', '首批入職'), l('团队合影', 'Team photo', '團隊合影')],
    core: 'term.core.wuxing',
    layers: 8,
    twoPerson: false,
  },
  {
    key: 'expo',
    group: '经营择日',
    name: 'term.ev.expo',
    sub: l('参展 / 招商会', 'Exhibitions, trade fairs', '參展 / 招商會'),
    need: l('负责人出生资料 + 展位朝向', "Principal's birth details + booth facing", '負責人出生资料 + 展位朝向'),
    acts: [l('布展', 'Set up the booth', '佈展'), l('开展', 'Open the booth', '開展'), l('首轮洽谈', 'First round of talks', '首輪洽談')],
    core: 'term.core.wuxing',
    layers: 8,
    twoPerson: false,
  },
  {
    key: 'office',
    group: '经营择日',
    name: 'term.ev.office',
    sub: l('办公室搬迁', 'Office relocation', '辦公室搬遷'),
    need: l('负责人出生资料 + 楼层朝向', "Principal's birth details + floor facing", '負責人出生资料 + 樓層朝向'),
    acts: [l('进门', 'Enter the doors', '進門'), l('安座', 'Seat the desk', '安座'), l('首次会议', 'First meeting', '首次會議')],
    core: 'term.core.wuxing',
    layers: 8,
    twoPerson: false,
  },
  {
    key: 'close',
    group: '经营择日',
    name: 'term.ev.close',
    sub: l('停业 / 转让 / 清算', 'Closure, transfer, liquidation', '停業 / 轉讓 / 清算'),
    need: l('负责人出生资料', "Principal's birth details", '負責人出生资料'),
    acts: [l('公告', 'Announcement', '公告'), l('交接', 'Handover', '交接'), l('封存', 'Seal and archive', '封存')],
    core: 'term.core.wuxing',
    layers: 8,
    twoPerson: false,
  },
  // 工程择日
  {
    key: 'ground',
    group: '工程择日',
    name: 'term.ev.ground',
    sub: l('装修 / 施工 / 破土', 'Renovation, construction, earth-breaking', '裝修 / 施工 / 破土'),
    need: l('业主出生资料 + 房屋坐向', "Owner's birth details + house orientation", '業主出生资料 + 房屋坐向'),
    acts: [l('破土', 'Break ground', '破土'), l('奠基', 'Lay the foundation', '奠基'), l('首锤', 'First strike', '首錘')],
    core: 'term.core.sit',
    layers: 8,
    twoPerson: false,
  },
  {
    key: 'beam',
    group: '工程择日',
    name: 'term.ev.beam',
    sub: l('上梁 / 挂牌 / 揭牌', 'Beam-setting, plaques, unveiling', '上梁 / 掛牌 / 揭牌'),
    need: l('业主出生资料 + 房屋坐向', "Owner's birth details + house orientation", '業主出生资料 + 房屋坐向'),
    acts: [l('上梁', 'Raise the beam', '上樑'), l('挂匾', 'Hang the plaque', '掛匾'), l('揭牌', 'Unveil', '揭牌')],
    core: 'term.core.sit',
    layers: 8,
    twoPerson: false,
  },
  {
    key: 'fitout',
    group: '工程择日',
    name: 'term.ev.fitout',
    sub: l('软装进场 / 竣工验收', 'Fit-out, final inspection', '軟裝進場 / 竣工驗收'),
    need: l('业主出生资料 + 店铺坐向', "Owner's birth details + shop orientation", '業主出生资料 + 店鋪坐向'),
    acts: [l('进场', 'Move in', '進場'), l('设备调试', 'Commission equipment', '設備調試'), l('验收', 'Inspection', '驗收')],
    core: 'term.core.sit',
    layers: 8,
    twoPerson: false,
  },
  // 家庭择日
  {
    key: 'marry',
    group: '家庭择日',
    name: 'term.ev.marry',
    sub: l('传统婚月 · 当日', "Bride's marriage months · day-chart", '传统婚月 · 日課'),
    need: l('双方出生资料 + 出生地 + 时辰', "Both parties' birth details + birthplaces + hour", '雙方出生资料 + 出生地 + 時辰'),
    acts: [l('迎娶', 'Fetch the bride', '迎娶'), l('拜堂', 'Bow before the hall', '拜堂'), l('入洞房', 'Enter the chamber', '入洞房')],
    core: 'term.core.marry',
    layers: 7,
    twoPerson: true,
  },
  {
    key: 'engage',
    group: '家庭择日',
    name: 'term.ev.engage',
    sub: l('定盟 / 纳采', 'Betrothal, betrothal gifts', '定盟 / 納采'),
    need: l('双方出生资料 + 出生地', "Both parties' birth details + birthplaces", '雙方出生资料 + 出生地'),
    acts: [l('纳采', 'Present betrothal gifts', '納采'), l('交换信物', 'Exchange tokens', '交換信物'), l('宴请', 'Banquet', '宴請')],
    core: 'term.core.marry',
    layers: 7,
    twoPerson: true,
  },
  {
    key: 'cert',
    group: '家庭择日',
    name: 'term.ev.cert',
    sub: l('登记 · 轻量当日', 'Registration · light day-chart', '登記 · 輕量日課'),
    need: l('双方出生资料', "Both parties' birth details", '雙方出生资料'),
    acts: [l('取号', 'Take a number', '取號'), l('签字', 'Sign', '簽字'), l('领证', 'Collect the certificate', '領證')],
    core: 'term.core.chongming',
    layers: 7,
    twoPerson: true,
  },
  {
    key: 'move',
    group: '家庭择日',
    name: 'term.ev.move',
    sub: l('新居入宅', 'Moving into a new home', '新居入宅'),
    need: l('户主出生资料 + 新居坐向', "Household head's birth details + new-home orientation", '戶主出生资料 + 新居坐向'),
    acts: [l('进门', 'Enter the doors', '進門'), l('安床', 'Set the bed', '安床'), l('开火', 'Light the fire', '開火')],
    core: 'term.core.sit',
    layers: 8,
    twoPerson: false,
  },
  // 生命礼
  {
    key: 'birth',
    group: '生命礼',
    name: 'term.ev.birth',
    sub: l('母命 · 预产期窗口', "Mother's chart · due-date window", '母命 · 預產期窗口'),
    need: l('母亲出生资料 + 预产期', "Mother's birth details + due date", '母親出生资料 + 預產期'),
    acts: [l('手术排期', 'Schedule the procedure', '手術排期'), l('出生时刻', 'Hour of birth', '出生時刻')],
    core: 'term.core.taijing',
    layers: 7,
    twoPerson: false,
  },
  {
    key: 'full',
    group: '生命礼',
    name: 'term.ev.full',
    sub: l('婴儿生辰', "Infant's birth hour", '嬰兒生辰'),
    need: l('婴儿出生时间', "Infant's birth time", '嬰兒出生時間'),
    acts: [l('剃头', 'First haircut', '剃頭'), l('宴请', 'Banquet', '宴請')],
    core: 'term.core.chongming',
    layers: 7,
    twoPerson: false,
  },
  {
    key: 'rite',
    group: '生命礼',
    name: 'term.ev.rite',
    sub: l('先人 · 墓位朝向', 'Ancestors · burial orientation', '先人 · 墓位朝向'),
    need: l('先人信息 + 墓位朝向', 'Ancestral details + burial orientation', '先人信息 + 墓位朝向'),
    acts: [l('启攒', 'Unearth', '啟攢'), l('下葬', 'Inter', '下葬'), l('立碑', 'Raise the stele', '立碑')],
    core: 'term.core.shanxiang',
    layers: 7,
    twoPerson: false,
  },
];

const EV_MAP = new Map(EVENTS.map((e) => [e.key, e]));

export function eventByKey(key: string): EventDef {
  return EV_MAP.get(key) ?? EV_MAP.get('open')!;
}

/** 嫁娶与订婚须双方 */
export const TWO_PERSON_EVENTS = ['marry', 'engage'];

export function isTwoPerson(key: string): boolean {
  return TWO_PERSON_EVENTS.includes(key);
}

export function isBizEvent(key: string): boolean {
  return eventByKey(key).group === '经营择日';
}

export function isEngEvent(key: string): boolean {
  return eventByKey(key).group === '工程择日';
}

/** 计坐向层：工程组 + 搬家入宅 + 迁址办公（与原型 courseLayers 一致） */
export function hasSitLayer(key: string): boolean {
  return isEngEvent(key) || key === 'move' || key === 'office';
}

/** 计业态五行层：经营组 */
export function hasWuxingLayer(key: string): boolean {
  return isBizEvent(key);
}

/** 用事所须的当事人称谓（按用事，双语） */
export const PERSON_LABEL: Record<string, L10n> = {
  open: l('负责人', 'Principal', '負責人'),
  sign: l('主事人', 'Lead', '主事人'),
  account: l('主事人', 'Lead', '主事人'),
  launch: l('主事人', 'Lead', '主事人'),
  recruit: l('负责人', 'Principal', '負責人'),
  expo: l('负责人', 'Principal', '負責人'),
  office: l('负责人', 'Principal', '負責人'),
  close: l('负责人', 'Principal', '負責人'),
  ground: l('业主', 'Owner', '業主'),
  beam: l('业主', 'Owner', '業主'),
  fitout: l('业主', 'Owner', '業主'),
  marry: l('女方', 'Bride', '女方'),
  engage: l('女方', 'Bride', '女方'),
  cert: l('当事人', 'Party', '當事人'),
  move: l('户主', 'Household head', '戶主'),
  birth: l('母亲', 'Mother', '母親'),
  full: l('婴儿', 'Infant', '嬰兒'),
  rite: l('主祭', 'Officiant', '主祭'),
};

/** 第二造称谓（嫁娶 / 订婚的男方） */
export const PERSON_LABEL_B: Record<string, L10n> = {
  marry: l('男方', 'Groom', '男方'),
  engage: l('男方', 'Groom', '男方'),
};

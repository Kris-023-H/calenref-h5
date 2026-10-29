/**
 * data/todos.ts — 仪程倒排四组清单（按用事组别）。
 * 与 PRD v3.5 §10 / 原型 rRemind 一致；H5 无推送能力，默认关闭任何通知承诺。
 */

import type { EventGroup, L10n } from '../engine/types';

const l = (zh: string, en: string, zhHant: string): L10n => ({ zh, en, zhHant });

export interface TodoItem {
  title: L10n;
  note: L10n;
}

export const TODOS_BY_GROUP: Record<EventGroup, TodoItem[]> = {
  经营择日: [
    { title: l('核定负责人出生资料与真太阳时', "Fix the principal's Four Pillars and true solar time", '核定負責人出生资料與真太陽時'), note: l('决定整课成立与否，须最先定', 'Decides whether the chart holds — settle first', '決定整課成立與否，須最先定') },
    { title: l('确定业态门类与店铺坐向', 'Fix the industry category and shop orientation', '確定業態門類與店鋪坐向'), note: l('业态定五行，坐向定方位', 'Industry fixes the five phases; orientation fixes direction', '業態定五行，坐向定方位') },
    { title: l('招牌 / 门头制作与报批', 'Signboard fabrication and permits', '招牌 / 門頭製作與報批'), note: l('按开市日倒排，留 15 天制作期', 'Work back from opening day; allow 15 days', '按開市日倒排，留 15 天製作期') },
    { title: l('证照、消防与食品经营许可', 'Licenses, fire safety, and food-service permits', '證照、消防與食品經營許可'), note: l('行政流程不可压缩，须前置', 'Administrative steps cannot be compressed — front-load them', '行政流程不可壓縮，須前置') },
    { title: l('首批货品与人员到岗', 'First stock and staff in place', '首批貨品與人員到崗'), note: l('开市前 3 日到位，留一日演练', 'In place 3 days before; keep a rehearsal day', '開市前 3 日到位，留一日演練') },
    { title: l('开市传播物料与首客邀约', 'Opening-day materials and first-guest invitations', '開市傳播物料與首客邀約'), note: l('按时辰排定首客到店时刻', 'Schedule the first guest inside a favourable hour', '按時辰排定首客到店時刻') },
  ],
  工程择日: [
    { title: l('核定业主出生资料与房屋坐向', "Fix the owner's Four Pillars and house orientation", '核定業主出生资料與房屋坐向'), note: l('坐向须与图纸一致，冲山即须改期', 'Orientation must match the drawings; mountain-clash forces a change', '坐向須與圖紙一致，沖山即須改期') },
    { title: l('施工队进场档期确认', 'Confirm the crew schedule', '施工隊進場檔期確認'), note: l('破土日与队伍档期对齐', 'Align groundbreaking with the crew calendar', '破土日與隊伍檔期對齊') },
    { title: l('主材到场与验收', 'Main materials delivered and accepted', '主材到場與驗收'), note: l('上梁前须全部到位', 'All in place before the beam is raised', '上梁前須全部到位') },
    { title: l('邻里与物业告知', 'Notify neighbors and property management', '鄰里與物業告知'), note: l('动土前 3 日完成', 'Complete 3 days before groundbreaking', '動土前 3 日完成') },
    { title: l('安全交底与保险', 'Safety briefing and insurance', '安全交底與保險'), note: l('破土前一日完成', 'Complete the day before groundbreaking', '破土前一日完成') },
    { title: l('上梁 / 挂牌时辰确认', 'Confirm the beam-raising hour', '上梁 / 掛牌時辰確認'), note: l('上梁取时最严，须单独定', 'Beam-setting is timed most strictly — fix it separately', '上梁取時最嚴，須單獨定') },
  ],
  家庭择日: [
    { title: l('双方父母时间确认', "Confirm both families' availability", '雙方父母時間確認'), note: l('仪程类须先合长辈档期', 'Ceremonies start with the elders\' calendars', '儀程類須先合長輩檔期') },
    { title: l('择定纳采与亲迎两日', 'Set the betrothal and procession days', '擇定納采與親迎兩日'), note: l('六礼中两日最关键，须分定', 'The two decisive rites — set each separately', '六禮中兩日最關鍵，須分定') },
    { title: l('领证预约（如需）', 'Book the registration (if needed)', '領證預約（如需）'), note: l('民政放号提前 30 天', 'Civil-affairs slots open 30 days ahead', '民政放號提前 30 天') },
    { title: l('场地与宴席锁定', 'Lock venue and banquet', '場地與宴席鎖定'), note: l('按推演区间倒排，先锁场地', 'Work back from the chart window; lock the venue first', '按課期倒排，先鎖場地') },
    { title: l('礼服与妆造试妆', 'Attire fitting and makeup trial', '禮服與妝造試妝'), note: l('提前 10 天', 'Ten days ahead', '提前 10 天') },
    { title: l('请柬发出（电子 + 纸质）', 'Send invitations (digital + paper)', '請柬發出（電子 + 紙質）'), note: l('提前 21 天', 'Twenty-one days ahead', '提前 21 天') },
  ],
  生命礼: [
    { title: l('核定母亲出生资料与胎元', "Fix the mother's Four Pillars and fetal origin", '核定母亲出生资料與胎元'), note: l('剖腹产取课以母命为体', 'Scheduled-birth selection takes the mother\'s chart as the body', '剖腹產取課以母命為體') },
    { title: l('预产期窗口与医生排期', 'Due-date window and doctor scheduling', '預產期窗口與醫生排期'), note: l('须在医学安全窗内取课', 'Selection must stay inside the medical safety window', '須在醫學安全窗內取課') },
    { title: l('出生时刻的备选方案', 'Prepare 2–3 fallback hours', '出生時刻的備選方案'), note: l('准备 2–3 个时辰备选', 'Keep two or three candidate hours ready', '準備 2–3 個時辰備選') },
    { title: l('证件与出生证明办理', 'Documents and birth certificate', '證件與出生證明辦理'), note: l('出生后 30 日内', 'Within 30 days of birth', '出生後 30 日內') },
    { title: l('满月 / 百日仪程定日', 'Set the full-month / hundred-day ceremony', '滿月 / 百日儀程定日'), note: l('另推一次', 'A separate chart', '另推一次') },
    { title: l('亲属告知与回礼', 'Notify relatives and return gifts', '親屬告知與回禮'), note: l('按仪程倒排', 'Work back from the ceremony', '按儀程倒排') },
  ],
};

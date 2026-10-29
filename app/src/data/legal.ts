/**
 * data/legal.ts — 法务四页正文（隐私 / 条款 / 退款 / Cookie）。
 *
 * 为什么正文不放进 i18n：语言包是短文案字典，逐条对齐且有红线测试；
 * 法务长文是成篇文档，混进去会让语言包不可维护。此处独立成篇，只保留
 * 标题/联系/免责等界面短句在 i18n。
 *
 * 三语策略沿用项目既有约定：zh 为唯一事实源，zh-Hant 由 s2t 派生（与 i18n
 * 同一转换器），en 为独立译文。转换遗漏由测试把关。
 *
 * 内容口径依据：
 *   · 出海增量 PRD §5.2 合规清单（数字商品退款、欧盟 14 天撤回权豁免、Stripe 不落地卡数据）
 *   · 产品真实行为：无账号、数据只在本机、无推送/定位/通讯录、默认本机生成解读
 *   · 支付服务商按 Merchant of Record 口径（Creem / Stripe）陈述
 *
 * 上线前必须人工审定的三处（已在 README 标注）：
 *   ① 运营主体名称与注册地址；② 客服邮箱可收信；③ 准据法属地。
 */

import type { Lang } from '../engine/types';
import { SITE } from './site';
import { s2t } from '../i18n/zh-hant';

export type LegalPage = 'privacy' | 'terms' | 'refund' | 'cookie';

export const LEGAL_PAGES: LegalPage[] = ['privacy', 'terms', 'refund', 'cookie'];

export interface LegalSection {
  /** 小节标题 */
  h: string;
  /** 段落 */
  p: string[];
  /** 可选要点列表 */
  list?: string[];
}

export interface LegalDoc {
  title: string;
  updated: string;
  /** 摘要（页首一句，审核方第一眼看到的东西） */
  lead: string;
  sections: LegalSection[];
}

const UPDATED = SITE.effectiveDate;
const EMAIL = SITE.supportEmail;
const PRIVACY_EMAIL = SITE.privacyEmail;
const ENTITY = SITE.entity;
const LAW = SITE.jurisdiction;

// ---------------------------------------------------------------- 简体中文

const ZH: Record<LegalPage, LegalDoc> = {
  privacy: {
    title: '隐私政策',
    updated: UPDATED,
    lead: `本政策说明 ${ENTITY} 在「本应用」中如何处理你的信息。核心一句话：你的出生资料与历法参考记录保存在你自己的设备上，我们收不到。`,
    sections: [
      {
        h: '1. 谁在处理你的信息',
        p: [
          `「本应用」（下称「本服务」）由 ${ENTITY} 运营，是本服务的个人信息处理者。`,
          `隐私事务联系方式：${PRIVACY_EMAIL}。一般客服：${EMAIL}。我们通常在 30 日内答复。`,
        ],
      },
      {
        h: '2. 我们收集什么、不收集什么',
        p: [
          '本服务免注册、免登录。我们不建立用户账号，也没有存放你个人资料的服务器数据库。',
          '你主动输入的以下内容，仅写入本机存储（浏览器 IndexedDB 与 localStorage），不会上传：',
        ],
        list: [
          '人物档案：姓名或称呼、出生日期与时辰、出生地、性别（用于出生资料与真太阳时校正）',
          '历法参考记录：用事类型、行业、坐向、筛选结果、生成的报告与当日帖',
          '本机偏好：语言、时区、币种、历法口径、匿名统计开关',
          '购买凭证：兑换码与解锁状态（不含任何银行卡信息）',
        ],
      },
      {
        h: '3. 出生资料的处理位置',
        p: [
          '全部历法计算在你的设备本地完成，出生资料不经过网络传输，我们无法读取、也无法导出。',
          '默认的 AI 白话解读同样在本机用模板生成，不联网。如未来提供云端解读，我们会在使用前单独征求你的同意，并先更新本政策。',
          '因此，清除浏览器数据、更换设备或卸载应用，都会导致本机资料与购买凭证消失。请用「我的 → 导出备份」自行留存。',
        ],
      },
      {
        h: '4. Cookie 与统计分析',
        p: [
          '我们使用必要存储记住你的语言与设置，这类存储始终开启，否则应用无法正常工作。',
          '经你同意后，我们使用 Google Analytics 4 统计页面访问与三个关键操作（发起推演、开始 AI 解读、点击购买）。统计事件不含姓名、出生资料或任何可识别个人的内容，也不记录完整 IP 地址。',
          '你可以随时在「我的 → Cookie 与统计偏好」中撤回同意。撤回后我们不再加载统计脚本，已产生的统计数据为聚合结果，无法回溯删除。详见《Cookie 政策》。',
        ],
      },
      {
        h: '5. 支付',
        p: [
          '支付由第三方支付服务商（Merchant of Record，如 Creem、Stripe）处理。银行卡号、账单地址等信息直接提交给支付服务商，我们不接触、不传输、不存储任何卡数据。',
          '我们仅从支付服务商处收到订单结果（是否成功、购买了哪个套餐、订单号），用于在本机写入解锁凭证。',
          '支付服务商对信息的处理适用其自身隐私政策。',
        ],
      },
      {
        h: '6. 数据保留与删除',
        p: [
          '你的资料保存在本机，保留多久由你决定。删除方式有三种：',
        ],
        list: [
          '在「我的 → 清除数据」中一次性删除本机全部档案、记录与凭证（需连续确认三次）',
          '在浏览器设置中清除本站数据',
          '删除前先「导出备份」，可随时用同一文件在另一台设备导入恢复',
        ],
      },
      {
        h: '7. 你的权利',
        p: [
          `依据新加坡《个人数据保护法》（PDPA）、欧盟《通用数据保护条例》（GDPR）等适用法律，你享有查阅、更正、删除、限制处理、反对处理与数据可携的权利。`,
          '由于我们不持有你的个人资料，这些权利多数可通过本机功能直接行使（导出即查阅与可携，清除即删除）。如需就我们实际持有的少量信息（如订单记录）提出请求，请致信 ' +
            PRIVACY_EMAIL +
            '。',
        ],
      },
      {
        h: '8. 儿童',
        p: [
          '本服务不面向 16 岁以下未成年人，我们不会有意收集其信息。若你发现此类情况，请联系我们删除。',
        ],
      },
      {
        h: '9. 跨境传输与政策变更',
        p: [
          '你的出生资料不发生跨境传输。支付与统计服务由境外服务商提供，可能在其服务器所在国处理订单与访问数据，这些服务商均受其所在法域与合同条款约束。',
          `本政策如有实质变更，我们会更新本页顶部的「最后更新」日期；涉及你权利的重大变更会在应用内显著提示。准据法属地：${LAW}。`,
        ],
      },
    ],
  },

  terms: {
    title: '服务条款',
    updated: UPDATED,
    lead: '使用「本应用」即表示你接受本条款。请特别阅读第 2 条（服务性质）与第 7 条（责任限制）。',
    sections: [
      {
        h: '1. 协议成立',
        p: [
          `本条款是你与 ${ENTITY} 之间关于使用「本应用」的协议。访问或使用本服务，即视为你已阅读并同意本条款；如不同意，请停止使用。`,
        ],
      },
      {
        h: '2. 服务性质：文化参考工具，不是专业意见',
        p: [
          '本服务依据传统历法、历法文献与民俗规则，对日期与用事作出参考性评估。它是一项文化与民俗工具，不是科学预测，也不保证任何结果。',
          '本服务不构成医疗、法律、财务、投资、婚姻或任何专业建议。涉及健康、诉讼、大额交易、婚姻登记等重大决定，请咨询相应持牌专业人士。',
          '所有历法参考结论仅供参考，最终决定与后果由你自行承担。',
        ],
      },
      {
        h: '3. 使用许可与限制',
        p: [
          '我们授予你一项个人、非独占、不可转让、可撤回的许可，用于在你自有设备上使用本服务。',
          '你不得：逆向工程、反编译或试图获取源代码（法律强制允许的除外）；批量抓取或镜像本服务内容；将本服务或其输出用于转售、代客提供历法参考的收费服务或训练商业模型；以违法、欺诈或侵害他人权益的方式使用。',
        ],
      },
      {
        h: '4. 你的责任',
        p: [
          '你应确保输入的出生信息已获得当事人同意。为他人做历法参考（如对照双方出生资料）时，你需自行取得对方授权。',
          '你应自行备份本机资料。因清除浏览器数据、更换设备、卸载应用导致的记录与凭证丢失，我们无法恢复。',
        ],
      },
      {
        h: '5. 知识产权',
        p: [
          `本服务的界面、文案、当日帖版式、评分体系与软件代码归 ${ENTITY} 所有，受著作权法保护。`,
          '传统历法规则、干支术语与公版文献本身不属于任何人；我们主张的是具体的表达、编排与实现。',
          '你可以自由分享自己生成的当日帖与报告用于个人、非商业用途。',
        ],
      },
      {
        h: '6. 付费、凭证与解锁',
        p: [
          '本服务采用一次性购买制，不含自动续费订阅。价格以下单页显示为准，按币种分别定价。',
          '支付成功后，解锁凭证写入你的本机。凭证与设备绑定，不跨设备自动同步；更换设备可用「恢复购买」或原始订单号申请补发。',
          '兑换码为一次性使用，请在有效期内兑换。',
          '退款规则见《退款政策》，该政策是本条款的组成部分。',
        ],
      },
      {
        h: '7. 免责与责任限制',
        p: [
          '本服务按「现状」提供。我们尽力保证推演规则稳定与数据准确，但不保证服务不中断、无错误，或结果符合你的期望。',
          `在适用法律允许的最大范围内，${ENTITY} 对因使用或无法使用本服务产生的间接、附带、后果性损失不承担责任；就任一订单的直接赔偿责任，以你为该订单实际支付的金额为上限。`,
          '本条不排除或限制依法不可排除的责任，包括因故意或重大过失造成的人身伤害与欺诈责任。',
        ],
      },
      {
        h: '8. 服务变更与终止',
        p: [
          '我们可能更新规则版本、调整界面或停止部分功能。涉及已购权益的重大不利变更，我们会提前在应用内通知，并按《退款政策》提供相应救济。',
          '如你严重违反本条款，我们可终止你的使用许可。',
        ],
      },
      {
        h: '9. 准据法与争议解决',
        p: [
          `本条款适用 ${LAW} 法律（不含其冲突法规则）。争议应先通过友好协商解决；协商不成，提交 ${LAW} 有管辖权的法院处理。`,
          '如你所在国家或地区的消费者保护法赋予你更强的权利（如在本国法院起诉的权利），该等权利不受本条影响。',
        ],
      },
      {
        h: '10. 联系方式',
        p: [`条款相关疑问：${EMAIL}。`],
      },
    ],
  },

  refund: {
    title: '退款政策',
    updated: UPDATED,
    lead: '本服务为数字产品，一次性交付、即时生效。未使用的订单可在 7 日内退款；已经生成并查看报告、或已消耗 AI 解读次数的订单不予退款。',
    sections: [
      {
        h: '1. 适用范围',
        p: [
          '本政策适用于通过本服务完成的全部一次性购买（单次报告、AI 解读次数包、双人对照、年度不限次）。',
          '本服务不含订阅与自动续费，因此不存在「忘记取消」类争议。',
        ],
      },
      {
        h: '2. 可以退款的情形',
        p: ['符合下列任一情形，请在购买后 7 日内提出，我们核实后退款：'],
        list: [
          '付费后未生成、未查看任何报告，且未消耗 AI 解读次数',
          '同一订单被重复扣款（含网络重试导致的重复支付）',
          '因我们的技术故障导致已付费内容无法打开，且我们在 7 日内无法修复',
          '你所在法域的消费者保护法强制赋予的退款权利',
        ],
      },
      {
        h: '3. 不予退款的情形（数字产品例外条款）',
        p: [
          '本服务内容为即时交付的数字内容。下列情形不予退款：',
        ],
        list: [
          '报告已生成并可查看（无论是否实际阅读）',
          'AI 解读次数已部分或全部消耗',
          '已使用兑换码完成解锁',
          '以「历法参考结果不符合预期」「事后认为不准确」为由——本服务是文化参考工具，不承诺结果（见《服务条款》第 2 条）',
          '因你自行清除浏览器数据、更换设备或卸载应用导致凭证丢失（可用订单号申请补发，无需重新付费）',
          '购买超过 7 日且内容已交付',
        ],
      },
      {
        h: '4. 欧盟与英国用户的 14 天撤回权',
        p: [
          '欧盟与英国消费者通常享有 14 天无理由撤回权。但依《消费者权利指令》关于数字内容的例外，若你在下单时明确同意立即履行，并确认因此丧失撤回权，则该权利不再适用。',
          '我们在结账页以单独一行明确提示上述内容。若你未作出该同意，14 天撤回权仍然有效，可在 14 日内提出退款，无需说明理由。',
        ],
      },
      {
        h: '5. 新加坡、马来西亚及其他地区',
        p: [
          '本政策不排除、不限制你依当地消费者保护法享有的法定权利。若当地法律规定的退款权利优于本政策，以当地法律为准。',
          '商品存在瑕疵（如内容无法打开、重复扣款）时，无论是否超过 7 日，我们都会处理。',
        ],
      },
      {
        h: '6. 如何申请',
        p: [
          `请致信 ${EMAIL}，主题注明「退款申请」，并提供：下单邮箱或支付服务商订单号、购买日期、所选套餐、退款原因简述。`,
          '我们会在 2 个工作日内确认收悉，核实后 5–10 个工作日内发起退款。退款退回原支付方式，到账时间由发卡行决定（通常 3–10 个工作日）。',
        ],
      },
      {
        h: '7. 支付服务商的角色',
        p: [
          '本服务的收款由支付服务商作为记录商户（Merchant of Record）处理，订单记录与退款通道由该服务商持有。因此退款可能需要通过其客服渠道共同完成，我们会协助跟进。',
          '退款完成后，对应解锁权益将同步收回。',
        ],
      },
    ],
  },

  cookie: {
    title: 'Cookie 政策',
    updated: UPDATED,
    lead: '我们只用必要存储让应用正常工作；统计分析仅在你同意后启用，且不包含你的出生资料。',
    sections: [
      {
        h: '1. Cookie 与本地存储',
        p: [
          '本服务是免登录的本地优先应用，主要依靠浏览器本地存储（localStorage 与 IndexedDB）保存你的设置与记录，而不是靠 Cookie 跟踪你。',
          '本政策中的「Cookie」泛指 Cookie、localStorage、IndexedDB 等本地存储技术。',
        ],
      },
      {
        h: '2. 我们使用的存储',
        p: ['按用途分为两类：'],
        list: [
          '必要（始终开启）：zj.settings（语言、时区、币种、历法口径）、zj.consent（你的 Cookie 选择）、IndexedDB 中的档案/报告/收藏/提醒/凭证。用途是让应用记住你的选择并保存你的记录。不开启则应用无法使用。',
          '分析（需同意）：_ga 与 _ga_<容器 ID>（Google Analytics 4，有效期最长 13 个月），用途是统计页面访问量与三个关键操作的完成情况，用于判断功能是否好用。不含姓名、出生资料、精确位置。',
        ],
      },
      {
        h: '3. 同意机制',
        p: [
          '首次访问时，底部会弹出同意横幅，提供「全部接受」与「仅必要」两个同等显著的选项，不做暗黑模式设计。',
          '在你作出选择前，分析脚本不会加载（Google 同意模式默认拒绝）。选择「仅必要」时，我们不会写入任何分析 Cookie。',
          '你的选择保存在本机，不会上传。',
        ],
      },
      {
        h: '4. 如何更改或撤回',
        p: [
          '随时在「我的 → Cookie 与统计偏好」中更改选择，撤回即时生效，无需说明理由。',
          '你也可以在浏览器设置中删除本站存储；删除后下次访问会重新询问。',
          '撤回同意不影响此前基于同意所作处理的合法性。',
        ],
      },
      {
        h: '5. 第三方',
        p: [
          '经你同意后，Google Analytics 由 Google LLC 提供，其处理行为适用 Google 隐私政策。我们未启用任何广告、再营销、社交插件或跨站跟踪像素。',
          '支付页面由支付服务商托管，其 Cookie 适用该服务商自身政策。',
        ],
      },
      {
        h: '6. 变更与联系',
        p: [
          `本政策更新时我们会修改页首日期。疑问请致信 ${PRIVACY_EMAIL}。`,
        ],
      },
    ],
  },
};

// ---------------------------------------------------------------- English

const EN: Record<LegalPage, LegalDoc> = {
  privacy: {
    title: 'Privacy Policy',
    updated: UPDATED,
    lead: `This policy explains how ${ENTITY} handles information in Zeji. In one sentence: your birth data and readings stay on your own device — we never receive them.`,
    sections: [
      {
        h: '1. Who processes your information',
        p: [
          `Zeji (the "Service") is operated by ${ENTITY}, which acts as the data controller for the Service.`,
          `Privacy contact: ${PRIVACY_EMAIL}. General support: ${EMAIL}. We normally respond within 30 days.`,
        ],
      },
      {
        h: '2. What we collect — and what we do not',
        p: [
          'The Service requires no sign-up and no login. We do not create user accounts and we operate no server-side database of personal profiles.',
          'The following information you enter is written only to on-device storage (browser IndexedDB and localStorage) and is never uploaded:',
        ],
        list: [
          'Person profiles: name or label, date and hour of birth, birthplace, sex (used for the calendar calculation and true-solar-time correction)',
          'Readings: event type, industry, sitting direction, screening results, generated reports and day cards',
          'On-device preferences: language, time zone, currency, calendar convention, analytics toggle',
          'Purchase credentials: redemption codes and unlock status (never any card details)',
        ],
      },
      {
        h: '3. Where birth data is processed',
        p: [
          'Chart casting and scoring run entirely on your device. Birth data is not transmitted over the network, and we cannot read or export it.',
          'The default AI reading is also generated locally from templates, with no network call. If a cloud-based reading option is ever offered, we will ask for your separate consent before use and update this policy first.',
          'As a result, clearing browser data, switching devices or uninstalling the app will erase your on-device records and purchase credentials. Please keep a backup via "Me → Export backup".',
        ],
      },
      {
        h: '4. Cookies and analytics',
        p: [
          'We use essential local storage to remember your language and settings. This storage is always on — the app cannot work without it.',
          'With your consent, we use Google Analytics 4 to count page visits and three key actions (starting a date check, starting an AI reading, tapping buy). These events contain no name, birth data or other identifiable content, and we do not record full IP addresses.',
          'You can withdraw consent at any time under "Me → Cookie & analytics preferences". Once withdrawn we stop loading the analytics script; data already aggregated cannot be traced back and deleted. See the Cookie Policy for details.',
        ],
      },
      {
        h: '5. Payments',
        p: [
          'Payments are handled by third-party payment providers acting as Merchant of Record (such as Creem or Stripe). Card numbers and billing details go directly to the provider — we do not touch, transmit or store any card data.',
          'We only receive the order outcome (success or failure, which package, order reference) in order to write the unlock credential on your device.',
          'The provider processes that information under its own privacy policy.',
        ],
      },
      {
        h: '6. Retention and deletion',
        p: ['Your data lives on your device and stays as long as you decide. You can delete it in three ways:'],
        list: [
          'Use "Me → Clear data" to erase all profiles, readings and credentials on this device (three-step confirmation)',
          'Clear site data in your browser settings',
          'Export a backup first — you can re-import the same file on another device at any time',
        ],
      },
      {
        h: '7. Your rights',
        p: [
          'Under applicable law — including Singapore\'s PDPA and the EU GDPR — you have the right to access, correct, delete, restrict, object to processing, and to data portability.',
          'Because we do not hold your personal data, most of these rights can be exercised directly in the app: exporting is access and portability, clearing is deletion. To make a request about the limited information we do hold (such as an order record), email ' +
            PRIVACY_EMAIL +
            '.',
        ],
      },
      {
        h: '8. Children',
        p: ['The Service is not directed to anyone under 16, and we do not knowingly collect their information. Contact us if you become aware of such a case and we will delete it.'],
      },
      {
        h: '9. International transfers and changes',
        p: [
          'Your birth data is not transferred across borders. Payment and analytics providers are located outside your country and may process order and visit data in their own jurisdictions, under their local law and contractual terms.',
          `If this policy changes materially we will update the "Last updated" date at the top of this page; significant changes affecting your rights will be highlighted in the app. Governing jurisdiction: ${LAW}.`,
        ],
      },
    ],
  },

  terms: {
    title: 'Terms of Service',
    updated: UPDATED,
    lead: 'By using Zeji you accept these terms. Please read section 2 (nature of the service) and section 7 (limitation of liability) with particular care.',
    sections: [
      {
        h: '1. Agreement',
        p: [
          `These terms are an agreement between you and ${ENTITY} regarding your use of Zeji. By accessing or using the Service you confirm that you have read and accept them. If you do not agree, please stop using the Service.`,
        ],
      },
      {
        h: '2. Nature of the service — cultural reference, not professional advice',
        p: [
          'The Service evaluates dates and activities against traditional calendrical systems, day-selection literature and folk rules. It is a cultural and folk tool. It is not scientific prediction and it does not guarantee any outcome.',
          'The Service does not constitute medical, legal, financial, investment, marital or any other professional advice. For health, litigation, major transactions or marriage registration, consult an appropriately licensed professional.',
          'All readings are for reference only. The final decision and its consequences remain yours.',
        ],
      },
      {
        h: '3. Licence and restrictions',
        p: [
          'We grant you a personal, non-exclusive, non-transferable, revocable licence to use the Service on devices you own.',
          'You must not: reverse engineer, decompile or attempt to obtain the source code (except where mandatory law permits); scrape or mirror the Service in bulk; resell the Service or its output, run a paid day-selection service for clients on top of it, or use it to train commercial models; use it unlawfully, deceptively or to infringe the rights of others.',
        ],
      },
      {
        h: '4. Your responsibilities',
        p: [
          'You must ensure you have consent from any person whose birth details you enter. When selecting dates for others (for example a combined two-person reading) you are responsible for obtaining their authorisation.',
          'You are responsible for backing up your on-device data. We cannot recover records or credentials lost through clearing browser data, changing devices or uninstalling the app.',
        ],
      },
      {
        h: '5. Intellectual property',
        p: [
          `The interface, copy, day-card layout, scoring system and source code of the Service belong to ${ENTITY} and are protected by copyright.`,
          'Traditional calendrical rules, sexagenary terminology and public-domain texts belong to no one; what we claim is our specific expression, arrangement and implementation.',
          'You may freely share the day cards and reports you generate for personal, non-commercial use.',
        ],
      },
      {
        h: '6. Payment, credentials and unlocking',
        p: [
          'The Service is sold as one-off purchases. There are no auto-renewing subscriptions. Prices are shown on the checkout page and are set per currency.',
          'After a successful payment the unlock credential is written to your device. Credentials are tied to the device and do not sync automatically; on a new device use "Restore purchase" or request a reissue with your original order reference.',
          'Redemption codes are single-use; please redeem within their validity period.',
          'Refunds are governed by the Refund Policy, which forms part of these terms.',
        ],
      },
      {
        h: '7. Disclaimer and limitation of liability',
        p: [
          'The Service is provided "as is". We work to keep the rules stable and the data accurate, but we do not warrant that the Service will be uninterrupted or error-free, or that results will meet your expectations.',
          `To the maximum extent permitted by law, ${ENTITY} is not liable for indirect, incidental or consequential loss arising from use of, or inability to use, the Service; our direct liability for any order is limited to the amount you actually paid for that order.`,
          'Nothing in this section excludes or limits liability that cannot lawfully be excluded, including liability for death or personal injury caused by negligence, or for fraud.',
        ],
      },
      {
        h: '8. Changes and termination',
        p: [
          'We may update rule versions, adjust the interface or discontinue features. For material adverse changes affecting rights you have already paid for, we will notify you in the app in advance and provide relief under the Refund Policy.',
          'If you seriously breach these terms, we may terminate your licence to use the Service.',
        ],
      },
      {
        h: '9. Governing law and disputes',
        p: [
          `These terms are governed by the laws of ${LAW}, without regard to conflict-of-law rules. Disputes should first be raised with us in good faith; if unresolved, they are subject to the competent courts of ${LAW}.`,
          'If the consumer protection law of your country of residence grants you stronger rights (for example the right to sue in your local courts), those rights are unaffected by this section.',
        ],
      },
      {
        h: '10. Contact',
        p: [`Questions about these terms: ${EMAIL}.`],
      },
    ],
  },

  refund: {
    title: 'Refund Policy',
    updated: UPDATED,
    lead: 'This is a digital product, delivered instantly and irrevocably. Unused orders can be refunded within 7 days; orders where a report has been generated and viewed, or AI credits consumed, are not refundable.',
    sections: [
      {
        h: '1. Scope',
        p: [
          'This policy covers every one-off purchase made through the Service (single report, AI credit pack, two-person combined reading, annual unlimited).',
          'The Service has no subscriptions or auto-renewals, so there are no "forgot to cancel" disputes.',
        ],
      },
      {
        h: '2. When a refund is available',
        p: ['Contact us within 7 days of purchase if any of the following applies, and we will refund after verification:'],
        list: [
          'No report was generated or viewed after payment, and no AI credits were consumed',
          'The same order was charged twice (including duplicate payments caused by network retries)',
          'A technical fault on our side made paid content inaccessible and we could not fix it within 7 days',
          'A refund right is mandatorily granted by the consumer law of your jurisdiction',
        ],
      },
      {
        h: '3. When a refund is not available (digital-content exception)',
        p: ['The Service delivers digital content instantly. Refunds are not available in these cases:'],
        list: [
          'A report has been generated and is viewable, whether or not you read it',
          'AI reading credits have been partly or fully consumed',
          'A redemption code has already been used to unlock content',
          'The request is based on "the reading did not match my expectations" or a later view that it was inaccurate — the Service is a cultural reference tool and promises no outcome (see Terms, section 2)',
          'Credentials were lost because you cleared browser data, changed device or uninstalled the app (we will reissue with your order reference at no charge)',
          'More than 7 days have passed and the content has been delivered',
        ],
      },
      {
        h: '4. EU and UK: the 14-day right of withdrawal',
        p: [
          'Consumers in the EU and UK normally have 14 days to withdraw from a distance contract. However, under the digital-content exception in the Consumer Rights Directive, that right is lost where you expressly consented to immediate performance and acknowledged that you would therefore lose the right of withdrawal.',
          'We state this in a separate line on the checkout page. If you did not give that consent, your 14-day right of withdrawal remains available and you may request a refund within 14 days without giving a reason.',
        ],
      },
      {
        h: '5. Singapore, Malaysia and elsewhere',
        p: [
          'This policy does not exclude or restrict any statutory right you have under your local consumer protection law. Where local law is more favourable to you, local law prevails.',
          'Where goods are faulty (for example content will not open, or you were charged twice), we will act regardless of the 7-day window.',
        ],
      },
      {
        h: '6. How to request a refund',
        p: [
          `Email ${EMAIL} with the subject "Refund request" and include: the email used at checkout or the payment provider order reference, purchase date, package purchased, and a short reason.`,
          'We acknowledge within 2 business days and, once verified, initiate the refund within 5–10 business days. Refunds return to the original payment method; the time to appear depends on your issuer (usually 3–10 business days).',
        ],
      },
      {
        h: '7. The payment provider\'s role',
        p: [
          'Payments for the Service are collected by a payment provider acting as Merchant of Record, which holds the order record and the refund channel. A refund may therefore need to be completed together with their support team; we will help follow up.',
          'When a refund is completed, the corresponding unlock entitlement is withdrawn.',
        ],
      },
    ],
  },

  cookie: {
    title: 'Cookie Policy',
    updated: UPDATED,
    lead: 'We use essential local storage to make the app work; analytics only runs with your consent, and it never includes your birth data.',
    sections: [
      {
        h: '1. Cookies and local storage',
        p: [
          'The Service is a login-free, local-first app. It relies mainly on browser local storage (localStorage and IndexedDB) to keep your settings and records, rather than on cookies that track you.',
          'In this policy, "cookies" covers cookies, localStorage, IndexedDB and similar local storage technologies.',
        ],
      },
      {
        h: '2. What we store',
        p: ['Two categories:'],
        list: [
          'Essential (always on): zj.settings (language, time zone, currency, calendar convention), zj.consent (your cookie choice), and IndexedDB records for profiles, readings, favourites, reminders and credentials. Purpose: remember your choices and keep your records. The app cannot work without these.',
          'Analytics (consent required): _ga and _ga_<container id> (Google Analytics 4, up to 13 months), used to count page visits and completion of three key actions so we can judge whether features work. No names, no birth data, no precise location.',
        ],
      },
      {
        h: '3. How consent works',
        p: [
          'On your first visit a banner appears at the bottom with two equally prominent options, "Accept all" and "Essential only". No dark patterns.',
          'The analytics script is not loaded until you choose (Google Consent Mode defaults to denied). If you choose "Essential only", no analytics cookies are written.',
          'Your choice is stored on your device and never uploaded.',
        ],
      },
      {
        h: '4. Changing or withdrawing consent',
        p: [
          'Change your choice at any time under "Me → Cookie & analytics preferences"; withdrawal takes effect immediately and needs no reason.',
          'You can also delete site storage in your browser settings; you will be asked again on your next visit.',
          'Withdrawal does not affect the lawfulness of processing carried out before it.',
        ],
      },
      {
        h: '5. Third parties',
        p: [
          'With your consent, Google Analytics is provided by Google LLC and processes data under Google\'s privacy policy. We use no advertising, remarketing, social plug-ins or cross-site tracking pixels.',
          'Checkout pages are hosted by our payment provider, whose cookies are governed by that provider\'s own policy.',
        ],
      },
      {
        h: '6. Changes and contact',
        p: [`When this policy is updated we change the date at the top. Questions: ${PRIVACY_EMAIL}.`],
      },
    ],
  },
};

// ---------------------------------------------------------------- 繁体派生

function toHant(doc: LegalDoc): LegalDoc {
  return {
    title: s2t(doc.title),
    updated: doc.updated,
    lead: s2t(doc.lead),
    sections: doc.sections.map((s) => ({
      h: s2t(s.h),
      p: s.p.map(s2t),
      list: s.list?.map(s2t),
    })),
  };
}

function hantPack(): Record<LegalPage, LegalDoc> {
  return {
    privacy: toHant(ZH.privacy),
    terms: toHant(ZH.terms),
    refund: toHant(ZH.refund),
    cookie: toHant(ZH.cookie),
  };
}

export const LEGAL_DOCS: Record<Lang, Record<LegalPage, LegalDoc>> = {
  zh: ZH,
  en: EN,
  'zh-Hant': hantPack(),
};

/** 取一篇法务文档 */
export function legalDoc(page: LegalPage, lang: Lang): LegalDoc {
  return LEGAL_DOCS[lang][page];
}

/** 法务页 key → i18n 标题 key（页脚与屏内标题共用） */
export const LEGAL_TITLE_KEY: Record<LegalPage, 'legal.privacy' | 'legal.terms' | 'legal.refund' | 'legal.cookie'> = {
  privacy: 'legal.privacy',
  terms: 'legal.terms',
  refund: 'legal.refund',
  cookie: 'legal.cookie',
};

/** pathname → 法务页（/privacy 等真 URL；与 site.ts 的 LEGAL_PATH 一一对应） */
const PATH_TO_PAGE: Record<string, LegalPage> = {
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/refund': 'refund',
  '/cookies': 'cookie',
};

/**
 * 解析 pathname 深链。
 * Creem 要求隐私政策与服务条款「must be present and accessible」「load without
 * authentication」——审核员会直接打开 /privacy，所以必须按路径渲染，不能只认查询串。
 */
export function parseLegalPath(pathname: string): LegalPage | null {
  const p = pathname.replace(/\/+$/, '') || '/';
  return PATH_TO_PAGE[p] ?? null;
}

/**
 * 解析 `?legal=privacy` 深链（旧地址，保留兼容）。
 * 支付平台审核会直接点开链接看政策，因此该参数必须可分享、可刷新；
 * 非法值返回 null（不跳转，避免脏参数把用户带进空白页）。
 */
export function parseLegalParam(search: string): LegalPage | null {
  try {
    const v = new URLSearchParams(search).get('legal');
    if (!v) return null;
    return (LEGAL_PAGES as readonly string[]).includes(v) ? (v as LegalPage) : null;
  } catch {
    return null;
  }
}

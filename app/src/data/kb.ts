/**
 * data/kb.ts — 知库 24 篇元数据（分类 / 时长 / 典籍标注）。
 * 篇目标题与导语为双语长文；分类走术语表。未英译篇目在英文界面显示「中文原文」。
 */

import type { L10n } from '../engine/types';
import type { TermKey } from '../engine/types';

const l = (zh: string, en: string, zhHant: string): L10n => ({ zh, en, zhHant });

export interface KbArticle {
  id: number;
  title: L10n;
  category: TermKey;
  /** 预计阅读分钟 */
  minutes: number;
  /** 本课出处（保留中文书名） */
  books: string[];
  sub: L10n;
  /** 长文正文（段落以 \n 分隔）；未收录篇目走「导语 + 导读」结构 */
  body?: L10n;
  /** 是否已有英译正文（P1 首批 10 篇） */
  translated: boolean;
}

export const KB_ARTICLES: KbArticle[] = [
  {
    id: 1,
    title: l('通书、黄历、历法参考：三个词不是一件事', 'Almanac, Huangli, and Calendar Reference: Three Different Things', '通書、黃曆、曆法參考：三個詞不是一件事'),
    category: 'term.kbcat.xueli',
    minutes: 3,
    books: ['《协纪辨方书》'],
    sub: l(
      '通书是历书，黄历是民间印本，历法参考是一门取用之学。混着用，结论必然打架。',
      'The almanac is a calendar book; the Huangli is a folk print; calendar reference is an applied art. Mix them and conclusions collide.',
      '通書是曆書，黃曆是民間印本，曆法參考是一門取用之學。混著用，結論必然打架。',
    ),
    body: l(
      '通书，本质上是历书。它回答的问题是「今天是几月几号、什么节气、下一个节气在什么时候」——这是天文与历法问题，有唯一答案，算错了就是算错了。\n'
        + '黄历，是在历书基础上加了「宜忌」栏的民间印本。它回答「今天总体上宜做什么、忌做什么」。同一个「宜」，它对所有人都一样——因为印本只按日期排，不知道你是谁、要办什么事。\n'
        + '历法参考，是另一回事。它回答「今天对你要办的这件事怎么样」。同一个开业日，对甲是优选，对乙可能冲了出生年。历法参考以当事人的出生资料为据、以用事为用，一层一层推，结论因人、因事、因地而异。\n'
        + '三个词三个层级。拿黄历的「诸事不宜」去否掉一个按你出生年推出来的优选日，或者拿历法参考的结论去质疑历书的节气日期，都是层级错位。本产品把这三件事分得很清：首页「今日通书」是通书口径，对所有人一致；「起一局」出来的推演报告，才是历法参考口径，只对你这件事负责。',
      'The almanac is, at bottom, a calendar book. It answers "what is today\'s date, which solar term are we in, when is the next one" — an astronomical question with a single answer. Get the astronomy wrong and the book is simply wrong.\n'
        + 'The Huangli is a folk print that adds a column of "suitable / avoid" notes to the calendar. It answers "what should people generally do today". Its advice is the same for everyone, because the print is indexed by date alone — it does not know who you are or what matter you have at hand.\n'
        + 'This calendar reading is a different thing. It answers "how is today for your matter". The same opening day can be superior for one person and clash with another\'s year branch. It takes the person\'s birth details as the body and the matter as the use, weighing layer upon layer, so its conclusions vary by person, matter, and place.\n'
        + 'Three words, three levels. Using a Huangli\'s "avoid everything" to veto a day your own chart ranks superior is a category error — as is questioning the calendar\'s solar terms with a date-selection result. This product keeps the three apart: the home screen\'s "today" reading is the almanac level, identical for everyone; only the lesson report answers for your matter.',
      '通書，本質上是曆書。它回答的問題是「今天是幾月幾號、什麼節氣、下一個節氣在什麼時候」——這是天文與曆法問題，有唯一答案，算錯了就是算錯了。\n'
        + '黃曆，是在曆書基礎上加了「宜忌」欄的民間印本。它回答「今天總體上宜做什麼、忌做什麼」。同一個「宜」，它對所有人都一樣——因為印本只按日期排，不知道你是誰、要辦什麼事。\n'
        + '曆法參考，是另一回事。它回答「今天對你要辦的這件事怎麼樣」。同一個開業日，對甲是優選，對乙可能沖了出生年。曆法參考以當事人的出生資料為據、以用事為用，一層一層推，結論因人、因事、因地而異。\n'
        + '三個詞三個層級。拿黃曆的「諸事不宜」去否掉一個按你出生年推出來的優選日，或者拿曆法參考的結論去質疑曆書的節氣日期，都是層級錯位。本產品把這三件事分得很清：首頁「今日通書」是通書口徑，對所有人一致；「起一局」出來的推演報告，才是曆法參考口徑，只對你這件事負責。',
    ),
    translated: true,
  },
  {
    id: 2,
    title: l('为什么你手机上的黄历，和你奶奶那本天天打架', 'Why Your Phone\'s Almanac Argues with Grandma\'s', '為什麼你手機上的黃曆，和你奶奶那本天天打架'),
    category: 'term.kbcat.xueli',
    minutes: 4,
    books: ['《星历考原》'],
    sub: l(
      '同一天，一个说大吉，一个说诸事不宜。不是谁算错了，是它们不在同一层级上取。',
      'Same day, one calls it favourable, the other says avoid everything. Neither is wrong — they select at different levels.',
      '同一天，一個說大吉，一個說諸事不宜。不是誰算錯了，是它們不在同一層級上取。',
    ),
    body: l(
      '你手机上的黄历和长辈手里那本，说的常常不是同一件事。\n'
        + '第一层差别在历。老印本用固定节气表，遇到极端年份会差一天；手机软件按真实天文时刻计算，节气在几分几秒都算得出来。这不是谁抄错了谁，是算法精度不同。\n'
        + '第二层差别在「取」。同样是建除十二值神，有的版本以节气月建起建，有的以农历初一为界；同样是德日，有的按三合局推，有的按节气方位推。取法不同，同一天的「值神」就不同，宜忌自然相反。\n'
        + '第三层差别在「口径」。老黄历很多按《星历考原》之后的通书体系，默认对「所有人」；而你在本应用 里看到的结果，是按你的出生资料、你要办的事单独推的。一个是广播，一个是点对点。\n'
        + '所以两个 App 打架，先别急着骂谁不准。看清层级：如果争的是「今天几号」，以天文计算为准；如果争的是「今天宜不宜搬家」，先问一句——对谁、办什么事。',
      'Your phone\'s almanac and the one in your elder\'s hands are often not talking about the same thing.\n'
        + 'The first difference is the calendar itself. Old prints use fixed solar-term tables and can be a day off in extreme years; phone software computes the true astronomical instant, down to the minute. Neither copied the other wrong — the precision simply differs.\n'
        + 'The second difference is the selection rule. Even for the same twelve jianchu officers, one version counts the month from the solar term, another from the lunar new moon; even for monthly and heavenly virtues, one derives them from the three harmonies, another from the term directions. Different rules give a different "officer of the day", and opposite advice.\n'
        + 'The third difference is the level of address. Old almanacs speak to everyone in general; a date-selection app computes for your pillars and your matter alone. One is a broadcast, the other a point-to-point reading.\n'
        + 'So when two apps disagree, do not rush to call one wrong. Ask which level they are arguing on: if it is "what is today\'s date", trust astronomy; if it is "is today good for moving house", first ask — for whom, and for what matter.',
      '你手機上的黃曆和長輩手裡那本，說得常常不是同一件事。\n'
        + '第一層差別在曆。老印本用固定節氣表，遇到極端年份會差一天；手機軟件按真實天文時刻計算，節氣在幾分幾秒都算得出來。這不是誰抄錯了誰，是算法精度不同。\n'
        + '第二層差別在「取」。同樣是建除十二值神，有的版本以節氣月建起建，有的以農曆初一為界；同樣是德日，有的按三合局推，有的按節氣方位推。取法不同，同一天的「值神」就不同，宜忌自然相反。\n'
        + '第三層差別在「口徑」。老黃曆很多按《星歷考原》之後的通書體系，默認對「所有人」；而你在本應用裡看到的結果，是按你的出生資料、你要辦的事單獨推的。一個是廣播，一個是點對點。\n'
        + '所以兩個 App 打架，先別急著罵誰不準。看清層級：如果爭的是「今天幾號」，以天文計算為準；如果爭的是「今天宜不宜搬家」，先問一句——對誰、辦什麼事。',
    ),
    translated: true,
  },
  {
    id: 3,
    title: l('传统婚嫁月份表是怎么来的', 'Where the Traditional Wedding-Month Tables Came From', '傳統婚嫁月份表是怎麼來的'),
    category: 'term.kbcat.hunjia',
    minutes: 4,
    books: ['《协纪辨方书》'],
    sub: l(
      '旧式通书按女方出生年的地支列出一张月表，标注哪些月宜嫁娶。它是一份历史文献，不是对某个人婚姻的判断。',
      'Old almanacs listed a month table keyed to the bride\'s birth-year branch. It is a historical document, not a verdict on anyone\'s marriage.',
      '舊式通書按女方出生年的地支列出一張月表，標註哪些月宜嫁娶。它是一份歷史文獻，不是對某個人婚姻的判斷。',
    ),
    body: l(
      '「婚月」是传统通书里的一张月表：以女方出生年的地支为索引，把十二个月分成大利月、小利月、不宜月几档。这张表在《协纪辨方书》一系的文献里可以查到，属于历法文献的一部分，不是对具体某个人婚姻前景的判断。\n'
        + '表怎么读？以卯年（如 1987 年）为例，文献把正月、七月列为大利月，二、八月列为不宜，其余月份分入小利月一档。读法上它是「按月归档」，不是「按人推算」——换一个人、换一年，表上的档位就跟着换。\n'
        + '为什么旧式文献先定月再定日？因为它们把月看作「纲」、日看作「目」，月的档位在前的逻辑来自文献体例本身：月是大颗粒度的筛选，日是小颗粒度的筛选，先粗后细可以少推很多天。这是一套检索顺序，与结果是否应验无关。\n'
        + '不同文献对同一张表的宽严并不一致：有的只把「不宜」当参考，有的把它当硬性排除；翁姑月、女父母月这类名目在各本通书里的处理也各不相同。本应用把这几种读法并列展示，是为了让你看到文献本身的差异，而不是替你选定其中一种。\n'
        + '需要说清楚的一点：以上都是对历史文献的整理与呈现。它描述的是旧时通书的编排方式，不构成对你婚姻的任何预测或建议。真要办婚事，日期之外要考虑的事情——双方家庭、场地、季节、工作安排——都比一张月表重要得多。\n'
        + '范围也要讲清：这张月表在文献里只对应婚嫁与订盟。开业、签约、入宅并不套用这套规则，它们各自对应别的条目。',
      'Marriage months are a table in traditional almanacs: keyed to the bride\'s birth-year branch, it sorts the twelve lunar months into "great benefit", "small benefit" and "unsuitable" tiers. The table can be found in the literature around the Xieji Bianfang Shu; it is part of the calendrical record, not a verdict on any particular marriage.\n'
        + 'How is it read? Take a Mao year (1987, for instance): the literature lists the first and seventh lunar months as great benefit, the second and eighth as unsuitable, and sorts the rest into the small-benefit tier. It works by filing months into categories, not by judging people — change the person or the year and the tiers change with them.\n'
        + 'Why did old texts settle the month before the day? Because they treated the month as the "main rope" and the day as the "mesh": the month is the coarse filter, the day the fine one, and coarse-then-fine saves a great deal of computation. It is a search order, not a claim about whether the result comes true.\n'
        + 'Different texts read the same table with different strictness: some treat "unsuitable" as a note, others as a hard exclusion, and the in-law categories are handled differently from one almanac to the next. This app shows those readings side by side so you can see the disagreement in the literature — not to pick one for you.\n'
        + 'One thing to be explicit about: everything above is a summary and presentation of historical documents. It describes how old almanacs were organised. It is not a prediction about your marriage and not advice about it. For an actual wedding, the things that matter — both families, the venue, the season, work schedules — outweigh any month table.\n'
        + 'Scope matters too: in the literature this table applies to weddings and engagements only. Openings, signings and moving in follow other entries, not this one.',
      '「婚月」是傳統通書裡的一張月表：以女方出生年的地支為索引，把十二個月分成大利月、小利月、不宜月幾檔。這張表在《協紀辨方書》一系的文獻裡可以查到，屬於曆法文獻的一部分，不是對具體某個人婚姻前景的判斷。\n'
        + '表怎麼讀？以卯年（如 1987 年）為例，文獻把正月、七月列為大利月，二、八月列為不宜，其餘月份分入小利月一檔。讀法上它是「按月歸檔」，不是「按人推算」——換一個人、換一年，表上的檔位就跟著換。\n'
        + '為什麼舊式文獻先定月再定日？因為它們把月看作「綱」、日看作「目」，月的檔位在前的邏輯來自文獻體例本身：月是大顆粒度的篩選，日是小顆粒度的篩選，先粗後細可以少推很多天。這是一套檢索順序，與結果是否應驗無關。\n'
        + '不同文獻對同一張表的寬嚴並不一樣：有的只把「不宜」當參考，有的把它當硬性排除；翁姑月、女父母月這類名目在各本通書裡的處理也各不相同。本應用把這幾種讀法並列展示，是為了讓你看到文獻本身的差異，而不是替你選定其中一種。\n'
        + '需要說清楚的一點：以上都是對歷史文獻的整理與呈現。它描述的是舊時通書的編排方式，不構成對你婚姻的任何預測或建議。真要辦婚事，日期之外要考慮的事情——雙方家庭、場地、季節、工作安排——都比一張月表重要得多。\n'
        + '範圍也要講清：這張月表在文獻裡只對應婚嫁與訂盟。開業、簽約、入宅並不套用這套規則，它們各自對應別的條目。',
    ),
    translated: true,
  },
  {
    id: 4,
    title: l('1988 年夏天出生的人，出生时辰可能一直错了一小时', 'Born in a Chinese Summer, 1986–1991? Your Birth Hour May Be Off by an Hour', '1988 年夏天出生的人，出生時辰可能一直錯了一小時'),
    category: 'term.kbcat.xueli',
    minutes: 3,
    books: ['《星历考原》'],
    sub: l(
      '1986–1991 年，中国实行过六年夏令时。很多人的出生时刻，档案里记的是「夏令时」。',
      'China observed six years of daylight saving, 1986–1991. Many recorded birth times are still on summer time.',
      '1986–1991 年，中國實行過六年夏令時。很多人的出生時刻，檔案裡記的是「夏令時」。',
    ),
    translated: true,
  },
  {
    id: 5,
    title: l('餐饮开业：为什么「开炉」比「开门」更重', 'Opening a Restaurant: Why Lighting the Stove Beats Opening the Doors', '餐飲開業：為什麼「開爐」比「開門」更重'),
    category: 'term.kbcat.canyin',
    minutes: 4,
    books: ['《饮膳正要》', '《随园食单》'],
    sub: l(
      '灶火为业之根。开炉一刻即开市，故取火德与厨位坐向，先于门面。',
      'The stove is the root of the trade. Lighting it is the opening — fire virtue and kitchen orientation come before the facade.',
      '灶火為業之根。開爐一刻即開市，故取火德與廚位坐向，先於門面。',
    ),
    translated: true,
  },
  {
    id: 6,
    title: l('工地动土先看朝向：相冲为何是硬性排除', 'Earthworks and Orientation: Why a Direct Clash Is Absolute', '工地動土先看朝向：相衝為何是硬性排除'),
    category: 'term.kbcat.gongcheng',
    minutes: 5,
    books: ['《营造法式》', '《鲁班经匠家镜》'],
    sub: l(
      '日支冲建筑朝向，即朝向相冲。不是「不太顺」，是传统直接列为一票否决。',
      'When the day branch clashes with the building orientation, the literature excludes the day outright — not a minor blemish.',
      '日支沖建築朝向，即朝向相沖。不是「不太順」，是傳統直接列為一票否決。',
    ),
    translated: true,
  },
  {
    id: 7,
    title: l('节气月与农历月：一次错位，整月传统条目全错', 'Solar-Term Months vs Lunar Months: One Offset, a Month of Errors', '節氣月與農曆月：一次錯位，整月傳統條目全錯'),
    category: 'term.kbcat.xueli',
    minutes: 4,
    books: ['《星历考原》'],
    sub: l(
      '按月取的传统条目用节气月，不是农历初一。电子黄历最大的错，几乎都出在这里。',
      'Month-based spirits follow solar-term months, not the lunar new moon. Most digital almanac errors start here.',
      '按月取的傳統條目用節氣月，不是農曆初一。電子黃曆最大的錯，幾乎都出在這裡。',
    ),
    translated: true,
  },
  {
    id: 8,
    title: l('《协纪辨方书》怎么读：三十六卷的取用次第', 'How to Read the Xieji Bianfang Shu: Thirty-Six Volumes in Order', '《協紀辨方書》怎麼讀：三十六卷的取用次第'),
    category: 'term.kbcat.dianji',
    minutes: 6,
    books: ['《协纪辨方书》'],
    sub: l(
      '四库全书所收历法第一书。读它要按「本原—义例—宜忌—利用」四段走，不能跳。',
      'The foremost Qing treatise on selection. Read it in four passes — origins, definitions, daily entries, application — never skipping.',
      '四庫全書所收擇日第一書。讀它要按「本原—義例—宜忌—利用」四段走，不能跳。',
    ),
    translated: true,
  },
  {
    id: 9,
    title: l('医美机构开诊：生气与洁净', 'Opening a Clinic: Vitality and Cleanliness', '醫美機構開診：生氣與潔淨'),
    category: 'term.kbcat.yimei',
    minutes: 3,
    books: ['《黄帝内经·素问》'],
    sub: l(
      '医者属木主生。开诊取生气之日，忌月厌与节气交界日。',
      'Medicine belongs to Wood and governs life: open on vital days, avoiding month-avoidance days and solar-term boundaries.',
      '醫者屬木主生。開診取生氣之日，忌月厭與節氣交界日。',
    ),
    translated: true,
  },
  {
    id: 10,
    title: l('珠宝店开柜：藏与显的分寸', 'Opening the Jewelry Case: Concealment and Display', '珠寶店開櫃：藏與顯的分寸'),
    category: 'term.kbcat.lingshou',
    minutes: 3,
    books: ['《格古要论》'],
    sub: l(
      '珠玉属金主贵。开柜取「显」，忌闭日与月支相害——藏而不显，客不至。',
      'Gems belong to Metal and govern value: open for display, avoiding Close days and month-branch harm.',
      '珠玉屬金主貴。開櫃取「顯」，忌閉日與月支相害——藏而不顯，客不至。',
    ),
    translated: true,
  },
  {
    id: 11,
    title: l('教培开课取「启」与「序」', 'Opening a Classroom: Commencement and Sequence', '教培開課取「啟」與「序」'),
    category: 'term.kbcat.jiaoyu',
    minutes: 3,
    books: ['《学记》'],
    sub: l(
      '文教属木，重启蒙与次序。开日、成日为佳，闭日开课主学不进。',
      'Education belongs to Wood: commencement and order lead. Open and Completion days suit a first class.',
      '文教屬木，重啟蒙與次序。開日、成日為佳，閉日開課主學不進。',
    ),
    translated: false,
  },
  {
    id: 12,
    title: l('制造业开炉：成日与破日的一线之隔', 'Firing the Furnace: Completion and Break Days', '製造業開爐：成日與破日的一線之隔'),
    category: 'term.kbcat.zhizao',
    minutes: 4,
    books: ['《天工开物》', '《考工记》'],
    sub: l(
      '金工重「器成」。成日开炉器成，破日开炉器败——这是匠家的老规矩。',
      'Metalwork is about finished goods: fire on Completion days, never on Break days — the old workshop rule.',
      '金工重「器成」。成日開爐器成，破日開爐器敗——這是匠家的老規矩。',
    ),
    translated: false,
  },
  {
    id: 13,
    title: l('物流开仓取「动」与「通」', 'Opening a Warehouse: Movement and Flow', '物流開倉取「動」與「通」'),
    category: 'term.kbcat.wuliu',
    minutes: 3,
    books: ['《史记·货殖列传》'],
    sub: l(
      '流通属水主行。开日、除日为宜，闭日开仓主货滞。',
      'Distribution belongs to Water and governs movement: Open and Remove days suit a warehouse opening.',
      '流通屬水主行。開日、除日為宜，閉日開倉主貨滯。',
    ),
    translated: false,
  },
  {
    id: 14,
    title: l('金融开账：定日、成日与一个「信」字', 'Opening the Books: Stability, Completion, and Trust', '金融開賬：定日、成日與一個「信」字'),
    category: 'term.kbcat.jinrong',
    minutes: 3,
    books: ['《管子·轻重》'],
    sub: l(
      '金部重信与守。定日主安定，成日主成就，破日开账主账目纠纷。',
      'Finance governs trust and custody: Stability settles, Completion achieves, Break invites disputes.',
      '金部重信與守。定日主安定，成日主成就，破日開賬主賬目糾紛。',
    ),
    translated: false,
  },
  {
    id: 15,
    title: l('直播间上线为什么多用开日', 'Why Streamers Launch on Open Days', '直播間上線為什麼多用開日'),
    category: 'term.kbcat.chuanmei',
    minutes: 3,
    books: ['《文心雕龙》'],
    sub: l(
      '声光之业属火主显。开日主生发，首发多取开日、成日。',
      'Light and sound belong to Fire and govern visibility: Open days generate, so launches favor them.',
      '聲光之業屬火主顯。開日主生發，首發多取開日、成日。',
    ),
    translated: false,
  },
  {
    id: 16,
    title: l('双春年不宜结婚？这是个误会', 'Double-Spring Years and Marriage: A Misunderstanding', '雙春年不宜結婚？這是個誤會'),
    category: 'term.kbcat.hunjia',
    minutes: 3,
    books: ['《朱子家礼》'],
    sub: l(
      '这条被传了几十年，源头其实是「寡年」的说法，与双春无关。',
      'Repeated for decades, this taboo traces to the "widow year" notion — nothing to do with double spring.',
      '這條被傳了幾十年，源頭其實是「寡年」的說法，與雙春無關。',
    ),
    translated: false,
  },
  {
    id: 17,
    title: l('本命年真的不能结婚吗', 'Can You Marry in Your Birth-Sign Year?', '本命年真的不能結婚嗎'),
    category: 'term.kbcat.hunjia',
    minutes: 2,
    books: ['《三命通会》'],
    sub: l(
      '与当年地支相同，不等于不能办事。要看的是冲、刑、害，而不是「同支」。',
      'Sharing a branch with the year is not a bar. What matters is clash, punishment, and harm — not sameness.',
      '與當年地支相同，不等於不能辦事。要看的是沖、刑、害，而不是「同支」。',
    ),
    translated: false,
  },
  {
    id: 18,
    title: l('不将日：一套更宽松的嫁娶口径', 'Non-Contention Days: A More Permissive Marriage Reading', '不將日：一套更寬鬆的嫁娶口徑'),
    category: 'term.kbcat.hunjia',
    minutes: 4,
    books: ['《协纪辨方书》'],
    sub: l(
      '阴阳不将日不重婚月，适合不讲究女方月份的家庭。两套结论都给。',
      'Non-contention days set aside marriage months — for families that don\'t observe them. Both readings are given.',
      '陰陽不將日不重婚月，適合不講究女方月份的家庭。兩套結論都給。',
    ),
    translated: false,
  },
  {
    id: 19,
    title: l('杨公忌与三娘煞：两条民间口诀的来历', 'Yanggong Taboos and Sanniang Sha: Two Folk Rhymes', '楊公忌與三娘煞：兩條民間口訣的來歷'),
    category: 'term.kbcat.xueli',
    minutes: 3,
    books: ['《玉匣记》'],
    sub: l(
      '一条按月排，一条按日排，流传极广而说法不一，用时须先辨源流。',
      'One runs by month, one by day; both circulate widely with conflicting versions — trace the source first.',
      '一條按月排，一條按日排，流傳極廣而說法不一，用時須先辨源流。',
    ),
    translated: false,
  },
  {
    id: 20,
    title: l('中国历法与韩国历法：都在躲什么', 'Chinese and Korean Calendars: What Each Avoids', '中國曆法與韓國曆法：都在躲什麼'),
    category: 'term.kbcat.xueli',
    minutes: 5,
    books: ['《协纪辨方书》'],
    sub: l(
      '韩国人搬家避开 9 和 0 结尾的日子，日本人看六曜，华人看建除与传统条目。',
      'Koreans avoid days ending in 9 or 0 for moving; Japan reads the six days; Chinese read Jianchu and spirits.',
      '韓國人搬家避開 9 和 0 結尾的日子，日本人看六曜，華人看建除與傳統條目。',
    ),
    translated: false,
  },
  {
    id: 21,
    title: l('日本六曜与东南亚历法传统', 'Japan\'s Six Days and Southeast Asian Traditions', '日本六曜與東南亞曆法傳統'),
    category: 'term.kbcat.xueli',
    minutes: 4,
    books: ['《象吉通书》'],
    sub: l(
      '先胜、友引、先负、佛灭——六曜是一套独立循环，与建除不可混用。',
      'Sensho, Tomobiki, Senbu, Butsumetsu — the six days form an independent cycle, never mixed with Jianchu.',
      '先勝、友引、先負、佛滅——六曜是一套獨立循環，與建除不可混用。',
    ),
    translated: false,
  },
  {
    id: 22,
    title: l('《营造法式》里的时序：动土、上梁、安门', 'Timing in the Yingzao Fashi: Ground, Beam, Gate', '《營造法式》裡的時序：動土、上梁、安門'),
    category: 'term.kbcat.dianji',
    minutes: 5,
    books: ['《营造法式》'],
    sub: l(
      '宋人营造有严格工序与时序，上梁取时最严，安门次之，动土最宽。',
      'Song builders followed strict sequences: beam-setting is timed most strictly, gates next, earth-breaking loosest.',
      '宋人營造有嚴格工序與時序，上梁取時最嚴，安門次之，動土最寬。',
    ),
    translated: false,
  },
  {
    id: 23,
    title: l('《天工开物》与百工历法', 'The Tiangong Kaiwu and the Crafts\' Calendar', '《天工開物》與百工曆法'),
    category: 'term.kbcat.dianji',
    minutes: 4,
    books: ['《天工开物》'],
    sub: l(
      '宋应星记的是工艺，但每道工序的时令禁忌，恰好是百工历法的底本。',
      'Song Yingxing recorded craft processes; their seasonal taboos are the substrate of the crafts\' date selection.',
      '宋應星記的是工藝，但每道工序的時令禁忌，恰好是百工擇日的底本。',
    ),
    translated: false,
  },
  {
    id: 24,
    title: l('90 天区间只剩 5 天：一份完整的出局归因', 'Ninety Days Down to Five: A Complete Exclusion Reasoning', '90 天區間只剩 5 天：一份完整的出局歸因'),
    category: 'term.kbcat.xueli',
    minutes: 4,
    books: ['《选择宗镜》'],
    sub: l(
      '把筛选过程完整放出来，比任何自我介绍都更能证明专业。',
      'Publishing the full filtering process proves expertise better than any introduction.',
      '把篩選過程完整放出來，比任何自我介紹都更能證明專業。',
    ),
    translated: false,
  },
];

/** 按类别筛选知库篇目；'term.kbcat.all' 返回全部。 */
export function filterKbArticles(cat: TermKey): KbArticle[] {
  if (cat === 'term.kbcat.all') return KB_ARTICLES;
  return KB_ARTICLES.filter((a) => a.category === cat);
}

export const KB_CATS: TermKey[] = [
  'term.kbcat.all',
  'term.kbcat.xueli',
  'term.kbcat.hunjia',
  'term.kbcat.canyin',
  'term.kbcat.lingshou',
  'term.kbcat.yimei',
  'term.kbcat.jiaoyu',
  'term.kbcat.gongcheng',
  'term.kbcat.zhizao',
  'term.kbcat.wuliu',
  'term.kbcat.jinrong',
  'term.kbcat.chuanmei',
  'term.kbcat.dianji',
];

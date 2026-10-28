/**
 * data/cities.ts — 城市经纬度表：国内 24 城 + 海外约 40 城。
 * 时区仅作显示参考，真太阳时校正只用经度（架构 §1.5）。
 * 静态内置数据，不调用地理编码 API（保持离线可用）。
 */

export interface CityDef {
  id: string;
  zh: string;
  en: string;
  /** 经度（东经为正） */
  lon: number;
  /** 时区（小时） */
  tz: number;
  region: 'cn' | 'ea' | 'sea' | 'na' | 'eu' | 'oceania' | 'me';
}

export const CITIES: CityDef[] = [
  // 国内 24 城
  { id: 'beijing', zh: '北京', en: 'Beijing', lon: 116.41, tz: 8, region: 'cn' },
  { id: 'shanghai', zh: '上海', en: 'Shanghai', lon: 121.47, tz: 8, region: 'cn' },
  { id: 'guangzhou', zh: '广州', en: 'Guangzhou', lon: 113.26, tz: 8, region: 'cn' },
  { id: 'shenzhen', zh: '深圳', en: 'Shenzhen', lon: 114.06, tz: 8, region: 'cn' },
  { id: 'hangzhou', zh: '杭州', en: 'Hangzhou', lon: 120.15, tz: 8, region: 'cn' },
  { id: 'nanjing', zh: '南京', en: 'Nanjing', lon: 118.8, tz: 8, region: 'cn' },
  { id: 'chengdu', zh: '成都', en: 'Chengdu', lon: 104.07, tz: 8, region: 'cn' },
  { id: 'chongqing', zh: '重庆', en: 'Chongqing', lon: 106.55, tz: 8, region: 'cn' },
  { id: 'xian', zh: '西安', en: "Xi'an", lon: 108.94, tz: 8, region: 'cn' },
  { id: 'wuhan', zh: '武汉', en: 'Wuhan', lon: 114.3, tz: 8, region: 'cn' },
  { id: 'changsha', zh: '长沙', en: 'Changsha', lon: 112.94, tz: 8, region: 'cn' },
  { id: 'fuzhou', zh: '福州', en: 'Fuzhou', lon: 119.3, tz: 8, region: 'cn' },
  { id: 'wenzhou', zh: '温州', en: 'Wenzhou', lon: 120.7, tz: 8, region: 'cn' },
  { id: 'shantou', zh: '汕头', en: 'Shantou', lon: 116.68, tz: 8, region: 'cn' },
  { id: 'xiamen', zh: '厦门', en: 'Xiamen', lon: 118.09, tz: 8, region: 'cn' },
  { id: 'kunming', zh: '昆明', en: 'Kunming', lon: 102.83, tz: 8, region: 'cn' },
  { id: 'haerbin', zh: '哈尔滨', en: 'Harbin', lon: 126.53, tz: 8, region: 'cn' },
  { id: 'shenyang', zh: '沈阳', en: 'Shenyang', lon: 123.43, tz: 8, region: 'cn' },
  { id: 'wulumuqi', zh: '乌鲁木齐', en: 'Urumqi', lon: 87.62, tz: 8, region: 'cn' },
  { id: 'lasa', zh: '拉萨', en: 'Lhasa', lon: 91.14, tz: 8, region: 'cn' },
  { id: 'sanya', zh: '三亚', en: 'Sanya', lon: 109.51, tz: 8, region: 'cn' },
  { id: 'xianggang', zh: '香港', en: 'Hong Kong', lon: 114.17, tz: 8, region: 'cn' },
  { id: 'aomen', zh: '澳门', en: 'Macau', lon: 113.54, tz: 8, region: 'cn' },
  { id: 'taibei', zh: '台北', en: 'Taipei', lon: 121.56, tz: 8, region: 'cn' },
  // 东亚
  { id: 'seoul', zh: '首尔', en: 'Seoul', lon: 126.98, tz: 9, region: 'ea' },
  { id: 'busan', zh: '釜山', en: 'Busan', lon: 129.08, tz: 9, region: 'ea' },
  { id: 'tokyo', zh: '东京', en: 'Tokyo', lon: 139.69, tz: 9, region: 'ea' },
  { id: 'osaka', zh: '大阪', en: 'Osaka', lon: 135.5, tz: 9, region: 'ea' },
  { id: 'sapporo', zh: '札幌', en: 'Sapporo', lon: 141.35, tz: 9, region: 'ea' },
  // 东南亚
  { id: 'singapore', zh: '新加坡', en: 'Singapore', lon: 103.82, tz: 8, region: 'sea' },
  { id: 'kualalumpur', zh: '吉隆坡', en: 'Kuala Lumpur', lon: 101.69, tz: 8, region: 'sea' },
  { id: 'penang', zh: '槟城', en: 'Penang', lon: 100.33, tz: 8, region: 'sea' },
  { id: 'johor', zh: '新山', en: 'Johor Bahru', lon: 103.76, tz: 8, region: 'sea' },
  { id: 'bangkok', zh: '曼谷', en: 'Bangkok', lon: 100.5, tz: 7, region: 'sea' },
  { id: 'chiangmai', zh: '清迈', en: 'Chiang Mai', lon: 98.99, tz: 7, region: 'sea' },
  { id: 'hochiminh', zh: '胡志明市', en: 'Ho Chi Minh City', lon: 106.7, tz: 7, region: 'sea' },
  { id: 'hanoi', zh: '河内', en: 'Hanoi', lon: 105.83, tz: 7, region: 'sea' },
  { id: 'jakarta', zh: '雅加达', en: 'Jakarta', lon: 106.85, tz: 7, region: 'sea' },
  { id: 'surabaya', zh: '泗水', en: 'Surabaya', lon: 112.75, tz: 7, region: 'sea' },
  { id: 'manila', zh: '马尼拉', en: 'Manila', lon: 120.98, tz: 8, region: 'sea' },
  { id: 'phnompenh', zh: '金边', en: 'Phnom Penh', lon: 104.92, tz: 7, region: 'sea' },
  { id: 'yangon', zh: '仰光', en: 'Yangon', lon: 96.16, tz: 6.5, region: 'sea' },
  // 北美
  { id: 'losangeles', zh: '洛杉矶', en: 'Los Angeles', lon: -118.24, tz: -8, region: 'na' },
  { id: 'sandiego', zh: '圣迭戈', en: 'San Diego', lon: -117.16, tz: -8, region: 'na' },
  { id: 'sanfrancisco', zh: '旧金山', en: 'San Francisco', lon: -122.42, tz: -8, region: 'na' },
  { id: 'seattle', zh: '西雅图', en: 'Seattle', lon: -122.33, tz: -8, region: 'na' },
  { id: 'vancouver', zh: '温哥华', en: 'Vancouver', lon: -123.12, tz: -8, region: 'na' },
  { id: 'calgary', zh: '卡尔加里', en: 'Calgary', lon: -114.07, tz: -7, region: 'na' },
  { id: 'toronto', zh: '多伦多', en: 'Toronto', lon: -79.38, tz: -5, region: 'na' },
  { id: 'newyork', zh: '纽约', en: 'New York', lon: -74.01, tz: -5, region: 'na' },
  { id: 'boston', zh: '波士顿', en: 'Boston', lon: -71.06, tz: -5, region: 'na' },
  { id: 'chicago', zh: '芝加哥', en: 'Chicago', lon: -87.63, tz: -6, region: 'na' },
  { id: 'houston', zh: '休斯顿', en: 'Houston', lon: -95.37, tz: -6, region: 'na' },
  // 欧洲
  { id: 'london', zh: '伦敦', en: 'London', lon: -0.13, tz: 0, region: 'eu' },
  { id: 'manchester', zh: '曼彻斯特', en: 'Manchester', lon: -2.24, tz: 0, region: 'eu' },
  { id: 'paris', zh: '巴黎', en: 'Paris', lon: 2.35, tz: 1, region: 'eu' },
  // 大洋洲
  { id: 'sydney', zh: '悉尼', en: 'Sydney', lon: 151.21, tz: 10, region: 'oceania' },
  { id: 'melbourne', zh: '墨尔本', en: 'Melbourne', lon: 144.96, tz: 10, region: 'oceania' },
  { id: 'brisbane', zh: '布里斯班', en: 'Brisbane', lon: 153.03, tz: 10, region: 'oceania' },
  { id: 'auckland', zh: '奥克兰', en: 'Auckland', lon: 174.76, tz: 12, region: 'oceania' },
  // 中东
  { id: 'dubai', zh: '迪拜', en: 'Dubai', lon: 55.27, tz: 4, region: 'me' },
];

const CITY_MAP = new Map(CITIES.map((c) => [c.id, c]));

export function cityById(id: string | null): CityDef | null {
  if (!id) return null;
  return CITY_MAP.get(id) ?? null;
}

/** 按地区分组的展示顺序 */
export const CITY_REGION_ORDER: Array<{ region: CityDef['region']; labelZh: string; labelEn: string }> = [
  { region: 'cn', labelZh: '中国大陆及港澳台', labelEn: 'Greater China' },
  { region: 'sea', labelZh: '东南亚', labelEn: 'Southeast Asia' },
  { region: 'ea', labelZh: '东亚', labelEn: 'East Asia' },
  { region: 'na', labelZh: '北美', labelEn: 'North America' },
  { region: 'eu', labelZh: '欧洲', labelEn: 'Europe' },
  { region: 'oceania', labelZh: '大洋洲', labelEn: 'Oceania' },
  { region: 'me', labelZh: '中东', labelEn: 'Middle East' },
];

import { describe, expect, it } from 'vitest';
import { zhHant, s2t } from '../../src/i18n/zh-hant';
import { tx } from '../../src/i18n/format';
import { zh } from '../../src/i18n/zh';

describe('zh-Hant conversion spot checks', () => {
  it('key phrases', () => {
    expect(zhHant['person.birthDate']).toBe('出生日期');
    expect(zhHant['person.readingRaw']).toBe('原始鐘錶');
    expect(zhHant['lang.calGreg']).toBe('公曆');
    expect(zhHant['event.title']).toBe('選擇查詢場景');
    expect(zhHant['common.copy']).toBe('複製');
    expect(zhHant['scan.generic']).toBe('通用模式');
    expect(zhHant['eng.jianchu.po']).toContain('破日');
    expect(zhHant['onboard.s1Title']).toBe('為重要的日子\n做傳統曆法參考');
  });
  it('simplified originals differ', () => {
    expect(zh['home.cta']).toBe('新建查询');
    expect(zhHant['home.cta']).toBe('新建查詢');
  });
});

describe('tx — 组件内联文案三语', () => {
  it('en → 英文原文', () => {
    expect(tx('份档案', 'files', 'en')).toBe('files');
  });

  it('zh → 简体原文', () => {
    expect(tx('份档案', 'files', 'zh')).toBe('份档案');
  });

  it('zh-Hant → 逐字转繁体', () => {
    expect(tx('份档案', 'files', 'zh-Hant')).toBe('份檔案');
    expect(tx('仅存本机', 'on this device', 'zh-Hant')).toBe('僅存本機');
    expect(tx('开启', 'On', 'zh-Hant')).toBe('開啟');
  });

  it('zh-Hant 也走词组覆写（历法 → 曆法）', () => {
    expect(tx('语言与历法', 'Language & calendar', 'zh-Hant')).toBe('語言與曆法');
  });

  it('含插值的中文串同样可转', () => {
    expect(tx('共 3 重', '3 layers', 'zh-Hant')).toBe('共 3 重');
    expect(tx('起课 7 日后', 'start in 7d', 'zh-Hant')).toBe('起課 7 日後');
  });
});

describe('s2t — 词组覆写必须在字符转换「之前」生效', () => {
  // 回归：PHRASES 原在字符转换之后执行，键却是简体写法（如「农历」），
  // 转换后已变「農历」而永远匹配不上，导致繁体界面残留简体。
  it('历 → 曆（曆法义）', () => {
    expect(s2t('农历')).toBe('農曆');
    expect(s2t('公历')).toBe('公曆');
    expect(s2t('佛历')).toBe('佛曆');
    expect(s2t('日历')).toBe('日曆');
    expect(s2t('历法')).toBe('曆法');
    expect(s2t('黄历')).toBe('黃曆');
    expect(s2t('星历考')).toBe('星曆考');
    expect(s2t('历书')).toBe('曆書');
  });

  it('历 → 歷（经历义）走前置覆写', () => {
    expect(s2t('历史')).toBe('歷史');
    expect(s2t('来历')).toBe('來歷');
  });

  it('干 / 采 / 表 的一情多义不被误转', () => {
    expect(s2t('干支')).toBe('干支');
    expect(s2t('日干')).toBe('日干');
    expect(s2t('纳采')).toBe('納采');
    expect(s2t('钟表')).toBe('鐘錶');
    expect(s2t('时刻表')).toBe('時刻表');
    expect(s2t('复制')).toBe('複製');
  });
});

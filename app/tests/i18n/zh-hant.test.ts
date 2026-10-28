import { describe, expect, it } from 'vitest';
import { zhHant } from '../../src/i18n/zh-hant';
import { zh } from '../../src/i18n/zh';

describe('zh-Hant conversion spot checks', () => {
  it('key phrases', () => {
    expect(zhHant['person.birthDate']).toBe('出生日期');
    expect(zhHant['person.readingRaw']).toBe('原始鐘錶');
    expect(zhHant['lang.calGreg']).toBe('公曆');
    expect(zhHant['event.title']).toBe('選擇用事');
    expect(zhHant['common.copy']).toBe('複製');
    expect(zhHant['scan.generic']).toBe('通用模式');
    expect(zhHant['eng.jianchu.po']).toContain('破日');
    expect(zhHant['onboard.s1Title']).toBe('為每一件大事\n挑一個對的日子');
  });
  it('simplified originals differ', () => {
    expect(zh['home.cta']).toBe('开始择日');
    expect(zhHant['home.cta']).toBe('開始擇日');
  });
});

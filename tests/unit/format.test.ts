import BigNumber from 'bignumber.js';
import { describe, expect, it } from 'vitest';
import {
  formatTokenAmount,
  parseUnits,
  stroopToXlm,
  truncateString,
  twoDecimalsPercentage,
  xlmToStroop,
} from '../../src/helpers/format';

describe('format helpers', () => {
  it('converts between stroops and XLM', () => {
    expect(stroopToXlm('10000000').toString()).toBe('1');
    expect(xlmToStroop('1.5').toString()).toBe('15000000');
    expect(stroopToXlm(BigNumber(5_000_000)).toNumber()).toBe(0.5);
  });

  it('formats token amounts with the requested decimals', () => {
    expect(formatTokenAmount(1000000001)).toBe('100.0000001');
    expect(formatTokenAmount('2000000', 7)).toBe('0.2');
    expect(formatTokenAmount(0)).toBe('0');
  });

  it('parses units and trims percentages', () => {
    expect(parseUnits('1.25', 7).toString()).toBe('12500000');
    expect(twoDecimalsPercentage('0.01234')).toBe(1.23);
  });

  it('truncates addresses without throwing on empty input', () => {
    expect(truncateString('GCHR5WWPDFF3U3HP2NA6TI6FCQPYEWS3UOPIPJKZLAAFM57CEG4ZYBWP')).toBe(
      'GCHR5…ZYBWP',
    );
    expect(truncateString('')).toBe('');
  });
});

import BigNumber from 'bignumber.js';
import { describe, expect, it } from 'vitest';
import fromExactInputGetExpectedOutput from '../../src/functions/fromExactInputGetExpectedOutput';
import fromExactOutputGetExpectedInput from '../../src/functions/fromExactOutputGetExpectedInput';

describe('fromExactInputGetExpectedOutput', () => {
  it('applies the 0.3% fee using reserveIn then reserveOut', () => {
    const reserveIn = BigNumber(1_000_000);
    const reserveOut = BigNumber(2_000_000);
    const amountIn = BigNumber(1_000);

    const result = fromExactInputGetExpectedOutput(amountIn, reserveIn, reserveOut);
    const expected = (1_000 * 997 * 2_000_000) / (1_000_000 * 1_000 + 1_000 * 997);

    expect(result.toNumber()).toBeCloseTo(expected, 5);
  });

  it('returns zero for missing amounts or empty reserves', () => {
    expect(fromExactInputGetExpectedOutput(undefined, BigNumber(1), BigNumber(1)).toNumber()).toBe(0);
    expect(fromExactInputGetExpectedOutput(BigNumber(1), BigNumber(0), BigNumber(1)).toNumber()).toBe(0);
    expect(fromExactInputGetExpectedOutput(BigNumber(1), BigNumber(1), BigNumber(0)).toNumber()).toBe(0);
  });
});

describe('fromExactOutputGetExpectedInput', () => {
  it('treats the second argument as reserveIn and the third as reserveOut', () => {
    const reserveIn = BigNumber(1_000_000);
    const reserveOut = BigNumber(2_000_000);
    const amountOut = BigNumber(1_000);

    const result = fromExactOutputGetExpectedInput(amountOut, reserveIn, reserveOut);
    const expected =
      (1_000_000 * 1_000 * 1_000) / ((2_000_000 - 1_000) * 997) + 1;

    expect(result.toNumber()).toBeCloseTo(expected, 5);
    expect(
      fromExactOutputGetExpectedInput(amountOut, reserveOut, reserveIn).isEqualTo(result),
    ).toBe(false);
  });

  it('returns zero for missing amounts or empty reserves', () => {
    expect(fromExactOutputGetExpectedInput(undefined, BigNumber(1), BigNumber(1)).toNumber()).toBe(0);
    expect(fromExactOutputGetExpectedInput(BigNumber(1), BigNumber(0), BigNumber(1)).toNumber()).toBe(0);
    expect(fromExactOutputGetExpectedInput(BigNumber(1), BigNumber(1), BigNumber(0)).toNumber()).toBe(0);
  });
});

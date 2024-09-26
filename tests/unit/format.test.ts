import { describe, expect, it } from 'vitest';
import { centsToDollars, dollarsToCents, formatMoney, formatMonth, percentChange } from '../../src/lib/format';

describe('format', () => {
  it('formats cents as currency', () => {
    expect(formatMoney(4200)).toBe('$42.00');
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney(123456)).toBe('$1,234.56');
  });

  it('round-trips dollars and cents', () => {
    expect(dollarsToCents('24.50')).toBe(2450);
    expect(dollarsToCents('0.1')).toBe(10);
    expect(Number.isNaN(dollarsToCents('abc'))).toBe(true);
    expect(centsToDollars(1999)).toBe('19.99');
    expect(centsToDollars(null)).toBe('');
  });
});

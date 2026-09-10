import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatMoney } from '../money';

describe('formatMoney', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formats whole and fractional amounts', () => {
    expect(formatMoney(2200)).toBe('$22.00');
    expect(formatMoney(550)).toBe('$5.50');
    expect(formatMoney(1)).toBe('$0.01');
  });

  it('groups thousands', () => {
    // The reason this function exists. The `toFixed(2)` implementations it
    // replaces rendered this as "$1234.56".
    expect(formatMoney(123456)).toBe('$1,234.56');
    expect(formatMoney(100000000)).toBe('$1,000,000.00');
  });

  it('shows zero as a price by default', () => {
    expect(formatMoney(0)).toBe('$0.00');
  });

  it('substitutes for zero only when asked', () => {
    expect(formatMoney(0, { zeroAs: 'Free' })).toBe('Free');
    expect(formatMoney(1, { zeroAs: 'Free' })).toBe('$0.01');
  });

  it('rounds half-cents the way the platform fee calculation expects', () => {
    // Fees are rounded to whole cents before reaching here, so this only
    // guards against a fractional value slipping through.
    expect(formatMoney(1050.4)).toBe('$10.50');
  });

  it('honours a different currency', () => {
    expect(formatMoney(2200, { currency: 'EUR' })).toBe('€22.00');
    expect(formatMoney(2200, { currency: 'eur' })).toBe('€22.00');
  });

  it('reports a non-finite amount rather than rendering "$NaN"', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(formatMoney(Number.NaN)).toBe('$0.00');
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe('$0.00');
    expect(error).toHaveBeenCalledTimes(2);
  });

  it('handles a negative amount, for refunds and reversals', () => {
    expect(formatMoney(-2200)).toBe('-$22.00');
  });
});

/**
 * Formatting money for display.
 *
 * There were four implementations of this before: a `formatPrice` used in seven
 * places, two separate `formatCurrency` definitions, and around fifteen inline
 * `(cents / 100).toFixed(2)` expressions. They disagreed in ways a user could
 * see — the `Intl` versions produce `$1,234.56` while `toFixed` produces
 * `$1234.56`, so a product over $999 was displayed differently depending on
 * which page you were looking at. Some sites prefixed `$`, others `USD `.
 *
 * Money is stored as integer cents everywhere in this codebase. It is never a
 * float, and this is the only place it becomes a string.
 */

/** Cache formatters: constructing an Intl.NumberFormat is not cheap. */
const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string, locale: string): Intl.NumberFormat {
  const key = `${locale}:${currency}`;
  let formatter = formatters.get(key);

  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
    formatters.set(key, formatter);
  }

  return formatter;
}

export interface FormatMoneyOptions {
  /** ISO 4217 code. Defaults to USD, which is all the platform supports today. */
  currency?: string;
  /** BCP 47 tag. Fixed by default so server and client render identically. */
  locale?: string;
  /**
   * What to show for zero. Marketplaces usually say "Free" rather than "$0.00",
   * but a receipt or a balance should say the number.
   */
  zeroAs?: string;
}

/**
 * Format an integer number of cents.
 *
 * @example formatMoney(2200)                  // "$22.00"
 * @example formatMoney(123456)                // "$1,234.56"
 * @example formatMoney(0, { zeroAs: 'Free' }) // "Free"
 */
export function formatMoney(cents: number, options: FormatMoneyOptions = {}): string {
  const { currency = 'USD', locale = 'en-US', zeroAs } = options;

  if (cents === 0 && zeroAs !== undefined) return zeroAs;

  // A non-finite value here means an upstream calculation went wrong. Rendering
  // "$NaN" to a buyer is worse than rendering nothing meaningful, but silently
  // showing 0 would hide the fault — so it is reported and shown as zero.
  if (!Number.isFinite(cents)) {
    console.error(`formatMoney received a non-finite value: ${cents}`);
    return formatterFor(currency, locale).format(0);
  }

  return formatterFor(currency, locale).format(cents / 100);
}

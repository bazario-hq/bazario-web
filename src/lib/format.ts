import moment from 'moment';
import 'moment/min/locales';

// BZR-233: show dates in the shopper's language (we have a lot of si/ta customers).
moment.locale(typeof navigator !== 'undefined' ? [...navigator.languages, 'en'] : ['en']);

const moneyFormats = new Map<string, Intl.NumberFormat>();

export function formatMoney(cents: number, currency = 'USD') {
  let fmt = moneyFormats.get(currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency });
    moneyFormats.set(currency, fmt);
  }
  return fmt.format(cents / 100);
}

export function formatDate(value: string | Date) {
  return moment(value).format('ll');
}

export function formatDateTime(value: string | Date) {
  return moment(value).format('lll');
}

export function fromNow(value: string | Date) {
  return moment(value).fromNow();
}

export function formatMonth(value: string) {
  return moment(value, 'YYYY-MM').format('MMM YYYY');
}

export function formatNumber(n: number) {
  return n.toLocaleString('en-US');
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function dollarsToCents(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

export function centsToDollars(cents: number | null | undefined) {
  return cents == null ? '' : (cents / 100).toFixed(2);
}

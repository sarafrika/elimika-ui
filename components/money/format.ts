/** The one money and date format for every money screen: "KES 12,500", "17 Oct 2026, 23:19" (EAT). */

const TIME_ZONE = 'Africa/Nairobi';

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatMoney(value: number | string | null | undefined, currency = 'KES'): string {
  const n = toNumber(value);
  if (n === null) return '—';
  const hasCents = Math.round(Math.abs(n) * 100) % 100 !== 0;
  const digits = new Intl.NumberFormat('en-KE', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(n));
  return `${n < 0 ? '−' : ''}${currency} ${digits}`;
}

/** "+ KES 2,700" for money in, "− KES 300" for money out. */
export function formatSignedMoney(
  value: number | string | null | undefined,
  direction: 'in' | 'out',
  currency = 'KES'
): string {
  const n = toNumber(value);
  if (n === null) return '—';
  return `${direction === 'in' ? '+' : '−'} ${formatMoney(Math.abs(n), currency)}`;
}

export function formatMoneyDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return `${part('day')} ${part('month')} ${part('year')}, ${part('hour')}:${part('minute')}`;
}

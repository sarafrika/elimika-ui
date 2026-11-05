/** Formatting shared by every checkout screen, so a price or phone reads the same everywhere. */

/** Sarafrika's M-Pesa PayBill. The account number is the order number (ELM-…). */
export const MPESA_PAYBILL = '4953892';
export const MPESA_BUSINESS_NAME = 'SARAFRIKA PRODUCTIONS';

/** How long Safaricom keeps an STK prompt open on the phone. */
export const PROMPT_LIFETIME_SECONDS = 60;
/** A second prompt too soon only collides with the first one still on the phone. */
export const RESEND_AFTER_SECONDS = 20;

/** Whole shillings with thousands separators: `KES 10,500`. */
export function formatAmount(amount: number | string | null | undefined, currency = 'KES'): string {
  const value = typeof amount === 'string' ? Number.parseFloat(amount) : (amount ?? 0);
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  return `${(currency || 'KES').toUpperCase()} ${safe.toLocaleString('en-KE')}`;
}

/**
 * Normalise a Kenyan mobile number to `2547XXXXXXXX` / `2541XXXXXXXX`.
 * Accepts `07…`, `01…`, `+254…`, `254…` and the 9-digit local form. Null when invalid.
 */
export function normalizeMsisdn(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let n = raw.replace(/[\s()-]/g, '').replace(/^\+/, '');
  if (n.startsWith('0')) n = `254${n.slice(1)}`;
  else if ((n.startsWith('7') || n.startsWith('1')) && n.length === 9) n = `254${n}`;
  return /^254[17]\d{8}$/.test(n) ? n : null;
}

/** `254712345678` → `0712 *** 678`, the only way a number is ever shown back. */
export function maskMsisdn(msisdn: string | null | undefined): string {
  const n = normalizeMsisdn(msisdn ?? '');
  if (!n) return '';
  const local = `0${n.slice(3)}`;
  return `${local.slice(0, 4)} *** ${local.slice(7)}`;
}

/** Seconds as `0:42`. */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

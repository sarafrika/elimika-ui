/**
 * Client-side checks for an SMS template, mirroring the server's rules so an admin sees
 * what will be refused before saving. Pure functions only: the page renders the result.
 */

export interface SmsPlaceholder {
  name: string;
  label: string;
  sample: string;
  max_length: number;
  required: boolean;
}

export type SmsIssueTone = 'error' | 'warning' | 'ok';

export interface SmsIssue {
  tone: SmsIssueTone;
  tag: string;
  text: string;
}

export interface SmsAnalysis {
  issues: SmsIssue[];
  /** Any error-level issue: the server would refuse this wording. */
  blocking: boolean;
  /** Length with every placeholder at its longest. */
  worstLength: number;
  /** 160 for plain SMS text, 70 once a non-GSM-7 character is present. */
  limit: number;
  segments: number;
  /** The message as the sample values fill it. */
  preview: string;
  /** Placeholder names that appear in the text, in order, without repeats. */
  used: string[];
}

const TOKEN = /\{([a-z_]+)\}/g;
const GSM7 =
  /^[A-Za-z0-9 \n\r@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~\]|€]$/;

/** Placeholder names written in the text, without repeats. */
export function placeholdersIn(text: string): string[] {
  return [...new Set(Array.from(text.matchAll(TOKEN), match => match[1] ?? ''))];
}

/** Characters outside the GSM-7 set, which force the whole message to 70-char segments. */
export function nonGsmCharacters(text: string): string[] {
  const bare = text.replace(TOKEN, '');
  return [...new Set(Array.from(bare).filter(ch => !GSM7.test(ch)))];
}

/** Fill each placeholder with its sample, or with its worst-case length. */
export function fillPlaceholders(
  text: string,
  placeholders: SmsPlaceholder[],
  mode: 'sample' | 'worst'
): string {
  const byName = new Map(placeholders.map(p => [p.name, p]));
  return text.replace(TOKEN, (whole, name: string) => {
    const placeholder = byName.get(name);
    if (!placeholder) return whole;
    return mode === 'worst' ? 'X'.repeat(placeholder.max_length) : placeholder.sample;
  });
}

export function segmentCount(length: number, unicode: boolean): number {
  const single = unicode ? 70 : 160;
  if (length <= single) return 1;
  return Math.ceil(length / (unicode ? 67 : 153));
}

export function analyseSmsTemplate(
  text: string,
  placeholders: SmsPlaceholder[],
  security: boolean
): SmsAnalysis {
  const allowed = new Set(placeholders.map(p => p.name));
  const used = placeholdersIn(text);
  const unknown = used.filter(name => !allowed.has(name));
  const missing = placeholders.filter(p => p.required && !used.includes(p.name));
  const stray = /[{}]/.test(text.replace(TOKEN, ''));
  const unicode = nonGsmCharacters(text);
  const worstLength = fillPlaceholders(text, placeholders, 'worst').length;
  const limit = unicode.length ? 70 : 160;

  const issues: SmsIssue[] = [];
  if (!text.trim()) {
    issues.push({ tone: 'error', tag: 'Empty', text: 'The message cannot be empty.' });
  }
  for (const name of unknown) {
    issues.push({
      tone: 'error',
      tag: 'Unknown',
      text: `{${name}} is not available for this message. Use one from Placeholders.`,
    });
  }
  for (const placeholder of missing) {
    issues.push({
      tone: 'error',
      tag: 'Required',
      text: `{${placeholder.name}} must stay in this message${
        security ? ' — without it the code never reaches the user.' : '.'
      }`,
    });
  }
  if (stray) {
    issues.push({ tone: 'error', tag: 'Braces', text: 'A { or } is not part of a placeholder.' });
  }
  if (unicode.length) {
    issues.push({
      tone: 'warning',
      tag: 'Characters',
      text: `Not plain SMS text: ${unicode.join(' ')} — the whole message drops to 70-character segments. Use a plain hyphen or quote.`,
    });
  }
  if (worstLength > 160) {
    issues.push({
      tone: unicode.length ? 'warning' : 'error',
      tag: 'Length',
      text: `Worst case is ${worstLength} characters, more than one SMS (160).`,
    });
  }
  if (!issues.length) {
    issues.push({
      tone: 'ok',
      tag: 'Good',
      text: `Only allowed placeholders, and one SMS at ${worstLength} characters worst case.`,
    });
  }

  return {
    issues,
    blocking: issues.some(issue => issue.tone === 'error'),
    worstLength,
    limit,
    segments: segmentCount(worstLength, unicode.length > 0),
    preview: fillPlaceholders(text, placeholders, 'sample'),
    used,
  };
}

/** Insert `{name}` at the caret, padding with spaces so it never fuses with a word. */
export function insertPlaceholder(
  text: string,
  name: string,
  at: number = text.length
): { text: string; caret: number } {
  const position = Math.max(0, Math.min(at, text.length));
  const before = text.slice(0, position);
  const after = text.slice(position);
  const lead = before && !/\s$/.test(before) ? ' ' : '';
  const trail = after && !/^[\s.,!?;:]/.test(after) ? ' ' : '';
  const token = `${lead}{${name}}${trail}`;
  return { text: before + token + after, caret: position + token.length };
}

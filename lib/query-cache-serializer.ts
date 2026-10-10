import type { PersistedClient } from '@tanstack/react-query-persist-client';
import { logger } from '@/lib/logger';

const BIGINT_TAG = '$bigint';
const DATE_TAG = '$date';

let reportedFailure = false;

// A function replacer sees the raw value via this[key], before Date#toJSON runs.
function replacer(this: Record<string, unknown>, key: string, value: unknown): unknown {
  const raw = this[key];
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : { [DATE_TAG]: raw.toISOString() };
  }
  if (typeof value === 'bigint') return { [BIGINT_TAG]: value.toString() };
  return value;
}

function singleTag(value: object): [string, unknown] | undefined {
  const keys = Object.keys(value);
  if (keys.length !== 1) return undefined;
  const key = keys[0] as string;
  return key === BIGINT_TAG || key === DATE_TAG
    ? [key, (value as Record<string, unknown>)[key]]
    : undefined;
}

function reviver(_key: string, value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const tag = singleTag(value);
  if (!tag || typeof tag[1] !== 'string') return value;
  const [name, text] = tag as [string, string];
  if (name === BIGINT_TAG && /^-?\d+$/.test(text)) return BigInt(text);
  if (name === DATE_TAG) {
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? value : date;
  }
  return value;
}

/** JSON for the persisted query snapshot that keeps BigInt and Date values intact. */
export function serializeQueryCache(value: unknown): string {
  try {
    return JSON.stringify(value, replacer);
  } catch (error) {
    if (!reportedFailure) {
      reportedFailure = true;
      logger.warn('Query cache snapshot could not be serialized', { error: String(error) });
    }
    throw error;
  }
}

export function deserializeQueryCache(text: string): PersistedClient {
  return JSON.parse(text, reviver) as PersistedClient;
}

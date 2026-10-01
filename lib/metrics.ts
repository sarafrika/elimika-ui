type NumericLike = number | bigint | string | null | undefined;

const hasValue = (value: NumericLike): boolean =>
  value !== null && value !== undefined && value !== '';

export const toNumber = (value: NumericLike, fallback = 0): number => {
  if (!hasValue(value)) {
    return fallback;
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  return fallback;
};

export const formatCount = (value: NumericLike, fallback = '—'): string => {
  if (!hasValue(value)) {
    return fallback;
  }

  if (typeof value === 'bigint') {
    return value.toLocaleString();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString();
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed.toLocaleString();
    }
  }

  return fallback;
};

type UnknownRecord = Record<string, unknown>;

export function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value === 'object' && value !== null) {
    return value as UnknownRecord;
  }

  return null;
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return getStringValue(error.message) ?? fallback;
  }

  const errorRecord = asRecord(error);
  if (!errorRecord) {
    return fallback;
  }

  return (
    getStringValue(errorRecord.message) ??
    getStringValue(asRecord(errorRecord.error)?.message) ??
    getStringValue(asRecord(errorRecord.data)?.message) ??
    getStringValue(errorRecord.error) ??
    fallback
  );
}

export function getFieldErrorMessage(error: unknown, field: string): string | undefined {
  const errorRecord = asRecord(error);
  const nestedErrorRecord = asRecord(errorRecord?.error);
  const fieldValue = nestedErrorRecord?.[field] ?? errorRecord?.[field];
  const fieldRecord = asRecord(fieldValue);

  return (
    getStringValue(fieldValue) ??
    getStringValue(fieldRecord?.message) ??
    getStringValue(asRecord(fieldRecord?.error)?.message)
  );
}

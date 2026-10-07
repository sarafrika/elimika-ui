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

function getValidationMessages(value: unknown): string[] {
  const message = getStringValue(value);
  if (message) return [message];
  if (Array.isArray(value)) return value.flatMap(getValidationMessages);

  const record = asRecord(value);
  if (!record) return [];
  const nestedMessage = getStringValue(record.message);
  if (nestedMessage) return [nestedMessage];
  return Object.values(record).flatMap(getValidationMessages);
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return getStringValue(error.message) ?? fallback;
  }

  const message = getStringValue(error);
  if (message) return message;

  const errorRecord = asRecord(error);
  if (!errorRecord) {
    return fallback;
  }

  const validationMessages = getValidationMessages(errorRecord.error ?? errorRecord.errors);
  if (validationMessages.length > 0) return validationMessages.join('\n');

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

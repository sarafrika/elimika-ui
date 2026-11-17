type UnknownRecord = Record<string, unknown>;

export function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value === 'object' && value !== null) {
    return value as UnknownRecord;
  }

  return null;
}

function getStringValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const message = value.trim();
  return message && !/^validation failed[.!]?$/i.test(message) ? message : undefined;
}

const errorMetadata = new Set([
  'ref', 'type', 'status', 'success', 'code', 'timestamp', 'path', 'field',
  'rejectedValue', 'objectName', 'stack', 'name', 'target',
]);

function getValidationMessages(value: unknown, seen: Set<object>, fieldMap = false): string[] {
  const message = getStringValue(value);
  if (message) return [message];
  const record = asRecord(value);
  if (!record || seen.has(record)) return [];
  seen.add(record);
  if (Array.isArray(value)) return value.flatMap(item => getValidationMessages(item, seen, fieldMap));

  const details = ['error', 'errors', 'data', 'response', 'cause'].flatMap(key =>
    getValidationMessages(record[key], seen, key === 'error' || key === 'errors')
  );
  if (details.length) return details;
  const nestedMessage = getStringValue(record.message);
  if (nestedMessage) return [nestedMessage];
  const detail = getStringValue(record.detail);
  if (detail) return [detail];
  return Object.entries(record).flatMap(([key, item]) =>
    key === 'ref' || (!fieldMap && errorMetadata.has(key)) ? [] : getValidationMessages(item, seen)
  );
}

export function getErrorMessage(error: unknown, fallback: string): string {
  const message = getStringValue(error);
  if (message) return message;

  const errorRecord = asRecord(error);
  if (!errorRecord) {
    return fallback;
  }

  const seen = new Set<object>([errorRecord]);
  const validationMessages = ['error', 'errors', 'response', 'data', 'cause'].flatMap(key =>
    getValidationMessages(errorRecord[key], seen, key === 'error' || key === 'errors')
  );
  if (validationMessages.length > 0) return [...new Set(validationMessages)].join('\n');

  return (
    getStringValue(errorRecord.message) ??
    getStringValue(errorRecord.detail) ??
    fallback
  );
}

export function getFieldErrorMessage(error: unknown, field: string): string | undefined {
  const seen = new Set<object>();
  const find = (value: unknown): string | undefined => {
    const record = asRecord(value);
    if (!record || seen.has(record)) return undefined;
    seen.add(record);
    const messages = getValidationMessages(record[field], new Set());
    if (messages.length) return [...new Set(messages)].join('\n');
    for (const key of ['error', 'errors', 'response', 'data', 'cause']) {
      const message = find(record[key]);
      if (message) return message;
    }
    return undefined;
  };
  return find(error);
}

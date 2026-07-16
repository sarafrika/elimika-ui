import dayjs from 'dayjs';

/**
 * Normalised view of one conflicting occurrence, whether it came from the
 * resource booking engine (`ResourceConflictDetail`) or the class scheduling
 * checks (`ClassSchedulingConflict`).
 */
export type ConflictItem = {
  start?: string;
  end?: string;
  reasons: string[];
};

type ApiErrorBody = {
  success?: boolean;
  message?: string;
  error?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asDateLabel(value: unknown): string | undefined {
  if (typeof value !== 'string' && !(value instanceof Date)) return undefined;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('ddd, D MMM YYYY HH:mm') : undefined;
}

function toConflictItem(entry: unknown): ConflictItem | null {
  if (!isRecord(entry)) return null;

  const reasons: string[] = [];
  if (Array.isArray(entry.reasons)) {
    for (const reason of entry.reasons) {
      if (typeof reason === 'string') reasons.push(reason);
    }
  }
  if (typeof entry.description === 'string') {
    reasons.push(entry.description);
  }
  if (reasons.length === 0 && typeof entry.conflict_type === 'string') {
    reasons.push(String(entry.conflict_type).replaceAll('_', ' ').toLowerCase());
  }

  const start = asDateLabel(entry.requested_start);
  const end = asDateLabel(entry.requested_end);
  if (!start && !end && reasons.length === 0) return null;

  return { start, end, reasons };
}

/**
 * Parses a thrown HeyAPI error into a conflict report when the backend answered
 * 409 with `ApiResponse{message, error: [conflicts]}`. Returns null for any
 * other error shape so callers can fall back to the generic toast.
 */
export function parseConflictError(error: unknown): { message: string; conflicts: ConflictItem[] } | null {
  if (!isRecord(error)) return null;

  const body = error as ApiErrorBody;
  if (!Array.isArray(body.error) || body.error.length === 0) return null;

  const conflicts = body.error
    .map(toConflictItem)
    .filter((item): item is ConflictItem => item !== null);
  if (conflicts.length === 0) return null;

  return {
    message: typeof body.message === 'string' ? body.message : 'Scheduling conflicts detected',
    conflicts,
  };
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (isRecord(error) && typeof (error as ApiErrorBody).message === 'string') {
    return (error as ApiErrorBody).message as string;
  }
  return fallback;
}

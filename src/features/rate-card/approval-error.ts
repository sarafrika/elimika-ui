import { asRecord, getErrorMessage } from '@/lib/error-utils';

const UUID = /\b[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\b/gi;
const MISSING_COURSES = 'Missing approvals for courses:';

/** Only translate this known approval failure; preserve all other API messages. */
export async function approvalErrorMessage(
  error: unknown,
  fallback: string,
  resolveNames: (ids: string[]) => Promise<Record<string, string>>
): Promise<string> {
  const apiMessage = asRecord(error)?.message;
  const message =
    typeof apiMessage === 'string' && apiMessage.includes(MISSING_COURSES)
      ? apiMessage
      : getErrorMessage(error, fallback);
  const start = message.indexOf(MISSING_COURSES);
  if (start < 0) return message;
  const ids = [
    ...new Set(
      (message.slice(start + MISSING_COURSES.length).match(UUID) ?? []).map(id => id.toLowerCase())
    ),
  ];
  if (!ids.length) return message;
  try {
    const names = await resolveNames(ids);
    return message.replace(UUID, id => names[id.toLowerCase()] || id);
  } catch {
    // A failed name lookup must not replace or hide the actual approval failure.
    return message;
  }
}

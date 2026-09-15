import { parseApiDate } from '@/lib/date';

export function isValidGrade(value: string, maximum: number) {
  const score = Number(value);
  return (
    value.trim() !== '' &&
    Number.isFinite(score) &&
    Number.isFinite(maximum) &&
    maximum > 0 &&
    score >= 0 &&
    score <= maximum
  );
}

export function newestSubmissionsFirst<T extends { submitted_at?: Date | null }>(items: T[]) {
  return [...items].sort(
    (a, b) =>
      (parseApiDate(b.submitted_at)?.valueOf() ?? 0) -
      (parseApiDate(a.submitted_at)?.valueOf() ?? 0)
  );
}

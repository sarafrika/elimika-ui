const RESULT_LABELS: Record<string, string> = {
  IN_PROGRESS: 'In progress',
  PASSED: 'Passed',
  FAILED: 'Did not pass',
};

/** A course result in words; the API sends IN_PROGRESS until every required item is graded. */
export function resultLabel(status?: string | null) {
  return RESULT_LABELS[(status ?? 'IN_PROGRESS').toUpperCase()] ?? 'In progress';
}

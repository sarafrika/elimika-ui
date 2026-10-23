import type { AssessmentResultRow, AssessmentRow } from './assessment-list-data';

export type CompetencySummary = {
  competency: string;
  assessed: number;
  achieved: number;
  developing: number;
  notAchieved: number;
};

/** Assessment titles are indicators until criteria-level competency outcomes are available.
 * Count each learner's latest result once per assessment/class, even with repeated schedules.
 * Grades without explicit pass/fail outcomes remain developing rather than guessing a cutoff.
 */
export function summarizeAssessmentCompetencies(
  assessments: AssessmentRow[],
  results: AssessmentResultRow[]
): CompetencySummary[] {
  const assessmentKey = (row: AssessmentRow) => `${row.kind}:${row.uuid}:${row.classMeta.uuid}`;
  const selected = new Map(assessments.map(row => [assessmentKey(row), row]));
  const summaries = new Map<string, CompetencySummary>();
  for (const assessment of selected.values()) {
    if (!summaries.has(assessment.title)) {
      summaries.set(assessment.title, {
        competency: assessment.title,
        assessed: 0,
        achieved: 0,
        developing: 0,
        notAchieved: 0,
      });
    }
  }
  const seen = new Set<string>();
  for (const result of results) {
    const key = assessmentKey(result.assessment);
    const identity = `${key}:${result.enrollmentUuid}`;
    if (!selected.has(key) || seen.has(identity)) continue;
    seen.add(identity);
    const summary = summaries.get(result.assessment.title);
    if (!summary) continue;
    summary.assessed += 1;
    if (result.passed === true) summary.achieved += 1;
    else if (result.passed === false) summary.notAchieved += 1;
    else summary.developing += 1;
  }
  return [...summaries.values()].sort(
    (a, b) => b.achieved - a.achieved || a.competency.localeCompare(b.competency)
  );
}

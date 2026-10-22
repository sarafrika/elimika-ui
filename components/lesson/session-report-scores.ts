import type { CourseGradeBand, RowDto, SessionReport } from '@/services/client/types.gen';

export type ReportTaskMark = {
  id: string;
  kind: 'assignment' | 'quiz';
  title: string;
  status?: string;
  score?: number;
  maxScore?: number;
};

export type ReportStudentScore = {
  marks: ReportTaskMark[];
  score?: number;
  maxScore?: number;
  percentage?: number;
  graded: number;
  complete: boolean;
};

export type ReportScoreSummary = {
  rows: Map<string, ReportStudentScore>;
  hasTasks: boolean;
  scored: number;
  enrolled: number;
  average?: number;
  averagePercentage?: number;
  highest?: number;
  lowest?: number;
  maxScore?: number;
  bands: Array<{ name: string; count: number }>;
};

export function reportRowKey(row: RowDto, index: number) {
  return row.class_enrollment_uuid ?? row.student_uuid ?? String(index);
}

export function isReportTaskGraded(mark: ReportTaskMark) {
  return (
    mark.status?.toUpperCase() === 'GRADED' &&
    typeof mark.score === 'number' &&
    Number.isFinite(mark.score)
  );
}

function positiveNumber(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** Missing grades contribute neither earned points nor possible points. */
export function summarizeStudentMarks(marks: ReportTaskMark[]): ReportStudentScore {
  const graded = marks.filter(isReportTaskGraded);
  const maxScore =
    graded.length > 0 && graded.every(mark => positiveNumber(mark.maxScore))
      ? graded.reduce((sum, mark) => sum + (mark.maxScore ?? 0), 0)
      : undefined;
  const score = graded.length
    ? graded.reduce((sum, mark) => sum + (mark.score ?? 0), 0)
    : undefined;
  return {
    marks,
    score,
    maxScore,
    graded: graded.length,
    complete: graded.length > 0 && maxScore != null,
    percentage: score != null && maxScore != null ? (score / maxScore) * 100 : undefined,
  };
}

const DEFAULT_BANDS = [
  { name: '85–100%', min_percentage: 85 },
  { name: '70–84%', min_percentage: 70 },
  { name: '50–69%', min_percentage: 50 },
  { name: 'Below 50%', min_percentage: 0 },
];

export function reportScoreBand(percentage?: number, gradeBands: CourseGradeBand[] = []) {
  if (percentage == null || !Number.isFinite(percentage)) return undefined;
  return (
    [...(gradeBands.length ? gradeBands : DEFAULT_BANDS)]
      .filter(band => Number.isFinite(band.min_percentage))
      .sort((a, b) => b.min_percentage - a.min_percentage)
      .find(band => percentage >= band.min_percentage)?.name ?? 'Below band'
  );
}

/** Compare available grades; learners with no grades are excluded from class statistics. */
export function summarizeReportScores(
  entries: Array<{ key: string; marks: ReportTaskMark[] }>,
  gradeBands: CourseGradeBand[] = []
): ReportScoreSummary {
  const rows = new Map(entries.map(entry => [entry.key, summarizeStudentMarks(entry.marks)]));
  const complete = [...rows.values()].filter(row => row.complete);
  const averagePercentage = complete.length
    ? complete.reduce((sum, row) => sum + (row.percentage ?? 0), 0) / complete.length
    : undefined;
  const firstMax = complete[0]?.maxScore;
  const maxScore =
    firstMax != null && complete.every(row => row.maxScore === firstMax) ? firstMax : undefined;
  const values = complete.map(row => (maxScore != null ? (row.score ?? 0) : (row.percentage ?? 0)));
  const bands = [...(gradeBands.length ? gradeBands : DEFAULT_BANDS)]
    .filter(band => Number.isFinite(band.min_percentage))
    .sort((a, b) => b.min_percentage - a.min_percentage);
  const counts = new Map(bands.map(band => [band.name, 0]));
  for (const row of complete) {
    const name =
      bands.find(band => (row.percentage ?? 0) >= band.min_percentage)?.name ?? 'Below band';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return {
    rows,
    hasTasks: entries.some(entry => entry.marks.length > 0),
    scored: complete.length,
    enrolled: entries.length,
    average: values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : undefined,
    averagePercentage,
    highest: values.length ? Math.max(...values) : undefined,
    lowest: values.length ? Math.min(...values) : undefined,
    maxScore,
    bands: [...counts].map(([name, count]) => ({ name, count })),
  };
}

/** The submitted report is authoritative for assignments, including learners with no submission. */
export function reportAssignmentMarks(report: SessionReport): ReportTaskMark[][] {
  const tasks = new Map<string, { title: string; maxScore?: number }>();
  const keyed = (items: Array<{ title?: string }>) => {
    const occurrences = new Map<string, number>();
    return items.map((item, index) => {
      const title = item.title || `Assignment ${index + 1}`;
      const occurrence = occurrences.get(title) ?? 0;
      occurrences.set(title, occurrence + 1);
      return { id: `assignment:${title}:${occurrence}`, title };
    });
  };
  for (const task of keyed((report.assignment_titles ?? []).map(title => ({ title })))) {
    tasks.set(task.id, task);
  }
  const rows = (report.rows ?? []).map(row => {
    const assignments = row.assignments ?? [];
    return new Map(
      keyed(assignments).map((task, index) => {
        const assignment = assignments[index];
        const maxScore = positiveNumber(assignment?.max_score)
          ? assignment?.max_score
          : tasks.get(task.id)?.maxScore;
        tasks.set(task.id, { title: task.title, maxScore });
        return [task.id, assignment];
      })
    );
  });
  return rows.map(row =>
    [...tasks].map(([id, task]) => {
      const assignment = row.get(id);
      return {
        id,
        kind: 'assignment',
        title: task.title,
        status: assignment?.status,
        score: assignment?.score,
        maxScore: assignment?.max_score ?? task.maxScore,
      };
    })
  );
}

export function isBelowClassAverage(score: ReportStudentScore, summary: ReportScoreSummary) {
  return (
    score.complete &&
    score.percentage != null &&
    summary.averagePercentage != null &&
    score.percentage < summary.averagePercentage - 1e-9
  );
}

export function formatReportNumber(value: number) {
  return Number(value.toFixed(2)).toString();
}

export function reportTaskMarkLabel(mark: ReportTaskMark) {
  const maximum = mark.maxScore != null ? formatReportNumber(mark.maxScore) : '—';
  if (isReportTaskGraded(mark) && mark.score != null) {
    return `${formatReportNumber(mark.score)} / ${maximum}`;
  }
  const status = mark.status?.toUpperCase();
  const label =
    status === 'GRADED'
      ? 'Grade unavailable'
      : status === 'SUBMITTED' || status === 'IN_REVIEW'
        ? 'Not graded'
        : 'Not submitted';
  return `${label}${mark.maxScore != null ? ` / ${maximum}` : ''}`;
}

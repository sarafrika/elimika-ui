/** Sample learners run through a program's weights and pass rule, for the editor's preview. */

export type TryCourse = { name: string; weight: number; passMark: number };

export type TryResult = {
  label: string;
  mark: number;
  provisional: boolean;
  result: 'In progress' | 'Passed' | 'Failed';
  why: string;
};

const SAMPLE_FINALS = [87.94, 76.5, 80.72, 72.4, 84.1, 79.3, 90.2, 74.8];

const round2 = (value: number) => Math.round(value * 100) / 100;
const fmt = (value: number) => round2(value).toFixed(2);

function weighted(rows: { weight: number; final: number }[]) {
  const weights = rows.reduce((sum, row) => sum + row.weight, 0);
  const points = rows.reduce((sum, row) => sum + (row.weight * row.final) / 100, 0);
  return { weights, points, mark: weights > 0 ? (points / weights) * 100 : 0 };
}

/** Three learners: one still running a course, one who passed everything, one who failed a course. */
export function tryLearners(courses: TryCourse[], passMark: number): TryResult[] {
  const rows = courses
    .filter(course => course.weight > 0)
    .map((course, index) => ({
      ...course,
      final: Math.min(
        100,
        Math.max(SAMPLE_FINALS[index % SAMPLE_FINALS.length] ?? 80, course.passMark + 5)
      ),
    }));
  if (rows.length === 0) return [];
  const samples: TryResult[] = [];

  if (rows.length > 1) {
    const running = rows[rows.length - 1];
    const done = weighted(rows.slice(0, -1));
    samples.push({
      label: 'In progress',
      mark: done.mark,
      provisional: true,
      result: 'In progress',
      why: `${running?.name} has no result yet, so ${rows.length - 1} of ${rows.length} weights count (${fmt(done.points)} ÷ ${round2(done.weights)}).`,
    });
  }

  const all = weighted(rows);
  const passed = all.mark >= passMark;
  samples.push({
    label: 'All passed',
    mark: all.mark,
    provisional: false,
    result: passed ? 'Passed' : 'Failed',
    why: passed
      ? `Every mandatory course passed and the mark is at least ${passMark}%.`
      : `Every mandatory course passed, but the mark is below ${passMark}%.`,
  });

  const lightest = rows.reduce((low, row) => (row.weight < low.weight ? row : low));
  const failedFinal = Math.max(0, lightest.passMark - 5);
  const failed = weighted(
    rows.map(row => (row === lightest ? { ...row, final: failedFinal } : row))
  );
  samples.push({
    label: 'One course failed',
    mark: failed.mark,
    provisional: false,
    result: 'Failed',
    why: `${failed.mark >= passMark ? 'Above' : 'Below'} ${passMark}%, but ${lightest.name} finished at ${fmt(failedFinal)}%. Every mandatory course must pass.`,
  });
  return samples;
}

export function formatMark(value: number) {
  return `${fmt(value)}%`;
}

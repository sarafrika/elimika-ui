'use client';

import { SchedulingConflictAlert } from '@/components/scheduling/scheduling-conflict-alert';
import type { SchedulingConflict } from '@/lib/scheduling-conflicts';

export function hireClashTitle(count: number) {
  return `Hire stopped: ${count} session${count === 1 ? ' clashes' : 's clash'}`;
}

/** A refused hire changes nothing server side, so the alert says what clashed and what to do next. */
export function HireClashAlert({
  conflicts,
  instructorName,
  timeZone,
}: {
  conflicts: SchedulingConflict[];
  instructorName?: string | null;
  timeZone?: string | null;
}) {
  return (
    <SchedulingConflictAlert
      title={hireClashTitle(conflicts.length)}
      conflicts={conflicts}
      timeZone={timeZone}
    >
      We&apos;ve let you and {instructorName || 'the instructor'} know. Pick another applicant,
      change the job&apos;s schedule, or wait for them to free those times.
    </SchedulingConflictAlert>
  );
}

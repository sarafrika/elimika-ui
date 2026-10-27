'use client';

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getProgramReportOptions,
  listStudentProgramReportsOptions,
} from '@/services/client/@tanstack/react-query.gen';

/** The learner's live programme report; the period filters attendance only. */
export function useProgramReport(
  programUuid?: string,
  studentUuid?: string,
  period?: { from?: string; to?: string }
) {
  return useQuery({
    ...getProgramReportOptions({
      path: { programUuid: programUuid ?? '', studentUuid: studentUuid ?? '' },
      query: {
        from: period?.from as unknown as Date | undefined,
        to: period?.to as unknown as Date | undefined,
      },
    }),
    enabled: Boolean(programUuid && studentUuid),
    staleTime: STALE_TIMES.entity,
  });
}

/** Programmes whose report the caller may open for this learner. */
export function useStudentProgrammes(studentUuid?: string) {
  return useQuery({
    ...listStudentProgramReportsOptions({ path: { studentUuid: studentUuid ?? '' } }),
    enabled: Boolean(studentUuid),
    staleTime: STALE_TIMES.entity,
  });
}

export function percent(value?: number | null) {
  return value == null ? '—' : `${Number(value).toFixed(2)}%`;
}

export function shortDate(value?: Date | string | null) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

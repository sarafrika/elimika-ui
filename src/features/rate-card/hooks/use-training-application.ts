'use client';

import { useQuery } from '@tanstack/react-query';

import { APPROVAL_QUERY_FRESHNESS, STALE_TIMES } from '@/lib/query-client';
import {
  getProgramTrainingApplicationOptions,
  getTrainingApplicationOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { TrainingApplication, TrainingApplicationKind } from '../types';

/** One course or program training application; polls like every approval read. */
export function useTrainingApplication(
  kind: TrainingApplicationKind,
  parentUuid: string | null | undefined,
  applicationUuid: string | null | undefined
) {
  const ready = Boolean(parentUuid && applicationUuid);
  const course = useQuery({
    ...getTrainingApplicationOptions({
      path: { courseUuid: parentUuid ?? '', applicationUuid: applicationUuid ?? '' },
    }),
    ...APPROVAL_QUERY_FRESHNESS,
    staleTime: STALE_TIMES.live,
    enabled: ready && kind === 'course',
  });
  const program = useQuery({
    ...getProgramTrainingApplicationOptions({
      path: { programUuid: parentUuid ?? '', applicationUuid: applicationUuid ?? '' },
    }),
    ...APPROVAL_QUERY_FRESHNESS,
    staleTime: STALE_TIMES.live,
    enabled: ready && kind === 'program',
  });

  const query = kind === 'course' ? course : program;
  const application: TrainingApplication | null =
    (kind === 'course' ? course.data?.data : program.data?.data) ?? null;
  return { application, query };
}

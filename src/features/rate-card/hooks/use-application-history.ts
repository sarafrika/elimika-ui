'use client';

import { useQuery } from '@tanstack/react-query';

import { APPROVAL_QUERY_FRESHNESS, STALE_TIMES } from '@/lib/query-client';
import type { TrainingApplicationEvent } from '@/services/client';
import {
  getProgramTrainingApplicationHistoryOptions,
  getTrainingApplicationHistoryOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { TrainingApplicationKind } from '../types';

const NO_EVENTS: TrainingApplicationEvent[] = [];

/** An application's timeline (submitted, opened, decided, rate updates), newest first. */
export function useApplicationHistory(
  kind: TrainingApplicationKind,
  parentUuid: string | null | undefined,
  applicationUuid: string | null | undefined
) {
  const ready = Boolean(parentUuid && applicationUuid);
  const course = useQuery({
    ...getTrainingApplicationHistoryOptions({
      path: { courseUuid: parentUuid ?? '', applicationUuid: applicationUuid ?? '' },
    }),
    ...APPROVAL_QUERY_FRESHNESS,
    staleTime: STALE_TIMES.live,
    enabled: ready && kind === 'course',
  });
  const program = useQuery({
    ...getProgramTrainingApplicationHistoryOptions({
      path: { programUuid: parentUuid ?? '', applicationUuid: applicationUuid ?? '' },
    }),
    ...APPROVAL_QUERY_FRESHNESS,
    staleTime: STALE_TIMES.live,
    enabled: ready && kind === 'program',
  });

  const query = kind === 'course' ? course : program;
  const events = (kind === 'course' ? course.data?.data : program.data?.data) ?? NO_EVENTS;
  return { events, query };
}

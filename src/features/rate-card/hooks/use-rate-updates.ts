'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { APPROVAL_QUERY_FRESHNESS, STALE_TIMES } from '@/lib/query-client';
import type { TrainingRateUpdate } from '@/services/client';
import {
  listCourseTrainingRateUpdatesOptions,
  listProgramTrainingApplicationRateUpdatesOptions,
  listProgramTrainingRateUpdatesOptions,
  listTrainingRateUpdatesOptions,
} from '@/services/client/@tanstack/react-query.gen';
import type { RateUpdateStatus, TrainingApplicationKind } from '../types';

const NO_UPDATES: TrainingRateUpdate[] = [];

/** Every rate update on one application, newest first, plus the pending one if any. */
export function useRateUpdates(
  kind: TrainingApplicationKind,
  parentUuid: string | null | undefined,
  applicationUuid: string | null | undefined
) {
  const ready = Boolean(parentUuid && applicationUuid);
  const course = useQuery({
    ...listTrainingRateUpdatesOptions({
      path: { courseUuid: parentUuid ?? '', applicationUuid: applicationUuid ?? '' },
    }),
    ...APPROVAL_QUERY_FRESHNESS,
    staleTime: STALE_TIMES.live,
    enabled: ready && kind === 'course',
  });
  const program = useQuery({
    ...listProgramTrainingApplicationRateUpdatesOptions({
      path: { programUuid: parentUuid ?? '', applicationUuid: applicationUuid ?? '' },
    }),
    ...APPROVAL_QUERY_FRESHNESS,
    staleTime: STALE_TIMES.live,
    enabled: ready && kind === 'program',
  });

  const query = kind === 'course' ? course : program;
  const updates = (kind === 'course' ? course.data?.data : program.data?.data) ?? NO_UPDATES;
  const pending = useMemo(
    () => updates.find(update => update.status === 'pending') ?? null,
    [updates]
  );
  return { updates, pending, query };
}

/** A course or program owner's rate updates across all applicants, one page at a time. */
export function useCreatorRateUpdates(
  kind: TrainingApplicationKind,
  parentUuid: string | null | undefined,
  status?: RateUpdateStatus,
  { page = 0, size = 20 }: { page?: number; size?: number } = {}
) {
  const query = { ...(status ? { status } : {}), pageable: { page, size } };
  const course = useQuery({
    ...listCourseTrainingRateUpdatesOptions({ path: { courseUuid: parentUuid ?? '' }, query }),
    ...APPROVAL_QUERY_FRESHNESS,
    staleTime: STALE_TIMES.live,
    enabled: Boolean(parentUuid) && kind === 'course',
  });
  const program = useQuery({
    ...listProgramTrainingRateUpdatesOptions({ path: { programUuid: parentUuid ?? '' }, query }),
    ...APPROVAL_QUERY_FRESHNESS,
    staleTime: STALE_TIMES.live,
    enabled: Boolean(parentUuid) && kind === 'program',
  });

  const active = kind === 'course' ? course : program;
  const pageData = active.data?.data;
  return {
    updates: pageData?.content ?? NO_UPDATES,
    metadata: pageData?.metadata,
    query: active,
  };
}

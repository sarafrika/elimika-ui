'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { hiredJobData } from '@/components/profile-job-marketplace/hired-jobs';
import { dayjs, localDate, parseApiDate } from '@/lib/date';
import { STALE_TIMES } from '@/lib/query-client';
import { getInstructorCalendarOptions } from '@/services/client/@tanstack/react-query.gen';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

/** How far ahead a class-created card looks for its next session. */
export const NEXT_SESSION_WINDOW_DAYS = 60;

const LIVE_SESSION_STATUSES = ['SCHEDULED', 'ONGOING'];

/** The next session start per class, from one calendar read covering every class on screen. */
export function useNextClassSessions(classUuids: readonly string[]) {
  const profile = useUserProfile();
  const instructorUuid = profile?.instructor?.uuid;
  const [range] = useState(() => ({
    start_date: localDate(new Date()),
    end_date: localDate(dayjs().add(NEXT_SESSION_WINDOW_DAYS, 'day').toDate()),
  }));
  const enabled = Boolean(instructorUuid) && classUuids.length > 0;

  const calendar = useQuery({
    ...getInstructorCalendarOptions({
      path: { instructorUuid: instructorUuid ?? '' },
      query: range,
    }),
    enabled,
    staleTime: STALE_TIMES.live,
    select: hiredJobData,
  });

  const nextByClass = useMemo(() => {
    const wanted = new Set(classUuids);
    const now = Date.now();
    const next = new Map<string, number>();
    for (const entry of calendar.data ?? []) {
      const classUuid = entry.class_definition_uuid;
      const start = parseApiDate(entry.start_time)?.valueOf();
      if (entry.entry_type !== 'SCHEDULED_INSTANCE' || !classUuid || !wanted.has(classUuid))
        continue;
      if (!start || start < now || !LIVE_SESSION_STATUSES.includes(entry.status ?? '')) continue;
      const known = next.get(classUuid);
      if (known === undefined || start < known) next.set(classUuid, start);
    }
    return next;
  }, [calendar.data, classUuids]);

  return {
    nextByClass,
    isPending: enabled && calendar.isPending,
    failed: Boolean(calendar.error),
  };
}

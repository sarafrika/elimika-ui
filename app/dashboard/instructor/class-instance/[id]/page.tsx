'use client';

import { skipToken, useQuery } from '@tanstack/react-query';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { WorkbookError } from '@/components/lesson/WorkbookError';
import { WorkbookLoading } from '@/components/lesson/WorkbookLoading';
import { hasApiError } from '@/components/lesson/workbook-data';
import { EmptyState } from '@/components/ui/empty-state';
import { useInstructor } from '@/context/instructor-context';
import { STALE_TIMES } from '@/lib/query-client';
import {
  getScheduledInstanceOptions,
  getScheduledInstanceQueryKey,
} from '@/services/client/@tanstack/react-query.gen';

export default function ClassInstanceDetailsRoute() {
  const { id: instanceId } = useParams<{ id: string }>();
  const instructor = useInstructor();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = useQuery({
    ...(instanceId
      ? getScheduledInstanceOptions({ path: { instanceUuid: instanceId } })
      : {
          queryKey: getScheduledInstanceQueryKey({ path: { instanceUuid: '' } }),
          queryFn: skipToken,
        }),
    enabled: Boolean(instanceId && instructor?.uuid),
    staleTime: STALE_TIMES.live,
  });
  const instance = hasApiError(query.data) ? undefined : query.data?.data;
  const classId =
    instance?.instructor_uuid === instructor?.uuid ? instance?.class_definition_uuid : undefined;

  useEffect(() => {
    if (!classId || !instanceId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('schedule', instanceId);
    router.replace(`/dashboard/instructor/classes/training/${classId}?${params.toString()}`);
  }, [classId, instanceId, router, searchParams]);

  if (query.isError || hasApiError(query.data)) {
    return (
      <WorkbookError title='Unable to load class instance' retry={() => void query.refetch()} />
    );
  }
  if (query.isSuccess && !classId) {
    return (
      <EmptyState
        title='Class instance not found'
        description='We could not match that instance to one of your instructor classes.'
      />
    );
  }
  return <WorkbookLoading />;
}

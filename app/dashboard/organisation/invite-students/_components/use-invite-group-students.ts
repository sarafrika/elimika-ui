'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { STALE_TIMES } from '@/lib/query-client';
import { listRosterOptions } from '@/services/client/@tanstack/react-query.gen';
import { groupInviteStudents, type GroupInviteStudent } from './invitation-audience';
import { GROUP_ROSTER_PAGE_SIZE, loadInviteGroupStudents } from './load-invite-group-students';

type AudienceState = {
  scope: string;
  status: 'loading' | 'ready' | 'error';
  students: GroupInviteStudent[];
};

/** Load complete selected groups through a bounded queue using canonical roster query keys. */
export function useInviteGroupStudents(organisationUuid: string, groupUuids: string[]) {
  const queryClient = useQueryClient();
  const groupIds = useMemo(() => [...new Set(groupUuids.filter(Boolean))].sort(), [groupUuids]);
  const scope = JSON.stringify([organisationUuid, groupIds]);
  const [revision, setRevision] = useState(0);
  const [audience, setAudience] = useState<AudienceState>({
    scope: '',
    status: 'loading',
    students: [],
  });

  useEffect(() => {
    let cancelled = false;
    if (!organisationUuid || groupIds.length === 0) return;
    setAudience({ scope, status: 'loading', students: [] });
    void loadInviteGroupStudents(
      groupIds,
      (groupUuid, page) =>
        queryClient.fetchQuery({
          ...listRosterOptions({
            path: { organisationUuid },
            query: { groupUuid, pageable: { page, size: GROUP_ROSTER_PAGE_SIZE } },
          }),
          staleTime: STALE_TIMES.entity,
        }),
      () => cancelled
    )
      .then(rows => {
        if (!cancelled)
          setAudience({ scope, status: 'ready', students: groupInviteStudents(rows) });
      })
      .catch(() => {
        if (!cancelled) setAudience({ scope, status: 'error', students: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [organisationUuid, groupIds, scope, revision, queryClient]);

  const active = Boolean(organisationUuid) && groupIds.length > 0;
  const matchesScope = audience.scope === scope;
  return {
    students: active && matchesScope ? audience.students : [],
    isLoading: active && (!matchesScope || audience.status === 'loading'),
    isError: active && matchesScope && audience.status === 'error',
    refetch: useCallback(() => setRevision(current => current + 1), []),
  };
}

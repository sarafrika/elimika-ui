'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { APPROVAL_QUERY_FRESHNESS, STALE_TIMES } from '@/lib/query-client';
import {
  getCurrentOnboardingOptions,
  getCurrentOnboardingQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { ACTING_DOMAIN_HEADER } from '@/src/features/dashboard/lib/active-domain-storage';
import { requireApiData } from '../lib/user-onboarding';

export const creatorOnboardingOptions = { headers: { [ACTING_DOMAIN_HEADER]: 'course_creator' } };
export const creatorOnboardingQueryKey = () =>
  getCurrentOnboardingQueryKey(creatorOnboardingOptions);

export function useCourseCreatorOnboarding(enabled: boolean) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id ?? session?.user?.email ?? '';
  const [identity, setIdentity] = useState<string | null>(null);
  const ready = identity === userId;

  useEffect(() => {
    // A /me response from a previous sign-in must never decide this user's progress.
    // Also force a fresh GET on entry to the verification page after submission.
    queryClient.removeQueries({ queryKey: creatorOnboardingQueryKey() });
    setIdentity(userId);
  }, [queryClient, userId]);

  const query = useQuery({
    ...getCurrentOnboardingOptions(creatorOnboardingOptions),
    select: response => requireApiData(response),
    enabled: enabled && ready,
    staleTime: STALE_TIMES.live,
    ...APPROVAL_QUERY_FRESHNESS,
    retry: false,
  });
  return { ...query, data: ready ? query.data : undefined, isPending: !ready || query.isPending };
}

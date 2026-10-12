'use client';

import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { APPROVAL_QUERY_FRESHNESS, STALE_TIMES } from '@/lib/query-client';
import {
  getCurrentAccountStatusOptions,
  getCurrentAccountStatusQueryKey,
  getDomainOnboardingOptions,
  getDomainOnboardingQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import type { Onboarding } from '@/services/client';
import { type RegisterableDomain, requireApiData } from '../lib/user-onboarding';

// The generated key's id alone: a partial key matching every domain's onboarding.
const DOMAIN_ONBOARDING_PREFIX = [
  { _id: getDomainOnboardingQueryKey({ path: { domain: '' } })[0]._id },
] as const;

/** Clears /me-scoped caches once per signed-in identity so a previous user's state never shows. */
function useIdentityReady(queryKeys: readonly (readonly unknown[])[]) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id ?? session?.user?.email ?? '';
  const [identity, setIdentity] = useState<string | null>(null);

  useEffect(() => {
    for (const queryKey of queryKeys) queryClient.removeQueries({ queryKey });
    setIdentity(userId);
  }, [queryClient, userId]);

  return identity === userId;
}

export function useAccountStatus(enabled: boolean) {
  const ready = useIdentityReady([getCurrentAccountStatusQueryKey()]);
  const query = useQuery({
    ...getCurrentAccountStatusOptions(),
    select: response => requireApiData(response),
    enabled: enabled && ready,
    staleTime: STALE_TIMES.live,
    ...APPROVAL_QUERY_FRESHNESS,
    retry: false,
  });
  return { ...query, data: ready ? query.data : undefined, isPending: !ready || query.isPending };
}

export function useDomainOnboarding(domain: RegisterableDomain | undefined, enabled: boolean) {
  const ready = useIdentityReady([DOMAIN_ONBOARDING_PREFIX]);
  const query = useQuery({
    ...(domain
      ? getDomainOnboardingOptions({ path: { domain } })
      : { queryKey: getDomainOnboardingQueryKey({ path: { domain: '' } }), queryFn: skipToken }),
    select: response => requireApiData(response),
    enabled: enabled && ready && Boolean(domain),
    staleTime: STALE_TIMES.live,
    ...APPROVAL_QUERY_FRESHNESS,
    retry: false,
  });
  return { ...query, data: ready ? query.data : undefined, isPending: !ready || query.isPending };
}

export function isDomainOnboardingKey(queryKey: readonly unknown[]) {
  const head = queryKey[0];
  return (
    typeof head === 'object' &&
    head !== null &&
    '_id' in head &&
    head._id === DOMAIN_ONBOARDING_PREFIX[0]._id
  );
}

export function onboardingStep(onboarding: Onboarding | undefined, key: string) {
  return onboarding?.steps?.find(step => step.key === key);
}

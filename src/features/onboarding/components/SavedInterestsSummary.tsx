'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/error-utils';
import { STALE_TIMES } from '@/lib/query-client';
import { getMyInterestsOptions } from '@/services/client/@tanstack/react-query.gen';
import { type InterestDomain, readInterests } from '../lib/interests';

export function SavedInterestsSummary({
  domain,
  userUuid,
}: {
  domain: InterestDomain;
  userUuid?: string;
}) {
  const interests = useQuery({
    ...getMyInterestsOptions({ path: { domain } }),
    enabled: Boolean(userUuid),
    staleTime: STALE_TIMES.entity,
    select: readInterests,
    retry: false,
  });
  if (interests.isPending) return <span>Loading interests…</span>;
  if (interests.isError)
    return (
      <span className='space-y-1'>
        <span className='block' role='alert'>
          {getErrorMessage(interests.error, 'Unable to load saved interests.')}
        </span>
        <Button
          size='sm'
          variant='link'
          disabled={interests.isFetching}
          onClick={() => void interests.refetch()}
        >
          Try again
        </Button>
      </span>
    );
  return (
    <span>
      {interests.data.map(category => category.name).join(', ') || 'No interests selected'}
    </span>
  );
}

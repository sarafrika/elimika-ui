'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { STALE_TIMES } from '@/lib/query-client';
import { getCurrentAccountStatusOptions } from '@/services/client/@tanstack/react-query.gen';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { normalizeStoredUserDomain } from '@/src/features/dashboard/lib/active-domain-storage';
import { awaitingApprovalPath, sameReviewDomain } from '../lib/application-review';
import { requireApiData } from '../lib/user-onboarding';

/** Keep the pending application reachable throughout onboarding navigation. */
export function ReturnToApplication() {
  const user = useUserProfile();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data } = useQuery({
    ...getCurrentAccountStatusOptions(),
    enabled: !!user?.uuid,
    staleTime: STALE_TIMES.live,
    select: response => requireApiData(response),
    retry: false,
  });
  const routeDomain = pathname.split('/')[2]?.replace('course-creator', 'course_creator');
  const preferredDomain = normalizeStoredUserDomain(searchParams.get('domain') ?? routeDomain);
  const applications = data?.domain_applications?.filter(
    application => application.status && application.status !== 'APPROVED'
  ) ?? [];
  const application = applications.find(item => sameReviewDomain(item.domain, preferredDomain ?? undefined))
    ?? applications.find(item => item.status === 'PENDING')
    ?? applications[0];

  if (!application?.domain || pathname === '/onboarding/skills-wallet') return null;

  return (
    <div className='bg-background px-4 pt-6'>
      <div className='mx-auto max-w-7xl'>
        <Button asChild variant='outline' size='sm'>
          <Link href={awaitingApprovalPath(application.domain)}>
            <ArrowLeft className='size-4' aria-hidden='true' />
            Return to application
          </Link>
        </Button>
      </div>
    </div>
  );
}

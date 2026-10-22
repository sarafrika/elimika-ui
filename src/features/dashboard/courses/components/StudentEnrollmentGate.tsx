'use client';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import {
  STUDENT_PROFILE_PROMPT,
  studentCoursePath,
  studentEnrollmentState,
  studentEnrollmentSwitchHref,
  studentProfileSetupHref,
} from '@/src/features/dashboard/lib/student-enrollment';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

/** The student dashboard owns browsing classes and enrollment, regardless of the starting role. */
export function StudentEnrollmentGate({
  children,
  nextPath,
}: {
  children?: ReactNode;
  nextPath?: string;
}) {
  const profile = useUserProfile();
  const domain = useUserDomain();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const destination = studentCoursePath(nextPath ?? `${pathname}?${searchParams.toString()}`);
  const redirectWhenReady = children === undefined;
  const state = studentEnrollmentState({
    isLoading: !domain.isReady || Boolean(profile?.isLoading),
    accountUuid: profile?.uuid,
    studentUuid: profile?.student?.uuid,
    domains: domain.domains,
    activeDomain: domain.activeDomain,
  });

  useEffect(() => {
    if (state === 'switch-profile') {
      router.replace(studentEnrollmentSwitchHref(destination));
    } else if (state === 'ready' && redirectWhenReady) {
      router.replace(destination);
    }
  }, [state, destination, redirectWhenReady, router]);

  if (state === 'ready' && !redirectWhenReady) return children;

  if (state === 'loading' || state === 'switch-profile' || state === 'ready') {
    return (
      <div className='space-y-4 p-4 sm:p-6' role='status'>
        <span className='sr-only'>
          {state === 'loading'
            ? 'Loading your profile'
            : 'Opening the course in your student profile'}
        </span>
        <Skeleton className='h-8 w-56' />
        <Skeleton className='h-4 w-80 max-w-full' />
        <Skeleton className='h-72 w-full rounded-xl' />
      </div>
    );
  }

  if (state === 'unavailable') {
    return (
      <div className='p-4 sm:p-6'>
        <EmptyState
          title='Couldn’t load your student profile'
          description='Try loading your account again to continue enrolling.'
          action={
            <Button variant='outline' onClick={() => void profile?.invalidateQuery?.()}>
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className='p-4 sm:p-6'>
      <EmptyState
        icon={GraduationCap}
        title={STUDENT_PROFILE_PROMPT.title}
        description={STUDENT_PROFILE_PROMPT.description}
        action={
          <>
            <Button asChild>
              <Link href={studentProfileSetupHref(destination)}>Create Student Profile</Link>
            </Button>
            <Button asChild variant='outline'>
              <Link
                href={
                  domain.activeDomain ? dashboardUrl(domain.activeDomain, 'overview') : '/dashboard'
                }
              >
                Back to dashboard
              </Link>
            </Button>
          </>
        }
      />
    </div>
  );
}

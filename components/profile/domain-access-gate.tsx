'use client';

import { type ReactNode, useEffect, useMemo } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOptionalCourseCreator } from '@/context/course-creator-context';
import { useUserProfile } from '@/context/profile-context';
import { useUserDomain } from '@/context/user-domain-context';
import { useTrainingCenter } from '@/context/training-center-provide';
import { cn } from '@/lib/utils';
import { ShieldAlert } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

type DomainGateState = {
  renderChildren: boolean;
  redirect?: string;
  notice?: {
    title: string;
    description: string;
  };
};

const PROFILE_PREFIX = '/dashboard/profile';
const ACCOUNT_PREFIX = '/dashboard/account';
const ADD_PROFILE_PREFIX = '/dashboard/add-profile';

export default function DomainAccessGate({ children }: { children: ReactNode }) {
  const profile = useUserProfile();
  const userDomain = useUserDomain();
  const courseCreator = useOptionalCourseCreator();
  const trainingCenter = useTrainingCenter();
  const pathname = usePathname();
  const router = useRouter();

  const hasOrganisation = Boolean(profile?.organisation_affiliations?.length);
  const organisationVerified = hasOrganisation
    ? Boolean(trainingCenter?.admin_verified)
    : true; // if not attached, skip organisation verification gating

  const state: DomainGateState = useMemo(() => {
    if (!profile || profile.isLoading) {
      return { renderChildren: true };
    }

    const domain = userDomain.activeDomain;
    if (!domain) {
      return { renderChildren: true };
    }

    const shared = {
      instructor: {
        verified: Boolean(profile.instructor?.admin_verified),
        allowedPrefixes: [PROFILE_PREFIX, ADD_PROFILE_PREFIX],
        fallback: `${PROFILE_PREFIX}/general`,
        title: 'Instructor verification pending',
        description:
          'Update your profile details so the Elimika team can verify your instructor account.',
      },
      course_creator: {
        verified: Boolean(
          courseCreator?.profile?.admin_verified ?? profile.courseCreator?.admin_verified
        ),
        allowedPrefixes: [PROFILE_PREFIX, ADD_PROFILE_PREFIX],
        fallback: PROFILE_PREFIX,
        title: 'Course creator verification pending',
        description:
          'Complete your course creator profile to request publishing access on Elimika.',
      },
      organisation: {
        verified: organisationVerified,
        allowedPrefixes: [ACCOUNT_PREFIX, PROFILE_PREFIX, ADD_PROFILE_PREFIX],
        fallback: `${ACCOUNT_PREFIX}/training-center`,
        title: 'Organisation verification pending',
        description:
          'Review and submit your organisation information so your workspace can be approved.',
      },
      organisation_user: {
        verified: organisationVerified,
        allowedPrefixes: [ACCOUNT_PREFIX, PROFILE_PREFIX, ADD_PROFILE_PREFIX],
        fallback: `${ACCOUNT_PREFIX}/training-center`,
        title: 'Organisation verification pending',
        description:
          'Review and submit your organisation information so your workspace can be approved.',
      },
    } as const;

    if (!(domain in shared)) {
      return { renderChildren: true };
    }

    const config = shared[domain as keyof typeof shared];

    if (config.verified) {
      return { renderChildren: true };
    }

    const isAllowed = config.allowedPrefixes.some(prefix => pathname.startsWith(prefix));

    if (!isAllowed) {
      return {
        renderChildren: false,
        redirect: config.fallback,
      };
    }

    return {
      renderChildren: true,
      notice: {
        title: config.title,
        description: config.description,
      },
    };
  }, [
    profile,
    courseCreator,
    trainingCenter,
    pathname,
    userDomain.activeDomain,
    organisationVerified,
  ]);

  useEffect(() => {
    if (!state.renderChildren && state.redirect && pathname !== state.redirect) {
      router.replace(state.redirect);
    }
  }, [state, router, pathname]);

  if (!state.renderChildren) {
    return null;
  }

  return (
    <>
      {state.notice ? (
        <Alert
          className={cn(
            'mx-auto mb-4 w-full max-w-5xl border-yellow-500/30 bg-yellow-50 text-yellow-900 shadow-sm',
            'dark:border-yellow-500/40 dark:bg-yellow-950/30 dark:text-yellow-100'
          )}
        >
          <ShieldAlert className='col-start-1 self-start text-yellow-600 dark:text-yellow-400' />
          <AlertTitle className='text-xs font-semibold tracking-[0.15em] text-yellow-700 uppercase dark:text-yellow-300'>
            {state.notice.title}
          </AlertTitle>
          <AlertDescription className='text-sm text-yellow-800/80 dark:text-yellow-200/80'>
            {state.notice.description}
          </AlertDescription>
        </Alert>
      ) : null}
      {children}
    </>
  );
}

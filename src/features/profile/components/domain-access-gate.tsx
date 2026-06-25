'use client';

import { ShieldAlert } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOptionalCourseCreator } from '@/context/course-creator-context';
import { cn } from '@/lib/utils';
import type { Organisation } from '@/services/client';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

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
const ORGANISATION_PROFILE_PREFIX = `${ACCOUNT_PREFIX}/training-center`;
const ADD_PROFILE_PREFIX = '/dashboard/add-profile';
const CREDENTIALS_PREFIX = '/dashboard/credentials';
const SETTINGS_PREFIX = '/dashboard/settings';

function resolveOrganisationVerified(
  organisation?: (Organisation & { adminVerified?: boolean }) | null
): boolean | undefined {
  if (!organisation) return undefined;
  if (typeof organisation.admin_verified !== 'undefined') return organisation.admin_verified;
  return organisation.adminVerified;
}

export default function DomainAccessGate({ children }: { children: ReactNode }) {
  const profile = useUserProfile();
  const userDomain = useUserDomain();
  const courseCreator = useOptionalCourseCreator();
  const organisation = useOrganisation();
  const pathname = usePathname();
  const router = useRouter();

  const hasOrganisation = Boolean(profile?.organisation_affiliations?.length);
  const organisationVerifiedFlag = resolveOrganisationVerified(organisation);
  const organisationVerified = hasOrganisation ? organisationVerifiedFlag === true : true;

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
        allowedPrefixes: [PROFILE_PREFIX, ADD_PROFILE_PREFIX, SETTINGS_PREFIX],
        fallback: `${PROFILE_PREFIX}/general`,
        title: 'Instructor verification pending',
        description:
          'Update your profile details so the Elimika team can verify your instructor account.',
      },
      course_creator: {
        verified: Boolean(
          courseCreator?.profile?.admin_verified ?? profile.courseCreator?.admin_verified
        ),
        allowedPrefixes: [PROFILE_PREFIX, ADD_PROFILE_PREFIX, SETTINGS_PREFIX],
        fallback: PROFILE_PREFIX,
        title: 'Course creator verification pending',
        description:
          'Complete your course creator profile to request publishing access on Elimika.',
      },
      organisation: {
        verified: organisationVerified,
        allowedExactPaths: [ACCOUNT_PREFIX],
        allowedPrefixes: [ORGANISATION_PROFILE_PREFIX, PROFILE_PREFIX, CREDENTIALS_PREFIX],
        fallback: ORGANISATION_PROFILE_PREFIX,
        title: 'Organisation verification pending',
        description:
          'Your organisation profile and validation documents are under admin review. Verified-only tools are locked until admin approval is complete.',
      },
      organisation_user: {
        verified: organisationVerified,
        allowedExactPaths: [ACCOUNT_PREFIX],
        allowedPrefixes: [ORGANISATION_PROFILE_PREFIX, PROFILE_PREFIX, CREDENTIALS_PREFIX],
        fallback: ORGANISATION_PROFILE_PREFIX,
        title: 'Organisation verification pending',
        description:
          'Your organisation profile and validation documents are under admin review. Verified-only tools are locked until admin approval is complete.',
      },
    } as const;

    if (!(domain in shared)) {
      return { renderChildren: true };
    }

    const config = shared[domain as keyof typeof shared];

    if (config.verified) {
      return { renderChildren: true };
    }

    const isAllowed =
      ('allowedExactPaths' in config && config.allowedExactPaths.some(path => pathname === path)) ||
      config.allowedPrefixes.some(prefix => pathname.startsWith(prefix));

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
    organisation,
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
            'border-warning/30 bg-warning/10 mx-auto mb-4 w-full max-w-5xl text-foreground shadow-sm'
          )}
        >
          <ShieldAlert className='text-warning col-start-1 self-start' />
          <AlertTitle className='text-xs font-semibold tracking-[0.15em] uppercase'>
            {state.notice.title}
          </AlertTitle>
          <AlertDescription className='text-muted-foreground text-sm'>
            {state.notice.description}
          </AlertDescription>
        </Alert>
      ) : null}
      {children}
    </>
  );
}

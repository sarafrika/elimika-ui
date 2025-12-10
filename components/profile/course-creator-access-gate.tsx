'use client';

import { type ReactNode, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOptionalCourseCreator } from '@/context/course-creator-context';
import { useUserProfile } from '@/context/profile-context';
import { useUserDomain } from '@/context/user-domain-context';
import { cn } from '@/lib/utils';
import { ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

type CourseCreatorAccessGateProps = {
  children: ReactNode;
  fallbackUrl?: string;
};

export default function CourseCreatorAccessGate({
  children,
  fallbackUrl = '/dashboard/overview',
}: CourseCreatorAccessGateProps) {
  const profile = useUserProfile();
  const userDomain = useUserDomain();
  const courseCreator = useOptionalCourseCreator();
  const router = useRouter();

  // Check if loading
  if (profile?.isLoading || courseCreator?.isLoading) {
    return null;
  }

  // Check if user has course_creator in their user_domain
  const hasGlobalCourseCreatorAccess = userDomain.domains.includes('course_creator');

  // Check if user has course_creator in their organization domain
  const hasOrgCourseCreatorAccess = profile?.organisation_affiliations?.some(
    affiliation => affiliation.domain_in_organisation === 'course_creator' && affiliation.active
  );

  // Check if user has course creator profile
  const hasCourseCreatorProfile = Boolean(courseCreator?.profile);

  // Grant access if user has global access OR organization access with profile
  const hasAccess = hasGlobalCourseCreatorAccess || (hasOrgCourseCreatorAccess && hasCourseCreatorProfile);

  useEffect(() => {
    if (!profile?.isLoading && !hasAccess) {
      router.replace(fallbackUrl);
    }
  }, [profile?.isLoading, hasAccess, fallbackUrl, router]);

  if (!hasAccess) {
    return (
      <div className='mx-auto max-w-5xl p-4'>
        <Alert
          className={cn(
            'border-red-500/30 bg-red-50 text-red-900 shadow-sm',
            'dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-100'
          )}
        >
          <ShieldAlert className='col-start-1 self-start text-red-600 dark:text-red-400' />
          <AlertTitle className='text-xs font-semibold tracking-[0.15em] text-red-700 uppercase dark:text-red-300'>
            Access Denied
          </AlertTitle>
          <AlertDescription className='text-sm text-red-800/80 dark:text-red-200/80'>
            You need course creator permissions to access this feature. Please contact your organization
            administrator or the Elimika team for access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show verification notice if profile exists but not verified
  const isVerified = courseCreator?.profile?.admin_verified;
  const showVerificationNotice = hasCourseCreatorProfile && !isVerified;

  return (
    <>
      {showVerificationNotice && (
        <Alert
          className={cn(
            'mx-auto mb-4 w-full max-w-5xl border-yellow-500/30 bg-yellow-50 text-yellow-900 shadow-sm',
            'dark:border-yellow-500/40 dark:bg-yellow-950/30 dark:text-yellow-100'
          )}
        >
          <ShieldAlert className='col-start-1 self-start text-yellow-600 dark:text-yellow-400' />
          <AlertTitle className='text-xs font-semibold tracking-[0.15em] text-yellow-700 uppercase dark:text-yellow-300'>
            Course creator verification pending
          </AlertTitle>
          <AlertDescription className='text-sm text-yellow-800/80 dark:text-yellow-200/80'>
            Your course creator profile is awaiting verification. You can create draft courses, but
            publishing will be enabled after admin approval.
          </AlertDescription>
        </Alert>
      )}
      {children}
    </>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import {
  STUDENT_PROFILE_PROMPT,
  studentCoursePath,
  studentEnrollmentState,
  studentEnrollmentSwitchHref,
  studentProfileSetupHref,
} from '@/src/features/dashboard/lib/student-enrollment';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type StudentCourseActionProps = Pick<
  ComponentProps<typeof Button>,
  'variant' | 'size' | 'className' | 'disabled'
> & {
  href: string;
  children: ReactNode;
  onContinue?: () => void;
};

/** Browsing stays open; the student profile is required only when a learner action is clicked. */
export function StudentCourseAction({
  href,
  children,
  onContinue,
  ...props
}: StudentCourseActionProps) {
  const profile = useUserProfile();
  const domain = useUserDomain();
  const state = studentEnrollmentState({
    isLoading: !domain.isReady || Boolean(profile?.isLoading),
    accountUuid: profile?.uuid,
    studentUuid: profile?.student?.uuid,
    domains: domain.domains,
    activeDomain: domain.activeDomain,
  });

  if (state === 'loading' || props.disabled) {
    return (
      <Button {...props} type='button' disabled aria-busy={state === 'loading'}>
        {children}
      </Button>
    );
  }

  if (state === 'ready' && onContinue) {
    return (
      <Button
        {...props}
        type='button'
        onClick={event => {
          event.stopPropagation();
          onContinue();
        }}
      >
        {children}
      </Button>
    );
  }

  if (state === 'ready' || state === 'switch-profile') {
    return (
      <Button {...props} asChild>
        <Link
          href={state === 'ready' ? studentCoursePath(href) : studentEnrollmentSwitchHref(href)}
          onClick={event => event.stopPropagation()}
        >
          {children}
        </Link>
      </Button>
    );
  }

  const needsProfile = state === 'create-profile';
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button {...props} type='button' onClick={event => event.stopPropagation()}>
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent onClick={event => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>
            {needsProfile ? STUDENT_PROFILE_PROMPT.title : 'Couldn’t load your student profile'}
          </DialogTitle>
          <DialogDescription>
            {needsProfile
              ? STUDENT_PROFILE_PROMPT.description
              : 'Try loading your account again to continue.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' variant='outline'>
              Keep browsing
            </Button>
          </DialogClose>
          {needsProfile ? (
            <Button asChild>
              <Link href={studentProfileSetupHref(href)}>Create Student Profile</Link>
            </Button>
          ) : (
            <Button type='button' onClick={() => void profile?.invalidateQuery?.()}>
              Try again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { LogIn } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { itemLinks } from '@/src/features/catalogue/catalogue-search';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';

type ButtonProps = Pick<ComponentProps<typeof Button>, 'variant' | 'size' | 'className'>;

/**
 * A link for a signed-in viewer; for a visitor, sign-in first and then the same address
 * (the catalogue cards' convention, `itemLinks` / `hit-href.ts`).
 */
export function SignInOrLink({
  href,
  signIn: needsSignIn,
  label,
  children,
  ...button
}: ButtonProps & { href: string; signIn: boolean; label?: string; children: ReactNode }) {
  if (needsSignIn) {
    return (
      <Button
        type='button'
        {...button}
        aria-label={label}
        onClick={() => void signIn('keycloak', { redirectTo: `${window.location.origin}${href}` })}
      >
        <LogIn className='size-4' aria-hidden />
        {children}
      </Button>
    );
  }
  return (
    <Button asChild {...button}>
      <Link href={href} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}

/** The learner's enrolment page for one class, as Find classes links it. */
export const classEnrolHref = (courseUuid: string, classUuid: string) =>
  `${dashboardUrl('student', `courses/available-classes/${encodeURIComponent(courseUuid)}/enroll`)}?id=${encodeURIComponent(classUuid)}`;

/** Where a viewer looks for classes when this course has none open: Find classes, by course. */
export function SeeClassesAction({
  courseUuid,
  title,
  signedIn,
  ...button
}: ButtonProps & { courseUuid: string; title: string; signedIn: boolean }) {
  const { secondary } = itemLinks({ type: 'course', uuid: courseUuid, title }, signedIn);
  return (
    <SignInOrLink
      href={secondary.href}
      signIn={secondary.signIn}
      label={secondary.signIn ? `Sign in to see classes for ${title}` : undefined}
      {...button}
    >
      {secondary.signIn ? 'Sign in to see classes' : 'Find classes'}
    </SignInOrLink>
  );
}

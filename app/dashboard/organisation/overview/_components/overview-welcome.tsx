'use client';

import Link from 'next/link';

import { WelcomeBanner } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { useOrganisation } from '@/context/organisation-context';
import { useUserProfile } from '@/context/profile-context';

const dateLabel = () =>
  new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

/** Greeting banner for the org overview, wired to the org + profile context. */
export function OverviewWelcome() {
  const organisation = useOrganisation();
  const profile = useUserProfile();

  const firstName = profile?.first_name?.trim();
  const orgName = organisation?.name?.trim();
  const title = firstName ? `Welcome back, ${firstName}` : orgName ? `Welcome, ${orgName}` : 'Welcome back';

  return (
    <WelcomeBanner
      eyebrow={dateLabel()}
      title={title}
      description={
        orgName
          ? `Here's what's happening across ${orgName} today.`
          : "Here's what's happening across your organisation today."
      }
      actions={
        <>
          <Button
            asChild
            variant='secondary'
            size='sm'
            className='bg-white/15 text-white hover:bg-white/25 sm:h-10 sm:px-4'
          >
            <Link href='/dashboard/organisation/audit'>View Reports</Link>
          </Button>
          <Button
            asChild
            size='sm'
            className='bg-teal-500 text-white shadow-sm hover:bg-teal-600 sm:h-10 sm:px-4'
          >
            <Link href='/dashboard/organisation/approvals'>Manage Approvals</Link>
          </Button>
        </>
      }
    />
  );
}

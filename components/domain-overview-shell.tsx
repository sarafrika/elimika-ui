'use client';

import { surfaceTheme } from '@/components/data-display';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { WelcomeBanner } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { useOrganisation } from '@/context/organisation-context';
import { useUserProfile } from '@/context/profile-context';
import { useUserDomain } from '../context/user-domain-context';

type BadgeTone = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';

interface DomainOverviewShellProps {
  domainLabel: string;
  title: string;
  subtitle: string;
  badge?: {
    label: string;
    tone?: BadgeTone;
  };
  actions?: ReactNode;
  welcomeContent?: ReactNode;
  leftColumn: ReactNode;
  rightColumn: ReactNode;
  children: ReactNode;
  className?: string;
}

const dateLabel = () =>
  new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

function DomainOverviewShell({
  domainLabel,
  title,
  subtitle,
  badge,
  actions,
  welcomeContent,
  leftColumn,
  rightColumn,
  className,
  children,
}: DomainOverviewShellProps) {
  return (
    <div className={cn(surfaceTheme.pageWide, 'space-y-6 overflow-x-auto pt-4 pb-10', className)}>
      <OverviewWelcome welcomeContent={welcomeContent} />

      {children}

      {/* <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <section className="space-y-4">{leftColumn}</section>
        <section className="space-y-4">{rightColumn}</section>
      </div> */}
    </div>
  );
}

export default DomainOverviewShell;


/** Greeting banner for the org overview, wired to the org + profile context. */
function OverviewWelcome({ welcomeContent }: { welcomeContent?: ReactNode }) {
  const organisation = useOrganisation();
  const profile = useUserProfile();
  const { activeDomain } = useUserDomain()

  const firstName = profile?.first_name?.trim();
  const orgName = organisation?.name?.trim();

  const isOrganisation = activeDomain === 'organisation';

  const title = isOrganisation
    ? orgName
      ? `Welcome, ${orgName}`
      : 'Welcome back'
    : firstName
      ? `Welcome back, ${firstName}`
      : 'Welcome back';

  const description = isOrganisation && orgName
    ? `Here's what's happening across ${orgName} today.`
    : "Here's what's happening across your account today.";



  return (
    <WelcomeBanner
      eyebrow={dateLabel()}
      title={title}
      description={description}
      content={welcomeContent}
      compact
      className='bg-primary/75'
      actions={
        <>
          <Button
            asChild
            variant='secondary'
            size='sm'
            className='bg-white/15 text-white hover:bg-white/25 sm:h-10 sm:px-4'
          >
            <Link href='/dashboard/course-creator/analytics'>View Analytics</Link>
          </Button>
          <Button
            asChild
            size='sm'
            className='bg-teal-500 text-white shadow-sm hover:bg-teal-600 sm:h-10 sm:px-4'
          >
            <Link href='/dashboard/course-creator/pending-approvals'>Manage Approvals</Link>
          </Button>
        </>
      }
    />
  );
}


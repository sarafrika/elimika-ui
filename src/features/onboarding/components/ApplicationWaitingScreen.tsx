'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock3, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { UserDomain } from '@/lib/types';
import { getCurrentAccountStatusOptions } from '@/services/client/@tanstack/react-query.gen';
import { plainText } from '@/src/features/onboarding/lib/plain-text';

const DOMAIN_LABELS: Partial<Record<UserDomain, string>> = {
  instructor: 'Instructor',
  course_creator: 'Course Creator',
  organisation: 'Organisation',
  organisation_user: 'Organisation',
};

/**
 * Shown in place of a role dashboard while its application is under review or after it was
 * turned down. It re-checks every 30 seconds and opens the real dashboard once approved.
 */
export function ApplicationWaitingScreen({
  domain,
  status,
  reason,
}: {
  domain: UserDomain;
  status: string;
  reason: string | null;
}) {
  const router = useRouter();
  const { data } = useQuery({
    ...getCurrentAccountStatusOptions(),
    select: response =>
      response.data?.domain_applications?.find(application => application.domain === domain),
    refetchInterval: 30_000,
    retry: false,
  });

  const liveStatus = data?.status ?? status;
  const liveReason = data ? (data.review_reason ?? null) : reason;

  useEffect(() => {
    if (liveStatus === 'APPROVED') router.refresh();
  }, [liveStatus, router]);

  const label = DOMAIN_LABELS[domain] ?? domain;
  const pending = liveStatus === 'PENDING' || liveStatus === 'APPROVED';
  const Icon = pending ? Clock3 : ShieldAlert;

  return (
    <div className='flex min-h-[60vh] items-center justify-center p-4'>
      <Card className={pending ? 'w-full max-w-xl' : 'border-destructive/40 w-full max-w-xl'}>
        <CardContent className='flex flex-col items-center gap-4 py-10 text-center'>
          <div
            className={
              pending
                ? 'bg-primary/10 text-primary rounded-full p-3'
                : 'bg-destructive/10 text-destructive rounded-full p-3'
            }
          >
            <Icon className='size-6' />
          </div>
          <h1 className='text-foreground text-xl font-semibold'>
            {pending
              ? `Your ${label} application is awaiting approval`
              : `Your ${label} application was not approved`}
          </h1>
          <p className='text-muted-foreground max-w-md text-sm'>
            {pending
              ? `An Elimika admin is reviewing your details. Your ${label} dashboard opens here as soon as you are approved; you do not need to submit again.`
              : plainText(liveReason) ||
                'An Elimika admin turned down this application. Contact support for help.'}
          </p>
          {pending ? (
            <p className='text-muted-foreground text-xs'>
              This page checks for a decision every 30 seconds.
            </p>
          ) : (
            <Button asChild className='rounded-md'>
              <Link href='/onboarding'>Choose another role</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

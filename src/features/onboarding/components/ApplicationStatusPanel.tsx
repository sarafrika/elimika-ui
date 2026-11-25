'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { getCurrentAccountStatusOptions } from '@/services/client/@tanstack/react-query.gen';
import { awaitingApprovalPath, isChangesRequested } from '@/src/features/onboarding/lib/application-review';
import { plainText } from '@/src/features/onboarding/lib/plain-text';
import { useQuery } from '@tanstack/react-query';
import { Clock3, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

const DOMAIN_LABELS: Record<string, string> = {
  instructor: 'Instructor',
  course_creator: 'Course Creator',
  organisation_user: 'Organisation',
  student: 'Student',
};

/** Shows applications still under review (or turned down) so onboarding never looks like a dead end. */
export function ApplicationStatusPanel() {
  const { data } = useQuery({
    ...getCurrentAccountStatusOptions(),
    select: response => response.data,
    retry: false,
  });

  const applications = (data?.domain_applications ?? []).filter(
    application => application.status && application.status !== 'APPROVED'
  );
  if (!applications.length) return null;

  return (
    <div className='mx-auto my-10 max-w-3xl space-y-3'>
      {applications.map(application => {
        const label = DOMAIN_LABELS[application.domain ?? ''] ?? application.domain;
        const pending = application.status === 'PENDING';
        const feedback = plainText(application.review_reason);
        const changesRequested = !pending && isChangesRequested(feedback);
        const Icon = pending ? Clock3 : ShieldAlert;
        return (
          <Alert
            key={`${application.domain}-${application.status}`}
            className={pending ? undefined : 'border-destructive/40 bg-destructive/5'}
          >
            <Icon className={pending ? 'h-4 w-4' : 'text-destructive h-4 w-4'} />
            <AlertTitle className={pending ? undefined : 'text-destructive'}>
              {pending
                ? `${label} application awaiting approval`
                : changesRequested
                  ? `${label} application needs changes`
                  : `${label} application not approved`}
            </AlertTitle>
            <AlertDescription>
              {pending
                ? `We have your ${label} details. An Elimika admin will review them and your dashboard opens once approved. You do not need to submit again.`
                : feedback ||
                `Your ${label} application was ${application.status?.toLowerCase()}. Contact support for help.`}
              <Button asChild variant='link' size='sm' className='mt-2 h-auto p-0'>
                <Link href={awaitingApprovalPath(application.domain)}>View application status</Link>
              </Button>
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock3, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getCurrentAccountStatusOptions } from '@/services/client/@tanstack/react-query.gen';

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
    <div className='mx-auto mb-10 max-w-3xl space-y-3'>
      {applications.map(application => {
        const label = DOMAIN_LABELS[application.domain ?? ''] ?? application.domain;
        const pending = application.status === 'PENDING';
        const Icon = pending ? Clock3 : ShieldAlert;
        return (
          <Alert
            key={`${application.domain}-${application.status}`}
            variant={pending ? 'default' : 'destructive'}
          >
            <Icon className='h-4 w-4' />
            <AlertTitle>
              {pending
                ? `${label} application awaiting approval`
                : `${label} application not approved`}
            </AlertTitle>
            <AlertDescription>
              {pending
                ? `We have your ${label} details. An Elimika admin will review them and your dashboard opens once approved. You do not need to submit again.`
                : application.review_reason ||
                  `Your ${label} application was ${application.status?.toLowerCase()}. Contact support for help.`}
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}

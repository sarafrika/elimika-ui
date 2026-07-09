'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ClipboardCheck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useOrganisation } from '@/context/organisation-context';
import { useUserProfile } from '@/context/profile-context';
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { cn } from '@/lib/utils';
import {
  getPendingOrganisationsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { SectionCard } from '../../_components/ui';

/** Actionable alerts for the control centre — pending applications and (for admins) verifications. */
export function OverviewAlerts() {
  const organisation = useOrganisation();
  const profile = useUserProfile();
  const organisationUuid = organisation?.uuid ?? '';
  const isSystemAdmin = Boolean(profile?.user_domain?.includes('admin'));

  const pendingApplicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: {
          course_creator_uuid_eq: organisationUuid,
          status_eq: 'PENDING',
        },
        pageable: { page: 0, size: 1 },
      },
    }),
    enabled: Boolean(organisationUuid),
  });

  const pendingVerificationQuery = useQuery({
    ...getPendingOrganisationsOptions({ query: { pageable: { page: 0, size: 1 } } }),
    enabled: isSystemAdmin,
  });

  const pendingApplications = getTotalFromMetadata(
    extractPage(pendingApplicationsQuery.data).metadata
  );
  const pendingVerifications = getTotalFromMetadata(
    extractPage(pendingVerificationQuery.data).metadata
  );

  const alerts = [
    {
      show: true,
      count: pendingApplications,
      label: 'Training applications awaiting review',
      href: '/dashboard/training-applications',
      icon: ClipboardCheck,
    },
    {
      show: isSystemAdmin,
      count: pendingVerifications,
      label: 'Organisations pending verification',
      href: '/dashboard/verification',
      icon: ShieldCheck,
    },
  ].filter(alert => alert.show);

  const hasAlerts = alerts.some(alert => alert.count > 0);

  return (
    <SectionCard title='Alerts' description='Items that need your attention'>
      {hasAlerts ? (
        <ul className='flex flex-col gap-3'>
          {alerts.map(alert => {
            const Icon = alert.icon;
            const active = alert.count > 0;
            return (
              <li key={alert.href}>
                <Link
                  href={alert.href}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-md border p-4 transition-colors',
                    active
                      ? 'border-warning/30 bg-warning/10 hover:bg-warning/15'
                      : 'border-border/60 bg-muted/30 hover:bg-muted/50'
                  )}
                >
                  <span className='flex items-center gap-3'>
                    <Icon
                      className={cn('size-5', active ? 'text-warning' : 'text-muted-foreground')}
                    />
                    <span className='text-sm text-foreground'>{alert.label}</span>
                  </span>
                  <span
                    className={cn(
                      'text-lg font-semibold tabular-nums',
                      active ? 'text-warning' : 'text-muted-foreground'
                    )}
                  >
                    {alert.count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className='flex items-center gap-3 rounded-md border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground'>
          <CheckCircle2 className='size-5 text-success' />
          You&apos;re all caught up — no pending actions.
        </div>
      )}
    </SectionCard>
  );
}

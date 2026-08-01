'use client';

import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, ShieldAlert } from 'lucide-react';

import { AlertPanel, type AlertItem } from '@/components/dashboard';
import { useOrganisation } from '@/context/organisation-context';
import { searchTrainingApplicationsOptions } from '@/services/client/@tanstack/react-query.gen';

type TrainingApplicationLike = { status?: string | null };

const isPending = (status?: string | null) => (status ?? '').toLowerCase() === 'pending';

/**
 * Org-scoped alerts. Container that surfaces real signals (verification status,
 * pending training applications the org submitted) into the presentational
 * AlertPanel. Renders a graceful "all caught up" state when nothing is pending.
 */
export function OverviewAlerts() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const isUnverified = Boolean(organisationUuid) && organisation?.admin_verified !== true;
  const awaitingReview = isUnverified && Boolean(organisation?.verification_requested_at);

  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: {
          applicant_uuid_eq: organisationUuid,
          applicant_type_eq: 'organisation',
        },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: Boolean(organisationUuid),
  });

  const applications = (applicationsQuery.data?.data?.content ?? []) as TrainingApplicationLike[];
  const pendingApplications = applications.filter(application =>
    isPending(application.status)
  ).length;

  const alerts: AlertItem[] = [];

  if (isUnverified) {
    alerts.push({
      id: 'verification',
      severity: awaitingReview ? 'medium' : 'high',
      title: awaitingReview
        ? 'Verification awaiting admin review'
        : 'Organisation not yet submitted for verification',
      description: awaitingReview
        ? 'Your organisation has been submitted. An admin will review it shortly.'
        : 'Complete your profile, then submit for admin verification to unlock all features.',
      icon: ShieldAlert,
      actionLabel: awaitingReview ? 'View' : 'Submit',
      href: '/dashboard/organisation/account',
    });
  }

  if (pendingApplications > 0) {
    alerts.push({
      id: 'approvals',
      severity: 'medium',
      title: `${pendingApplications} training ${pendingApplications === 1 ? 'request' : 'requests'} pending`,
      description: 'Your training applications are awaiting admin review.',
      icon: ClipboardCheck,
      actionLabel: 'View',
      href: '/dashboard/organisation/approvals',
    });
  }

  return <AlertPanel alerts={alerts} />;
}

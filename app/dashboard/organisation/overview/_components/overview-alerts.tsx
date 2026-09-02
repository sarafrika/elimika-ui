'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Bell, BellRing, ClipboardCheck, Info, Send, ShieldAlert } from 'lucide-react';

import { AlertPanel, type AlertItem, type AlertSeverity } from '@/components/dashboard';
import { useOrganisation } from '@/context/organisation-context';
import { extractPage } from '@/lib/api-helpers';
import type { NotificationDto } from '@/services/client';
import {
  listNotificationsOptions,
  listSentOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';

type TrainingApplicationLike = { status?: string | null };

const isPending = (status?: string | null) => (status ?? '').toLowerCase() === 'pending';

const severityFor = (n: NotificationDto): AlertSeverity => {
  const p = (n.priority ?? '').toLowerCase();
  if (p.includes('high') || p.includes('urgent') || p.includes('critical')) return 'high';
  if (p.includes('low')) return 'low';
  return 'medium';
};

const iconFor = (n: NotificationDto) => {
  const p = (n.priority ?? '').toLowerCase();
  if (p.includes('high') || p.includes('urgent') || p.includes('critical')) return AlertTriangle;
  if ((n.category ?? '').toLowerCase().includes('info')) return Info;
  return n.read_at ? Bell : BellRing;
};

/**
 * Org-scoped alerts. Surfaces the organisation's own operational signals (verification status,
 * pending training applications) together with the most recent incoming notifications from its
 * inbox — a compact mirror of the notifications section. Renders a graceful "all caught up" state
 * when there is nothing to show.
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

  const notificationsQuery = useQuery({
    ...listNotificationsOptions({ query: { pageable: { page: 0, size: 5 } } }),
    enabled: Boolean(organisationUuid),
  });

  const sentQuery = useQuery({
    ...listSentOptions({ path: { organisationUuid }, query: { limit: 2 } }),
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

  for (const d of sentQuery.data?.data ?? []) {
    const count = d.recipient_count ?? 0;
    alerts.push({
      id: `sent-${d.uuid}`,
      severity: 'low',
      title: `Sent: ${d.title}`,
      description: `To ${d.audience} · ${count} recipient${count === 1 ? '' : 's'}`,
      icon: Send,
      actionLabel: 'View',
      href: '/dashboard/organisation/notifications',
    });
  }

  for (const n of extractPage<NotificationDto>(notificationsQuery.data).items) {
    alerts.push({
      id: n.uuid ?? n.notification_id ?? `${n.title}-${n.created_at}`,
      severity: severityFor(n),
      title: n.title ?? 'Notification',
      description: n.body ?? '',
      icon: iconFor(n),
      actionLabel: n.action_url ? 'View' : undefined,
      href: n.action_url ?? undefined,
    });
  }

  return <AlertPanel alerts={alerts} />;
}

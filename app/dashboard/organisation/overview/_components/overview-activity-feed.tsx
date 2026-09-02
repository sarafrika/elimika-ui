'use client';

import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { BookOpen, UserPlus, Wallet } from 'lucide-react';

import { ActivityFeed, ActivityFeedSkeleton, type ActivityItem } from '@/components/dashboard';
import { useOrganisation } from '@/context/organisation-context';
import { useStudentsByIds, useUsersByIds } from '@/hooks/use-batched-lookups';
import { getActivityFeedOptions } from '@/services/client/@tanstack/react-query.gen';

dayjs.extend(relativeTime);

const CURRENCY_PREFIXES: Record<string, string> = {
  KES: 'KSh ',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const fullName = (first?: string, last?: string) =>
  [first, last].filter(Boolean).join(' ').trim();

const formatAmount = (amount?: number, currencyCode?: string) => {
  const prefix = currencyCode
    ? (CURRENCY_PREFIXES[currencyCode] ?? `${currencyCode} `)
    : '';
  return `${prefix}${Number(amount ?? 0).toLocaleString()}`;
};

/**
 * Organisation activity feed — the recent enrolments, class openings and instructor payouts
 * returned by the org activity endpoint, with student and instructor names resolved through the
 * batched directory lookups. Renders the feed's own empty state when nothing has happened yet.
 */
export function OverviewActivityFeed() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const feedQuery = useQuery({
    ...getActivityFeedOptions({ path: { organisationUuid }, query: { limit: 20 } }),
    enabled: Boolean(organisationUuid),
  });

  const events = useMemo(() => feedQuery.data?.data ?? [], [feedQuery.data]);

  // Enrolment subjects are student uuids; resolve them to their user uuids first.
  const studentUuids = useMemo(
    () =>
      events
        .filter(e => e.event_type === 'ENROLMENT' && e.subject_uuid)
        .map(e => e.subject_uuid as string),
    [events]
  );
  const { studentMap } = useStudentsByIds(studentUuids);

  // Payout subjects are already user uuids; add the enrolment students' user uuids.
  const userUuids = useMemo(() => {
    const ids = new Set<string>();
    for (const e of events) {
      if (e.event_type === 'PAYOUT' && e.subject_uuid) ids.add(e.subject_uuid);
      if (e.event_type === 'ENROLMENT' && e.subject_uuid) {
        const userUuid = studentMap[e.subject_uuid]?.user_uuid;
        if (userUuid) ids.add(userUuid);
      }
    }
    return Array.from(ids);
  }, [events, studentMap]);
  const { userMap } = useUsersByIds(userUuids);

  const items: ActivityItem[] = useMemo(
    () =>
      events.map((e, index) => {
        const when = e.occurred_at ? dayjs(e.occurred_at).fromNow() : '';
        const id = `${e.event_type}-${index}-${e.occurred_at ?? ''}`;

        if (e.event_type === 'PAYOUT') {
          const user = e.subject_uuid ? userMap[e.subject_uuid] : undefined;
          const who = fullName(user?.first_name, user?.last_name) || 'an instructor';
          return {
            id,
            text: `Paid ${formatAmount(e.amount, e.currency_code)} to ${who}`,
            time: when,
            icon: Wallet,
            iconClassName: 'bg-warning/10 text-warning',
          };
        }

        if (e.event_type === 'CLASS_OPENED') {
          return {
            id,
            text: `New class opened${e.class_title ? `: ${e.class_title}` : ''}`,
            time: when,
            icon: BookOpen,
            iconClassName: 'bg-success/10 text-success',
          };
        }

        // ENROLMENT
        const userUuid = e.subject_uuid ? studentMap[e.subject_uuid]?.user_uuid : undefined;
        const user = userUuid ? userMap[userUuid] : undefined;
        const who = fullName(user?.first_name, user?.last_name) || 'A student';
        return {
          id,
          text: `${who} enrolled${e.class_title ? ` in ${e.class_title}` : ''}`,
          time: when,
          icon: UserPlus,
          iconClassName: 'bg-primary/10 text-primary',
        };
      }),
    [events, studentMap, userMap]
  );

  if (feedQuery.isLoading) {
    return <ActivityFeedSkeleton />;
  }

  return <ActivityFeed items={items} />;
}

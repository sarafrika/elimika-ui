'use client';

import { useQuery } from '@tanstack/react-query';

import { TodayGrowthChart } from '@/components/dashboard';
import { useOrganisation } from '@/context/organisation-context';
import { getTodayGrowthOptions } from '@/services/client/@tanstack/react-query.gen';

/**
 * Real "today's growth" chart — hourly enrolment activity for the current day,
 * wired to `/enrollment/organisations/{uuid}/today-growth`. Gracefully empty when
 * there has been no enrolment activity today.
 */
export function OverviewTodayGrowth() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const growthQuery = useQuery({
    ...getTodayGrowthOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });

  const data = (growthQuery.data?.data ?? []).map(point => ({
    hour: point.hour ?? '',
    enrolments: Number(point.enrolments ?? 0),
  }));

  return <TodayGrowthChart data={data} />;
}

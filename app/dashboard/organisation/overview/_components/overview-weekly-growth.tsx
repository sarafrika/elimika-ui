'use client';

import { useQuery } from '@tanstack/react-query';

import { WeeklyGrowthChart } from '@/components/dashboard';
import { useOrganisation } from '@/context/organisation-context';
import { getWeeklyGrowthOptions } from '@/services/client/@tanstack/react-query.gen';

/**
 * Real weekly-growth chart — distinct student/course enrolments per ISO week over the
 * last 8 weeks, wired to `/enrollment/organisations/{uuid}/weekly-growth`. Gracefully
 * empty when there has been no enrolment activity in the window.
 */
export function OverviewWeeklyGrowth() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const growthQuery = useQuery({
    ...getWeeklyGrowthOptions({ path: { organisationUuid }, query: { weeks: 8 } }),
    enabled: Boolean(organisationUuid),
  });

  const data = (growthQuery.data?.data ?? []).map(point => ({
    week: point.week ?? '',
    enrolments: Number(point.enrolments ?? 0),
  }));

  return <WeeklyGrowthChart data={data} />;
}

'use client';

import { useQuery } from '@tanstack/react-query';

import { EnrollmentTrendsChart } from '@/components/dashboard';
import { useOrganisation } from '@/context/organisation-context';
import { getEnrolmentTrendsOptions } from '@/services/client/@tanstack/react-query.gen';

/**
 * Real monthly enrolment-trend chart, wired to the org-scoped
 * `/enrollment/organisations/{uuid}/enrolment-trends` endpoint. Falls back to the
 * chart's graceful empty state when there is no enrolment history yet.
 */
export function OverviewEnrolmentTrends() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const trendsQuery = useQuery({
    ...getEnrolmentTrendsOptions({
      path: { organisationUuid },
      query: { months: 6 },
    }),
    enabled: Boolean(organisationUuid),
  });

  const data = (trendsQuery.data?.data ?? []).map(point => ({
    month: point.month ?? '',
    enrolments: Number(point.total ?? 0),
  }));

  return (
    <EnrollmentTrendsChart
      data={data}
      series={[{ key: 'enrolments', name: 'Enrolments', color: 'var(--color-chart-1)' }]}
    />
  );
}

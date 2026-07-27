// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { FileText } from 'lucide-react';
import { useMemo } from 'react';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity } from '@/lib/api-helpers';
import type { Course } from '@/services/client';
import {
  getCourseByUuidOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';

const statusVariant = (status?: string) => {
  const s = (status ?? '').toLowerCase();
  if (s === 'approved') return 'default' as const;
  if (s === 'rejected' || s === 'revoked') return 'destructive' as const;
  return 'outline' as const;
};

const pretty = (value?: string | null) =>
  value ? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';

export default function MyApplicationsPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: { applicant_uuid_eq: organisationUuid, applicant_type_eq: 'organisation' },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: Boolean(organisationUuid),
  });

  const applications = applicationsQuery.data?.data?.content ?? [];

  const courseUuids = useMemo(
    () => Array.from(new Set(applications.map(a => a.course_uuid).filter(Boolean) as string[])),
    [applications]
  );
  const courseQueries = useQueries({
    queries: courseUuids.map(uuid => ({
      ...getCourseByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const courseByUuid = useMemo(() => {
    const map = new Map<string, { course?: Course; loading: boolean }>();
    courseQueries.forEach((q, i) => {
      map.set(courseUuids[i], { course: extractEntity<Course>(q.data) ?? undefined, loading: q.isLoading });
    });
    return map;
  }, [courseQueries, courseUuids]);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <PageHeader title="My Applications" description="Track applications to train courses and their review status." />

      <div className="space-y-4">
        <div className="pb-3">
          <h3 className="text-base font-semibold">Applications to train</h3>
        </div>
        {applications.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No applications yet"
            description="Apply to train a course from the catalogue and track its review status here."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Course</TableHead>
                  <TableHead className="min-w-[120px] whitespace-nowrap">Subject</TableHead>
                  <TableHead className="whitespace-nowrap">Submitted</TableHead>
                  <TableHead className="whitespace-nowrap">Cohort</TableHead>
                  <TableHead className="whitespace-nowrap">Mode</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Reviewer notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map(app => {
                  const entry = app.course_uuid ? courseByUuid.get(app.course_uuid) : undefined;
                  const course = entry?.course;
                  const cats = course?.category_names ?? [];
                  return (
                    <TableRow key={app.uuid}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {course?.name ?? (entry?.loading ? <Skeleton className="h-4 w-40" /> : 'Course')}
                      </TableCell>
                      <TableCell className="min-w-[120px] whitespace-nowrap text-muted-foreground">
                        {cats[1] ?? cats[0] ?? '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {app.created_date ? dayjs(app.created_date).format('DD MMM YYYY') : '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">—</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">—</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={statusVariant(app.status)}>{pretty(app.status)}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs whitespace-nowrap text-sm text-muted-foreground">
                        {app.review_notes ?? app.rejection_reason ?? '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

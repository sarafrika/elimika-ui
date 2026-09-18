'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ChevronRight, Clock, Inbox, Layers, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { AsyncSection } from '@/components/data/async-section';
import { KpiCard, KpiCardSkeleton } from '@/components/dashboard';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { RateUpdateStatus } from '@/components/rate-card/rate-update-status';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import { useCoursesByIds, useProgramsByIds } from '@/hooks/use-batched-lookups';
import { dayjs } from '@/lib/date';
import { APPROVAL_QUERY_FRESHNESS, STALE_TIMES } from '@/lib/query-client';
import { offeredMethods } from '@/lib/rate-card';
import {
  searchProgramTrainingApplicationsOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { dashboardUrl } from '@/src/features/dashboard/lib/dashboard-url';
import { ApplicationStatusBadge } from '@/src/features/rate-card/components/application-status-badge';
import type { TrainingApplication, TrainingApplicationKind } from '@/src/features/rate-card/types';
import { OrgPage } from '../_components/org-page';

type Row = {
  kind: TrainingApplicationKind;
  uuid: string;
  parentUuid: string;
  name: string | undefined;
  application: TrainingApplication;
};

const PAGEABLE = { page: 0, size: 100 };

export default function OrganisationApprovalsPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const query = {
    searchParams: { applicant_uuid_eq: organisationUuid, applicant_type_eq: 'organisation' },
    pageable: PAGEABLE,
  };
  const enabled = Boolean(organisationUuid);

  const coursesQuery = useQuery({
    ...searchTrainingApplicationsOptions({ query }),
    ...APPROVAL_QUERY_FRESHNESS,
    staleTime: STALE_TIMES.live,
    enabled,
  });
  const programsQuery = useQuery({
    ...searchProgramTrainingApplicationsOptions({ query }),
    ...APPROVAL_QUERY_FRESHNESS,
    staleTime: STALE_TIMES.live,
    enabled,
  });

  const courseApplications = useMemo(
    () => coursesQuery.data?.data?.content ?? [],
    [coursesQuery.data]
  );
  const programApplications = useMemo(
    () => programsQuery.data?.data?.content ?? [],
    [programsQuery.data]
  );
  const courseUuids = useMemo(
    () => courseApplications.map(row => row.course_uuid).filter((id): id is string => Boolean(id)),
    [courseApplications]
  );
  const programUuids = useMemo(
    () =>
      programApplications.map(row => row.program_uuid).filter((id): id is string => Boolean(id)),
    [programApplications]
  );
  const { courseMap } = useCoursesByIds(courseUuids);
  const { programMap } = useProgramsByIds(programUuids);

  const rows = useMemo<Row[]>(() => {
    const courseRows = courseApplications.flatMap(application =>
      application.uuid && application.course_uuid
        ? [
            {
              kind: 'course' as const,
              uuid: application.uuid,
              parentUuid: application.course_uuid,
              name: courseMap[application.course_uuid]?.name,
              application,
            },
          ]
        : []
    );
    const programRows = programApplications.flatMap(application =>
      application.uuid && application.program_uuid
        ? [
            {
              kind: 'program' as const,
              uuid: application.uuid,
              parentUuid: application.program_uuid,
              name: programMap[application.program_uuid]?.title,
              application,
            },
          ]
        : []
    );
    const time = (row: Row) =>
      row.application.created_date ? new Date(row.application.created_date).getTime() : 0;
    return [...courseRows, ...programRows].sort((a, b) => time(b) - time(a));
  }, [courseApplications, programApplications, courseMap, programMap]);

  const counts = useMemo(() => {
    const tally = { pending: 0, approved: 0, rejected: 0, updates: 0 };
    for (const { application } of rows) {
      if (application.status === 'pending') tally.pending += 1;
      if (application.status === 'approved') tally.approved += 1;
      if (application.status === 'rejected' || application.status === 'revoked')
        tally.rejected += 1;
      if (application.pending_rate_update_uuid) tally.updates += 1;
    }
    return tally;
  }, [rows]);

  const loading =
    !enabled ||
    (coursesQuery.isLoading && !coursesQuery.data) ||
    (programsQuery.isLoading && !programsQuery.data);
  const error = coursesQuery.error ?? programsQuery.error;
  const retry = () => {
    void coursesQuery.refetch();
    void programsQuery.refetch();
  };

  return (
    <OrgPage className='space-y-6'>
      <PageHeader
        title='Approvals'
        description='Your organisation’s applications to train courses and programs. Open one to see where it is, its rate card and its history.'
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {loading ? (
          [0, 1, 2, 3].map(index => <KpiCardSkeleton key={index} />)
        ) : (
          <>
            <KpiCard
              title='Pending'
              value={counts.pending}
              icon={<Clock className='h-5 w-5' />}
              variant='amber'
            />
            <KpiCard
              title='Approved'
              value={counts.approved}
              icon={<CheckCircle2 className='h-5 w-5' />}
              variant='green'
            />
            <KpiCard
              title='Updates awaiting approval'
              value={counts.updates}
              icon={<Layers className='h-5 w-5' />}
              variant='indigo'
            />
            <KpiCard
              title='Rejected or revoked'
              value={counts.rejected}
              icon={<XCircle className='h-5 w-5' />}
              variant='coral'
            />
          </>
        )}
      </div>

      <Card>
        <CardContent className='space-y-4 p-6'>
          <div className='space-y-1'>
            <h2 className='text-foreground text-base font-semibold'>Your applications</h2>
            <p className='text-muted-foreground text-sm'>
              Courses and programs your organisation has applied to train.
            </p>
          </div>

          <AsyncSection
            loading={loading}
            error={error}
            onRetry={retry}
            errorTitle='Couldn’t load your applications'
            empty={rows.length === 0}
            skeleton={
              <div className='space-y-2'>
                {[0, 1, 2, 3].map(index => (
                  <Skeleton key={index} className='h-14 w-full' />
                ))}
              </div>
            }
            emptyState={
              <EmptyState
                icon={Inbox}
                title='No applications yet'
                description='Apply to train a course or program from the course catalog.'
              />
            }
          >
            <div className='overflow-x-auto rounded-lg border'>
              <Table className='min-w-[820px]'>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course or program</TableHead>
                    <TableHead>Methods offered</TableHead>
                    <TableHead className='whitespace-nowrap'>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='sr-only'>Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(row => (
                    <ApprovalRow key={`${row.kind}-${row.uuid}`} row={row} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </AsyncSection>
        </CardContent>
      </Card>
    </OrgPage>
  );
}

function ApprovalRow({ row }: { row: Row }) {
  const href = dashboardUrl('organisation', `approvals/${row.uuid}`);
  const { application } = row;
  const methods = offeredMethods(application.rate_card);

  return (
    <TableRow>
      <TableCell>
        <Link href={href} className='text-foreground font-medium hover:underline'>
          {row.name ?? (row.kind === 'program' ? 'Program' : 'Course')}
        </Link>
        <p className='text-muted-foreground text-xs capitalize'>{row.kind}</p>
      </TableCell>
      <TableCell className='text-muted-foreground max-w-xs text-sm'>
        {methods.length ? methods.map(method => method.label).join(' · ') : 'None'}
      </TableCell>
      <TableCell className='text-muted-foreground whitespace-nowrap'>
        {application.created_date ? dayjs(application.created_date).format('D MMM YYYY') : '—'}
      </TableCell>
      <TableCell>
        <div className='flex flex-wrap items-center gap-1.5'>
          <ApplicationStatusBadge status={application.status} kind={row.kind} />
          {application.status === 'approved' ? (
            <RateUpdateStatus
              variant='badge'
              kind={row.kind}
              parentUuid={row.parentUuid}
              applicationUuid={row.uuid}
              pendingUpdateUuid={application.pending_rate_update_uuid}
            />
          ) : null}
        </div>
      </TableCell>
      <TableCell className='text-right'>
        <Button asChild variant='ghost' size='sm'>
          <Link href={href} aria-label={`Open ${row.name ?? 'application'}`}>
            View
            <ChevronRight aria-hidden />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

'use client';

import { Ban, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import {
  DetailGrid,
  SectionCard,
  SectionCardSkeleton,
  StatusBadge,
  surfaceTheme,
} from '@/components/data-display';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useCoursesByIds,
  useInstructorsByIds,
  useOrganisationsByIds,
  useProgramsByIds,
} from '@/hooks/use-batched-lookups';
import { formatDate, formatDateTime } from '@/lib/date';
import { toNumber } from '@/lib/metrics';
import { RecordHeader } from '../components/record-header';
import { SectionBoundary } from '../components/section-boundary';
import {
  APPLICATION_CLOSED,
  APPLICATION_PIPELINE,
  useJobApplications,
  useMarketplaceJob,
} from '../hooks/use-marketplace';
import { adminRoutes } from '../lib/admin-routes';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'neutral' | 'destructive' | 'info'> = {
  open: 'success',
  awaiting_class: 'warning',
  filled: 'info',
  cancelled: 'destructive',
  expired: 'neutral',
  pending: 'warning',
  shortlisted: 'info',
  interviewing: 'info',
  offered: 'info',
  hired: 'success',
  assigned: 'success',
  rejected: 'destructive',
  not_selected: 'neutral',
  withdrawn: 'neutral',
};

const label = (value?: string | null) =>
  value ? value.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase()) : '—';

const money = (amount?: number | null) =>
  typeof amount === 'number' ? amount.toLocaleString('en-KE') : '—';

/** Initials for the monogram, from the job title. */
function monogram(title: string) {
  return (
    title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0]?.toUpperCase() ?? '')
      .join('') || 'JB'
  );
}

export function AdminJobPage({ jobUuid }: { jobUuid: string }) {
  const { job, query } = useMarketplaceJob(jobUuid);
  const { applications, pipeline, query: applicationsQuery } = useJobApplications(jobUuid);

  const { organisationMap } = useOrganisationsByIds(
    job?.organisation_uuid ? [job.organisation_uuid] : []
  );
  const { courseMap } = useCoursesByIds(job?.course_uuid ? [job.course_uuid] : []);
  const { programMap } = useProgramsByIds(job?.program_uuid ? [job.program_uuid] : []);

  // One lookup resolves every applicant, so an applicant row never fetches on its own.
  const instructorIds = useMemo(
    () => applications.map(entry => entry.instructor_uuid).filter((id): id is string => Boolean(id)),
    [applications]
  );
  const { instructorMap } = useInstructorsByIds(instructorIds);

  const organisation = organisationMap[job?.organisation_uuid ?? ''];
  const course = courseMap[job?.course_uuid ?? ''];
  const program = programMap[job?.program_uuid ?? ''];

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <SectionBoundary
          label='this job'
          loading={query.isLoading && !job}
          error={query.error}
          onRetry={query.refetch}
          empty={!query.isLoading && !job}
          emptyTitle='Job not found'
          emptyDescription='It may have been withdrawn since this link was made.'
          skeleton={<SectionCardSkeleton rows={2} />}
        >
          {job ? (
            <RecordHeader
              initials={monogram(job.title ?? 'Job')}
              title={job.title ?? 'Untitled job'}
              facts={[
                organisation?.name ?? null,
                job.branch_name ?? null,
                course?.name ?? program?.title ?? null,
                `Posted ${formatDate(job.created_date) || '—'}`,
              ].filter(Boolean)}
              badges={[
                {
                  label: label(job.status),
                  tone: STATUS_TONE[job.status ?? ''] ?? 'neutral',
                },
              ]}
              context={
                organisation?.uuid ? (
                  <Link
                    href={adminRoutes.organisation(organisation.uuid)}
                    className='text-primary text-sm font-medium hover:underline'
                  >
                    Open the organisation record
                  </Link>
                ) : null
              }
              actions={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button variant='outline' className='rounded-md' disabled>
                        <Ban className='mr-2 size-4' />
                        Cancel job
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Cancelling belongs to the organisation that posted the job.
                  </TooltipContent>
                </Tooltip>
              }
            />
          ) : null}
        </SectionBoundary>

        {job ? (
          <>
            <SectionCard title='The job' description='What the organisation is asking for.'>
              <DetailGrid
                columns={3}
                items={[
                  { label: 'Sale price', value: money(job.sale_price) },
                  {
                    label: 'Instructor pay',
                    value: `${money(job.instructor_pay)} ${job.rate_basis ?? ''}`.trim(),
                  },
                  { label: 'Format', value: label(job.session_format) },
                  { label: 'Delivery', value: label(job.location_type) },
                  { label: 'Location', value: job.location_name || '—' },
                  { label: 'Visibility', value: label(job.class_visibility) },
                  { label: 'Places', value: toNumber(job.max_participants) },
                  {
                    label: 'Sessions planned',
                    value: job.session_templates?.length ?? 0,
                  },
                  {
                    label: 'Duration',
                    value: job.duration_minutes ? `${toNumber(job.duration_minutes)} min` : '—',
                  },
                  {
                    label: 'Academic period',
                    value:
                      [
                        formatDate(job.academic_period_start_date),
                        formatDate(job.academic_period_end_date),
                      ]
                        .filter(Boolean)
                        .join(' → ') || '—',
                  },
                  {
                    label: 'Registration period',
                    value:
                      [
                        formatDate(job.registration_period_start_date),
                        formatDate(job.registration_period_end_date),
                      ]
                        .filter(Boolean)
                        .join(' → ') || '—',
                  },
                  { label: 'Filled', value: formatDate(job.filled_at) || 'Not yet' },
                ]}
              />
              {job.description ? (
                <p className='text-muted-foreground mt-4 text-sm'>{job.description}</p>
              ) : null}
            </SectionCard>

            <SectionCard
              title='Applicants'
              description='Where each instructor sits in the hiring pipeline.'
            >
              <SectionBoundary
                label='the applicants'
                loading={applicationsQuery.isLoading}
                error={applicationsQuery.error}
                empty={applications.length === 0}
                onRetry={applicationsQuery.refetch}
                emptyTitle='Nobody has applied yet'
                emptyDescription='Applications appear here as instructors respond.'
              >
                <div className='space-y-4'>
                  <div className='flex flex-wrap gap-2'>
                    {[...APPLICATION_PIPELINE, ...APPLICATION_CLOSED]
                      .filter(stage => pipeline[stage])
                      .map(stage => (
                        <span
                          key={stage}
                          className='border-border/60 flex items-center gap-2 rounded-md border px-2.5 py-1'
                        >
                          <StatusBadge label={label(stage)} tone={STATUS_TONE[stage] ?? 'neutral'} />
                          <span className='text-foreground font-mono text-xs'>
                            {pipeline[stage]}
                          </span>
                        </span>
                      ))}
                  </div>

                  <ul className='flex flex-col gap-2'>
                    {applications.map(application => {
                      const instructor = instructorMap[application.instructor_uuid ?? ''];
                      return (
                        <li
                          key={application.uuid}
                          className='border-border/60 flex flex-wrap items-start gap-3 rounded-md border px-3 py-2.5'
                        >
                          <div className='min-w-0 flex-1 space-y-1'>
                            <div className='flex flex-wrap items-center gap-2'>
                              {instructor?.user_uuid ? (
                                <Link
                                  href={adminRoutes.person(instructor.user_uuid)}
                                  className='text-primary text-sm font-medium hover:underline'
                                >
                                  {instructor.full_name ?? 'Open the instructor record'}
                                  <ExternalLink className='ml-1 inline size-3' />
                                </Link>
                              ) : (
                                <span className='text-foreground text-sm font-medium'>
                                  {instructor?.full_name ?? 'Instructor'}
                                </span>
                              )}
                              <StatusBadge
                                label={label(application.status)}
                                tone={STATUS_TONE[application.status ?? ''] ?? 'neutral'}
                              />
                              {application.instructor_admin_verified ? (
                                <StatusBadge label='Verified' tone='success' />
                              ) : null}
                              {application.training_approved ? (
                                <StatusBadge label='Approved to train' tone='info' />
                              ) : null}
                            </div>
                            {application.application_note ? (
                              <p className='text-muted-foreground text-xs'>
                                {application.application_note}
                              </p>
                            ) : null}
                            <p className='text-muted-foreground text-xs'>
                              Applied {formatDateTime(application.created_date) || '—'}
                              {application.interview_at
                                ? ` · interview ${formatDateTime(application.interview_at)}`
                                : ''}
                            </p>
                          </div>
                          <div className='text-right'>
                            <p className='text-foreground font-mono text-sm'>
                              {money(application.approved_rate)}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              {application.rate_covers_pay === false
                                ? 'Rate above the offer'
                                : 'Rate within the offer'}
                            </p>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button variant='outline' size='sm' className='rounded-md' disabled>
                                  Decide
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Shortlisting, offering and hiring belong to the organisation.
                            </TooltipContent>
                          </Tooltip>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </SectionBoundary>
            </SectionCard>

            <div className='text-muted-foreground space-y-1 text-xs'>
              <p>
                Admins read this record but do not act on it: cancelling the job and deciding on
                applicants are organisation-manager actions, and opening them to admins is a backend
                change.
              </p>
              <p>
                Per-job eligibility is not shown, because the batch eligibility endpoint is missing
                from the generated client and needs a regeneration.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

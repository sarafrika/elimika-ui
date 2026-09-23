'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, GraduationCap, Undo2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  DetailGrid,
  SectionCard,
  SectionCardSkeleton,
  StatCard,
  StatCardSkeleton,
  StatusBadge,
  surfaceTheme,
} from '@/components/data-display';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCourseCreatorsByIds,
  useInstructorsByIds,
  useOrganisationsByIds,
} from '@/hooks/use-batched-lookups';
import { formatDate } from '@/lib/date';
import { formatCount } from '@/lib/metrics';
import type { CourseTrainingRateCard, ProgramTrainingApplication } from '@/services/client';
import { ConfirmDialog } from '../components/confirm-dialog';
import { NoteField, noteToPlainText } from '../components/note-field';
import { RecordHeader } from '../components/record-header';
import { SectionBoundary } from '../components/section-boundary';
import { UnderlineTabs } from '../components/underline-tabs';
import {
  type ApplicationDecision,
  type ProgramDecision,
  useDecideProgramApplication,
  useModerateProgram,
} from '../hooks/use-program-actions';
import {
  useProgram,
  useProgramApplications,
  useProgramCourses,
  useProgramInsights,
  useProgramModerationHistory,
} from '../hooks/use-programs';
import { adminRoutes, type ProgramTab } from '../lib/admin-routes';
import { enumParam, stringParam } from '../state/search-state';
import { useSearchState } from '../state/use-search-state';

const TAB_IDS = ['overview', 'courses', 'applications', 'history'] as const satisfies readonly ProgramTab[];

const TAB_LABELS: Record<ProgramTab, string> = {
  overview: 'Overview',
  courses: 'Courses',
  applications: 'Applications',
  history: 'Moderation history',
};

const tabParam = enumParam(TAB_IDS, 'overview');
const applicationStatusParam = stringParam('any');

const reasonSchema = z.object({
  reason: z
    .string()
    .refine(
      value => noteToPlainText(value).length >= 10,
      'Say why in at least a sentence — it is stored in the moderation history.'
    ),
});

const notesSchema = z.object({
  notes: z
    .string()
    .refine(
      value => noteToPlainText(value).length >= 10,
      'Say why in at least a sentence — the applicant reads this.'
    ),
});

/** Only the rates that are actually set, so an empty card reads as empty. */
function rateSummary(card?: CourseTrainingRateCard) {
  if (!card) return null;
  const entries = Object.entries(card).filter(
    ([key, value]) => key !== 'currency' && typeof value === 'number'
  ) as [string, number][];
  if (!entries.length) return null;

  const currency = card.currency || 'KES';
  const lowest = Math.min(...entries.map(([, value]) => value));
  const highest = Math.max(...entries.map(([, value]) => value));

  return {
    currency,
    count: entries.length,
    range: lowest === highest ? `${lowest}` : `${lowest}–${highest}`,
  };
}

export function AdminProgramPage({ uuid }: { uuid: string }) {
  const [tab] = useSearchState<ProgramTab>('tab', tabParam);
  const [applicationStatus, setApplicationStatus] = useSearchState(
    'status',
    applicationStatusParam
  );

  const { program, query } = useProgram(uuid);
  const insights = useProgramInsights(uuid, tab === 'overview');
  const programCourses = useProgramCourses(uuid, tab === 'courses');
  const { applications, query: applicationsQuery } = useProgramApplications(
    uuid,
    applicationStatus,
    tab === 'applications'
  );
  const { history, query: historyQuery } = useProgramModerationHistory(uuid, tab === 'history');

  const moderate = useModerateProgram();
  const decide = useDecideProgramApplication();

  const [pendingDecision, setPendingDecision] = useState<ProgramDecision | null>(null);
  const [pendingApplication, setPendingApplication] = useState<{
    application: ProgramTrainingApplication;
    action: ApplicationDecision;
    applicantName: string;
  } | null>(null);

  const decisionForm = useForm<z.infer<typeof reasonSchema>>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: '' },
    mode: 'onChange',
  });

  const applicationForm = useForm<z.infer<typeof notesSchema>>({
    resolver: zodResolver(notesSchema),
    defaultValues: { notes: '' },
    mode: 'onChange',
  });

  const creatorIds = useMemo(
    () => (program?.course_creator_uuid ? [program.course_creator_uuid] : []),
    [program?.course_creator_uuid]
  );
  const { courseCreatorMap } = useCourseCreatorsByIds(creatorIds);
  const creator = courseCreatorMap[program?.course_creator_uuid ?? ''];

  // Applicants are either instructors or organisations; each kind resolves in one call.
  const instructorIds = useMemo(
    () =>
      Array.from(
        new Set(
          applications
            .filter(application => application.applicant_type === 'instructor')
            .map(application => application.applicant_uuid)
            .filter(Boolean)
        )
      ) as string[],
    [applications]
  );
  const organisationIds = useMemo(
    () =>
      Array.from(
        new Set(
          applications
            .filter(application => application.applicant_type === 'organisation')
            .map(application => application.applicant_uuid)
            .filter(Boolean)
        )
      ) as string[],
    [applications]
  );
  const { instructorMap } = useInstructorsByIds(instructorIds);
  const { organisationMap } = useOrganisationsByIds(organisationIds);

  const applicantName = (application: ProgramTrainingApplication) => {
    const id = application.applicant_uuid ?? '';
    if (application.applicant_type === 'organisation') {
      return organisationMap[id]?.name ?? 'This organisation';
    }
    return instructorMap[id]?.full_name ?? 'This instructor';
  };

  const tabs = TAB_IDS.map(id => ({
    id,
    label: TAB_LABELS[id],
    href: adminRoutes.program(uuid, id),
  }));

  const askForDecision = async (action: ProgramDecision) => {
    const valid = await decisionForm.trigger('reason');
    if (!valid) return;
    setPendingDecision(action);
  };

  const askForApplication = async (
    application: ProgramTrainingApplication,
    action: ApplicationDecision
  ) => {
    const valid = await applicationForm.trigger('notes');
    if (!valid) return;
    setPendingApplication({ application, action, applicantName: applicantName(application) });
  };

  const confirmProgramAction =
    pendingDecision === 'approved'
      ? 'approveProgram'
      : pendingDecision === 'rejected'
        ? 'rejectProgram'
        : 'revokeProgram';

  const confirmApplicationAction =
    pendingApplication?.action === 'approve'
      ? 'approveTrainingApplication'
      : pendingApplication?.action === 'reject'
        ? 'rejectTrainingApplication'
        : 'revokeTrainingApplication';

  return (
    <div className={surfaceTheme.page}>
      <div className={surfaceTheme.pageStack}>
        <SectionBoundary
          label='this program'
          loading={query.isLoading && !program}
          error={query.error}
          onRetry={query.refetch}
          skeleton={<SectionCardSkeleton rows={2} />}
          empty={!query.isLoading && !program}
          emptyTitle='Program not found'
          emptyDescription='It may have been deleted since this link was made.'
        >
          {program ? (
            <RecordHeader
              initials='PR'
              title={program.title}
              facts={[
                creator?.full_name ? `By ${creator.full_name}` : null,
                program.total_duration_display || null,
                program.program_type || null,
                `Updated ${formatDate(program.updated_date) || '—'}`,
              ].filter(Boolean)}
              badges={[
                { status: program.status },
                program.admin_approved
                  ? { label: 'Approved', tone: 'success' as const }
                  : { label: 'Awaiting review', tone: 'warning' as const },
                program.published
                  ? { label: 'Published', tone: 'success' as const }
                  : { label: 'Unpublished', tone: 'neutral' as const },
              ]}
            />
          ) : null}
        </SectionBoundary>

        <UnderlineTabs tabs={tabs} active={tab} />

        {program && tab === 'overview' ? (
          <div className='grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]'>
            <div className='flex flex-col gap-4'>
              <SectionBoundary
                label='the program figures'
                loading={insights.ratingQuery.isLoading || insights.completionQuery.isLoading}
                error={insights.ratingQuery.error}
                onRetry={insights.ratingQuery.refetch}
                skeleton={
                  <div className='grid gap-4 sm:grid-cols-3'>
                    {[0, 1, 2].map(item => (
                      <StatCardSkeleton key={item} />
                    ))}
                  </div>
                }
              >
                <div className='grid gap-4 sm:grid-cols-3'>
                  <StatCard
                    label='Rating'
                    value={
                      insights.rating?.average_rating ? insights.rating.average_rating.toFixed(1) : '—'
                    }
                    hint={`${formatCount(insights.rating?.review_count, '0')} review(s)`}
                    icon={GraduationCap}
                  />
                  <StatCard
                    label='Completion'
                    value={
                      typeof insights.completionRate === 'number'
                        ? `${Math.round(insights.completionRate)}%`
                        : '—'
                    }
                  />
                  <StatCard label='Certificates issued' value={insights.certificateCount} />
                </div>
              </SectionBoundary>

              <SectionCard title='Program details'>
                <DetailGrid
                  columns={3}
                  items={[
                    { label: 'Title', value: program.title },
                    { label: 'Creator', value: creator?.full_name ?? '—' },
                    { label: 'Duration', value: program.total_duration_display || '—' },
                    {
                      label: 'Class limit',
                      value: program.class_limit ? String(program.class_limit) : 'No limit',
                    },
                    {
                      label: 'Price',
                      value:
                        program.price === null || program.price === undefined
                          ? 'Free'
                          : `KES ${Number(program.price).toLocaleString('en-KE')}`,
                    },
                    { label: 'Type', value: program.program_type || '—' },
                    { label: 'Created', value: formatDate(program.created_date) || '—' },
                    { label: 'Updated', value: formatDate(program.updated_date) || '—' },
                    {
                      label: 'Category',
                      value: program.category_uuid ? (
                        <span className='font-mono text-xs'>{program.category_uuid}</span>
                      ) : (
                        'Uncategorised'
                      ),
                    },
                  ]}
                />
                {program.description ? (
                  <p className='text-muted-foreground mt-4 text-sm'>{program.description}</p>
                ) : null}
              </SectionCard>

              <SectionCard title='Objectives and prerequisites'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div>
                    <p className={surfaceTheme.sectionLabel}>Objectives</p>
                    <p className='text-foreground mt-1 text-sm'>
                      {program.objectives || 'None recorded.'}
                    </p>
                  </div>
                  <div>
                    <p className={surfaceTheme.sectionLabel}>Prerequisites</p>
                    <p className='text-foreground mt-1 text-sm'>
                      {program.prerequisites || 'None recorded.'}
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            <SectionCard
              title='Decision'
              description='Approving publishes it to learners; sending it back tells the creator what to fix.'
            >
              <div className='flex flex-col gap-4'>
                <Controller
                  control={decisionForm.control}
                  name='reason'
                  render={({ field }) => (
                    <NoteField
                      id='program-decision-reason'
                      label='Reason'
                      required
                      value={field.value}
                      onChange={field.onChange}
                      error={decisionForm.formState.errors.reason?.message}
                      helper='Stored in the moderation history and sent to the creator.'
                    />
                  )}
                />

                <div className='flex flex-col gap-2'>
                  {program.admin_approved ? (
                    <Button
                      type='button'
                      variant='outline'
                      className='border-destructive/40 text-destructive rounded-md'
                      onClick={() => askForDecision('revoked')}
                    >
                      <Undo2 className='mr-2 size-4' />
                      Revoke approval
                    </Button>
                  ) : (
                    <>
                      <Button
                        type='button'
                        className='rounded-md'
                        onClick={() => askForDecision('approved')}
                      >
                        <Check className='mr-2 size-4' />
                        Approve program
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        className='rounded-md'
                        onClick={() => askForDecision('rejected')}
                      >
                        <X className='mr-2 size-4' />
                        Send back for changes
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SectionCard>
          </div>
        ) : null}

        {program && tab === 'courses' ? (
          <SectionCard
            title='Courses in this program'
            description='Required and optional courses, in the order a learner meets them.'
          >
            <SectionBoundary
              label='the program courses'
              loading={programCourses.allQuery.isLoading}
              error={programCourses.allQuery.error}
              empty={programCourses.courses.length === 0}
              onRetry={programCourses.allQuery.refetch}
              emptyTitle='No courses yet'
              emptyDescription='This program has no courses attached.'
            >
              <ul className='flex flex-col gap-2'>
                {programCourses.courses.map(course => (
                  <li
                    key={course.uuid}
                    className='border-border/60 flex flex-wrap items-center gap-3 rounded-md border px-3 py-2.5'
                  >
                    <div className='min-w-0 flex-1'>
                      <p className='text-foreground text-sm font-medium'>{course.name}</p>
                      <p className='text-muted-foreground text-xs'>
                        {course.category_names?.join(', ') || 'Uncategorised'}
                      </p>
                    </div>
                    {programCourses.requiredUuids.has(course.uuid) ? (
                      <StatusBadge label='Required' tone='info' />
                    ) : programCourses.optionalUuids.has(course.uuid) ? (
                      <StatusBadge label='Optional' tone='neutral' />
                    ) : null}
                    <StatusBadge status={course.status} />
                  </li>
                ))}
              </ul>
            </SectionBoundary>
          </SectionCard>
        ) : null}

        {program && tab === 'applications' ? (
          <div className='flex flex-col gap-4'>
            <SectionCard
              title='Applications to train'
              description='Instructors and organisations asking to deliver this program.'
              actions={
                <select
                  aria-label='Filter by status'
                  className='border-border/70 bg-background h-9 rounded-md border px-2 text-sm'
                  value={applicationStatus}
                  onChange={event => setApplicationStatus(event.target.value)}
                >
                  <option value='any'>Any status</option>
                  <option value='pending'>Pending</option>
                  <option value='approved'>Approved</option>
                  <option value='rejected'>Rejected</option>
                  <option value='revoked'>Revoked</option>
                </select>
              }
            >
              <SectionBoundary
                label='the applications'
                loading={applicationsQuery.isLoading}
                error={applicationsQuery.error}
                empty={applications.length === 0}
                onRetry={applicationsQuery.refetch}
                emptyTitle='Nothing waiting'
                emptyDescription='No one has applied to deliver this program under this filter.'
              >
                <div className='flex flex-col gap-4'>
                  <Controller
                    control={applicationForm.control}
                    name='notes'
                    render={({ field }) => (
                      <NoteField
                        id='application-decision-notes'
                        label='Decision notes'
                        required
                        value={field.value}
                        onChange={field.onChange}
                        error={applicationForm.formState.errors.notes?.message}
                        helper='Sent to the applicant with the decision and kept on the application.'
                      />
                    )}
                  />

                  <ul className='flex flex-col gap-2'>
                    {applications.map(application => {
                      const rates = rateSummary(application.rate_card);
                      const isPending = application.status === 'pending';
                      const isApproved = application.status === 'approved';

                      return (
                        <li
                          key={application.uuid}
                          className='border-border/60 flex flex-wrap items-start gap-3 rounded-md border px-3 py-3'
                        >
                          <div className='min-w-0 flex-1'>
                            <p className='text-foreground text-sm font-medium'>
                              {applicantName(application)}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              {application.applicant_type === 'organisation'
                                ? 'Organisation'
                                : 'Instructor'}{' '}
                              · applied {formatDate(application.created_date) || '—'}
                              {application.reviewed_at
                                ? ` · reviewed ${formatDate(application.reviewed_at)}`
                                : ''}
                            </p>
                            <p className='text-muted-foreground mt-1 text-xs'>
                              {rates
                                ? `${rates.currency} ${rates.range} across ${rates.count} rate(s)`
                                : 'No rate card set'}
                            </p>
                          </div>

                          <StatusBadge status={application.status} />

                          <div className='flex flex-wrap gap-2'>
                            {isPending ? (
                              <>
                                <Button
                                  type='button'
                                  size='sm'
                                  className='rounded-md'
                                  onClick={() => askForApplication(application, 'approve')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  type='button'
                                  size='sm'
                                  variant='outline'
                                  className='rounded-md'
                                  onClick={() => askForApplication(application, 'reject')}
                                >
                                  Reject
                                </Button>
                              </>
                            ) : null}
                            {isApproved ? (
                              <Button
                                type='button'
                                size='sm'
                                variant='outline'
                                className='border-destructive/40 text-destructive rounded-md'
                                onClick={() => askForApplication(application, 'revoke')}
                              >
                                Revoke
                              </Button>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </SectionBoundary>
            </SectionCard>

            <p className='text-muted-foreground text-xs'>
              Admins may decide program applications, but course applications are owner-only — an
              asymmetry in the API rather than a rule of the console.
            </p>
          </div>
        ) : null}

        {program && tab === 'history' ? (
          <SectionCard title='Moderation history' description='Every decision taken on this program.'>
            <SectionBoundary
              label='the moderation history'
              loading={historyQuery.isLoading}
              error={historyQuery.error}
              empty={history.length === 0}
              onRetry={historyQuery.refetch}
              emptyTitle='No decisions yet'
              emptyDescription='Nothing has been approved, rejected or revoked on this program.'
              skeleton={
                <div className='space-y-2'>
                  {[0, 1, 2].map(item => (
                    <Skeleton key={item} className='h-12 w-full' />
                  ))}
                </div>
              }
            >
              <ul className='flex flex-col gap-2'>
                {history.map(entry => (
                  <li
                    key={entry.uuid}
                    className='border-border/60 flex flex-wrap items-start gap-3 rounded-md border px-3 py-2.5'
                  >
                    <StatusBadge status={entry.action} />
                    <div className='min-w-0 flex-1'>
                      <p className='text-foreground text-sm'>{entry.reason || 'No reason given'}</p>
                      <p className='text-muted-foreground text-xs'>
                        {entry.created_by || 'Unknown admin'} ·{' '}
                        {formatDate(entry.created_date) || '—'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </SectionBoundary>
          </SectionCard>
        ) : null}

        <ConfirmDialog
          open={pendingDecision !== null}
          onOpenChange={open => {
            if (!open) setPendingDecision(null);
          }}
          action={confirmProgramAction}
          subject={{
            name: program?.title ?? 'this program',
            detail: creator?.full_name,
            confirmValue: program?.title,
          }}
          note={decisionForm.getValues('reason')}
          isPending={moderate.isPending}
          onConfirm={() => {
            if (!pendingDecision || !program?.uuid) return;
            moderate.mutate(
              {
                uuid: program.uuid,
                action: pendingDecision,
                reason: decisionForm.getValues('reason'),
                programTitle: program.title,
              },
              {
                onSuccess: () => {
                  setPendingDecision(null);
                  decisionForm.reset({ reason: '' });
                },
              }
            );
          }}
        />

        <ConfirmDialog
          open={pendingApplication !== null}
          onOpenChange={open => {
            if (!open) setPendingApplication(null);
          }}
          action={confirmApplicationAction}
          subject={{
            name: pendingApplication?.applicantName ?? 'This applicant',
            detail: program?.title,
            confirmValue: pendingApplication?.applicantName,
          }}
          note={applicationForm.getValues('notes')}
          isPending={decide.isPending}
          onConfirm={() => {
            if (!pendingApplication || !program?.uuid) return;
            decide.mutate(
              {
                programUuid: program.uuid,
                applicationUuid: pendingApplication.application.uuid ?? '',
                action: pendingApplication.action,
                reviewNotes: applicationForm.getValues('notes'),
                applicantName: pendingApplication.applicantName,
              },
              {
                onSuccess: () => {
                  setPendingApplication(null);
                  applicationForm.reset({ notes: '' });
                },
              }
            );
          }}
        />
      </div>
    </div>
  );
}

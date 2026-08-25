// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  Globe2,
  GraduationCap,
  MapPin,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  adminTheme,
  DetailGrid,
  SectionCard,
  StatCard,
  StatCardSkeleton,
  StatusBadge,
} from '@/app/dashboard/admin/_components/ui';
import { type RateBasis, rateBasisUnit } from '@/components/class-form';
import {
  RATE_BASES
} from '@/components/class-form/class-form-shared';
import DeleteModal from '@/components/custom-modals/delete-modal';
import { PageHeader as AdminPageHeader } from '@/components/dashboard';
import { AsyncSection } from '@/components/data/async-section';
import { type ConflictItem, parseConflictError } from '@/components/resourcing/conflicts';
import { ResourceConflictAlert } from '@/components/resourcing/ResourceConflictAlert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/format-currency';
import { cn } from '@/lib/utils';
import {
  applyToJobMutation,
  cancelJobMutation,
  getAllCoursesOptions,
  getAllOrganisationsOptions,
  getAllTrainingProgramsOptions,
  getJobEligibilityOptions,
  listJobApplicationsQueryKey,
  listJobsOptions,
  listJobsQueryKey,
  listMyApplicationsOptions,
  listMyApplicationsQueryKey
} from '@/services/client/@tanstack/react-query.gen';
import type {
  ClassMarketplaceJob,
  ClassMarketplaceJobRequest,
  ClassVisibilityEnum,
  Course,
  Instructor,
  LocationTypeEnum,
  Organisation,
  SessionFormatEnum,
  StatusEnum7,
  TrainingProgram
} from '@/services/client/types.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

import { useOrganisationsByIds } from '../../../hooks/use-batched-lookups';
import { extractPage } from '../../../lib/api-helpers';
import { canReapply as statusAllowsReapply } from '../application-status';
import type { JobMarketplaceRole } from '../data';
import { getJobMarketplaceRoleConfig } from '../data';
import { JobCard } from './JobMarketplaceCard';
import {
  JobListSkeleton,
  MarketplaceSidebarSkeleton,
  SelectSkeleton,
} from './JobMarketplaceSkeletons';
import { MarketplaceSidebar } from './MarketplaceSidebar';
import { MarketplaceTabs } from './MarketplaceTabs';


type JobFilter = 'all' | StatusEnum7;
type MarketplaceTabId = 'all' | RateBasis;
type JobSortDirection = 'newest' | 'oldest';
type MarketplaceContentType = 'course' | 'program';
type JobContentPrefill = { type: MarketplaceContentType; id: string };
type ClassMarketplaceJobWithProgram = ClassMarketplaceJob & {
  readonly program_uuid?: string | null;
};
type ClassMarketplaceJobRequestWithProgram = Omit<ClassMarketplaceJobRequest, 'course_uuid'> & {
  course_uuid?: string | null;
  program_uuid?: string | null;
};

const JOB_PAGE_SIZE = 50;
const LOOKUP_PAGE_SIZE = 100;
const DEFAULT_LOCATION_LATITUDE = -1.286389;
const DEFAULT_LOCATION_LONGITUDE = 36.817223;

const weekdayOptions: Array<{ value: string; label: string }> = [
  { value: 'MONDAY', label: 'Mon' },
  { value: 'TUESDAY', label: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wed' },
  { value: 'THURSDAY', label: 'Thu' },
  { value: 'FRIDAY', label: 'Fri' },
  { value: 'SATURDAY', label: 'Sat' },
  { value: 'SUNDAY', label: 'Sun' },
];
const weekdayValueByJsDay = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

const locationTypeOptions: LocationTypeEnum[] = ['ONLINE', 'IN_PERSON', 'HYBRID'];
const classVisibilityOptions: ClassVisibilityEnum[] = ['PUBLIC', 'PRIVATE'];
const sessionFormatOptions: SessionFormatEnum[] = [
  'ONE_ON_ONE',
  'GROUP',
  'ONLINE',
  'PRIVATE_ONLINE',
];


const statusOptions: Array<{ label: string; value: JobFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Awaiting class', value: 'awaiting_class' as JobFilter },
  { label: 'Filled', value: 'filled' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Expired', value: 'expired' },
];
const marketplaceTabs: Array<{
  id: MarketplaceTabId;
  label: string;
  count: number;
  icon: typeof BriefcaseBusiness;
}> = [
    { id: 'all', label: 'All', count: 0, icon: BriefcaseBusiness },
    ...RATE_BASES.map(basis => ({
      id: basis.value as MarketplaceTabId,
      label: basis.label,
      count: 0,
      icon:
        basis.value === 'per_hour'
          ? Clock
          : basis.value === 'per_session'
            ? CalendarDays
            : BriefcaseBusiness,
    })),
  ];

function matchesMarketplaceTab(job: ClassMarketplaceJobWithProgram, tabId: MarketplaceTabId) {
  if (tabId === 'all') return true;
  return job.rate_basis === tabId;
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return 'Not provided';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not provided';

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatDateValue(value?: Date | string | null) {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
}

function formatDateTimeInputValue(value?: Date | string | null) {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatTimeInputValue(value?: Date | string | null) {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function combineDateAndTime(dateValue: string, timeValue: string) {
  if (!dateValue.trim() || !timeValue.trim()) return undefined;

  const combined = new Date(`${dateValue}T${timeValue}`);
  return Number.isNaN(combined.getTime()) ? undefined : combined;
}

function firstSessionDateOnOrAfter(trainingStartDate: string, daysOfWeek: string[]) {
  const start = new Date(`${trainingStartDate}T00:00`);
  if (Number.isNaN(start.getTime()) || daysOfWeek.length === 0) return undefined;

  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + offset);
    if (daysOfWeek.includes(weekdayValueByJsDay[candidate.getDay()] ?? '')) {
      return [
        candidate.getFullYear(),
        String(candidate.getMonth() + 1).padStart(2, '0'),
        String(candidate.getDate()).padStart(2, '0'),
      ].join('-');
    }
  }
  return undefined;
}

function formatEnumLabel(value?: string | null) {
  if (!value) return 'Not provided';

  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, letter => letter.toUpperCase());
}

function getApplicationStatusLabel(status?: string | null) {
  if (!status) return 'Not applied';
  return formatEnumLabel(status);
}

function sortJobs(jobs: ClassMarketplaceJobWithProgram[], sortBy: JobSortDirection) {
  return [...jobs].sort((left, right) => {
    const leftCreated = left.created_date ? new Date(left.created_date).getTime() : 0;
    const rightCreated = right.created_date ? new Date(right.created_date).getTime() : 0;

    switch (sortBy) {
      case 'oldest':
        return leftCreated - rightCreated;
      case 'newest':
      default:
        return rightCreated - leftCreated;
    }
  });
}

function shortId(value?: string | null) {
  if (!value) return 'Unknown';
  return value.slice(0, 8);
}

function getDisplayOrganisationLabel(job: ClassMarketplaceJob, organisationName?: string | null) {
  if (organisationName) return organisationName;
  if (job.organisation_uuid) return `Organisation ${shortId(job.organisation_uuid)}`;
  return 'Organisation';
}

function getJobProgramUuid(job: ClassMarketplaceJobWithProgram) {
  return job.program_uuid ?? null;
}

function getJobContentType(job: ClassMarketplaceJobWithProgram): MarketplaceContentType {
  return getJobProgramUuid(job) ? 'program' : 'course';
}

function getDisplayContentLabel(
  job: ClassMarketplaceJobWithProgram,
  course?: Course | null,
  program?: TrainingProgram | null
) {
  const programUuid = getJobProgramUuid(job);
  if (program?.title) return program.title;
  if (programUuid) return `Program ${shortId(programUuid)}`;
  if (course?.name) return course.name;
  if (job.course_uuid) return `Course ${shortId(job.course_uuid)}`;
  return 'Course or program';
}

function parseNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function JobStatsRow({ job }: { job: ClassMarketplaceJob }) {
  return (
    <DetailGrid
      columns={3}
      items={[
        {
          label: `Pay per ${rateBasisUnit(job.rate_basis as RateBasis)}`,
          value: (
            <span className='text-primary text-base font-bold'>
              {typeof job.instructor_pay === 'number'
                ? formatCurrency(job.instructor_pay)
                : 'Not specified'}
            </span>
          ),
        },
        { label: 'Published', value: formatDateTime(job.created_date) },
        {
          label: 'Training start / end',
          value: (
            <div className='space-y-0.5'>
              <div className='text-foreground text-sm font-medium'>
                {formatDateTime(job.default_start_time)}
              </div>
              <div className='text-muted-foreground text-xs'>
                to {formatDateTime(job.default_end_time)}
              </div>
            </div>
          ),
        },
        {
          label: 'Capacity',
          value: (
            <div className='space-y-0.5'>
              <div className='text-foreground text-sm font-medium'>
                {typeof job.max_participants === 'number'
                  ? `${job.max_participants} participants`
                  : 'Not provided'}
              </div>
              <div className='text-muted-foreground text-xs'>
                Waitlist {job.allow_waitlist ? 'enabled' : 'disabled'}
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}

function JobDetailsSheet({
  job,
  open,
  onOpenChange,
  isManagementView,
  organisationName,
  organisation,
  instructor,
  course,
  program,
  onEdit,
  onCancel,
  application,
  myApplicationsHref,
}: {
  job: ClassMarketplaceJobWithProgram | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isManagementView: boolean;
  organisationName?: string | null;
  organisation?: Organisation;
  instructor?: Instructor;
  course?: Course | null;
  program?: TrainingProgram | null;
  onEdit?: () => void;
  onCancel?: () => void;
  application?: { status?: string | null; application_note?: string | null } | null;
  myApplicationsHref?: string;
}) {
  const queryClient = useQueryClient();
  const { activeDomain } = useUserDomain();
  const [applicationNote, setApplicationNote] = useState('');
  const [showAllSessions, setShowAllSessions] = useState(false);
  const jobUuid = job?.uuid;

  const { organisationMap } = useOrganisationsByIds([job?.organisation_uuid as string]);
  const displayName = organisationMap?.[job?.organisation_uuid as string]?.name;

  // JOB CLASS SCHEDULES
  const schedules = job?.session_templates ?? [];
  const sortedSchedules = [...schedules].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const firstSchedule = sortedSchedules[0];
  const lastSchedule = sortedSchedules[sortedSchedules.length - 1];

  const startsAt = firstSchedule?.start_time;
  const endsAt = lastSchedule?.end_time;

  const [applyConflicts, setApplyConflicts] = useState<ConflictItem[]>([]);
  // Asked unconditionally now. This endpoint exists precisely to answer "can this instructor apply",
  // and gating it on the locally-cached application list meant an instructor whose application fell
  // outside that page was silently offered a fresh application the server would then reject.
  const eligibilityQuery = useQuery({
    ...getJobEligibilityOptions({ path: { jobUuid: jobUuid ?? '' } }),
    enabled: open && Boolean(jobUuid) && !isManagementView && job?.status === 'open',
  });
  const eligibility = eligibilityQuery.data?.data;

  // The server is the authority on both of these; the locally-cached application is only a
  // fallback for the moment before eligibility resolves.
  const applicationStatus = eligibility?.application_status ?? application?.status;
  const alreadyApplied = eligibility?.already_applied ?? Boolean(application);
  const canReapply =
    eligibility?.can_reapply ?? statusAllowsReapply(application?.status);
  const hasLiveApplication = alreadyApplied && !canReapply;
  const isIneligible = Boolean(eligibility && !eligibility.eligible);
  const eligibilityScheduleConflicts = useMemo<ConflictItem[]>(() => {
    if (!eligibility || eligibility.schedule_clear !== false) return [];
    return (eligibility.schedule_conflicts ?? []).map(conflict => ({
      start: conflict.requested_start
        ? new Date(conflict.requested_start).toLocaleString()
        : undefined,
      end: conflict.requested_end ? new Date(conflict.requested_end).toLocaleString() : undefined,
      reasons: (conflict.reasons ?? []).filter(
        (reason): reason is string => typeof reason === 'string'
      ),
    }));
  }, [eligibility]);

  const applyMutation = useMutation({
    ...applyToJobMutation(),
    onSuccess: async () => {
      toast.success('Application submitted successfully.');
      setApplicationNote('');
      onOpenChange(false);
      await queryClient.invalidateQueries({
        queryKey: listMyApplicationsQueryKey({ query: { pageable: {} } }),
      });

      if (jobUuid) {
        await queryClient.invalidateQueries({
          queryKey: listJobApplicationsQueryKey({
            path: { jobUuid },
            query: { pageable: {} },
          }),
        });
      }
    },
    onError: error => {
      const report = parseConflictError(error);
      if (report) {
        setApplyConflicts(report.conflicts);
        toast.error('Your schedule conflicts with sessions of this job.');
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Unable to apply for this posting.');
    },
  });

  if (!job) return null;

  const sessionTemplateCount = job.session_templates?.length ?? 0;

  const handleApply = () => {
    if (!jobUuid) return;

    applyMutation.mutate({
      path: { jobUuid },
      body: applicationNote.trim() ? { application_note: applicationNote.trim() } : undefined,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='flex w-[min(98vw,650px)] max-w-none flex-col overflow-y-auto sm:max-w-none'
      >
        <div className='mb-10 space-y-6 p-3 sm:p-6'>
          <SheetHeader className='space-y-3 pr-10 text-left'>
            <div className='flex flex-wrap items-center gap-2'>
              <StatusBadge status={job.status} />
              <Badge variant='outline' className='rounded-md px-2.5 py-0.5 text-xs font-medium'>
                {formatEnumLabel(job.session_format)}
              </Badge>
              <Badge variant='outline' className='rounded-md px-2.5 py-0.5 text-xs font-medium'>
                {formatEnumLabel(job.location_type)}
              </Badge>
            </div>
            <SheetTitle className='text-2xl tracking-tight'>
              {job.title || 'Untitled job'}
            </SheetTitle>
            <SheetDescription>
              {getDisplayOrganisationLabel(job, displayName)} ·{' '}
              {getDisplayContentLabel(job, course, program)}
            </SheetDescription>
          </SheetHeader>

          <div className='space-y-4'>
            <JobStatsRow job={job} />

            {!isManagementView && application ? (
              <div className={adminTheme.cardPadded}>
                <h3 className={adminTheme.sectionLabel}>Your application</h3>
                <div className='mt-2 flex flex-wrap items-center gap-2'>
                  <StatusBadge
                    status={application.status}
                    label={getApplicationStatusLabel(application.status)}
                  />
                  {myApplicationsHref ? (
                    <Button asChild variant='outline' size='sm'>
                      <Link href={myApplicationsHref}>View my applications</Link>
                    </Button>
                  ) : null}
                </div>
                {application.application_note ? (
                  <p className='text-muted-foreground mt-3 text-sm leading-6 whitespace-pre-line'>
                    {application.application_note}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className={adminTheme.cardPadded}>
              <h3 className={cn(adminTheme.sectionLabel, 'flex flex-row items-center gap-2')}>
                Sessions
                <span>({sessionTemplateCount})</span>
              </h3>

              <div className='mt-3 space-y-2'>
                {(showAllSessions
                  ? job.session_templates
                  : job.session_templates?.slice(0, 10)
                )?.map((session, idx) => {
                  const start = new Date(session.start_time);
                  const end = new Date(session.end_time);

                  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                  const recurrence = session.recurrence;
                  const recurrenceLabel =
                    recurrence?.recurrence_type === 'WEEKLY'
                      ? `Repeats weekly on ${(recurrence.days_of_week ?? '')
                        .split(',')
                        .map(day => formatEnumLabel(day.trim()))
                        .filter(Boolean)
                        .join(', ')}${recurrence.end_date
                          ? ` until ${new Date(recurrence.end_date).toLocaleDateString()}`
                          : ''
                      }`
                      : recurrence?.recurrence_type
                        ? `Repeats ${formatEnumLabel(recurrence.recurrence_type).toLowerCase()}`
                        : null;

                  return (
                    <div
                      key={idx}
                      className='flex flex-wrap items-center justify-between gap-2 text-sm'
                    >
                      <div className='flex flex-col'>
                        <div className='flex flex-row gap-2'>
                          <p className='font-medium'>{start.toLocaleDateString()}</p>
                          <p className='text-muted-foreground'>
                            ({start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                            - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </p>
                        </div>
                        {recurrenceLabel ? (
                          <p className='text-muted-foreground text-xs'>{recurrenceLabel}</p>
                        ) : null}
                      </div>

                      <Badge
                        variant='outline'
                        className='border-primary/30 bg-primary/10 text-primary rounded-md px-2 py-0.5 tabular-nums'
                      >
                        {hours} hr{hours !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {sessionTemplateCount > 10 && (
                <div className='mt-3'>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='px-0'
                    onClick={() => setShowAllSessions(prev => !prev)}
                  >
                    {showAllSessions ? 'Show less' : `Show all (${sessionTemplateCount})`}
                  </Button>
                </div>
              )}
            </div>

            <div className={adminTheme.cardPadded}>
              <h3 className={adminTheme.sectionLabel}>Description</h3>
              <p className='text-foreground mt-2 text-sm leading-6 whitespace-pre-line'>
                {job.description || 'No description has been provided for this posting yet.'}
              </p>
            </div>

            <DetailGrid
              columns={2}
              items={[
                { label: 'Location name', value: job.location_name || 'Not provided' },
                { label: 'Meeting link', value: job.meeting_link || 'Not provided' },
                {
                  label: 'Academic period start',
                  value: formatDateTime(job.academic_period_start_date || startsAt),
                },
                {
                  label: 'Academic period end',
                  value: formatDateTime(job.academic_period_end_date || endsAt),
                },
                {
                  label: 'Registration start',
                  value: formatDateTime(job.registration_period_start_date),
                },
                {
                  label: 'Registration end',
                  value: formatDateTime(job.registration_period_end_date),
                },
              ]}
            />
          </div>

          {isManagementView ? (
            <div className='flex flex-wrap gap-2'>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onEdit?.();
                }}
              >
                <Pencil className='mr-1 size-4' />
                Edit job
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  onOpenChange(false);
                  onCancel?.();
                }}
              >
                <Trash2 className='mr-1 size-4' />
                Cancel job
              </Button>
            </div>
          ) : (
            <div className={cn('space-y-3', adminTheme.cardPadded)}>
              <p className='border-primary/30 bg-primary/10 text-foreground rounded-md border p-3 text-sm'>
                {typeof job.instructor_pay === 'number' ? (
                  <>
                    You will be paid{' '}
                    <span className='text-primary font-bold'>
                      {formatCurrency(job.instructor_pay)} per{' '}
                      {rateBasisUnit(job.rate_basis as RateBasis)}
                    </span>{' '}
                    for this engagement.
                  </>
                ) : (
                  'The organisation has not specified instructor pay for this posting.'
                )}
              </p>

              {isIneligible ? (
                <div className='border-warning/60 bg-warning/10 text-foreground space-y-2 rounded-md border border-dashed p-3 text-sm'>
                  <p>
                    {eligibility?.reason ??
                      'You are not currently eligible to apply for this posting.'}
                  </p>
                  {eligibility && !eligibility.training_approved && job.course_uuid ? (
                    <Button asChild variant='outline' size='sm'>
                      <Link
                        href={buildWorkspaceAliasPath(
                          activeDomain,
                          `/dashboard/courses`
                        )}
                      >
                        Apply to train this course
                      </Link>
                    </Button>
                  ) : null}
                </div>
              ) : null}

              <ResourceConflictAlert
                title='Sessions that clash with your existing schedule'
                conflicts={
                  applyConflicts.length > 0 ? applyConflicts : eligibilityScheduleConflicts
                }
              />

              <Label htmlFor='application-note' className='text-sm font-semibold'>
                Application note
              </Label>
              <Textarea
                id='application-note'
                value={applicationNote}
                onChange={event => setApplicationNote(event.target.value)}
                placeholder='Add a short note to support your application.'
                className='min-h-28'
                disabled={hasLiveApplication}
              />
              {alreadyApplied ? (
                <div className='border-border/70 bg-muted/30 text-muted-foreground flex flex-wrap items-center gap-2 rounded-md border border-dashed p-3 text-sm'>
                  <StatusBadge
                    status={applicationStatus}
                    label={formatEnumLabel(applicationStatus ?? 'applied')}
                  />
                  <span>
                    {canReapply
                      ? 'Your previous application for this opportunity is closed. You can apply again.'
                      : 'You have already applied to this opportunity.'}
                  </span>
                  {myApplicationsHref ? (
                    <Button asChild variant='outline' size='sm'>
                      <Link href={myApplicationsHref}>View my applications</Link>
                    </Button>
                  ) : null}
                </div>
              ) : null}
              <div className='flex flex-wrap gap-2'>
                <Button
                  onClick={handleApply}
                  disabled={applyMutation.isPending || hasLiveApplication || isIneligible}
                >
                  {applyMutation.isPending
                    ? 'Submitting...'
                    : canReapply
                      ? 'Apply again'
                      : 'Apply for job'}
                </Button>
                <Button variant='outline' onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function JobMarketplacePage({ role }: { role: JobMarketplaceRole }) {
  const config = getJobMarketplaceRoleConfig(role);
  const { activeDomain } = useUserDomain();
  const profile = useUserProfile();
  const profileOrg = profile?.organisation_affiliations?.[0];
  const orgData = useOrganisation();

  const organisation =
    orgData?.uuid === profileOrg?.organisation_uuid
      ? orgData
      : undefined;
  const instructor = profile?.instructor || undefined

  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const createJobParam = searchParams.get('create');
  const createContentTypeParam = searchParams.get('type');
  const createContentIdParam = searchParams.get('id');
  const isOrganizationView = role === 'organization';
  // Domain access matrix — keep the UI in lock-step with the backend guards.
  // Only organisations manage jobs; only instructors apply; students/parents are read-only.
  const canManageJobs = role === 'organization';
  const canApply = role === 'instructor';
  const organisationUuid = organisation?.uuid ?? '';
  const isOrgVerified = Boolean(organisation?.admin_verified);
  // Posting a class job requires an admin-verified organisation (mirrors the backend gate).
  const canCreateJob = canManageJobs && isOrgVerified;

  const userUuid = profile?.uuid ?? '';
  const organisationName = organisation?.name;
  const instructorName = instructor?.formatted_location;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobFilter>(isOrganizationView ? 'all' : 'open');
  const [sessionFormatFilter, setSessionFormatFilter] = useState<'all' | SessionFormatEnum>('all');
  const [locationFilter, setLocationFilter] = useState<'all' | LocationTypeEnum>('all');
  const [marketplaceTab, setMarketplaceTab] = useState<MarketplaceTabId>('all');
  const [organisationFilter, setOrganisationFilter] = useState<'all' | string>('all');
  const [contentFilter, setContentFilter] = useState<'all' | string>('all');
  const [sortDirection, setSortDirection] = useState<JobSortDirection>('newest');
  const [selectedJobUuid, setSelectedJobUuid] = useState<string | null>(null);
  const [pendingCancelJob, setPendingCancelJob] = useState<ClassMarketplaceJobWithProgram | null>(
    null
  );
  const canLoadJobs = !isOrganizationView || Boolean(organisationUuid);
  const jobsListOptions = {
    query: {
      pageable: {
        page: 0,
        size: JOB_PAGE_SIZE,
      },
      ...(isOrganizationView ? { organisation_uuid: organisationUuid } : {}),
    },
  };

  // Legacy ?create=1 links now resolve to the dedicated posting page.
  useEffect(() => {
    if (createJobParam !== '1' || !canManageJobs) return;
    const contentId = createContentIdParam?.trim();
    const key = createContentTypeParam === 'program' ? 'programUuid' : 'courseUuid';
    router.replace(
      contentId
        ? `/dashboard/organisation/jobs/new?${key}=${contentId}`
        : '/dashboard/organisation/jobs/new'
    );
  }, [canManageJobs, createContentIdParam, createContentTypeParam, createJobParam, router]);

  const {
    data: jobsResponse,
    isLoading: isJobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = useQuery({
    ...listJobsOptions(jobsListOptions),
    enabled: canLoadJobs,
  });
  const jobs: ClassMarketplaceJobWithProgram[] = jobsResponse?.data?.content ?? [];
  const jobsLoading = isJobsLoading && !jobsResponse;

  const myApplicationsQuery = useQuery({
    ...listMyApplicationsOptions({
      query: {
        // Every application has to be reconciled against the listings, so the default
        // page of 20 would silently drop the "already applied" badge on older postings.
        pageable: { page: 0, size: 200 },
      },
    }),
    // Only appliers (instructors) have applications to reconcile against listings.
    enabled: Boolean(canApply && userUuid),
  });

  const { data: coursesResponse, isLoading: isCoursesLoading } = useQuery({
    ...getAllCoursesOptions({
      query: {
        pageable: {
          page: 0,
          size: LOOKUP_PAGE_SIZE,
        },
      },
    }),
  });

  const { data: programsResponse, isLoading: isProgramsLoading } = useQuery({
    ...getAllTrainingProgramsOptions({
      query: {
        pageable: {
          page: 0,
          size: LOOKUP_PAGE_SIZE,
        },
      },
    }),
  });

  const { data: organisationsResponse, isLoading: isOrganisationsLoading } = useQuery({
    ...getAllOrganisationsOptions({
      query: {
        pageable: {
          page: 0,
          size: LOOKUP_PAGE_SIZE,
        },
      },
    }),
    enabled: !isOrganizationView,
  });

  const courses = coursesResponse?.data?.content ?? [];
  const programs = programsResponse?.data?.content ?? [];

  const organisations = extractPage<Organisation>(organisationsResponse).items;
  const myApplications = myApplicationsQuery.data?.data?.content ?? [];
  const organisationOptions = useMemo(() => {
    const options = organisations
      .filter(organisationItem => organisationItem.uuid)
      .map(organisationItem => ({
        label: organisationItem.name,
        value: organisationItem.uuid as string,
      }));

    if (isOrganizationView && organisationUuid && organisationName) {
      return [{ label: organisationName, value: organisationUuid }, ...options];
    }

    return options;
  }, [isOrganizationView, organisationName, organisationUuid, organisations]);

  const courseOptions = useMemo(
    () =>
      courses
        .filter(course => course.uuid && course.active === true && course.admin_approved === true)
        .map(course => ({
          label: course.name,
          value: course.uuid as string,
        })),
    [courses]
  );

  const programOptions = useMemo(
    () =>
      programs
        .filter(
          program =>
            program.uuid &&
            program.active === true &&
            program.published === true &&
            program.admin_approved === true
        )
        .map(program => ({
          label: program.title,
          value: program.uuid as string,
        })),
    [programs]
  );

  const contentOptions = useMemo(
    () => [
      ...courseOptions.map(option => ({
        ...option,
        label: `Course: ${option.label}`,
        value: `course:${option.value}`,
      })),
      ...programOptions.map(option => ({
        ...option,
        label: `Program: ${option.label}`,
        value: `program:${option.value}`,
      })),
    ],
    [courseOptions, programOptions]
  );

  const jobsByCourseId = useMemo(
    () =>
      new Map(
        courses
          .map(course => [course.uuid ?? '', course] as const)
          .filter(([uuid]) => Boolean(uuid))
      ),
    [courses]
  );

  const jobsByProgramId = useMemo(
    () =>
      new Map(
        programs
          .map(program => [program.uuid ?? '', program] as const)
          .filter(([uuid]) => Boolean(uuid))
      ),
    [programs]
  );

  const selectedJob = useMemo(
    () => jobs.find(job => job.uuid === selectedJobUuid) ?? null,
    [jobs, selectedJobUuid]
  );

  const applicationByJobUuid = useMemo(() => {
    return new Map(myApplications.map(application => [application.job_uuid ?? '', application]));
  }, [myApplications]);

  const jobsBeforeStatusFilter = useMemo(() => {
    return jobs.filter(job => {
      const programUuid = getJobProgramUuid(job);
      const searchable = [
        job.title,
        job.description,
        job.location_name,
        job.meeting_link,
        job.location_type,
        job.class_visibility,
        job.session_format,
        job.organisation_uuid,
        job.course_uuid,
        programUuid,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !search.trim() || searchable.includes(search.trim().toLowerCase());
      const matchesSessionFormat =
        sessionFormatFilter === 'all' || job.session_format === sessionFormatFilter;
      const matchesLocation = locationFilter === 'all' || job.location_type === locationFilter;
      const matchesOrganisation =
        organisationFilter === 'all' || job.organisation_uuid === organisationFilter;
      const matchesContent =
        contentFilter === 'all' ||
        (job.course_uuid ? contentFilter === `course:${job.course_uuid}` : false) ||
        (programUuid ? contentFilter === `program:${programUuid}` : false);

      return (
        matchesSearch &&
        matchesOrganisation &&
        matchesContent &&
        matchesSessionFormat &&
        matchesLocation
      );
    });
  }, [contentFilter, jobs, locationFilter, organisationFilter, search, sessionFormatFilter]);

  const filteredJobs = useMemo(() => {
    return jobsBeforeStatusFilter.filter(
      job => statusFilter === 'all' || job.status === statusFilter
    );
  }, [jobsBeforeStatusFilter, statusFilter]);

  const sortedJobs = useMemo(
    () => sortJobs(filteredJobs, sortDirection),
    [filteredJobs, sortDirection]
  );

  const tabDefinitions = useMemo(
    () =>
      marketplaceTabs.map(tab => ({
        ...tab,
        count: String(
          tab.id === 'all'
            ? filteredJobs.length
            : filteredJobs.filter(job => matchesMarketplaceTab(job, tab.id)).length
        ),
      })),
    [filteredJobs]
  );

  const kpis = useMemo(() => {
    const openCount = jobs.filter(job => job.status === 'open').length;

    if (isOrganizationView) {
      return [
        {
          label: 'Total postings',
          value: jobs.length,
          icon: BriefcaseBusiness,
          tone: 'info' as const,
        },
        { label: 'Open', value: openCount, icon: CheckCircle2, tone: 'success' as const },
        {
          label: 'Awaiting class',
          value: jobs.filter(job => (job.status as string) === 'awaiting_class').length,
          icon: Clock,
          tone: 'warning' as const,
        },
        {
          label: 'Filled',
          value: jobs.filter(job => job.status === 'filled').length,
          icon: Users,
          tone: 'neutral' as const,
        },
        {
          label: 'Cancelled',
          value: jobs.filter(job => job.status === 'cancelled').length,
          icon: Trash2,
          tone: 'destructive' as const,
        },
      ];
    }

    const distinctOrganisations = new Set(jobs.map(job => job.organisation_uuid).filter(Boolean))
      .size;
    const remoteCount = jobs.filter(job => job.location_type === 'ONLINE').length;

    return [
      { label: 'Open roles', value: openCount, icon: BriefcaseBusiness, tone: 'success' as const },
      {
        label: 'Organisations',
        value: distinctOrganisations,
        icon: Building2,
        tone: 'info' as const,
      },
      // "Applied" only makes sense for applying roles (instructor); orgs don't apply.
      ...(isOrganizationView
        ? []
        : [
          {
            label: 'Applied',
            value: myApplications.length,
            icon: CheckCircle2,
            tone: 'neutral' as const,
          },
        ]),
      { label: 'Remote', value: remoteCount, icon: Globe2, tone: 'warning' as const },
    ];
  }, [isOrganizationView, jobs, myApplications.length]);

  const cancelMutation = useMutation({
    ...cancelJobMutation(),
    onSuccess: async () => {
      toast.success('Job posting cancelled.');
      setPendingCancelJob(null);
      await queryClient.invalidateQueries({ queryKey: listJobsQueryKey(jobsListOptions) });
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to cancel this posting.');
    },
  });

  const handleEdit = (job: ClassMarketplaceJobWithProgram) => {
    router.push(`/dashboard/organisation/jobs/new?jobUuid=${job.uuid ?? ''}`);
  };

  if (!canLoadJobs) {
    return (
      <main className={adminTheme.page}>
        <EmptyState
          icon={BriefcaseBusiness}
          title='No organisation profile found'
          description='An active organisation profile is required before class jobs can be created or reviewed.'
          variant='card'
        />
      </main>
    );
  }

  const filterGroups = [
    {
      title: 'Status',
      icon: Filter,
      items: statusOptions.map(option => ({
        label: option.label,
        count:
          option.value === 'all'
            ? String(jobsBeforeStatusFilter.length)
            : String(jobsBeforeStatusFilter.filter(job => job.status === option.value).length),
        active: statusFilter === option.value,
        onSelect: () => setStatusFilter(option.value),
      })),
    },
    {
      title: 'Location',
      icon: MapPin,
      items: locationTypeOptions.map(option => ({
        label: formatEnumLabel(option),
        count: String(jobsBeforeStatusFilter.filter(job => job.location_type === option).length),
        active: locationFilter === option,
        onSelect: () => setLocationFilter(option),
      })),
    },
  ];
  const sidebarCount = `${filteredJobs.length} job posting${filteredJobs.length === 1 ? '' : 's'}`;

  return (
    <main className={cn(adminTheme.page, 'pb-16')}>
      <div className={adminTheme.pageStack}>
        <AdminPageHeader
          title={config.title}
          description={config.description}
          actions={
            <>
              {!isOrganizationView ? (
                <Button variant='outline' asChild>
                  <Link href={buildWorkspaceAliasPath(activeDomain, '/dashboard/opportunities/my-applications')}>
                    My applications
                  </Link>
                </Button>
              ) : null}
              {config.showCreateAction && canManageJobs ? (
                <Button asChild>
                  <Link href='/dashboard/organisation/jobs/new'>
                    <Plus className='mr-2 size-4' />
                    Post a job
                  </Link>
                </Button>
              ) : null}
            </>
          }
        />

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {jobsLoading
            ? kpis.map(kpi => <StatCardSkeleton key={kpi.label} />)
            : kpis.map(kpi => (
              <StatCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                icon={kpi.icon}
                tone={kpi.tone}
              />
            ))}
        </div>

        <div className='grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]'>
          <div className='hidden xl:sticky xl:top-4 xl:block xl:self-start'>
            {jobsLoading ? (
              <MarketplaceSidebarSkeleton />
            ) : (
              <MarketplaceSidebar
                heading='Filters'
                count={sidebarCount}
                groups={filterGroups}
                setAlertLabel='Set Alerts'
                applicationsLabel='My Applications'
                onApplicationsClick={
                  !isOrganizationView
                    ? () =>
                      router.push(
                        buildWorkspaceAliasPath(
                          activeDomain,
                          '/dashboard/opportunities/my-applications'
                        )
                      )
                    : undefined
                }
              />
            )}
          </div>

          <div className='min-w-0 space-y-4'>
            <SectionCard
              title='Filters'
              actions={
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant='outline' size='sm' className='xl:hidden'>
                      <SlidersHorizontal className='mr-1.5 size-4' />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side='left'
                    className='w-[88vw] max-w-sm overflow-y-auto border-r p-4'
                  >
                    <SheetHeader className='sr-only'>
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>
                        Explore job marketplace filters and quick actions.
                      </SheetDescription>
                    </SheetHeader>
                    {jobsLoading ? (
                      <MarketplaceSidebarSkeleton />
                    ) : (
                      <MarketplaceSidebar
                        heading='Filters'
                        count={sidebarCount}
                        groups={filterGroups}
                        setAlertLabel='Set Alerts'
                        applicationsLabel='My Applications'
                        onApplicationsClick={
                          !isOrganizationView
                            ? () =>
                              router.push(
                                buildWorkspaceAliasPath(
                                  activeDomain,
                                  '/dashboard/opportunities/my-applications'
                                )
                              )
                            : undefined
                        }
                      />
                    )}
                  </SheetContent>
                </Sheet>
              }
              bodyClassName='space-y-3'
            >
              <label className='relative block min-w-0'>
                <span className='sr-only'>Search jobs</span>
                <Input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder='Search job title, organisation, course, or location'
                  className='h-10 pl-10'
                />
                <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
              </label>

              <div className='flex flex-wrap items-center gap-3'>
                {!isOrganizationView ? (
                  <div className='min-w-[200px] flex-1'>
                    {isOrganisationsLoading ? (
                      <SelectSkeleton />
                    ) : (
                      <Select
                        value={organisationFilter}
                        onValueChange={value => setOrganisationFilter(value)}
                      >
                        <SelectTrigger className='h-10 w-full'>
                          <Building2 className='text-muted-foreground mr-2 size-4 shrink-0' />
                          <SelectValue placeholder='All organisations' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>All organisations</SelectItem>
                          {organisationOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ) : null}

                <div className='min-w-[200px] flex-1'>
                  {isCoursesLoading || isProgramsLoading ? (
                    <SelectSkeleton />
                  ) : (
                    <Select value={contentFilter} onValueChange={value => setContentFilter(value)}>
                      <SelectTrigger className='h-10 w-full'>
                        <GraduationCap className='text-muted-foreground mr-2 size-4 shrink-0' />
                        <SelectValue placeholder='All content' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All content</SelectItem>
                        {contentOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className='min-w-[200px] flex-1'>
                  <Select
                    value={sessionFormatFilter}
                    onValueChange={value =>
                      setSessionFormatFilter(value as 'all' | SessionFormatEnum)
                    }
                  >
                    <SelectTrigger className='h-10 w-full'>
                      <CalendarDays className='text-muted-foreground mr-2 size-4 shrink-0' />
                      <SelectValue placeholder='All session formats' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All session formats</SelectItem>
                      {sessionFormatOptions.map(option => (
                        <SelectItem key={option} value={option}>
                          {formatEnumLabel(option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type='button'
                  variant='outline'
                  className='h-10 shrink-0 whitespace-nowrap'
                  onClick={() =>
                    setSortDirection(previous => (previous === 'newest' ? 'oldest' : 'newest'))
                  }
                >
                  {sortDirection === 'newest' ? (
                    <ArrowDownWideNarrow className='size-4 shrink-0' />
                  ) : (
                    <ArrowUpWideNarrow className='size-4 shrink-0' />
                  )}
                  <span>{sortDirection === 'newest' ? 'Newest first' : 'Oldest first'}</span>
                </Button>
              </div>
            </SectionCard>

            <Tabs
              value={marketplaceTab}
              onValueChange={value => setMarketplaceTab(value as MarketplaceTabId)}
              className='gap-0'
            >
              <MarketplaceTabs tabs={tabDefinitions} />

              {tabDefinitions.map(tab => {
                const tabJobs =
                  tab.id === 'all'
                    ? sortedJobs
                    : sortJobs(
                      filteredJobs.filter(job => matchesMarketplaceTab(job, tab.id)),
                      sortDirection
                    );

                return (
                  <TabsContent key={tab.id} value={tab.id} className='mt-4 space-y-4'>
                    <div className='flex flex-wrap items-center justify-between gap-3'>
                      <p className='text-muted-foreground text-sm'>
                        <span className='text-foreground font-semibold tabular-nums'>
                          {tabJobs.length}
                        </span>{' '}
                        active job posting{tabJobs.length === 1 ? '' : 's'}
                      </p>
                    </div>

                    <AsyncSection
                      loading={jobsLoading}
                      error={jobsError}
                      empty={!tabJobs.length}
                      onRetry={() => refetchJobs()}
                      skeleton={<JobListSkeleton />}
                      errorTitle='Couldn’t load job postings'
                      emptyState={
                        <EmptyState
                          icon={BriefcaseBusiness}
                          title='No class jobs found'
                          description={config.emptyStateLabel}
                          variant='compact'
                        />
                      }
                    >
                      <div className='3xl:grid-cols-2 grid gap-4'>
                        {tabJobs.map(job => {
                          const course = jobsByCourseId.get(job.course_uuid ?? '') ?? null;
                          const program = jobsByProgramId.get(getJobProgramUuid(job) ?? '') ?? null;
                          const application = applicationByJobUuid.get(job.uuid ?? '') ?? null;

                          return (
                            <JobCard
                              key={job.uuid}
                              job={job}
                              course={course}
                              program={program}
                              isManagementView={isOrganizationView}
                              organisationName={organisationName}
                              organisation={organisation}
                              instructor={instructor}
                              onView={() => setSelectedJobUuid(job.uuid ?? null)}
                              onEdit={isOrganizationView ? () => handleEdit(job) : undefined}
                              onCancel={
                                isOrganizationView ? () => setPendingCancelJob(job) : undefined
                              }
                              applicationStatus={application?.status ?? null}
                              hasApplied={Boolean(application)}
                              // The grid has no per-job eligibility call — one per card would be
                              // dozens of requests — so the cached application decides here.
                              canReapply={statusAllowsReapply(application?.status)}
                              applicationsHref={
                                isOrganizationView && job.uuid
                                  ? buildWorkspaceAliasPath(
                                    activeDomain,
                                    `/dashboard/opportunities/${job.uuid}`
                                  )
                                  : undefined
                              }
                              createClassHref={
                                isOrganizationView && job.uuid
                                  ? buildWorkspaceAliasPath(
                                    activeDomain,
                                    `/dashboard/opportunities/${job.uuid}/create-class`
                                  )
                                  : undefined
                              }
                            />
                          );
                        })}
                      </div>
                    </AsyncSection>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        </div>
      </div>

      <JobDetailsSheet
        job={selectedJob}
        open={Boolean(selectedJob)}
        onOpenChange={open => {
          if (!open) setSelectedJobUuid(null);
        }}
        isManagementView={isOrganizationView}
        organisation={organisation}
        instructor={instructor}
        organisationName={organisationName}
        course={selectedJob ? (jobsByCourseId.get(selectedJob.course_uuid ?? '') ?? null) : null}
        program={
          selectedJob ? (jobsByProgramId.get(getJobProgramUuid(selectedJob) ?? '') ?? null) : null
        }
        onEdit={selectedJob ? () => handleEdit(selectedJob) : undefined}
        onCancel={selectedJob ? () => setPendingCancelJob(selectedJob) : undefined}
        application={
          selectedJob ? (applicationByJobUuid.get(selectedJob.uuid ?? '') ?? null) : null
        }
        myApplicationsHref={
          !isOrganizationView
            ? buildWorkspaceAliasPath(activeDomain, '/dashboard/opportunities/my-applications')
            : undefined
        }
      />

      <DeleteModal
        open={Boolean(pendingCancelJob)}
        setOpen={open => {
          if (!open) setPendingCancelJob(null);
        }}
        title='Cancel job posting'
        description={
          <span>
            This removes <strong>{pendingCancelJob?.title ?? 'this job posting'}</strong> from the
            active marketplace.
          </span>
        }
        confirmText='Cancel posting'
        onConfirm={() => {
          if (!pendingCancelJob?.uuid) return;

          cancelMutation.mutate({
            path: { jobUuid: pendingCancelJob.uuid },
          });
        }}
        isLoading={cancelMutation.isPending}
      />
    </main>
  );
}

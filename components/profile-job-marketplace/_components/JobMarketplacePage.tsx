'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Filter,
  Globe2,
  GraduationCap,
  MapPin,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import DeleteModal from '@/components/custom-modals/delete-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  applyToJobMutation,
  cancelJobMutation,
  createJobMutation,
  getAllCoursesOptions,
  getAllOrganisationsOptions,
  getAllTrainingProgramsOptions,
  listJobApplicationsQueryKey,
  listJobsOptions,
  listJobsQueryKey,
  listMyApplicationsOptions,
  listMyApplicationsQueryKey,
  updateJobMutation,
} from '@/services/client/@tanstack/react-query.gen';
import type {
  ClassMarketplaceJob,
  ClassMarketplaceJobRequest,
  ClassVisibilityEnum,
  Course,
  LocationTypeEnum,
  Organisation,
  SessionFormatEnum,
  StatusEnum5,
  TrainingProgram,
} from '@/services/client/types.gen';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

import { extractPage } from '../../../lib/api-helpers';
import type { JobMarketplaceRole } from '../data';
import { getJobMarketplaceRoleConfig } from '../data';
import { JobCard } from './JobMarketplaceCard';
import { JobListSkeleton, MarketplaceSidebarSkeleton, SelectSkeleton } from './JobMarketplaceSkeletons';
import { MarketplaceRail } from './MarketplaceRail';
import { MarketplaceSidebar } from './MarketplaceSidebar';
import { MarketplaceTabs } from './MarketplaceTabs';

type JobFilter = 'all' | StatusEnum5;
type MarketplaceTabId = 'all' | 'full-time' | 'freelance' | 'internship' | 'remote';
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

type JobFormState = {
  organisation_uuid: string;
  content_type: MarketplaceContentType;
  course_uuid: string;
  program_uuid: string;
  title: string;
  description: string;
  class_visibility: ClassVisibilityEnum;
  session_format: SessionFormatEnum;
  default_start_time: string;
  default_end_time: string;
  academic_period_start_date: string;
  academic_period_end_date: string;
  registration_period_start_date: string;
  registration_period_end_date: string;
  class_reminder_minutes: string;
  location_type: LocationTypeEnum;
  location_name: string;
  location_latitude: string;
  location_longitude: string;
  meeting_link: string;
  max_participants: string;
  allow_waitlist: boolean;
  session_template_start_time: string;
  session_template_end_time: string;
};

const JOB_PAGE_SIZE = 50;
const LOOKUP_PAGE_SIZE = 100;
const DEFAULT_LOCATION_LATITUDE = -1.286389;
const DEFAULT_LOCATION_LONGITUDE = 36.817223;

const locationTypeOptions: LocationTypeEnum[] = ['ONLINE', 'IN_PERSON', 'HYBRID'];
const classVisibilityOptions: ClassVisibilityEnum[] = ['PUBLIC', 'PRIVATE'];
const sessionFormatOptions: SessionFormatEnum[] = ['INDIVIDUAL', 'GROUP'];
const statusOptions: Array<{ label: string; value: JobFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Filled', value: 'filled' },
  { label: 'Cancelled', value: 'cancelled' },
];
const marketplaceTabs: Array<{
  id: MarketplaceTabId;
  label: string;
  count: number;
  icon: typeof BriefcaseBusiness;
}> = [
  { id: 'all', label: 'All', count: 0, icon: BriefcaseBusiness },
  { id: 'full-time', label: 'Full-Time', count: 0, icon: BriefcaseBusiness },
  { id: 'internship', label: 'Internship', count: 0, icon: GraduationCap },
  { id: 'freelance', label: 'Freelance', count: 0, icon: Star },
  { id: 'remote', label: 'Remote', count: 0, icon: Globe2 },
];

function matchesMarketplaceTab(job: ClassMarketplaceJobWithProgram, tabId: MarketplaceTabId) {
  const searchable = [job.title, job.description, job.location_name, job.meeting_link]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const isRemote = job.location_type === 'ONLINE' || searchable.includes('remote');
  const isInternship =
    searchable.includes('intern') ||
    searchable.includes('internship') ||
    searchable.includes('trainee') ||
    searchable.includes('apprentice');
  const isFreelance =
    searchable.includes('freelance') ||
    searchable.includes('contract') ||
    searchable.includes('project') ||
    searchable.includes('gig') ||
    searchable.includes('consult');

  switch (tabId) {
    case 'all':
      return true;
    case 'remote':
      return isRemote;
    case 'internship':
      return isInternship;
    case 'freelance':
      return isFreelance;
    case 'full-time':
    default:
      return !isRemote && !isInternship && !isFreelance;
  }
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

function getInitialFormState(
  organisationUuid: string,
  job?: ClassMarketplaceJobWithProgram | null,
  initialContent?: JobContentPrefill | null
): JobFormState {
  const defaultStart = job?.default_start_time ? new Date(job.default_start_time) : new Date();
  const defaultEnd = job?.default_end_time
    ? new Date(job.default_end_time)
    : new Date(defaultStart.getTime() + 60 * 60 * 1000);
  const jobProgramUuid = job ? getJobProgramUuid(job) : null;
  const contentType = job
    ? getJobContentType(job)
    : (initialContent?.type ?? 'course');

  const sessionTemplateStart = job?.session_templates?.[0]?.start_time
    ? new Date(job.session_templates[0].start_time)
    : defaultStart;
  const sessionTemplateEnd = job?.session_templates?.[0]?.end_time
    ? new Date(job.session_templates[0].end_time)
    : defaultEnd;

  return {
    organisation_uuid: job?.organisation_uuid ?? organisationUuid,
    content_type: contentType,
    course_uuid:
      job?.course_uuid ?? (initialContent?.type === 'course' ? initialContent.id : ''),
    program_uuid:
      jobProgramUuid ?? (initialContent?.type === 'program' ? initialContent.id : ''),
    title: job?.title ?? '',
    description: job?.description ?? '',
    class_visibility: job?.class_visibility ?? 'PUBLIC',
    session_format: job?.session_format ?? 'GROUP',
    default_start_time: formatDateTimeInputValue(job?.default_start_time ?? defaultStart),
    default_end_time: formatDateTimeInputValue(job?.default_end_time ?? defaultEnd),
    academic_period_start_date: formatDateValue(job?.academic_period_start_date ?? ''),
    academic_period_end_date: formatDateValue(job?.academic_period_end_date ?? ''),
    registration_period_start_date: formatDateValue(job?.registration_period_start_date ?? ''),
    registration_period_end_date: formatDateValue(job?.registration_period_end_date ?? ''),
    class_reminder_minutes: job?.class_reminder_minutes ? String(job.class_reminder_minutes) : '30',
    location_type: job?.location_type ?? 'ONLINE',
    location_name: job?.location_name ?? '',
    location_latitude:
      typeof job?.location_latitude === 'number' ? String(job.location_latitude) : '',
    location_longitude:
      typeof job?.location_longitude === 'number' ? String(job.location_longitude) : '',
    meeting_link: job?.meeting_link ?? '',
    max_participants: typeof job?.max_participants === 'number' ? String(job.max_participants) : '',
    allow_waitlist: Boolean(job?.allow_waitlist ?? true),
    session_template_start_time: formatDateTimeInputValue(sessionTemplateStart),
    session_template_end_time: formatDateTimeInputValue(sessionTemplateEnd),
  };
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

function parseDateTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function buildJobPayload(form: JobFormState): ClassMarketplaceJobRequestWithProgram {
  const payload: ClassMarketplaceJobRequestWithProgram = {
    organisation_uuid: form.organisation_uuid,
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    class_visibility: form.class_visibility,
    session_format: form.session_format,
    default_start_time: parseDateTime(form.default_start_time) ?? new Date(),
    default_end_time: parseDateTime(form.default_end_time) ?? new Date(),
    academic_period_start_date: parseDate(form.academic_period_start_date),
    academic_period_end_date: parseDate(form.academic_period_end_date),
    registration_period_start_date: parseDate(form.registration_period_start_date),
    registration_period_end_date: parseDate(form.registration_period_end_date),
    class_reminder_minutes: parseNumber(form.class_reminder_minutes),
    location_type: form.location_type,
    location_name: form.location_name.trim() || undefined,
    location_latitude: parseNumber(form.location_latitude),
    location_longitude: parseNumber(form.location_longitude),
    meeting_link: form.meeting_link.trim() || undefined,
    max_participants: parseNumber(form.max_participants),
    allow_waitlist: form.allow_waitlist,
    session_templates: [
      {
        start_time: parseDateTime(form.session_template_start_time) ?? new Date(),
        end_time: parseDateTime(form.session_template_end_time) ?? new Date(),
        conflict_resolution: 'FAIL',
      },
    ],
  };

  if (form.content_type === 'program') {
    payload.program_uuid = form.program_uuid;
  } else {
    payload.course_uuid = form.course_uuid;
  }

  return payload;
}

function JobStatsRow({ job }: { job: ClassMarketplaceJob }) {
  return (
    <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
      <div className='rounded-2xl border bg-background/70 p-3'>
        <div className='text-muted-foreground text-xs font-medium uppercase tracking-wide'>
          Published
        </div>
        <div className='mt-1 text-sm font-medium'>{formatDateTime(job.created_date)}</div>
      </div>
      <div className='rounded-2xl border bg-background/70 p-3'>
        <div className='text-muted-foreground text-xs font-medium uppercase tracking-wide'>
          Start / End
        </div>
        <div className='mt-1 text-sm font-medium'>{formatDateTime(job.default_start_time)}</div>
        <div className='text-muted-foreground text-xs'>to {formatDateTime(job.default_end_time)}</div>
      </div>
      <div className='rounded-2xl border bg-background/70 p-3'>
        <div className='text-muted-foreground text-xs font-medium uppercase tracking-wide'>
          Capacity
        </div>
        <div className='mt-1 text-sm font-medium'>
          {typeof job.max_participants === 'number' ? `${job.max_participants} participants` : 'Not provided'}
        </div>
        <div className='text-muted-foreground text-xs'>
          Waitlist {job.allow_waitlist ? 'enabled' : 'disabled'}
        </div>
      </div>
    </div>
  );
}

function JobDetailsSheet({
  job,
  open,
  onOpenChange,
  isManagementView,
  organisationName,
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
  course?: Course | null;
  program?: TrainingProgram | null;
  onEdit?: () => void;
  onCancel?: () => void;
  application?: { status?: string | null; application_note?: string | null } | null;
  myApplicationsHref?: string;
}) {
  const queryClient = useQueryClient();
  const [applicationNote, setApplicationNote] = useState('');
  const [showAllSessions, setShowAllSessions] = useState(false);
  const alreadyApplied = Boolean(application);
  const jobUuid = job?.uuid;


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
      <SheetContent side='right' className='flex w-[min(98vw,650px)] max-w-none flex-col overflow-y-auto sm:max-w-none'
      >
        <div className='space-y-6 p-3 sm:p-6 mb-10'>
          <SheetHeader className='space-y-3 pr-10 text-left'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='secondary' className='rounded-full px-2.5 py-1 text-xs font-medium'>
                {formatEnumLabel(job.status)}
              </Badge>
              <Badge variant='outline' className='rounded-full px-2.5 py-1 text-xs font-medium'>
                {formatEnumLabel(job.session_format)}
              </Badge>
              <Badge variant='outline' className='rounded-full px-2.5 py-1 text-xs font-medium'>
                {formatEnumLabel(job.location_type)}
              </Badge>
            </div>
            <SheetTitle className='text-2xl'>{job.title || 'Untitled job'}</SheetTitle>
            <SheetDescription>
              {getDisplayOrganisationLabel(job, organisationName)} · {getDisplayContentLabel(job, course, program)}
            </SheetDescription>
          </SheetHeader>

          <div className='space-y-4'>
            <JobStatsRow job={job} />

            {!isManagementView && application ? (
              <div className='rounded-2xl border bg-background/70 p-4'>
                <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
                  Your application
                </h3>
                <div className='mt-2 flex flex-wrap items-center gap-2'>
                  <Badge variant='secondary' className='rounded-full px-3 py-1'>
                    {getApplicationStatusLabel(application.status)}
                  </Badge>
                  {myApplicationsHref ? (
                    <Button asChild variant='outline' className='rounded-xl'>
                      <Link href={myApplicationsHref}>View my applications</Link>
                    </Button>
                  ) : null}
                </div>
                {application.application_note ? (
                  <p className='mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground'>
                    {application.application_note}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className='rounded-2xl border bg-background/70 p-4'>
              <h3 className='flex flex-row items-center gap-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
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

                  const hours =
                    (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                  return (
                    <div
                      key={idx}
                      className='flex flex-wrap items-center justify-between gap-2 text-sm'
                    >
                      <div className='flex flex-row gap-2'>
                        <p className='font-medium'>
                          {start.toLocaleDateString()}
                        </p>
                        <p className='text-muted-foreground'>
                          (
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                          -{' '}
                          {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </p>
                      </div>

                      <Badge className='bg-primary text-primary-foreground'>
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

            <div className='rounded-2xl border bg-background/70 p-4'>
              <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
                Description
              </h3>
              <p className='mt-2 whitespace-pre-line text-sm leading-6 text-foreground'>
                {job.description || 'No description has been provided for this posting yet.'}
              </p>
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              <InfoTile label='Location name' value={job.location_name || 'Not provided'} />
              <InfoTile label='Meeting link' value={job.meeting_link || 'Not provided'} />
              <InfoTile label='Academic period start' value={formatDateTime(job.academic_period_start_date)} />
              <InfoTile label='Academic period end' value={formatDateTime(job.academic_period_end_date)} />
              <InfoTile label='Registration start' value={formatDateTime(job.registration_period_start_date)} />
              <InfoTile label='Registration end' value={formatDateTime(job.registration_period_end_date)} />
            </div>
          </div>

          {isManagementView ? (
            <div className='flex flex-wrap gap-2'>
              <Button
                className='rounded-xl'
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
                className='rounded-xl'
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
            <div className='space-y-3 rounded-2xl border bg-background/70 p-4'>
              <Label htmlFor='application-note' className='text-sm font-semibold'>
                Application note
              </Label>
              <Textarea
                id='application-note'
                value={applicationNote}
                onChange={event => setApplicationNote(event.target.value)}
                placeholder='Add a short note to support your application.'
                className='min-h-28 rounded-2xl'
                disabled={alreadyApplied}
              />
              {alreadyApplied ? (
                <div className='flex flex-wrap items-center gap-2 rounded-xl border border-dashed bg-background/60 p-3 text-sm text-muted-foreground'>
                  <Badge variant='success' className='rounded-full px-3 py-1'>
                    Applied
                  </Badge>
                  <span>You have already applied to this opportunity.</span>
                  {myApplicationsHref ? (
                    <Button asChild variant='outline' className='rounded-xl'>
                      <Link href={myApplicationsHref}>View my applications</Link>
                    </Button>
                  ) : null}
                </div>
              ) : null}
              <div className='flex flex-wrap gap-2'>
                <Button
                  className='rounded-xl'
                  onClick={handleApply}
                  disabled={applyMutation.isPending || alreadyApplied}
                >
                  {applyMutation.isPending ? 'Submitting...' : 'Apply for job'}
                </Button>
                <Button variant='outline' className='rounded-xl' onClick={() => onOpenChange(false)}>
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

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-2xl border bg-background/70 p-4'>
      <div className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
        {label}
      </div>
      <div className='mt-1 text-sm leading-6 text-foreground'>{value}</div>
    </div>
  );
}

function JobFormSheet({
  open,
  onOpenChange,
  job,
  organisationUuid,
  courses,
  programs,
  initialContent,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: ClassMarketplaceJobWithProgram | null;
  organisationUuid: string;
  courses: Course[];
  programs: TrainingProgram[];
  initialContent: JobContentPrefill | null;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditMode = Boolean(job?.uuid);
  const [form, setForm] = useState<JobFormState>(() =>
    getInitialFormState(organisationUuid, job, initialContent)
  );
  const availableCourses = useMemo(
    () => courses.filter(course => course.active === true && course.admin_approved === true),
    [courses]
  );
  const availablePrograms = useMemo(
    () =>
      programs.filter(
        program =>
          program.active === true &&
          program.published === true &&
          program.admin_approved === true
      ),
    [programs]
  );

  const createMutation = useMutation({
    ...createJobMutation(),
    onSuccess: async () => {
      toast.success('Job posting created successfully.');
      onOpenChange(false);
      onSaved();
      await queryClient.invalidateQueries({
        queryKey: listJobsQueryKey({
          query: {
            pageable: { page: 0, size: JOB_PAGE_SIZE },
            organisation_uuid: organisationUuid,
          },
        }),
      });
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to create the job posting.');
    },
  });
  const updateMutation = useMutation({
    ...updateJobMutation(),
    onSuccess: async () => {
      toast.success('Job posting updated successfully.');
      onOpenChange(false);
      onSaved();
      await queryClient.invalidateQueries({
        queryKey: listJobsQueryKey({
          query: {
            pageable: { page: 0, size: JOB_PAGE_SIZE },
            organisation_uuid: organisationUuid,
          },
        }),
      });
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to update the job posting.');
    },
  });

  useEffect(() => {
    if (!open) return;
    setForm(getInitialFormState(organisationUuid, job, initialContent));
  }, [initialContent, job, open, organisationUuid]);

  const updateField = <K extends keyof JobFormState>(key: K, value: JobFormState[K]) => {
    setForm(previous => ({ ...previous, [key]: value }));
  };

  const handleContentTypeChange = (value: MarketplaceContentType) => {
    setForm(previous => ({
      ...previous,
      content_type: value,
      course_uuid: value === 'course' ? previous.course_uuid : '',
      program_uuid: value === 'program' ? previous.program_uuid : '',
    }));
  };

  const handleContentChange = (value: string) => {
    if (form.content_type === 'program') {
      updateField('program_uuid', value);
      return;
    }

    updateField('course_uuid', value);
  };

  const handleSubmit = () => {
    if (!organisationUuid) {
      toast.error('No organisation is available for this job posting.');
      return;
    }

    if (!form.title.trim()) {
      toast.error('Please enter a job title.');
      return;
    }

    if (form.content_type === 'course' && !form.course_uuid) {
      toast.error('Please choose a course.');
      return;
    }

    if (form.content_type === 'program' && !form.program_uuid) {
      toast.error('Please choose a program.');
      return;
    }

    const payload = buildJobPayload({
      ...form,
      organisation_uuid: organisationUuid,
    });

    if (!payload.default_start_time || !payload.default_end_time) {
      toast.error('Please choose valid start and end times.');
      return;
    }

    if (isEditMode && job?.uuid) {
      updateMutation.mutate({
        path: { jobUuid: job.uuid },
        body: payload as ClassMarketplaceJobRequest,
      });
      return;
    }

    createMutation.mutate({
      body: payload as ClassMarketplaceJobRequest,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='flex w-[min(98vw,700px)] max-w-none flex-col overflow-y-auto p-3 sm:p-6 sm:max-w-none'
      >
        <div className='space-y-6'>
          <SheetHeader className='space-y-3 pr-10 text-left'>
            <div className='flex items-center gap-2'>
              <Badge variant='secondary' className='rounded-full px-2.5 py-1 text-xs font-medium'>
                {isEditMode ? 'Edit job' : 'Create job'}
              </Badge>
              <Badge variant='outline' className='rounded-full px-2.5 py-1 text-xs font-medium'>
                {formatEnumLabel(form.location_type)}
              </Badge>
            </div>
            <SheetTitle className='text-2xl'>
              {isEditMode ? 'Edit job posting' : 'Create a new job posting'}
            </SheetTitle>
            <SheetDescription>
              Use the class creation layout to publish a job advert.
            </SheetDescription>
          </SheetHeader>

          <div className='grid gap-4'>
            <SectionShell title='Basic details'>
              <div className='grid gap-4 md:grid-cols-3'>
                <Field label='Job title *'>
                  <Input value={form.title} onChange={event => updateField('title', event.target.value)} />
                </Field>
                <Field label='Content type *'>
                  <Select
                    value={form.content_type}
                    onValueChange={value => handleContentTypeChange(value as MarketplaceContentType)}
                    disabled={isEditMode}
                  >
                    <SelectTrigger className='w-full min-w-0 rounded-xl'>
                      <SelectValue placeholder='Choose type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='course'>Course</SelectItem>
                      <SelectItem value='program'>Program</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={form.content_type === 'program' ? 'Program *' : 'Course *'}>
                  <Select
                    value={form.content_type === 'program' ? form.program_uuid : form.course_uuid}
                    onValueChange={handleContentChange}
                    disabled={isEditMode}
                  >
                    <SelectTrigger className='w-full min-w-0 rounded-xl'>
                      <SelectValue
                        placeholder={form.content_type === 'program' ? 'Choose program' : 'Choose course'}
                        className='min-w-0 truncate'
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {form.content_type === 'program'
                        ? availablePrograms.map(program => (
                          <SelectItem key={program.uuid} value={program.uuid ?? ''}>
                            {program.title}
                          </SelectItem>
                        ))
                        : availableCourses.map(course => (
                          <SelectItem key={course.uuid} value={course.uuid ?? ''}>
                            {course.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label='Description'>
                <Textarea
                  value={form.description}
                  onChange={event => updateField('description', event.target.value)}
                  className='min-h-32 rounded-2xl'
                  placeholder='Add a short summary of the job posting.'
                />
              </Field>

              <div className='grid gap-4 md:grid-cols-3'>
                <Field label='Visibility'>
                  <Select
                    value={form.class_visibility}
                    onValueChange={value => updateField('class_visibility', value as ClassVisibilityEnum)}
                  >
                    <SelectTrigger className='rounded-xl'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {classVisibilityOptions.map(value => (
                        <SelectItem key={value} value={value}>
                          {formatEnumLabel(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label='Session format'>
                  <Select
                    value={form.session_format}
                    onValueChange={value => updateField('session_format', value as SessionFormatEnum)}
                  >
                    <SelectTrigger className='rounded-xl'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sessionFormatOptions.map(value => (
                        <SelectItem key={value} value={value}>
                          {formatEnumLabel(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label='Reminder minutes'>
                  <Input
                    type='number'
                    value={form.class_reminder_minutes}
                    onChange={event => updateField('class_reminder_minutes', event.target.value)}
                    placeholder='30'
                  />
                </Field>
              </div>
            </SectionShell>

            <SectionShell title='Schedule'>
              <div className='grid gap-4 md:grid-cols-2'>
                <Field label='Default start *'>
                  <Input
                    type='datetime-local'
                    value={form.default_start_time}
                    onChange={event => updateField('default_start_time', event.target.value)}
                  />
                </Field>
                <Field label='Default end *'>
                  <Input
                    type='datetime-local'
                    value={form.default_end_time}
                    onChange={event => updateField('default_end_time', event.target.value)}
                  />
                </Field>
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <Field label='Academic period start'>
                  <Input
                    type='date'
                    value={form.academic_period_start_date}
                    onChange={event => updateField('academic_period_start_date', event.target.value)}
                  />
                </Field>
                <Field label='Academic period end'>
                  <Input
                    type='date'
                    value={form.academic_period_end_date}
                    onChange={event => updateField('academic_period_end_date', event.target.value)}
                  />
                </Field>
                <Field label='Registration start'>
                  <Input
                    type='date'
                    value={form.registration_period_start_date}
                    onChange={event => updateField('registration_period_start_date', event.target.value)}
                  />
                </Field>
                <Field label='Registration end'>
                  <Input
                    type='date'
                    value={form.registration_period_end_date}
                    onChange={event => updateField('registration_period_end_date', event.target.value)}
                  />
                </Field>
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                <Field label='Session template start *'>
                  <Input
                    type='datetime-local'
                    value={form.session_template_start_time}
                    onChange={event => updateField('session_template_start_time', event.target.value)}
                  />
                </Field>
                <Field label='Session template end *'>
                  <Input
                    type='datetime-local'
                    value={form.session_template_end_time}
                    onChange={event => updateField('session_template_end_time', event.target.value)}
                  />
                </Field>
              </div>
            </SectionShell>

            <SectionShell title='Location & capacity'>
              <div className='grid gap-4 md:grid-cols-2'>
                <Field label='Location type'>
                  <Select
                    value={form.location_type}
                    onValueChange={value => updateField('location_type', value as LocationTypeEnum)}
                  >
                    <SelectTrigger className='rounded-xl'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {locationTypeOptions.map(value => (
                        <SelectItem key={value} value={value}>
                          {formatEnumLabel(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label='Location name'>
                  <Input
                    value={form.location_name}
                    onChange={event => updateField('location_name', event.target.value)}
                    placeholder='Campus / venue / room'
                  />
                </Field>
                <Field label='Latitude'>
                  <Input
                    type='number'
                    value={form.location_latitude}
                    onChange={event => updateField('location_latitude', event.target.value)}
                    placeholder={`${DEFAULT_LOCATION_LATITUDE}`}
                  />
                </Field>
                <Field label='Longitude'>
                  <Input
                    type='number'
                    value={form.location_longitude}
                    onChange={event => updateField('location_longitude', event.target.value)}
                    placeholder={`${DEFAULT_LOCATION_LONGITUDE}`}
                  />
                </Field>
                <Field label='Meeting link'>
                  <Input
                    value={form.meeting_link}
                    onChange={event => updateField('meeting_link', event.target.value)}
                    placeholder='https://...'
                  />
                </Field>
                <Field label='Maximum participants'>
                  <Input
                    type='number'
                    value={form.max_participants}
                    onChange={event => updateField('max_participants', event.target.value)}
                    placeholder='24'
                  />
                </Field>
              </div>

              <label className='flex items-center gap-3 rounded-2xl border bg-background/70 px-4 py-3 text-sm'>
                <Checkbox
                  checked={form.allow_waitlist}
                  onCheckedChange={checked => updateField('allow_waitlist', checked === true)}
                />
                <span>Allow waitlist</span>
              </label>
            </SectionShell>
          </div>

          <div className='flex flex-wrap gap-2 border-t pt-4'>
            <Button
              className='rounded-xl'
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isEditMode
                  ? 'Update job'
                  : 'Create job'}
            </Button>
            <Button variant='outline' className='rounded-xl' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SectionShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='rounded-[24px] border-border border-1 p-4 shadow-sm'>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <h3 className='text-base font-semibold text-foreground'>{title}</h3>
      </div>
      <div className='space-y-4'>{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium'>{label}</Label>
      {children}
    </div>
  );
}

export function JobMarketplacePage({ role }: { role: JobMarketplaceRole }) {
  const config = getJobMarketplaceRoleConfig(role);
  const organisation = useOrganisation();
  const profile = useUserProfile();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const createJobParam = searchParams.get('create');
  const createContentTypeParam = searchParams.get('type');
  const createContentIdParam = searchParams.get('id');
  const isOrganizationView = role === 'organization';
  const organisationUuid = organisation?.uuid ?? '';
  const userUuid = profile?.uuid ?? '';
  const organisationName = organisation?.name ?? profile?.organizations?.[0]?.name ?? null;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobFilter>(isOrganizationView ? 'all' : 'open');
  const [sessionFormatFilter, setSessionFormatFilter] = useState<'all' | SessionFormatEnum>('all');
  const [locationFilter, setLocationFilter] = useState<'all' | LocationTypeEnum>('all');
  const [marketplaceTab, setMarketplaceTab] = useState<MarketplaceTabId>('all');
  const [organisationFilter, setOrganisationFilter] = useState<'all' | string>('all');
  const [contentFilter, setContentFilter] = useState<'all' | string>('all');
  const [sortDirection, setSortDirection] = useState<JobSortDirection>('newest');
  const [selectedJobUuid, setSelectedJobUuid] = useState<string | null>(null);
  const [pendingCancelJob, setPendingCancelJob] = useState<ClassMarketplaceJobWithProgram | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<ClassMarketplaceJobWithProgram | null>(null);
  const [initialContent, setInitialContent] = useState<JobContentPrefill | null>(null);
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

  useEffect(() => {
    if (!isOrganizationView || !organisationUuid) return;
    if (createJobParam !== '1') return;

    const contentType: MarketplaceContentType =
      createContentTypeParam === 'program' ? 'program' : 'course';
    const contentId = createContentIdParam?.trim();

    setEditingJob(null);
    setInitialContent(contentId ? { type: contentType, id: contentId } : null);
    setFormOpen(true);
  }, [
    createContentIdParam,
    createContentTypeParam,
    createJobParam,
    isOrganizationView,
    organisationUuid,
  ]);

  const { data: jobsResponse, isLoading: isJobsLoading } = useQuery({
    ...listJobsOptions(jobsListOptions),
    enabled: canLoadJobs,
  });
  const jobs: ClassMarketplaceJobWithProgram[] = jobsResponse?.data?.content ?? [];

  const myApplicationsQuery = useQuery({
    ...listMyApplicationsOptions({
      query: {
        pageable: {},
      },
    }),
    enabled: Boolean(!isOrganizationView && userUuid),
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
    return jobsBeforeStatusFilter.filter(job => statusFilter === 'all' || job.status === statusFilter);
  }, [jobsBeforeStatusFilter, statusFilter]);

  const sortedJobs = useMemo(() => sortJobs(filteredJobs, sortDirection), [filteredJobs, sortDirection]);

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
    setEditingJob(job);
    setInitialContent(null);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingJob(null);
    setInitialContent(null);
    setFormOpen(true);
  };

  if (!canLoadJobs) {
    return (
      <main className='min-h-screen px-3 py-4 sm:px-5 lg:px-7'>
        <EmptyState
          icon={BriefcaseBusiness}
          title='No organisation profile found'
          description='An active organisation profile is required before class jobs can be created or reviewed.'
          variant='card'
        />
      </main>
    );
  }

  return (
    <main className='min-h-screen px-3 py-4 sm:px-5 lg:px-7 mb-20'>
      <div className='mx-auto max-w-[1560px]'>
        <div className='grid gap-4 xl:grid-cols-[270px_minmax(0,1fr)] 2xl:grid-cols-[270px_minmax(0,1fr)_300px]'>
          <div className='hidden xl:sticky xl:top-4 xl:block xl:self-start'>
            {isJobsLoading && !jobsResponse ? (
              <MarketplaceSidebarSkeleton />
            ) : (
              <MarketplaceSidebar
                heading='Filters'
                count={`${filteredJobs.length} job posting${filteredJobs.length === 1 ? '' : 's'}`}
                groups={[
                  {
                    title: 'Status',
                    icon: Filter,
                    items: statusOptions.map(option => ({
                      label: option.label,
                      count:
                        option.value === 'all'
                          ? String(jobsBeforeStatusFilter.length)
                          : String(
                            jobsBeforeStatusFilter.filter(job => job.status === option.value).length
                          ),
                      active: statusFilter === option.value,
                      onSelect: () => setStatusFilter(option.value),
                    })),
                  },
                  {
                    title: 'Location',
                    icon: MapPin,
                    items: locationTypeOptions.map(option => ({
                      label: formatEnumLabel(option),
                      count: String(
                        jobsBeforeStatusFilter.filter(job => job.location_type === option).length
                      ),
                      active: locationFilter === option,
                      onSelect: () => setLocationFilter(option),
                    })),
                  },
                ]}
                setAlertLabel='Set Alerts'
                applicationsLabel='My Applications'
                onApplicationsClick={
                  !isOrganizationView
                    ? () => router.push('/dashboard/opportunities/my-applications')
                    : undefined
                }
              />
            )}
          </div>

          <div className='space-y-4'>
            <div className='gap-0 overflow-hidden rounded-[18px] border-border border-1 px-0 py-0 shadow-sm'>
              <div className='flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4'>
                <div className='space-y-1'>
                  <h1 className='text-foreground text-[1.9rem] font-semibold tracking-tight'>
                    {config.title}
                  </h1>
                  <p className='text-muted-foreground text-sm'>{config.description}</p>
                </div>
                {config.showCreateAction ? (
                  <Button className='rounded-xl px-4' onClick={handleCreate}>
                    <Plus className='mr-2 size-4' />
                    Create job
                  </Button>
                ) : null}
              </div>


              <div className='px-5 pt-5'>
                <label className='relative block min-w-0'>
                  <span className='sr-only'>Search jobs</span>

                  <Input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder='Search job title, organisation, course, or location'
                    className='h-10 rounded-md pl-10'
                  />

                  <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                </label>
              </div>

              <div className='flex sm:flex-row items-center gap-3 flex-wrap border-b px-5 py-4'>
                {!isOrganizationView ? (
                  <div className='min-w-[220px] flex-1'>
                    {isOrganisationsLoading ? (
                      <SelectSkeleton />
                    ) : (
                      <Select
                        value={organisationFilter}
                        onValueChange={value => setOrganisationFilter(value)}
                      >
                        <SelectTrigger className='h-11 w-full rounded-md border border-border bg-background/80'>
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

                <div className='min-w-[220px] flex-1'>
                  {isCoursesLoading || isProgramsLoading ? (
                    <SelectSkeleton />
                  ) : (
                    <Select value={contentFilter} onValueChange={value => setContentFilter(value)}>
                      <SelectTrigger className='h-11 w-full rounded-md border border-border bg-background/80'>
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

                <div className='min-w-[240px] flex-1'>
                  <Select
                    value={sessionFormatFilter}
                    onValueChange={value =>
                      setSessionFormatFilter(value as 'all' | SessionFormatEnum)
                    }
                  >
                    <SelectTrigger className='h-11 w-full rounded-md border border-border bg-background/80'>
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
                  className='h-11 shrink-0 whitespace-nowrap rounded-md border border-border bg-background/80 px-4'
                  onClick={() =>
                    setSortDirection(previous =>
                      previous === 'newest' ? 'oldest' : 'newest'
                    )
                  }
                >
                  {sortDirection === 'newest' ? (
                    <ArrowDownWideNarrow className='size-4 shrink-0' />
                  ) : (
                    <ArrowUpWideNarrow className='size-4 shrink-0' />
                  )}

                  <span>
                    {sortDirection === 'newest' ? 'Newest first' : 'Oldest first'}
                  </span>
                </Button>
              </div>

              <Tabs
                value={marketplaceTab}
                onValueChange={value => setMarketplaceTab(value as MarketplaceTabId)}
                className='gap-0'
              >
                <div className='px-5'>
                  <MarketplaceTabs tabs={tabDefinitions} />
                </div>

                {tabDefinitions.map(tab => {
                  const tabJobs =
                    tab.id === 'all'
                      ? sortedJobs
                      : sortJobs(
                        filteredJobs.filter(job => matchesMarketplaceTab(job, tab.id)),
                        sortDirection
                      );

                  return (
                    <TabsContent key={tab.id} value={tab.id} className='mt-0 space-y-4 py-4 sm:px-5'>
                      <div className='gap-4 rounded-[16px] px-4 py-4'>
                        <div className='flex flex-wrap items-center justify-between gap-3 pb-4'>
                          <div className='text-foreground text-[1.05rem] font-medium'>
                            {tabJobs.length} active job posting{tabJobs.length === 1 ? '' : 's'}
                          </div>
                          <div className='flex flex-wrap items-center gap-2'>
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className='rounded-lg border-border border-1 bg-background/80 xl:hidden'
                                >
                                  <SlidersHorizontal className='size-4' />
                                  Filters
                                </Button>
                              </SheetTrigger>
                              <SheetContent side='left' className='w-[88vw] max-w-sm overflow-y-auto border-r p-4'>
                                <SheetHeader className='sr-only'>
                                  <SheetTitle>Filters</SheetTitle>
                                  <SheetDescription>Explore job marketplace filters and quick actions.</SheetDescription>
                                </SheetHeader>
                                {isJobsLoading && !jobsResponse ? (
                                  <MarketplaceSidebarSkeleton />
                                ) : (
                                  <MarketplaceSidebar
                                    heading='Filters'
                                    count={`${jobs.length} job posting${jobs.length === 1 ? '' : 's'}`}
                                    groups={[
                                      {
                                        title: 'Status',
                                        icon: Filter,
                                        items: statusOptions.map(option => ({
                                          label: option.label,
                                          count:
                                            option.value === 'all'
                                              ? String(jobsBeforeStatusFilter.length)
                                              : String(
                                                jobsBeforeStatusFilter.filter(
                                                  job => job.status === option.value
                                                ).length
                                              ),
                                          active: statusFilter === option.value,
                                          onSelect: () => setStatusFilter(option.value),
                                        })),
                                      },
                                      {
                                        title: 'Location',
                                        icon: MapPin,
                                        items: locationTypeOptions.map(option => ({
                                          label: formatEnumLabel(option),
                                          count: String(
                                            jobsBeforeStatusFilter.filter(
                                              job => job.location_type === option
                                            ).length
                                          ),
                                          active: locationFilter === option,
                                          onSelect: () => setLocationFilter(option),
                                        })),
                                      },
                                    ]}
                                    setAlertLabel='Set Alerts'
                                    applicationsLabel='My Applications'
                                    onApplicationsClick={
                                      !isOrganizationView
                                        ? () => router.push('/dashboard/opportunities/my-applications')
                                        : undefined
                                    }
                                  />
                                )}
                              </SheetContent>
                            </Sheet>
                          </div>
                        </div>

                        {isJobsLoading && !jobsResponse ? (
                          <JobListSkeleton />
                        ) : (
                          <div className='grid gap-4 3xl:grid-cols-2'>
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
                                  onView={() => setSelectedJobUuid(job.uuid ?? null)}
                                  onEdit={isOrganizationView ? () => handleEdit(job) : undefined}
                                  onCancel={
                                    isOrganizationView ? () => setPendingCancelJob(job) : undefined
                                  }
                                  applicationStatus={application?.status ?? null}
                                  hasApplied={Boolean(application)}
                                  applicationsHref={
                                    isOrganizationView && job.uuid
                                      ? `/dashboard/opportunities/${job.uuid}`
                                      : undefined
                                  }
                                />
                              );
                            })}
                          </div>
                        )}

                        {!isJobsLoading && !tabJobs.length ? (
                          <EmptyState
                            icon={BriefcaseBusiness}
                            title='No class jobs found'
                            description={config.emptyStateLabel}
                            variant='compact'
                            className='bg-background/80'
                          />
                        ) : null}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          </div>

          {!isOrganizationView ? (
            <div className='xl:col-start-2 2xl:col-start-auto 2xl:sticky 2xl:top-4 2xl:self-start'>
              <MarketplaceRail
                coursesTitle='Recommended Courses'
                insightsTitle='Portfolio Insights'
                matchingTitle='Matching Opportunities'
                matchingDescription='We found active jobs based on your skills and profile.'
                matchingAction='See All'
                searchJobsPlaceholder='Search jobs'
                sendLabel='Send'
                insightsCount={String(jobs.length)}
                courses={[]}
                insights={[]}
              />
            </div>
          ) : null}
        </div>
      </div>

      <JobDetailsSheet
        job={selectedJob}
        open={Boolean(selectedJob)}
        onOpenChange={open => {
          if (!open) setSelectedJobUuid(null);
        }}
        isManagementView={isOrganizationView}
        organisationName={organisationName}
        course={selectedJob ? jobsByCourseId.get(selectedJob.course_uuid ?? '') ?? null : null}
        program={
          selectedJob ? jobsByProgramId.get(getJobProgramUuid(selectedJob) ?? '') ?? null : null
        }
        onEdit={selectedJob ? () => handleEdit(selectedJob) : undefined}
        onCancel={selectedJob ? () => setPendingCancelJob(selectedJob) : undefined}
        application={
          selectedJob ? (applicationByJobUuid.get(selectedJob.uuid ?? '') ?? null) : null
        }
        myApplicationsHref={!isOrganizationView ? '/dashboard/opportunities/my-applications' : undefined}
      />

      <div className='w-full'>
        {organisationUuid ? (
          <JobFormSheet
            open={formOpen}
            onOpenChange={open => {
              setFormOpen(open);
              if (!open) {
                setEditingJob(null);
                setInitialContent(null);
              }
            }}
            job={editingJob}
            organisationUuid={organisationUuid}
            courses={courses}
            programs={programs}
            initialContent={initialContent}
            onSaved={() => {
              setEditingJob(null);
              setInitialContent(null);
            }}
          />
        ) : null}
      </div>

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

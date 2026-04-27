'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Filter,
  Globe2,
  GraduationCap,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import DeleteModal from '@/components/custom-modals/delete-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
  listJobApplicationsOptions,
  listJobsOptions,
  listMyApplicationsOptions,
  updateJobMutation
} from '@/services/client/@tanstack/react-query.gen';
import type {
  ApplyToJobData,
  CancelJobData,
  ClassMarketplaceJob,
  ClassMarketplaceJobRequest,
  ClassVisibilityEnum,
  Course,
  CreateJobData,
  LocationTypeEnum,
  SessionFormatEnum,
  StatusEnum4,
  UpdateJobData
} from '@/services/client/types.gen';
import { useOrganisation } from '@/src/features/organisation/context/organisation-context';
import { useUserProfile } from '@/src/features/profile/context/profile-context';

import type { JobMarketplaceRole } from '../data';
import { getJobMarketplaceRoleConfig } from '../data';
import { MarketplaceRail } from './MarketplaceRail';
import { MarketplaceSidebar } from './MarketplaceSidebar';
import { MarketplaceTabs } from './MarketplaceTabs';

type JobFilter = 'all' | StatusEnum4;
type MarketplaceTabId = 'all' | 'full-time' | 'freelance' | 'internship' | 'remote';
type JobSort = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

type JobFormState = {
  organisation_uuid: string;
  course_uuid: string;
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

const PAGE_SIZE = 100;
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
const sortOptions: Array<{ label: string; value: JobSort }> = [
  { label: 'Most Recent', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Title A-Z', value: 'title-asc' },
  { label: 'Title Z-A', value: 'title-desc' },
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

function matchesMarketplaceTab(job: ClassMarketplaceJob, tabId: MarketplaceTabId) {
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

function sortJobs(jobs: ClassMarketplaceJob[], sortBy: JobSort) {
  return [...jobs].sort((left, right) => {
    const leftTitle = (left.title ?? '').toLowerCase();
    const rightTitle = (right.title ?? '').toLowerCase();
    const leftCreated = left.created_date ? new Date(left.created_date).getTime() : 0;
    const rightCreated = right.created_date ? new Date(right.created_date).getTime() : 0;

    switch (sortBy) {
      case 'oldest':
        return leftCreated - rightCreated;
      case 'title-asc':
        return leftTitle.localeCompare(rightTitle);
      case 'title-desc':
        return rightTitle.localeCompare(leftTitle);
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

function getDisplayCourseLabel(job: ClassMarketplaceJob, course?: Course | null) {
  if (course?.name) return course.name;
  if (job.course_uuid) return `Course ${shortId(job.course_uuid)}`;
  return 'Course';
}

function getInitialFormState(organisationUuid: string, job?: ClassMarketplaceJob | null): JobFormState {
  const defaultStart = job?.default_start_time ? new Date(job.default_start_time) : new Date();
  const defaultEnd = job?.default_end_time
    ? new Date(job.default_end_time)
    : new Date(defaultStart.getTime() + 60 * 60 * 1000);

  const sessionTemplateStart = job?.session_templates?.[0]?.start_time
    ? new Date(job.session_templates[0].start_time)
    : defaultStart;
  const sessionTemplateEnd = job?.session_templates?.[0]?.end_time
    ? new Date(job.session_templates[0].end_time)
    : defaultEnd;

  return {
    organisation_uuid: job?.organisation_uuid ?? organisationUuid,
    course_uuid: job?.course_uuid ?? '',
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

function buildJobPayload(form: JobFormState): ClassMarketplaceJobRequest {
  return {
    organisation_uuid: form.organisation_uuid,
    course_uuid: form.course_uuid,
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
}

function JobBadgeRow({ job, course, organisationName }: { job: ClassMarketplaceJob; course?: Course | null; organisationName?: string | null; }) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Badge variant='secondary' className='rounded-full px-2.5 py-1 text-xs font-medium'>
        {formatEnumLabel(job.status)}
      </Badge>
      <Badge variant='outline' className='rounded-full px-2.5 py-1 text-xs font-medium'>
        {formatEnumLabel(job.class_visibility)}
      </Badge>
      <Badge variant='outline' className='rounded-full px-2.5 py-1 text-xs font-medium'>
        {formatEnumLabel(job.session_format)}
      </Badge>
      <Badge variant='outline' className='rounded-full px-2.5 py-1 text-xs font-medium'>
        {formatEnumLabel(job.location_type)}
      </Badge>
      <Badge variant='outline' className='rounded-full px-2.5 py-1 text-xs font-medium'>
        {getDisplayOrganisationLabel(job, organisationName)}
      </Badge>
      <Badge variant='outline' className='rounded-full px-2.5 py-1 text-xs font-medium'>
        {getDisplayCourseLabel(job, course)}
      </Badge>
    </div>
  );
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

function JobCard({
  job,
  onView,
  onEdit,
  onCancel,
  isManagementView,
  course,
  organisationName,
  applicationStatus,
  applicationCount,
  applicationsHref,
}: {
  job: ClassMarketplaceJob;
  onView: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  isManagementView: boolean;
  course?: Course | null;
  organisationName?: string | null;
  applicationStatus?: string | null;
  applicationCount?: number;
  applicationsHref?: string;
}) {
  const title = job.title ?? 'Untitled job';
  const applicationLabel = getApplicationStatusLabel(applicationStatus);

  return (
    <Card className='group flex gap-4 rounded-[22px] border-white/60 bg-card/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'>
      <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_14%,white),color-mix(in_srgb,var(--el-accent-azure)_24%,white))] text-primary'>
        {isManagementView ? <ShieldCheck className='size-5' /> : <BriefcaseBusiness className='size-5' />}
      </div>

      <div className='min-w-0 flex-1 space-y-3'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='truncate text-lg font-semibold text-foreground'>{title}</h3>
              {!isManagementView && applicationStatus ? (
                <Badge variant='secondary' className='rounded-full px-3 py-1'>
                  {applicationLabel}
                </Badge>
              ) : null}
            </div>
            <p className='mt-0.5 text-sm text-muted-foreground'>
              {getDisplayOrganisationLabel(job, organisationName)} · {getDisplayCourseLabel(job, course)}
            </p>
          </div>
          <Badge variant={job.status === 'open' ? 'secondary' : 'outline'} className='rounded-full px-3 py-1'>
            {formatEnumLabel(job.status)}
          </Badge>
        </div>

        <JobBadgeRow job={job} course={course} organisationName={organisationName} />

        <div className='grid gap-2 sm:grid-cols-2'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <CalendarDays className='size-4 text-primary' />
            <span>{formatDateTime(job.default_start_time)}</span>
          </div>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <MapPin className='size-4 text-primary' />
            <span>{job.location_name || formatEnumLabel(job.location_type)}</span>
          </div>
        </div>

        <p className='line-clamp-3 text-sm leading-6 text-muted-foreground'>
          {job.description || 'No description has been provided for this posting yet.'}
        </p>

        <div className='flex flex-wrap items-center gap-2 pt-1'>
          <Button variant='outline' className='rounded-xl' onClick={onView}>
            View
          </Button>
          {isManagementView && applicationsHref ? (
            <Button asChild variant='secondary' className='rounded-xl'>
              <Link href={applicationsHref}>
                View applications{typeof applicationCount === 'number' ? ` (${applicationCount})` : ''}
              </Link>
            </Button>
          ) : null}
          {isManagementView && onEdit ? (
            <Button variant='outline' className='rounded-xl' onClick={onEdit}>
              <Pencil className='mr-1 size-4' />
              Edit
            </Button>
          ) : null}
          {isManagementView && onCancel ? (
            <Button variant='destructive' className='rounded-xl' onClick={onCancel}>
              <Trash2 className='mr-1 size-4' />
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function JobDetailsSheet({
  job,
  open,
  onOpenChange,
  isManagementView,
  organisationName,
  course,
  onEdit,
  onCancel,
  application,
  myApplicationsHref,
}: {
  job: ClassMarketplaceJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isManagementView: boolean;
  organisationName?: string | null;
  course?: Course | null;
  onEdit?: () => void;
  onCancel?: () => void;
  application?: { status?: string | null; application_note?: string | null } | null;
  myApplicationsHref?: string;
}) {
  const queryClient = useQueryClient();
  const [applicationNote, setApplicationNote] = useState('');
  const [showAllSessions, setShowAllSessions] = useState(false);
  const alreadyApplied = Boolean(application);


  const applyMutation = useMutation({
    ...applyToJobMutation(),
    onSuccess: async () => {
      toast.success('Application submitted successfully.');
      setApplicationNote('');
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: ['listJobApplications'] });
      await queryClient.invalidateQueries({ queryKey: ['listMyApplications'] });
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to apply for this posting.');
    },
  });

  if (!job) return null;

  const handleApply = () => {
    if (!job.uuid) return;

    applyMutation.mutate({
      path: { jobUuid: job.uuid },
      body: applicationNote.trim() ? { application_note: applicationNote.trim() } : undefined,
    } satisfies ApplyToJobData);
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
              {getDisplayOrganisationLabel(job, organisationName)} · {getDisplayCourseLabel(job, course)}
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

            <div className="rounded-2xl border bg-background/70 p-4">
              <h3 className="flex flex-row items-center gap-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Sessions
                <p>                  ({job?.session_templates?.length})                </p>
              </h3>

              <div className="mt-3 space-y-2">
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
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <div className='flex flex-row gap-2'>
                        <p className="font-medium">
                          {start.toLocaleDateString()}
                        </p>
                        <p className="text-muted-foreground">(
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{" "}
                          -{" "}
                          {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </p>
                      </div>

                      <Badge className="bg-primary text-primary-foreground">
                        {hours} hr{hours !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {job?.session_templates?.length > 10 && (
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-0"
                    onClick={() => setShowAllSessions(prev => !prev)}
                  >
                    {showAllSessions ? "Show less" : `Show all (${job.session_templates.length})`}
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
          ) : alreadyApplied ? (
            <div className='space-y-3 rounded-2xl border bg-background/70 p-4'>
              <p className='text-sm text-muted-foreground'>
                You have already applied to this opportunity. Check your applications page for the latest status.
              </p>
              {myApplicationsHref ? (
                <Button asChild className='rounded-xl'>
                  <Link href={myApplicationsHref}>Go to my applications</Link>
                </Button>
              ) : null}
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
              />
              <div className='flex flex-wrap gap-2'>
                <Button
                  className='rounded-xl'
                  onClick={handleApply}
                  disabled={applyMutation.isPending}
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
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: ClassMarketplaceJob | null;
  organisationUuid: string;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditMode = Boolean(job?.uuid);
  const [form, setForm] = useState<JobFormState>(() => getInitialFormState(organisationUuid, job));
  const [selectedCourseUuid, setSelectedCourseUuid] = useState('');

  const { data: coursesResponse } = useQuery({
    ...getAllCoursesOptions({
      query: {
        pageable: {
          page: 0,
          size: PAGE_SIZE,
          sort: ['name,asc'],
        },
      },
    }),
  });

  const courses = coursesResponse?.data?.content ?? [];
  const createMutation = useMutation({
    ...createJobMutation(),
    onSuccess: async () => {
      toast.success('Job posting created successfully.');
      onOpenChange(false);
      onSaved();
      await queryClient.invalidateQueries({ queryKey: ['listJobs'] });
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
      await queryClient.invalidateQueries({ queryKey: ['listJobs'] });
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to update the job posting.');
    },
  });

  useEffect(() => {
    if (!open) return;
    setForm(getInitialFormState(organisationUuid, job));
    setSelectedCourseUuid(job?.course_uuid ?? '');
  }, [job, open, organisationUuid]);

  useEffect(() => {
    if (!open || isEditMode || selectedCourseUuid || courses.length === 0) return;
    setSelectedCourseUuid(courses[0]?.uuid ?? '');
  }, [courses, isEditMode, open, selectedCourseUuid]);

  const updateField = <K extends keyof JobFormState>(key: K, value: JobFormState[K]) => {
    setForm(previous => ({ ...previous, [key]: value }));
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

    if (!selectedCourseUuid) {
      toast.error('Please choose a course.');
      return;
    }

    const payload = buildJobPayload({
      ...form,
      organisation_uuid: organisationUuid,
      course_uuid: selectedCourseUuid,
    });

    if (!payload.default_start_time || !payload.default_end_time) {
      toast.error('Please choose valid start and end times.');
      return;
    }

    if (isEditMode && job?.uuid) {
      updateMutation.mutate({
        path: { jobUuid: job.uuid },
        body: payload,
      } satisfies UpdateJobData);
      return;
    }

    createMutation.mutate({
      body: payload,
    } satisfies CreateJobData);
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
              <div className='grid gap-4 md:grid-cols-2'>
                <Field label='Job title *'>
                  <Input value={form.title} onChange={event => updateField('title', event.target.value)} />
                </Field>
                <Field label='Course *'>
                  <Select value={selectedCourseUuid} onValueChange={setSelectedCourseUuid}>
                    <SelectTrigger className='rounded-xl'>
                      <SelectValue placeholder='Choose course' />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
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
    <section className='rounded-[24px] border border-white/60 bg-card/95 p-4 shadow-sm'>
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
  const isOrganizationView = role === 'organization';
  const organisationUuid = organisation?.uuid ?? '';
  const userUuid = profile?.uuid ?? '';
  const organisationName = organisation?.name ?? profile?.organizations?.[0]?.name ?? null;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobFilter>(isOrganizationView ? 'all' : 'open');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | ClassVisibilityEnum>('all');
  const [sessionFormatFilter, setSessionFormatFilter] = useState<'all' | SessionFormatEnum>('all');
  const [locationFilter, setLocationFilter] = useState<'all' | LocationTypeEnum>('all');
  const [marketplaceTab, setMarketplaceTab] = useState<MarketplaceTabId>('all');
  const [sortBy, setSortBy] = useState<JobSort>('newest');
  const [selectedJobUuid, setSelectedJobUuid] = useState<string | null>(null);
  const [pendingCancelJob, setPendingCancelJob] = useState<ClassMarketplaceJob | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<ClassMarketplaceJob | null>(null);

  // const { data: jobsResponse, isLoading: isJobsLoading } = useQuery({
  //   ...listJobsOptions({
  //     query: {
  //       pageable: {
  //         page: 0,
  //         size: PAGE_SIZE,
  //         sort: ['created_date,desc'],
  //       },
  //       ...(isOrganizationView && organisationUuid ? { organisation_uuid: organisationUuid } : {}),
  //     },
  //   }),
  //   enabled: true,
  // });
  const { data: jobsResponse, isLoading: isJobsLoading } = useQuery({
    ...listJobsOptions({ query: { pageable: {}, organisation_uuid: "ec237ec5-f13c-4248-bf70-8d0099cb3a15" } }),
    enabled: true,
  });
  const jobs = jobsResponse?.data?.content ?? [];

  const jobApplicationsQueryResults = useQueries({
    queries: jobs.map(job => ({
      ...listJobApplicationsOptions({
        path: { jobUuid: job.uuid ?? '' },
        query: { pageable: { page: 0, size: 1 } },
      }),
      enabled: Boolean(isOrganizationView && job.uuid),
    })),
  });

  const myApplicationsQuery = useQuery({
    ...listMyApplicationsOptions({
      query: {
        pageable: {
          page: 0,
          size: PAGE_SIZE,
          sort: ['created_date,desc'],
        },
        status: undefined,
      },
    }),
    enabled: Boolean(!isOrganizationView && userUuid),
  });

  const { data: coursesResponse } = useQuery({
    ...getAllCoursesOptions({
      query: {
        pageable: {
          page: 0,
          size: PAGE_SIZE,
          sort: ['name,asc'],
        },
      },
    }),
  });

  const courses = coursesResponse?.data?.content ?? [];
  const myApplications = myApplicationsQuery.data?.data?.content ?? [];
  const jobsByCourseId = useMemo(
    () =>
      new Map(
        courses
          .map(course => [course.uuid ?? '', course] as const)
          .filter(([uuid]) => Boolean(uuid))
      ),
    [courses]
  );

  const selectedJob = useMemo(
    () => jobs.find(job => job.uuid === selectedJobUuid) ?? null,
    [jobs, selectedJobUuid]
  );

  const applicationByJobUuid = useMemo(() => {
    return new Map(myApplications.map(application => [application.job_uuid ?? '', application]));
  }, [myApplications]);

  const applicationCountsByJobUuid = useMemo(() => {
    const counts = new Map<string, number>();

    jobApplicationsQueryResults.forEach((queryResult, index) => {
      const jobUuid = jobs[index]?.uuid ?? '';
      if (!jobUuid) return;

      const totalValue =
        queryResult.data?.data?.metadata?.totalElements ??
        queryResult.data?.data?.content?.length ??
        0;
      counts.set(jobUuid, Number(totalValue));
    });

    return counts;
  }, [jobApplicationsQueryResults, jobs]);

  const jobsBeforeStatusFilter = useMemo(() => {
    return jobs.filter(job => {
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
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !search.trim() || searchable.includes(search.trim().toLowerCase());
      const matchesVisibility =
        visibilityFilter === 'all' || job.class_visibility === visibilityFilter;
      const matchesSessionFormat =
        sessionFormatFilter === 'all' || job.session_format === sessionFormatFilter;
      const matchesLocation = locationFilter === 'all' || job.location_type === locationFilter;

      return matchesSearch && matchesVisibility && matchesSessionFormat && matchesLocation;
    });
  }, [jobs, locationFilter, search, sessionFormatFilter, visibilityFilter]);

  const filteredJobs = useMemo(() => {
    return jobsBeforeStatusFilter.filter(job => statusFilter === 'all' || job.status === statusFilter);
  }, [jobsBeforeStatusFilter, statusFilter]);

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
      await queryClient.invalidateQueries({ queryKey: ['listJobs'] });
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to cancel this posting.');
    },
  });

  const handleEdit = (job: ClassMarketplaceJob) => {
    setEditingJob(job);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingJob(null);
    setFormOpen(true);
  };

  if (isJobsLoading && !jobsResponse) {
    return (
      <main className='flex min-h-[60vh] items-center justify-center px-3 py-4 sm:px-5 lg:px-7'>
        <Loader2 className='text-muted-foreground size-8 animate-spin' />
      </main>
    );
  }

  return (
    <main className='min-h-screen px-3 py-4 sm:px-5 lg:px-7'>
      <div className='mx-auto max-w-[1560px]'>
        <div className='grid gap-4 xl:grid-cols-[270px_minmax(0,1fr)] 2xl:grid-cols-[270px_minmax(0,1fr)_300px]'>
          <div className='hidden xl:sticky xl:top-4 xl:block xl:self-start'>
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
                    count: String(jobsBeforeStatusFilter.filter(job => job.location_type === option).length),
                    active: locationFilter === option,
                    onSelect: () => setLocationFilter(option),
                  })),
                },
              ]}
              setAlertLabel='Set Alerts'
              applicationsLabel='My Applications'
              onApplicationsClick={
                !isOrganizationView ? () => router.push('/dashboard/opportunities/my-applications') : undefined
              }
            />
          </div>

          <div className='space-y-4'>
            <Card className='gap-0 overflow-hidden rounded-[18px] border-white/60 bg-card/95 px-0 py-0 shadow-sm'>
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

              <div className='grid gap-3 border-b px-5 py-4 lg:grid-cols-[minmax(0,1fr)_220px_180px]'>
                <label className='relative block'>
                  <span className='sr-only'>Search jobs</span>
                  <Input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder='Search job title, company, course, or location'
                    className='h-11 rounded-xl pl-10'
                  />
                  <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                </label>

                <Select value={statusFilter} onValueChange={value => setStatusFilter(value as JobFilter)}>
                  <SelectTrigger className='h-11 rounded-xl border-white/70 bg-background/80'>
                    <SelectValue placeholder='All statuses' />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={value => setSortBy(value as JobSort)}>
                  <SelectTrigger className='h-11 rounded-xl border-white/70 bg-background/80'>
                    <SelectValue placeholder='Sort by' />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      ? sortJobs(filteredJobs, sortBy)
                      : sortJobs(
                        filteredJobs.filter(job => matchesMarketplaceTab(job, tab.id)),
                        sortBy
                      );

                  return (
                    <TabsContent key={tab.id} value={tab.id} className='mt-0 space-y-4 px-4 py-4 sm:px-5'>
                      <Card className='gap-4 rounded-[16px] border-white/60 bg-background/65 px-4 py-4 shadow-none'>
                        <div className='flex flex-wrap items-center justify-between gap-3'>
                          <div className='text-foreground text-[1.05rem] font-medium'>
                            {tabJobs.length} active job posting{tabJobs.length === 1 ? '' : 's'}
                          </div>
                          <div className='flex flex-wrap items-center gap-2'>
                            <Select value={statusFilter} onValueChange={value => setStatusFilter(value as JobFilter)}>
                              <SelectTrigger className='h-9 w-[160px] rounded-lg border-white/70 bg-background/80'>
                                <SelectValue placeholder='All statuses' />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className='text-muted-foreground text-sm'>Sort by</span>
                            <Button variant='outline' size='sm' className='rounded-lg border-white/70 bg-background/80'>
                              Most Recent
                              <ChevronDown className='size-4' />
                            </Button>
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className='rounded-lg border-white/70 bg-background/80 xl:hidden'
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
                              </SheetContent>
                            </Sheet>
                          </div>
                        </div>

                        <div className='grid gap-4 3xl:grid-cols-2'>
                          {tabJobs.map(job => {
                            const course = jobsByCourseId.get(job.course_uuid ?? '') ?? null;
                            const application = applicationByJobUuid.get(job.uuid ?? '') ?? null;
                            const applicationCount = applicationCountsByJobUuid.get(job.uuid ?? '') ?? 0;

                            return (
                              <JobCard
                                key={job.uuid}
                                job={job}
                                course={course}
                                isManagementView={isOrganizationView}
                                organisationName={organisationName}
                                onView={() => setSelectedJobUuid(job.uuid ?? null)}
                                onEdit={isOrganizationView ? () => handleEdit(job) : undefined}
                                onCancel={isOrganizationView ? () => setPendingCancelJob(job) : undefined}
                                applicationStatus={application?.status ?? null}
                                applicationCount={isOrganizationView ? applicationCount : undefined}
                                applicationsHref={
                                  isOrganizationView && job.uuid
                                    ? `/dashboard/opportunities/${job.uuid}`
                                    : undefined
                                }
                              />
                            );
                          })}
                        </div>

                        {!tabJobs.length ? (
                          <div className='rounded-[16px] border border-dashed border-white/70 bg-background/80 px-4 py-8 text-sm text-muted-foreground'>
                            {config.emptyStateLabel}
                          </div>
                        ) : null}
                      </Card>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </Card>
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
              if (!open) setEditingJob(null);
            }}
            job={editingJob}
            organisationUuid={organisationUuid}
            onSaved={() => {
              setEditingJob(null);
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
          } satisfies CancelJobData);
        }}
        isLoading={cancelMutation.isPending}
      />
    </main>
  );
}

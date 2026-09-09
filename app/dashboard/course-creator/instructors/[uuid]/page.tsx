'use client';

import { skipToken, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  DollarSign,
  FileCheck,
  FileText,
  Globe2,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Star,
  UserRound,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ComponentType, ReactNode } from 'react';
import { useMemo, useState } from 'react';

import {
  StatusBadge,
  statusToneClass,
  type StatusTone,
} from '@/app/dashboard/admin/_components/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { extractList, extractPage } from '@/lib/api-helpers';
import { formatCurrency } from '@/lib/format-currency';
import { formatCount, toNumber } from '@/lib/metrics';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import type {
  ClassDefinition,
  Instructor,
  InstructorDocument,
  InstructorEducation,
  InstructorExperience,
  InstructorProfessionalMembership,
  InstructorReview,
  InstructorSkill,
  User,
} from '@/services/client';
import {
  getClassDefinitionsForInstructorOptions,
  getClassDefinitionsForInstructorQueryKey,
  getInstructorByUuidOptions,
  getInstructorByUuidQueryKey,
  getInstructorDocumentsOptions,
  getInstructorDocumentsQueryKey,
  getInstructorEducationOptions,
  getInstructorEducationQueryKey,
  getInstructorExperienceOptions,
  getInstructorExperienceQueryKey,
  getInstructorMembershipsOptions,
  getInstructorMembershipsQueryKey,
  getInstructorRatingSummaryOptions,
  getInstructorRatingSummaryQueryKey,
  getInstructorReviewsOptions,
  getInstructorReviewsQueryKey,
  getInstructorSkillsOptions,
  getInstructorSkillsQueryKey,
  getUserByUuidOptions,
  getUserByUuidQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

const tabListClass =
  'h-auto w-full justify-start gap-7 overflow-x-auto rounded-none border-b border-border/70 bg-transparent p-0';
const tabTriggerClass =
  'rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-1 text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none';

type DetailItem = {
  label: ReactNode;
  value: ReactNode;
};

function isClassDefinition(value?: ClassDefinition | null): value is ClassDefinition {
  return Boolean(value?.uuid);
}

function formatEnumLabel(value?: string | null) {
  if (!value) return '0';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, letter => letter.toUpperCase());
}

function formatDate(value?: Date | string | null) {
  if (!value) return '0';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '0';
  return parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return '0';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '0';
  return parsed.toLocaleString(undefined, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatSize(value?: bigint | number | string | null) {
  const bytes = toNumber(value, Number.NaN);
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function instructorInitials(name?: string | null) {
  return (
    (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase() || '?'
  );
}

function displayName(instructor?: Instructor | null, user?: User | null) {
  return (
    instructor?.full_name?.trim() ||
    user?.full_name?.trim() ||
    `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() ||
    user?.email ||
    'Instructor'
  );
}

function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ComponentType<{ className?: string }>;
  tone?: StatusTone;
}) {
  return (
    <div className='border-border/70 bg-card flex min-h-[88px] items-center gap-3 rounded-md border p-4 shadow-sm'>
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-md border',
          statusToneClass[tone]
        )}
      >
        <Icon className='size-5' />
      </span>
      <div className='min-w-0'>
        <p className='text-muted-foreground truncate text-xs font-medium uppercase'>{label}</p>
        <div className='text-foreground truncate text-xl font-semibold'>{value}</div>
        {hint ? <p className='text-muted-foreground truncate text-xs'>{hint}</p> : null}
      </div>
    </div>
  );
}

function SectionPanel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('border-border/70 bg-card rounded-md border shadow-sm', className)}>
      <div className='border-border/60 flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4'>
        <div className='min-w-0 space-y-1'>
          <h2 className='text-foreground text-base font-semibold'>{title}</h2>
          {description ? <p className='text-muted-foreground text-sm'>{description}</p> : null}
        </div>
        {actions ? <div className='flex items-center gap-2'>{actions}</div> : null}
      </div>
      <div className='p-5'>{children}</div>
    </section>
  );
}

function DetailGrid({ items, columns = 2 }: { items: DetailItem[]; columns?: 1 | 2 | 3 }) {
  const cols =
    columns === 1 ? 'sm:grid-cols-1' : columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2';
  return (
    <div className={cn('grid gap-3', cols)}>
      {items.map((item, index) => (
        <div key={index} className='border-border/60 bg-muted/20 rounded-md border px-3 py-2.5'>
          <p className='text-muted-foreground text-xs tracking-wide uppercase'>{item.label}</p>
          <div className='text-foreground mt-1 min-w-0 text-sm font-medium'>
            {item.value ?? '0'}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className='border-border/70 bg-muted/20 flex min-h-[180px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center'>
      <Icon className='text-muted-foreground size-8' />
      <p className='text-foreground mt-3 font-medium'>{title}</p>
      <p className='text-muted-foreground mt-1 max-w-md text-sm'>{description}</p>
    </div>
  );
}

function TimelineList<T>({ items, render }: { items: T[]; render: (item: T) => ReactNode }) {
  return (
    <div className='space-y-3'>
      {items.map((item, index) => (
        <div
          key={index}
          className='border-border/70 bg-muted/20 rounded-md border px-4 py-3 text-sm'
        >
          {render(item)}
        </div>
      ))}
    </div>
  );
}

export default function CourseCreatorInstructorDetailPage() {
  const params = useParams<{ uuid: string }>();
  const routeUuid = decodeURIComponent(params?.uuid ?? '');
  const [tab, setTab] = useState('overview');

  const instructorQuery = useQuery({
    ...(routeUuid
      ? getInstructorByUuidOptions({ path: { uuid: routeUuid } })
      : {
          queryKey: getInstructorByUuidQueryKey({ path: { uuid: routeUuid } }),
          queryFn: skipToken,
        }),
    enabled: Boolean(routeUuid),
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const instructor = instructorQuery.data?.error ? undefined : instructorQuery.data?.data;
  const instructorUuid = instructor?.uuid ?? '';
  const userUuid = instructor?.user_uuid ?? '';

  const userQuery = useQuery({
    ...(userUuid
      ? getUserByUuidOptions({ path: { uuid: userUuid } })
      : { queryKey: getUserByUuidQueryKey({ path: { uuid: userUuid } }), queryFn: skipToken }),
    enabled: Boolean(userUuid),
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const user = userQuery.data?.error ? undefined : userQuery.data?.data;
  const avatarUrl = toAuthenticatedMediaUrl(user?.profile_image_url);

  const pathOptions = { path: { instructorUuid } };
  const ratingQuery = useQuery({
    ...(instructorUuid
      ? getInstructorRatingSummaryOptions(pathOptions)
      : { queryKey: getInstructorRatingSummaryQueryKey(pathOptions), queryFn: skipToken }),
    enabled: Boolean(instructorUuid),
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const skillsQuery = useQuery({
    ...(instructorUuid
      ? getInstructorSkillsOptions({
          ...pathOptions,
          query: { pageable: { page: 0, size: 80 } },
        })
      : {
          queryKey: getInstructorSkillsQueryKey({
            ...pathOptions,
            query: { pageable: { page: 0, size: 80 } },
          }),
          queryFn: skipToken,
        }),
    enabled: Boolean(instructorUuid),
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const educationQuery = useQuery({
    ...(instructorUuid
      ? getInstructorEducationOptions(pathOptions)
      : { queryKey: getInstructorEducationQueryKey(pathOptions), queryFn: skipToken }),
    enabled: Boolean(instructorUuid),
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const membershipsQuery = useQuery({
    ...(instructorUuid
      ? getInstructorMembershipsOptions({
          ...pathOptions,
          query: { pageable: { page: 0, size: 80 } },
        })
      : {
          queryKey: getInstructorMembershipsQueryKey({
            ...pathOptions,
            query: { pageable: { page: 0, size: 80 } },
          }),
          queryFn: skipToken,
        }),
    enabled: Boolean(instructorUuid),
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const experienceQuery = useQuery({
    ...(instructorUuid
      ? getInstructorExperienceOptions({
          ...pathOptions,
          query: { pageable: { page: 0, size: 80 } },
        })
      : {
          queryKey: getInstructorExperienceQueryKey({
            ...pathOptions,
            query: { pageable: { page: 0, size: 80 } },
          }),
          queryFn: skipToken,
        }),
    enabled: Boolean(instructorUuid),
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const documentsQuery = useQuery({
    ...(instructorUuid
      ? getInstructorDocumentsOptions(pathOptions)
      : { queryKey: getInstructorDocumentsQueryKey(pathOptions), queryFn: skipToken }),
    enabled: Boolean(instructorUuid),
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const reviewsQuery = useQuery({
    ...(instructorUuid
      ? getInstructorReviewsOptions(pathOptions)
      : { queryKey: getInstructorReviewsQueryKey(pathOptions), queryFn: skipToken }),
    enabled: Boolean(instructorUuid),
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const classesQuery = useQuery({
    ...(instructorUuid
      ? getClassDefinitionsForInstructorOptions({
          ...pathOptions,
          query: { activeOnly: false },
        })
      : {
          queryKey: getClassDefinitionsForInstructorQueryKey({
            ...pathOptions,
            query: { activeOnly: false },
          }),
          queryFn: skipToken,
        }),
    enabled: Boolean(instructorUuid),
    staleTime: STALE_TIMES.live,
    retry: false,
  });
  const skills = extractPage<InstructorSkill>(
    skillsQuery.data?.error ? undefined : skillsQuery.data
  ).items;
  const education = extractList<InstructorEducation>(
    educationQuery.data?.error ? undefined : educationQuery.data
  );
  const memberships = extractPage<InstructorProfessionalMembership>(
    membershipsQuery.data?.error ? undefined : membershipsQuery.data
  ).items;
  const experience = extractPage<InstructorExperience>(
    experienceQuery.data?.error ? undefined : experienceQuery.data
  ).items;
  const documents = extractList<InstructorDocument>(
    documentsQuery.data?.error ? undefined : documentsQuery.data
  );
  const reviews = extractList<InstructorReview>(
    reviewsQuery.data?.error ? undefined : reviewsQuery.data
  );
  const rating = ratingQuery.data?.error ? undefined : ratingQuery.data?.data;
  const assignedClasses = useMemo(
    () =>
      (classesQuery.data?.error ? [] : (classesQuery.data?.data ?? []))
        .map(response => response.class_definition)
        .filter(isClassDefinition),
    [classesQuery.data]
  );
  const currentExperience = experience.find(item => item.is_current_position);
  const qualification = education.find(item => item.is_complete) ?? education[0];
  const primarySkill = skills[0];
  const name = displayName(instructor, user);

  const averageRating = toNumber(rating?.average_rating);
  const reviewCount = rating?.review_count ?? reviews.length;
  const classCount = assignedClasses.length;
  const activeClassCount = assignedClasses.filter(item => item.is_active === true).length;
  // Instructor class responses do not include enrolment or payable aggregates.
  const assignedStudentCount = 0;
  const payable = {
    amount_owed: 0,
    amount_settled: 0,
    amount_accrued: 0,
    class_count: 0,
    session_count: 0,
    outstanding_session_count: 0,
    currency_code: 'KES',
    instructor_uuid: instructorUuid,
  };
  const completedSessions = assignedClasses.reduce(
    (total, item) => total + toNumber(item.completed_session_count),
    0
  );
  const scheduledSessions = assignedClasses.reduce(
    (total, item) => total + toNumber(item.scheduled_session_count),
    0
  );
  const pageLoading = instructorQuery.isLoading;
  const notFound = !routeUuid || (instructorQuery.isSuccess && !instructor?.uuid);

  if (pageLoading) {
    return (
      <main className='mx-auto w-full max-w-[2200px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[2400px]'>
        <Skeleton className='h-8 w-48 rounded-md' />
        <Skeleton className='h-36 w-full rounded-md' />
        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-6'>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className='h-[88px] rounded-md' />
          ))}
        </div>
        <Skeleton className='h-80 w-full rounded-md' />
      </main>
    );
  }

  if (notFound || instructorQuery.isError) {
    return (
      <main className='mx-auto w-full max-w-[2200px] px-3 py-8 sm:px-5 lg:px-6 2xl:max-w-[2400px]'>
        <EmptyState
          icon={UserRound}
          title={instructorQuery.isError ? 'Unable to load instructor' : 'Instructor not found'}
          description='The selected instructor profile could not be loaded.'
          action={
            <Button asChild variant='outline'>
              <Link href='/dashboard/course-creator/instructors'>
                <ArrowLeft className='size-4' />
                Back to instructors
              </Link>
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main className='mx-auto w-full max-w-[2200px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[2400px]'>
      <Button variant='ghost' size='sm' asChild className='text-muted-foreground -ml-2'>
        <Link href='/dashboard/course-creator/instructors'>
          <ArrowLeft className='size-4' />
          Back to instructors
        </Link>
      </Button>

      <header className='border-border/70 bg-card rounded-md border px-5 py-5 shadow-sm'>
        <div className='flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between'>
          <div className='flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center'>
            <Avatar className='size-16 shrink-0 rounded-md'>
              {avatarUrl ? <AvatarImage src={avatarUrl} alt='' /> : null}
              <AvatarFallback className='bg-primary/10 text-primary rounded-md text-xl font-semibold'>
                {instructorInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <h1 className='text-foreground truncate text-2xl font-semibold tracking-tight sm:text-3xl'>
                  {name}
                </h1>
                <StatusBadge status={user?.active ? 'active' : 'inactive'} />
                {instructor?.admin_verified ? (
                  <StatusBadge status='verified' label='Verified instructor' />
                ) : (
                  <StatusBadge status='pending' label='Verification pending' />
                )}
              </div>
              <p className='text-muted-foreground mt-1 max-w-4xl text-sm'>
                {instructor?.professional_headline ||
                  primarySkill?.skill_name ||
                  qualification?.field_of_study ||
                  'Instructor profile'}
              </p>
              <div className='mt-3 flex flex-wrap items-center gap-2'>
                <Badge variant='outline' className='rounded-md'>
                  <BriefcaseBusiness className='mr-1 size-3.5' />
                  {currentExperience?.organisation_name ?? '0'}
                </Badge>
                <Badge variant='secondary' className='rounded-md'>
                  <GraduationCap className='mr-1 size-3.5' />
                  {qualification?.qualification ?? '0'}
                </Badge>
                <Badge variant='outline' className='rounded-md'>
                  <Star className='mr-1 size-3.5' />
                  {primarySkill?.skill_name ?? '0'}
                </Badge>
              </div>
            </div>
          </div>
          <div className='flex flex-wrap gap-2'>
            {user?.email ? (
              <Button asChild variant='outline'>
                <a href={`mailto:${user?.email}`}>
                  <Mail className='size-4' />
                  Email
                </a>
              </Button>
            ) : null}
            {instructor?.website ? (
              <Button asChild variant='outline'>
                <a href={instructor.website} target='_blank' rel='noreferrer'>
                  <Globe2 className='size-4' />
                  Website
                </a>
              </Button>
            ) : null}
            {userUuid ? (
              <Button asChild variant='secondary'>
                <Link href={`/profile-user/${userUuid}?domain=instructor`}>
                  <UserRound className='size-4' />
                  Public profile
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-6'>
        <MetricTile
          label='Assigned classes'
          value={formatCount(classCount, '0')}
          hint={`${formatCount(activeClassCount, '0')} active`}
          icon={BookOpen}
          tone='info'
        />
        <MetricTile
          label='Students'
          value={formatCount(assignedStudentCount, '0')}
          hint='active enrolments'
          icon={Users}
          tone='success'
        />
        <MetricTile
          label='Rating'
          value={averageRating.toFixed(1)}
          hint={`${formatCount(reviewCount, '0')} reviews`}
          icon={Star}
          tone='warning'
        />
        <MetricTile
          label='Credentials'
          value={formatCount(education.length + memberships.length + documents.length, '0')}
          hint={`${formatCount(documents.length, '0')} documents`}
          icon={FileCheck}
          tone='success'
        />
        <MetricTile
          label='Sessions'
          value={`${formatCount(completedSessions, '0')}/${formatCount(scheduledSessions, '0')}`}
          hint='completed/scheduled'
          icon={CalendarDays}
          tone='neutral'
        />
        <MetricTile
          label='Amount owed'
          value={formatCurrency(payable?.amount_owed ?? 0, payable?.currency_code ?? 'KES')}
          hint={`${formatCount(payable?.outstanding_session_count, '0')} unpaid sessions`}
          icon={DollarSign}
          tone={payable?.amount_owed ? 'warning' : 'neutral'}
        />
      </div>

      <SectionPanel title='Bio' description='Professional background and teaching profile.'>
        <p className='text-muted-foreground max-w-6xl text-sm leading-6 whitespace-pre-line'>
          {instructor?.bio || '0'}
        </p>
      </SectionPanel>

      <Tabs value={tab} onValueChange={setTab} className='space-y-4'>
        <TabsList className={tabListClass}>
          <TabsTrigger value='overview' className={tabTriggerClass}>
            <ClipboardList className='size-4' />
            Overview
          </TabsTrigger>
          <TabsTrigger value='classes' className={tabTriggerClass}>
            <BookOpen className='size-4' />
            Classes
          </TabsTrigger>
          <TabsTrigger value='students' className={tabTriggerClass}>
            <Users className='size-4' />
            Students
          </TabsTrigger>
          <TabsTrigger value='credentials' className={tabTriggerClass}>
            <GraduationCap className='size-4' />
            Credentials
          </TabsTrigger>
          <TabsTrigger value='history' className={tabTriggerClass}>
            <BriefcaseBusiness className='size-4' />
            Work history
          </TabsTrigger>
          <TabsTrigger value='reviews' className={tabTriggerClass}>
            <Star className='size-4' />
            Reviews
          </TabsTrigger>
          <TabsTrigger value='documents' className={tabTriggerClass}>
            <FileText className='size-4' />
            Documents
          </TabsTrigger>
          <TabsTrigger value='payables' className={tabTriggerClass}>
            <DollarSign className='size-4' />
            Payables
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='mt-0'>
          <div className='grid gap-4 xl:grid-cols-2'>
            <SectionPanel
              title='Identity data'
              description='Bio data from the linked user account.'
            >
              <DetailGrid
                columns={3}
                items={[
                  { label: 'Full name', value: name },
                  { label: 'User no.', value: user?.user_no ?? '0' },
                  { label: 'Username', value: user?.username ?? '0' },
                  { label: 'Email', value: user?.email ?? '0' },
                  { label: 'Phone', value: user?.phone_number ?? '0' },
                  { label: 'Gender', value: formatEnumLabel(user?.gender) },
                  { label: 'Date of birth', value: formatDate(user?.dob) },
                  { label: 'Account status', value: user?.active ? 'Active' : 'Inactive' },
                  {
                    label: 'User UUID',
                    value: <span className='font-mono text-xs break-all'>{userUuid || '0'}</span>,
                  },
                ]}
              />
            </SectionPanel>

            <SectionPanel
              title='Employment details'
              description="Current employment from the instructor's work history."
            >
              <DetailGrid
                columns={3}
                items={[
                  { label: 'Employer', value: currentExperience?.organisation_name ?? '0' },
                  { label: 'Position', value: currentExperience?.position ?? '0' },
                  {
                    label: 'Experience level',
                    value: formatEnumLabel(currentExperience?.experience_level),
                  },
                  {
                    label: 'Years of experience',
                    value: formatCount(
                      currentExperience?.years_of_experience ?? currentExperience?.calculated_years,
                      '0'
                    ),
                  },
                  { label: 'Employment status', value: currentExperience ? 'Current' : '0' },
                  { label: 'Duration', value: currentExperience?.formatted_duration ?? '0' },
                  { label: 'Start date', value: formatDate(currentExperience?.start_date) },
                  { label: 'Recorded date', value: formatDate(currentExperience?.created_date) },
                  { label: 'End date', value: formatDate(currentExperience?.end_date) },
                ]}
              />
            </SectionPanel>

            <SectionPanel title='Professional profile' description='Instructor-owned profile data.'>
              <DetailGrid
                columns={3}
                items={[
                  {
                    label: 'Instructor UUID',
                    value: (
                      <span className='font-mono text-xs break-all'>{instructorUuid || '0'}</span>
                    ),
                  },
                  {
                    label: 'Headline',
                    value: instructor?.professional_headline ?? '0',
                  },
                  { label: 'Website', value: instructor?.website ?? '0' },
                  {
                    label: 'Admin verified',
                    value:
                      instructor?.admin_verified === true
                        ? 'Yes'
                        : instructor?.admin_verified === false
                          ? 'No'
                          : 'Pending',
                  },
                  {
                    label: 'Profile complete',
                    value: instructor?.is_profile_complete ? 'Yes' : 'No',
                  },
                  {
                    label: 'Location set',
                    value: instructor?.has_location_coordinates ? 'Yes' : 'No',
                  },
                  { label: 'Location', value: instructor?.location_name ?? '0' },
                  {
                    label: 'Coordinates',
                    value:
                      typeof instructor?.latitude === 'number' &&
                      typeof instructor?.longitude === 'number'
                        ? `${instructor.latitude}, ${instructor.longitude}`
                        : '0',
                  },
                  { label: 'Created', value: formatDateTime(instructor?.created_date) },
                ]}
              />
            </SectionPanel>

            <SectionPanel
              title='Contact channels'
              description='Primary ways to reach this instructor.'
            >
              <DetailGrid
                columns={2}
                items={[
                  {
                    label: (
                      <span className='inline-flex items-center gap-1'>
                        <Mail className='size-3.5' />
                        Email
                      </span>
                    ),
                    value: user?.email ?? '0',
                  },
                  {
                    label: (
                      <span className='inline-flex items-center gap-1'>
                        <Phone className='size-3.5' />
                        Phone
                      </span>
                    ),
                    value: user?.phone_number ?? '0',
                  },
                  {
                    label: (
                      <span className='inline-flex items-center gap-1'>
                        <Globe2 className='size-3.5' />
                        Website
                      </span>
                    ),
                    value: instructor?.website ?? '0',
                  },
                  {
                    label: (
                      <span className='inline-flex items-center gap-1'>
                        <MapPin className='size-3.5' />
                        Base location
                      </span>
                    ),
                    value: instructor?.location_name ?? instructor?.formatted_location ?? '0',
                  },
                ]}
              />
            </SectionPanel>
          </div>
        </TabsContent>

        <TabsContent value='classes' className='mt-0'>
          <SectionPanel
            title='Instructor classes'
            description='Classes assigned to this instructor.'
            actions={
              <Button size='sm' disabled title='Class assignment is unavailable in this view'>
                <BookOpen className='size-4' />
                Assign class
              </Button>
            }
          >
            {classesQuery.isLoading ? (
              <div className='space-y-2'>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className='h-12 w-full rounded-md' />
                ))}
              </div>
            ) : assignedClasses.length === 0 ? (
              <EmptyPanel
                icon={BookOpen}
                title='No classes assigned'
                description='Classes assigned to this instructor will appear here with schedules, capacity, and delivery progress.'
              />
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full min-w-[1040px] text-sm'>
                  <thead>
                    <tr className='border-border/70 border-b text-left'>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Class</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Format</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Location</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Schedule</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Capacity</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Sessions</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Pay</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedClasses.map(item => (
                      <tr key={item.uuid} className='border-border/60 border-b last:border-0'>
                        <td className='px-3 py-3'>
                          <p className='text-foreground font-medium'>{item.title}</p>
                          <p className='text-muted-foreground text-xs'>
                            {item.course_uuid ? `Course ${item.course_uuid}` : 'Standalone class'}
                          </p>
                        </td>
                        <td className='px-3 py-3'>
                          <Badge variant='outline' className='rounded-md'>
                            {formatEnumLabel(item.session_format)}
                          </Badge>
                        </td>
                        <td className='text-muted-foreground px-3 py-3'>
                          {item.location_name ?? formatEnumLabel(item.location_type)}
                        </td>
                        <td className='text-muted-foreground px-3 py-3'>
                          {formatDateTime(item.default_start_time)}
                          <span className='block'>{formatDateTime(item.default_end_time)}</span>
                        </td>
                        <td className='px-3 py-3'>{formatCount(item.max_participants, '0')}</td>
                        <td className='px-3 py-3'>
                          {formatCount(item.completed_session_count, '0')}/
                          {formatCount(item.scheduled_session_count, '0')}
                        </td>
                        <td className='px-3 py-3'>
                          {formatCurrency(item.instructor_pay ?? 0)}
                          <span className='text-muted-foreground block text-xs'>
                            {formatEnumLabel(item.rate_basis)}
                          </span>
                        </td>
                        <td className='px-3 py-3'>
                          <StatusBadge
                            status={item.is_active === true ? 'active' : 'inactive'}
                            label={item.is_active === true ? 'Active' : 'Inactive'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionPanel>
        </TabsContent>

        <TabsContent value='students' className='mt-0'>
          <SectionPanel
            title='Student coverage'
            description='Learner counts for this instructor’s classes. Unavailable counts are shown as zero.'
            actions={
              <>
                <Button
                  size='sm'
                  variant='outline'
                  disabled
                  title='Student rosters are unavailable in this view'
                >
                  <Users className='size-4' />
                  Open students
                </Button>
                <Button size='sm' disabled title='Student invitations are unavailable in this view'>
                  <Mail className='size-4' />
                  Invite students
                </Button>
              </>
            }
          >
            {classesQuery.isLoading ? (
              <div className='space-y-2'>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className='h-14 w-full rounded-md' />
                ))}
              </div>
            ) : assignedClasses.length === 0 ? (
              <EmptyPanel
                icon={Users}
                title='No assigned class roster'
                description='Students will appear here after this instructor is assigned to classes.'
              />
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full min-w-[1040px] text-sm'>
                  <thead>
                    <tr className='border-border/70 border-b text-left'>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Class</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>
                        Active students
                      </th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Capacity</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Fill rate</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Sessions</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Status</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedClasses.map(item => {
                      const enrolled = 0;
                      const capacity = toNumber(item.max_participants);
                      const fillRate = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;
                      return (
                        <tr key={item.uuid} className='border-border/60 border-b last:border-0'>
                          <td className='px-3 py-3'>
                            <p className='text-foreground font-medium'>{item.title}</p>
                            <p className='text-muted-foreground text-xs'>
                              {item.course_uuid ? `Course ${item.course_uuid}` : 'Standalone class'}
                            </p>
                          </td>
                          <td className='px-3 py-3'>{formatCount(enrolled, '0')}</td>
                          <td className='px-3 py-3'>{formatCount(item.max_participants, '0')}</td>
                          <td className='px-3 py-3'>
                            <div className='flex w-44 items-center gap-3'>
                              <div className='bg-muted h-2 flex-1 overflow-hidden rounded-full'>
                                <div
                                  className='bg-primary h-full rounded-full'
                                  style={{ width: `${Math.min(fillRate, 100)}%` }}
                                />
                              </div>
                              <span className='text-muted-foreground w-10 text-right text-xs'>
                                {fillRate}%
                              </span>
                            </div>
                          </td>
                          <td className='px-3 py-3'>
                            {formatCount(item.completed_session_count, '0')}/
                            {formatCount(item.scheduled_session_count, '0')}
                          </td>
                          <td className='px-3 py-3'>
                            <StatusBadge
                              status={item.is_active === true ? 'active' : 'inactive'}
                              label={item.is_active === true ? 'Active' : 'Inactive'}
                            />
                          </td>
                          <td className='px-3 py-3'>
                            <div className='flex flex-wrap gap-2'>
                              <Button
                                size='sm'
                                variant='outline'
                                disabled
                                title='Student rosters are unavailable in this view'
                              >
                                Roster
                              </Button>
                              {item.uuid ? (
                                <Button
                                  size='sm'
                                  variant='secondary'
                                  disabled
                                  title='Student invitations are unavailable in this view'
                                >
                                  Invite
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionPanel>
        </TabsContent>

        <TabsContent value='credentials' className='mt-0'>
          <div className='grid gap-4 xl:grid-cols-[0.85fr_1.15fr]'>
            <SectionPanel title='Skills' description='Listed professional and teaching skills.'>
              {skillsQuery.isLoading ? (
                <Skeleton className='h-20 w-full rounded-md' />
              ) : skills.length === 0 ? (
                <EmptyPanel
                  icon={Star}
                  title='No skills listed'
                  description='Skills added by the instructor will appear here.'
                />
              ) : (
                <div className='flex flex-wrap gap-2'>
                  {skills.map(skill => (
                    <Badge
                      key={skill.uuid ?? skill.skill_name}
                      variant='outline'
                      className='rounded-md px-2.5 py-1'
                    >
                      {skill.skill_name}
                      {skill.proficiency_level
                        ? ` - ${formatEnumLabel(skill.proficiency_level)}`
                        : ''}
                    </Badge>
                  ))}
                </div>
              )}
            </SectionPanel>

            <SectionPanel title='Education' description='Academic and professional qualifications.'>
              {educationQuery.isLoading ? (
                <div className='space-y-2'>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className='h-14 w-full rounded-md' />
                  ))}
                </div>
              ) : education.length === 0 ? (
                <EmptyPanel
                  icon={GraduationCap}
                  title='No education records'
                  description='Education credentials added by the instructor will appear here.'
                />
              ) : (
                <TimelineList
                  items={education}
                  render={item => (
                    <div>
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <p className='text-foreground font-medium'>{item.qualification}</p>
                        <StatusBadge
                          status={item.is_complete ? 'complete' : 'pending'}
                          label={item.is_complete ? 'Complete' : 'Incomplete'}
                        />
                      </div>
                      <p className='text-muted-foreground mt-1'>
                        {item.school_name}
                        {item.field_of_study ? ` - ${item.field_of_study}` : ''}
                      </p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {item.year_completed
                          ? `Completed ${item.year_completed}`
                          : 'Year not provided'}
                        {item.certificate_number ? ` - Certificate ${item.certificate_number}` : ''}
                      </p>
                    </div>
                  )}
                />
              )}
            </SectionPanel>

            <SectionPanel
              title='Professional memberships'
              description='Associations, registration bodies, and certification memberships.'
              className='xl:col-span-2'
            >
              {membershipsQuery.isLoading ? (
                <div className='space-y-2'>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className='h-14 w-full rounded-md' />
                  ))}
                </div>
              ) : memberships.length === 0 ? (
                <EmptyPanel
                  icon={BadgeCheck}
                  title='No memberships listed'
                  description='Memberships and professional bodies added by the instructor will appear here.'
                />
              ) : (
                <TimelineList
                  items={memberships}
                  render={item => (
                    <div>
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <p className='text-foreground font-medium'>{item.organisation_name}</p>
                        <StatusBadge
                          status={
                            item.membership_status ?? (item.is_active ? 'active' : 'inactive')
                          }
                        />
                      </div>
                      <p className='text-muted-foreground mt-1'>
                        {formatEnumLabel(item.organisation_type)}
                        {item.membership_number ? ` - ${item.membership_number}` : ''}
                      </p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {item.membership_period ??
                          item.formatted_duration ??
                          'Duration not provided'}
                      </p>
                    </div>
                  )}
                />
              )}
            </SectionPanel>
          </div>
        </TabsContent>

        <TabsContent value='history' className='mt-0'>
          <SectionPanel
            title='Work history'
            description='Roles and work experience connected to this profile.'
          >
            {experienceQuery.isLoading ? (
              <div className='space-y-2'>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className='h-16 w-full rounded-md' />
                ))}
              </div>
            ) : experience.length === 0 ? (
              <EmptyPanel
                icon={BriefcaseBusiness}
                title='No work history listed'
                description='Experience records added by the instructor will appear here.'
              />
            ) : (
              <TimelineList
                items={experience}
                render={item => (
                  <div>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <p className='text-foreground font-medium'>
                        {item.position} - {item.organisation_name}
                      </p>
                      {item.is_current_position ? (
                        <StatusBadge status='active' label='Current' />
                      ) : null}
                    </div>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {item.employment_period ??
                        item.formatted_duration ??
                        `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`}
                    </p>
                    {item.responsibilities ? (
                      <p className='text-muted-foreground mt-2 leading-6'>
                        {item.responsibilities}
                      </p>
                    ) : null}
                  </div>
                )}
              />
            )}
          </SectionPanel>
        </TabsContent>

        <TabsContent value='reviews' className='mt-0'>
          <div className='grid gap-4 xl:grid-cols-[0.65fr_1.35fr]'>
            <SectionPanel title='Rating summary' description='Student feedback aggregate.'>
              <DetailGrid
                columns={1}
                items={[
                  {
                    label: 'Average rating',
                    value: averageRating.toFixed(1),
                  },
                  { label: 'Review count', value: formatCount(reviewCount, '0') },
                  {
                    label: 'Summary UUID',
                    value: (
                      <span className='font-mono text-xs break-all'>
                        {rating?.instructor_uuid ?? instructorUuid}
                      </span>
                    ),
                  },
                ]}
              />
            </SectionPanel>

            <SectionPanel
              title='Student reviews'
              description='Individual submitted instructor reviews.'
            >
              {reviewsQuery.isLoading ? (
                <div className='space-y-2'>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className='h-16 w-full rounded-md' />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <EmptyPanel
                  icon={Star}
                  title='No student reviews'
                  description='Submitted student reviews will appear here once learners rate this instructor.'
                />
              ) : (
                <TimelineList
                  items={reviews}
                  render={item => (
                    <div>
                      <div className='flex flex-wrap items-center gap-2'>
                        <Star className='fill-warning text-warning size-4' />
                        <span className='text-foreground font-medium'>{item.rating}/5</span>
                        {item.headline ? <span>{item.headline}</span> : null}
                        {item.is_anonymous ? (
                          <Badge variant='outline' className='rounded-md'>
                            Anonymous
                          </Badge>
                        ) : null}
                      </div>
                      {item.comments ? (
                        <p className='text-muted-foreground mt-2 leading-6'>{item.comments}</p>
                      ) : null}
                      <p className='text-muted-foreground mt-2 text-xs'>
                        Submitted {formatDateTime(item.created_date)}
                      </p>
                    </div>
                  )}
                />
              )}
            </SectionPanel>
          </div>
        </TabsContent>

        <TabsContent value='documents' className='mt-0'>
          <SectionPanel title='Documents' description='Uploaded instructor verification documents.'>
            {documentsQuery.isLoading ? (
              <div className='space-y-2'>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className='h-14 w-full rounded-md' />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <EmptyPanel
                icon={FileText}
                title='No documents uploaded'
                description='Education, experience, and membership documents will appear here when uploaded.'
              />
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full min-w-[980px] text-sm'>
                  <thead>
                    <tr className='border-border/70 border-b text-left'>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Document</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Status</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Verification</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Uploaded</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Expiry</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map(item => (
                      <tr
                        key={item.uuid ?? item.original_filename}
                        className='border-border/60 border-b last:border-0'
                      >
                        <td className='px-3 py-3'>
                          <p className='text-foreground font-medium'>
                            {item.title || item.original_filename}
                          </p>
                          <p className='text-muted-foreground text-xs'>{item.original_filename}</p>
                        </td>
                        <td className='px-3 py-3'>
                          <StatusBadge status={item.status} />
                        </td>
                        <td className='px-3 py-3'>
                          <StatusBadge
                            status={
                              item.is_verified === true
                                ? 'verified'
                                : item.is_verified === false
                                  ? 'pending'
                                  : 'unknown'
                            }
                            label={
                              item.is_verified === true
                                ? 'Verified'
                                : item.is_verified === false
                                  ? 'Not verified'
                                  : 'Unknown'
                            }
                          />
                          {item.verified_by ? (
                            <p className='text-muted-foreground mt-1 text-xs'>
                              By {item.verified_by}
                            </p>
                          ) : null}
                        </td>
                        <td className='text-muted-foreground px-3 py-3'>
                          {formatDateTime(item.upload_date)}
                        </td>
                        <td className='text-muted-foreground px-3 py-3'>
                          {formatDate(item.expiry_date)}
                        </td>
                        <td className='text-muted-foreground px-3 py-3'>
                          {formatSize(item.file_size_bytes)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionPanel>
        </TabsContent>

        <TabsContent value='payables' className='mt-0'>
          <SectionPanel
            title='Instructor payables'
            description='Payable totals for this instructor. Unavailable totals are shown as zero.'
          >
            {instructorQuery.isLoading ? (
              <Skeleton className='h-32 w-full rounded-md' />
            ) : !payable ? (
              <EmptyPanel
                icon={DollarSign}
                title='No payable ledger yet'
                description='Delivered and settled instructor obligations will appear here after sessions are completed.'
              />
            ) : (
              <DetailGrid
                columns={3}
                items={[
                  {
                    label: 'Outstanding',
                    value: formatCurrency(payable.amount_owed ?? 0, payable.currency_code ?? 'KES'),
                  },
                  {
                    label: 'Settled',
                    value: formatCurrency(
                      payable.amount_settled ?? 0,
                      payable.currency_code ?? 'KES'
                    ),
                  },
                  {
                    label: 'Lifetime accrued',
                    value: formatCurrency(
                      payable.amount_accrued ?? 0,
                      payable.currency_code ?? 'KES'
                    ),
                  },
                  { label: 'Class count', value: formatCount(payable.class_count, '0') },
                  { label: 'Session count', value: formatCount(payable.session_count, '0') },
                  {
                    label: 'Outstanding sessions',
                    value: formatCount(payable.outstanding_session_count, '0'),
                  },
                  { label: 'Currency', value: payable.currency_code ?? 'KES' },
                  {
                    label: 'Instructor UUID',
                    value: (
                      <span className='font-mono text-xs break-all'>
                        {payable.instructor_uuid ?? instructorUuid}
                      </span>
                    ),
                  },
                ]}
              />
            )}
          </SectionPanel>
        </TabsContent>
      </Tabs>
    </main>
  );
}

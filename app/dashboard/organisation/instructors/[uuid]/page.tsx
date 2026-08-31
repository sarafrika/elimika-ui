'use client';

import { useQuery } from '@tanstack/react-query';
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

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity, extractList, extractPage } from '@/lib/api-helpers';
import { formatCurrency } from '@/lib/format-currency';
import { formatCount, toNumber } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/app/dashboard/admin/_components/ui';
import { statusToneClass, type StatusTone } from '@/app/dashboard/admin/_components/ui';
import type {
  ClassDefinition,
  ClassEnrolmentCountDto,
  Instructor,
  InstructorDocument,
  InstructorEducation,
  InstructorExperience,
  InstructorProfessionalMembership,
  InstructorReview,
  InstructorSkill,
  OrganisationInstructorPayable,
  OrgInstructorSummary,
  User,
} from '@/services/client';
import {
  getClassDefinitionsForOrganisationOptions,
  getClassEnrolmentCountsOptions,
  getInstructorByUuidOptions,
  getInstructorDocumentsOptions,
  getInstructorEducationOptions,
  getInstructorExperienceOptions,
  getInstructorMembershipsOptions,
  getInstructorPayablesForOrganisationOptions,
  getInstructorRatingSummaryOptions,
  getInstructorReviewsOptions,
  getInstructorSkillsOptions,
  getOrganisationInstructorSummariesOptions,
  getUserByUuidOptions,
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
  if (!value) return '-';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, letter => letter.toUpperCase());
}

function formatDate(value?: Date | string | null) {
  if (!value) return '-';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return '-';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
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
  if (!Number.isFinite(bytes) || bytes <= 0) return '-';
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

function displayName(summary?: OrgInstructorSummary, instructor?: Instructor | null, user?: User | null) {
  return (
    summary?.full_name?.trim() ||
    instructor?.full_name?.trim() ||
    user?.full_name?.trim() ||
    `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() ||
    summary?.email ||
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
        <div
          key={index}
          className='border-border/60 bg-muted/20 rounded-md border px-3 py-2.5'
        >
          <p className='text-muted-foreground text-xs uppercase tracking-wide'>{item.label}</p>
          <div className='text-foreground mt-1 min-w-0 text-sm font-medium'>{item.value ?? '-'}</div>
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

function TimelineList<T>({
  items,
  render,
}: {
  items: T[];
  render: (item: T) => ReactNode;
}) {
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

export default function OrganisationInstructorDetailPage() {
  const params = useParams<{ uuid: string }>();
  const routeUuid = decodeURIComponent(params?.uuid ?? '');
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const [tab, setTab] = useState('overview');

  const summariesQuery = useQuery({
    ...getOrganisationInstructorSummariesOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const summaries = extractList<OrgInstructorSummary>(summariesQuery.data);
  const summary = useMemo(
    () =>
      summaries.find(
        item =>
          item.instructor_uuid === routeUuid || item.user_uuid === routeUuid || item.email === routeUuid
      ),
    [routeUuid, summaries]
  );
  const instructorUuid = summary?.instructor_uuid ?? '';
  const userUuidFromSummary = summary?.user_uuid ?? '';

  const instructorQuery = useQuery({
    ...getInstructorByUuidOptions({ path: { uuid: instructorUuid } }),
    enabled: Boolean(instructorUuid),
    retry: false,
  });
  const instructor = extractEntity<Instructor>(instructorQuery.data);
  const userUuid = userUuidFromSummary || instructor?.user_uuid || '';

  const userQuery = useQuery({
    ...getUserByUuidOptions({ path: { uuid: userUuid } }),
    enabled: Boolean(userUuid),
    retry: false,
  });
  const user = extractEntity<User>(userQuery.data);
  const avatarUrl = toAuthenticatedMediaUrl(user?.profile_image_url);

  const pathOptions = { path: { instructorUuid } };
  const ratingQuery = useQuery({
    ...getInstructorRatingSummaryOptions(pathOptions),
    enabled: Boolean(instructorUuid),
    retry: false,
  });
  const skillsQuery = useQuery({
    ...getInstructorSkillsOptions({
      ...pathOptions,
      query: { pageable: { page: 0, size: 80 } },
    }),
    enabled: Boolean(instructorUuid),
    retry: false,
  });
  const educationQuery = useQuery({
    ...getInstructorEducationOptions(pathOptions),
    enabled: Boolean(instructorUuid),
    retry: false,
  });
  const membershipsQuery = useQuery({
    ...getInstructorMembershipsOptions({
      ...pathOptions,
      query: { pageable: { page: 0, size: 80 } },
    }),
    enabled: Boolean(instructorUuid),
    retry: false,
  });
  const experienceQuery = useQuery({
    ...getInstructorExperienceOptions({
      ...pathOptions,
      query: { pageable: { page: 0, size: 80 } },
    }),
    enabled: Boolean(instructorUuid),
    retry: false,
  });
  const documentsQuery = useQuery({
    ...getInstructorDocumentsOptions(pathOptions),
    enabled: Boolean(instructorUuid),
    retry: false,
  });
  const reviewsQuery = useQuery({
    ...getInstructorReviewsOptions(pathOptions),
    enabled: Boolean(instructorUuid),
    retry: false,
  });
  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
    retry: false,
  });
  const enrolmentCountsQuery = useQuery({
    ...getClassEnrolmentCountsOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
    retry: false,
  });
  const payablesQuery = useQuery({
    ...getInstructorPayablesForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
    retry: false,
  });

  const skills = extractPage<InstructorSkill>(skillsQuery.data).items;
  const education = extractList<InstructorEducation>(educationQuery.data);
  const memberships = extractPage<InstructorProfessionalMembership>(membershipsQuery.data).items;
  const experience = extractPage<InstructorExperience>(experienceQuery.data).items;
  const documents = extractList<InstructorDocument>(documentsQuery.data);
  const reviews = extractList<InstructorReview>(reviewsQuery.data);
  const rating = ratingQuery.data?.data;
  const enrolmentCounts = extractList<ClassEnrolmentCountDto>(enrolmentCountsQuery.data);
  const enrolledByClass = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of enrolmentCounts) {
      if (item.class_definition_uuid) {
        map.set(item.class_definition_uuid, toNumber(item.enrolled));
      }
    }
    return map;
  }, [enrolmentCounts]);
  const classDefinitions = useMemo(
    () =>
      (classesQuery.data?.data ?? [])
        .map(response => response.class_definition)
        .filter(isClassDefinition),
    [classesQuery.data]
  );
  const assignedClasses = useMemo(
    () => classDefinitions.filter(item => item.default_instructor_uuid === instructorUuid),
    [classDefinitions, instructorUuid]
  );
  const payables = extractList<OrganisationInstructorPayable>(payablesQuery.data);
  const payable = payables.find(item => item.instructor_uuid === instructorUuid);

  const affiliation = user?.organisation_affiliations?.find(
    item => item.organisation_uuid === organisationUuid
  );
  const name = displayName(summary, instructor, user);
  const averageRating = rating?.average_rating ?? summary?.average_rating ?? null;
  const reviewCount = rating?.review_count ?? summary?.review_count ?? reviews.length;
  const classCount = assignedClasses.length || toNumber(summary?.class_count);
  const activeClassCount = assignedClasses.filter(item => item.is_active !== false).length;
  const assignedStudentCount = assignedClasses.reduce(
    (total, item) => total + (item.uuid ? (enrolledByClass.get(item.uuid) ?? 0) : 0),
    0
  );
  const completedSessions = assignedClasses.reduce(
    (total, item) => total + toNumber(item.completed_session_count),
    0
  );
  const scheduledSessions = assignedClasses.reduce(
    (total, item) => total + toNumber(item.scheduled_session_count),
    0
  );
  const pageLoading = summariesQuery.isLoading || (Boolean(instructorUuid) && instructorQuery.isLoading);
  const notFound = summariesQuery.isSuccess && !summary;

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

  if (notFound) {
    return (
      <main className='mx-auto w-full max-w-[2200px] px-3 py-8 sm:px-5 lg:px-6 2xl:max-w-[2400px]'>
        <EmptyState
          icon={UserRound}
          title='Instructor not found in this organisation'
          description='The selected profile is not linked to the active organisation.'
          action={
            <Button asChild variant='outline'>
              <Link href='/dashboard/organisation/instructors'>
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
        <Link href='/dashboard/organisation/instructors'>
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
                  summary?.top_skill ||
                  summary?.field_of_study ||
                  'Instructor profile'}
              </p>
              <div className='mt-3 flex flex-wrap items-center gap-2'>
                {organisation?.name ? (
                  <Badge variant='outline' className='rounded-md'>
                    <BriefcaseBusiness className='mr-1 size-3.5' />
                    {organisation.name}
                  </Badge>
                ) : null}
                {summary?.highest_qualification ? (
                  <Badge variant='secondary' className='rounded-md'>
                    <GraduationCap className='mr-1 size-3.5' />
                    {summary.highest_qualification}
                  </Badge>
                ) : null}
                {summary?.top_skill ? (
                  <Badge variant='outline' className='rounded-md'>
                    <Star className='mr-1 size-3.5' />
                    {summary.top_skill}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
          <div className='flex flex-wrap gap-2'>
            {user?.email || summary?.email ? (
              <Button asChild variant='outline'>
                <a href={`mailto:${user?.email ?? summary?.email}`}>
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
          value={typeof averageRating === 'number' ? averageRating.toFixed(1) : '-'}
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

      {instructor?.bio ? (
        <SectionPanel title='Bio' description='Professional background and teaching profile.'>
          <p className='text-muted-foreground max-w-6xl whitespace-pre-line text-sm leading-6'>
            {instructor.bio}
          </p>
        </SectionPanel>
      ) : null}

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
            <SectionPanel title='Identity data' description='Bio data from the linked user account.'>
              <DetailGrid
                columns={3}
                items={[
                  { label: 'Full name', value: name },
                  { label: 'User no.', value: user?.user_no ?? '-' },
                  { label: 'Username', value: user?.username ?? '-' },
                  { label: 'Email', value: user?.email ?? summary?.email ?? '-' },
                  { label: 'Phone', value: user?.phone_number ?? '-' },
                  { label: 'Gender', value: formatEnumLabel(user?.gender) },
                  { label: 'Date of birth', value: formatDate(user?.dob) },
                  { label: 'Account status', value: user?.active ? 'Active' : 'Inactive' },
                  {
                    label: 'User UUID',
                    value: <span className='font-mono text-xs break-all'>{userUuid || '-'}</span>,
                  },
                ]}
              />
            </SectionPanel>

            <SectionPanel
              title='Employer relationship'
              description='Organisation-scoped employment and access details.'
            >
              <DetailGrid
                columns={3}
                items={[
                  { label: 'Employer', value: organisation?.name ?? '-' },
                  {
                    label: 'Organisation status',
                    value: organisation?.active ? 'Active' : 'Inactive',
                  },
                  {
                    label: 'Organisation verified',
                    value: organisation?.admin_verified ? 'Yes' : 'No',
                  },
                  {
                    label: 'Role in organisation',
                    value: formatEnumLabel(affiliation?.domain_in_organisation ?? 'instructor'),
                  },
                  {
                    label: 'Affiliation status',
                    value: affiliation?.active === false ? 'Inactive' : 'Active',
                  },
                  { label: 'Branch', value: affiliation?.branch_name ?? '-' },
                  { label: 'Start date', value: formatDate(affiliation?.start_date) },
                  { label: 'Affiliated date', value: formatDate(affiliation?.affiliated_date) },
                  { label: 'End date', value: formatDate(affiliation?.end_date) },
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
                      <span className='font-mono text-xs break-all'>{instructorUuid || '-'}</span>
                    ),
                  },
                  {
                    label: 'Headline',
                    value: instructor?.professional_headline ?? '-',
                  },
                  { label: 'Website', value: instructor?.website ?? '-' },
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
                  { label: 'Location', value: instructor?.location_name ?? '-' },
                  {
                    label: 'Coordinates',
                    value:
                      typeof instructor?.latitude === 'number' &&
                      typeof instructor?.longitude === 'number'
                        ? `${instructor.latitude}, ${instructor.longitude}`
                        : '-',
                  },
                  { label: 'Created', value: formatDateTime(instructor?.created_date) },
                ]}
              />
            </SectionPanel>

            <SectionPanel title='Contact channels' description='Primary ways to reach this instructor.'>
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
                    value: user?.email ?? summary?.email ?? '-',
                  },
                  {
                    label: (
                      <span className='inline-flex items-center gap-1'>
                        <Phone className='size-3.5' />
                        Phone
                      </span>
                    ),
                    value: user?.phone_number ?? '-',
                  },
                  {
                    label: (
                      <span className='inline-flex items-center gap-1'>
                        <Globe2 className='size-3.5' />
                        Website
                      </span>
                    ),
                    value: instructor?.website ?? '-',
                  },
                  {
                    label: (
                      <span className='inline-flex items-center gap-1'>
                        <MapPin className='size-3.5' />
                        Base location
                      </span>
                    ),
                    value:
                      instructor?.location_name ??
                      instructor?.formatted_location ??
                      organisation?.location ??
                      '-',
                  },
                ]}
              />
            </SectionPanel>
          </div>
        </TabsContent>

        <TabsContent value='classes' className='mt-0'>
          <SectionPanel
            title='Organisation classes'
            description='Classes in this organisation where the instructor is the default instructor.'
            actions={
              <Button asChild size='sm'>
                <Link
                  href={`/dashboard/organisation/classes/new?instructorUuid=${encodeURIComponent(
                    instructorUuid
                  )}`}
                >
                  <BookOpen className='size-4' />
                  Assign class
                </Link>
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
                title='No organisation classes assigned'
                description='Assign this instructor to a class to see schedules, capacity, and delivery progress here.'
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
                            status={item.is_active === false ? 'inactive' : 'active'}
                            label={item.is_active === false ? 'Inactive' : 'Active'}
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
            description='Active learner counts for classes assigned to this instructor.'
            actions={
              <>
                <Button asChild size='sm' variant='outline'>
                  <Link href='/dashboard/organisation/students'>
                    <Users className='size-4' />
                    Open students
                  </Link>
                </Button>
                <Button asChild size='sm'>
                  <Link href='/dashboard/organisation/invite-students'>
                    <Mail className='size-4' />
                    Invite students
                  </Link>
                </Button>
              </>
            }
          >
            {classesQuery.isLoading || enrolmentCountsQuery.isLoading ? (
              <div className='space-y-2'>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className='h-14 w-full rounded-md' />
                ))}
              </div>
            ) : assignedClasses.length === 0 ? (
              <EmptyPanel
                icon={Users}
                title='No assigned class roster'
                description='Students will appear here after this instructor is assigned to organisation classes.'
              />
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full min-w-[1040px] text-sm'>
                  <thead>
                    <tr className='border-border/70 border-b text-left'>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Class</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Active students</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Capacity</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Fill rate</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Sessions</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Status</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedClasses.map(item => {
                      const enrolled = item.uuid ? (enrolledByClass.get(item.uuid) ?? 0) : 0;
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
                              status={item.is_active === false ? 'inactive' : 'active'}
                              label={item.is_active === false ? 'Inactive' : 'Active'}
                            />
                          </td>
                          <td className='px-3 py-3'>
                            <div className='flex flex-wrap gap-2'>
                              <Button asChild size='sm' variant='outline'>
                                <Link href='/dashboard/organisation/students'>Roster</Link>
                              </Button>
                              {item.uuid ? (
                                <Button asChild size='sm' variant='secondary'>
                                  <Link
                                    href={`/dashboard/organisation/invite-students?classUuid=${encodeURIComponent(
                                      item.uuid
                                    )}`}
                                  >
                                    Invite
                                  </Link>
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
                        {item.year_completed ? `Completed ${item.year_completed}` : 'Year not provided'}
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
                          status={item.membership_status ?? (item.is_active ? 'active' : 'inactive')}
                        />
                      </div>
                      <p className='text-muted-foreground mt-1'>
                        {formatEnumLabel(item.organisation_type)}
                        {item.membership_number ? ` - ${item.membership_number}` : ''}
                      </p>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {item.membership_period ?? item.formatted_duration ?? 'Duration not provided'}
                      </p>
                    </div>
                  )}
                />
              )}
            </SectionPanel>
          </div>
        </TabsContent>

        <TabsContent value='history' className='mt-0'>
          <SectionPanel title='Work history' description='Roles and work experience connected to this profile.'>
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
                      <p className='text-muted-foreground mt-2 leading-6'>{item.responsibilities}</p>
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
                    value: typeof averageRating === 'number' ? averageRating.toFixed(1) : '-',
                  },
                  { label: 'Review count', value: formatCount(reviewCount, '0') },
                  {
                    label: 'Summary UUID',
                    value: (
                      <span className='font-mono text-xs break-all'>{rating?.instructor_uuid ?? instructorUuid}</span>
                    ),
                  },
                ]}
              />
            </SectionPanel>

            <SectionPanel title='Student reviews' description='Individual submitted instructor reviews.'>
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
            description='Organisation ledger aggregate for delivered sessions owed to this instructor.'
          >
            {payablesQuery.isLoading ? (
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
                    value: formatCurrency(payable.amount_settled ?? 0, payable.currency_code ?? 'KES'),
                  },
                  {
                    label: 'Lifetime accrued',
                    value: formatCurrency(payable.amount_accrued ?? 0, payable.currency_code ?? 'KES'),
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

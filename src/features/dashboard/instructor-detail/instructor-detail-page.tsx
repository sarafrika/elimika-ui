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
import { useMemo } from 'react';
import {
  EntityHeaderCard,
  type SectionTab,
  SectionTabPanel,
  SectionTabs,
  StatusBadge,
  type StatusTone,
  statusToneClass,
  surfaceTheme,
  useSectionTab,
} from '@/components/data-display';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganisation } from '@/context/organisation-context';
import { useCoursesByIds } from '@/hooks/use-batched-lookups';
import { extractEntity, extractList, extractPage } from '@/lib/api-helpers';
import { formatCurrency } from '@/lib/format-currency';
import { formatCount, toNumber } from '@/lib/metrics';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
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
  getClassDefinitionsForInstructorOptions,
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
import { stripHtml } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

import { InstructorStudentsPanel } from './instructor-students-panel';

/**
 * Which dashboard is looking at the instructor. An organisation manager sees the
 * instructor through the organisation (its classes, enrolments, ledger and the
 * affiliation); a course creator sees the instructor's own classes only.
 */
export type InstructorDetailRole = 'organisation' | 'course-creator';

type InstructorTab =
  | 'overview'
  | 'classes'
  | 'students'
  | 'credentials'
  | 'history'
  | 'reviews'
  | 'documents'
  | 'payables';

const ORGANISATION_TABS: readonly InstructorTab[] = [
  'overview',
  'classes',
  'students',
  'credentials',
  'history',
  'reviews',
  'documents',
  'payables',
];
const COURSE_CREATOR_TABS: readonly InstructorTab[] = [
  'classes',
  'credentials',
  'history',
  'reviews',
  'payables',
];

const TAB_META: Record<InstructorTab, { label: string; icon: SectionTab['icon'] }> = {
  overview: { label: 'Overview', icon: ClipboardList },
  classes: { label: 'Classes', icon: BookOpen },
  students: { label: 'Students', icon: Users },
  credentials: { label: 'Credentials', icon: GraduationCap },
  history: { label: 'Work history', icon: BriefcaseBusiness },
  reviews: { label: 'Reviews', icon: Star },
  documents: { label: 'Documents', icon: FileText },
  payables: { label: 'Payables', icon: DollarSign },
};

interface RoleConfig {
  tabs: readonly InstructorTab[];
  defaultTab: InstructorTab;
  backHref: string;
  classesTitle: string;
  classesDescription: string;
  classesEmptyTitle: string;
  classesEmptyDescription: string;
  /** How a class with no `is_active` flag reads: the organisation list treats it as active. */
  unknownClassIsActive: boolean;
  payablesDescription: string;
}

const ROLE_CONFIG: Record<InstructorDetailRole, RoleConfig> = {
  organisation: {
    tabs: ORGANISATION_TABS,
    defaultTab: 'overview',
    backHref: '/dashboard/organisation/instructors',
    classesTitle: 'Organisation classes',
    classesDescription:
      'Classes in this organisation where the instructor is the default instructor.',
    classesEmptyTitle: 'No organisation classes assigned',
    classesEmptyDescription:
      'Assign this instructor to a class to see schedules, capacity, and delivery progress here.',
    unknownClassIsActive: true,
    payablesDescription:
      'Organisation ledger aggregate for delivered sessions owed to this instructor.',
  },
  'course-creator': {
    tabs: COURSE_CREATOR_TABS,
    defaultTab: 'classes',
    backHref: '/dashboard/course-creator/instructors',
    classesTitle: 'Instructor classes',
    classesDescription: 'Classes assigned to this instructor.',
    classesEmptyTitle: 'No classes assigned',
    classesEmptyDescription:
      'Classes assigned to this instructor will appear here with schedules, capacity, and delivery progress.',
    unknownClassIsActive: false,
    payablesDescription:
      'Payable totals for this instructor. Unavailable totals are shown as zero.',
  },
};

/** A course creator has no ledger view of the instructor, so the totals read as zero. */
const EMPTY_PAYABLE = {
  amount_owed: 0,
  amount_settled: 0,
  amount_accrued: 0,
  class_count: 0,
  session_count: 0,
  outstanding_session_count: 0,
  currency_code: 'KES',
};

const PAGEABLE = { pageable: { page: 0, size: 80 } };

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

function displayName(
  summary?: OrgInstructorSummary,
  instructor?: Instructor | null,
  user?: User | null
) {
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

/** Drops a HeyAPI `{ error }` envelope so the extractors read it as empty. */
function withoutError<T>(data: T | undefined): T | undefined {
  if (data && typeof data === 'object' && 'error' in data && data.error) return undefined;
  return data;
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
          className='border-border/60 bg-muted/20 min-w-0 rounded-md border px-3 py-2.5'
        >
          <p className='text-muted-foreground text-xs tracking-wide uppercase'>{item.label}</p>
          <div className='text-foreground mt-1 max-w-full min-w-0 text-sm font-medium break-words'>
            {item.value ?? '-'}
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

function PageSkeleton() {
  return (
    <main className={cn(surfaceTheme.pageWide, 'space-y-6 py-4')}>
      <Skeleton className='h-8 w-48 rounded-md' />
      <Skeleton className='h-36 w-full rounded-md' />
      <div className={surfaceTheme.statGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className='h-[88px] rounded-md' />
        ))}
      </div>
      <Skeleton className='h-80 w-full rounded-md' />
    </main>
  );
}

/**
 * One instructor, seen from the organisation or the course-creator dashboard. Both routes
 * render this page; `role` decides the data source, the tabs and the role-only actions.
 */
export function InstructorDetailPage({ role }: { role: InstructorDetailRole }) {
  const config = ROLE_CONFIG[role];
  const isOrganisation = role === 'organisation';
  const params = useParams<{ uuid: string }>();
  const routeUuid = decodeURIComponent(params?.uuid ?? '');
  const organisation = useOrganisation();
  const organisationUuid = isOrganisation ? (organisation?.uuid ?? '') : '';
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(config.tabs, config.defaultTab);

  // The organisation resolves the route id (instructor, user or email) through its roster.
  const summariesQuery = useQuery({
    ...getOrganisationInstructorSummariesOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const summaries = extractList<OrgInstructorSummary>(summariesQuery.data);
  const summary = useMemo(
    () =>
      summaries.find(
        item =>
          item.instructor_uuid === routeUuid ||
          item.user_uuid === routeUuid ||
          item.email === routeUuid
      ),
    [routeUuid, summaries]
  );
  const lookupUuid = isOrganisation ? (summary?.instructor_uuid ?? '') : routeUuid;

  const instructorQuery = useQuery({
    ...getInstructorByUuidOptions({ path: { uuid: lookupUuid } }),
    enabled: Boolean(lookupUuid),
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const instructor = extractEntity<Instructor>(withoutError(instructorQuery.data));
  const instructorUuid = isOrganisation ? lookupUuid : (instructor?.uuid ?? '');
  const userUuid = summary?.user_uuid || instructor?.user_uuid || '';

  const userQuery = useQuery({
    ...getUserByUuidOptions({ path: { uuid: userUuid } }),
    enabled: Boolean(userUuid),
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const user = extractEntity<User>(withoutError(userQuery.data));
  const avatarUrl = toAuthenticatedMediaUrl(user?.profile_image_url);

  const pathOptions = { path: { instructorUuid } };
  const hasInstructor = Boolean(instructorUuid);
  const ratingQuery = useQuery({
    ...getInstructorRatingSummaryOptions(pathOptions),
    enabled: hasInstructor,
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const skillsQuery = useQuery({
    ...getInstructorSkillsOptions({ ...pathOptions, query: PAGEABLE }),
    enabled: hasInstructor,
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const educationQuery = useQuery({
    ...getInstructorEducationOptions(pathOptions),
    enabled: hasInstructor,
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const membershipsQuery = useQuery({
    ...getInstructorMembershipsOptions({ ...pathOptions, query: PAGEABLE }),
    enabled: hasInstructor,
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const experienceQuery = useQuery({
    ...getInstructorExperienceOptions({ ...pathOptions, query: PAGEABLE }),
    enabled: hasInstructor,
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const documentsQuery = useQuery({
    ...getInstructorDocumentsOptions(pathOptions),
    enabled: hasInstructor,
    staleTime: STALE_TIMES.entity,
    retry: false,
  });
  const reviewsQuery = useQuery({
    ...getInstructorReviewsOptions(pathOptions),
    enabled: hasInstructor,
    staleTime: STALE_TIMES.entity,
    retry: false,
  });

  // Classes: the organisation's own classes led by this instructor, or every class the
  // instructor teaches when a course creator is looking.
  const organisationClassesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
    retry: false,
  });
  const instructorClassesQuery = useQuery({
    ...getClassDefinitionsForInstructorOptions({
      ...pathOptions,
      query: { activeOnly: false },
    }),
    enabled: !isOrganisation && hasInstructor,
    staleTime: STALE_TIMES.live,
    retry: false,
  });
  const classesQuery = isOrganisation ? organisationClassesQuery : instructorClassesQuery;
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

  const skills = extractPage<InstructorSkill>(withoutError(skillsQuery.data)).items;
  const education = extractList<InstructorEducation>(withoutError(educationQuery.data));
  const memberships = extractPage<InstructorProfessionalMembership>(
    withoutError(membershipsQuery.data)
  ).items;
  const experience = extractPage<InstructorExperience>(withoutError(experienceQuery.data)).items;
  const documents = extractList<InstructorDocument>(withoutError(documentsQuery.data));
  const reviews = extractList<InstructorReview>(withoutError(reviewsQuery.data));
  const rating = withoutError(ratingQuery.data)?.data;

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

  const classesData = withoutError(classesQuery.data);
  const assignedClasses = useMemo(() => {
    const definitions = (classesData?.data ?? [])
      .map(response => response.class_definition)
      .filter(isClassDefinition);
    return isOrganisation
      ? definitions.filter(item => item.default_instructor_uuid === instructorUuid)
      : definitions;
  }, [classesData, isOrganisation, instructorUuid]);
  const courseUuids = useMemo(
    () => assignedClasses.flatMap(item => (item.course_uuid ? [item.course_uuid] : [])),
    [assignedClasses]
  );
  const { courseMap, isLoading: coursesLoading } = useCoursesByIds(courseUuids);

  const payables = extractList<OrganisationInstructorPayable>(payablesQuery.data);
  const payable = isOrganisation
    ? payables.find(item => item.instructor_uuid === instructorUuid)
    : { ...EMPTY_PAYABLE, instructor_uuid: instructorUuid };

  const affiliation = user?.organisation_affiliations?.find(
    item => item.organisation_uuid === organisationUuid
  );
  const currentExperience = experience.find(item => item.is_current_position);
  const qualification = education.find(item => item.is_complete) ?? education[0];
  const primarySkill = skills[0];
  const name = displayName(summary, instructor, user);
  const headline =
    instructor?.professional_headline ||
    summary?.top_skill ||
    primarySkill?.skill_name ||
    summary?.field_of_study ||
    qualification?.field_of_study ||
    'Instructor profile';
  const employerName = isOrganisation ? organisation?.name : currentExperience?.organisation_name;
  const qualificationName = summary?.highest_qualification ?? qualification?.qualification;
  const topSkill = summary?.top_skill ?? primarySkill?.skill_name;
  const bio = stripHtml(instructor?.bio);

  const ratingValue = rating?.average_rating ?? summary?.average_rating;
  const averageRating = typeof ratingValue === 'number' ? ratingValue : null;
  const reviewCount = rating?.review_count ?? summary?.review_count ?? reviews.length;
  const isClassActive = (item: ClassDefinition) =>
    config.unknownClassIsActive ? item.is_active !== false : item.is_active === true;
  const classCount = assignedClasses.length || toNumber(summary?.class_count);
  const activeClassCount = assignedClasses.filter(isClassActive).length;
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

  const pageLoading = isOrganisation
    ? summariesQuery.isLoading || (Boolean(lookupUuid) && instructorQuery.isLoading)
    : instructorQuery.isLoading;
  const notFound = isOrganisation
    ? summariesQuery.isSuccess && !summary
    : !routeUuid || instructorQuery.isError || (instructorQuery.isSuccess && !instructor?.uuid);

  if (pageLoading) return <PageSkeleton />;

  if (notFound) {
    return (
      <main className={cn(surfaceTheme.pageWide, 'py-8')}>
        <EmptyState
          icon={UserRound}
          title={
            isOrganisation
              ? 'Instructor not found in this organisation'
              : instructorQuery.isError
                ? 'Unable to load instructor'
                : 'Instructor not found'
          }
          description={
            isOrganisation
              ? 'The selected profile is not linked to the active organisation.'
              : 'The selected instructor profile could not be loaded.'
          }
          action={
            <Button asChild variant='outline'>
              <Link href={config.backHref}>
                <ArrowLeft className='size-4' />
                Back to instructors
              </Link>
            </Button>
          }
        />
      </main>
    );
  }

  const tabCounts: Partial<Record<InstructorTab, number | null>> = {
    classes: classesQuery.isLoading ? null : assignedClasses.length,
    reviews: reviewsQuery.isLoading ? null : reviews.length,
    documents: documentsQuery.isLoading ? null : documents.length,
  };
  const tabs: SectionTab<InstructorTab>[] = config.tabs.map(id => ({
    id,
    ...TAB_META[id],
    count: tabCounts[id],
  }));
  const email = user?.email ?? summary?.email;

  return (
    <main className={cn(surfaceTheme.pageWide, 'space-y-6 py-4')}>
      <Button variant='ghost' size='sm' asChild className='text-muted-foreground -ml-2'>
        <Link href={config.backHref}>
          <ArrowLeft className='size-4' />
          Back to instructors
        </Link>
      </Button>

      <EntityHeaderCard
        title={name}
        eyebrow='Instructor'
        initials={instructorInitials(name)}
        imageUrl={avatarUrl}
        badges={
          <>
            <StatusBadge status={user?.active ? 'active' : 'inactive'} />
            {instructor?.admin_verified ? (
              <StatusBadge status='verified' label='Verified instructor' />
            ) : (
              <StatusBadge status='pending' label='Verification pending' />
            )}
          </>
        }
        description={headline}
        context={
          employerName || qualificationName || topSkill ? (
            <div className='flex flex-wrap items-center gap-2'>
              {employerName ? (
                <Badge variant='outline' className='rounded-md'>
                  <BriefcaseBusiness className='mr-1 size-3.5' />
                  {employerName}
                </Badge>
              ) : null}
              {qualificationName ? (
                <Badge variant='secondary' className='rounded-md'>
                  <GraduationCap className='mr-1 size-3.5' />
                  {qualificationName}
                </Badge>
              ) : null}
              {topSkill ? (
                <Badge variant='outline' className='rounded-md'>
                  <Star className='mr-1 size-3.5' />
                  {topSkill}
                </Badge>
              ) : null}
            </div>
          ) : null
        }
        actions={
          <>
            {email ? (
              <Button asChild variant='outline'>
                <a href={`mailto:${email}`}>
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
          </>
        }
      />

      <div className={surfaceTheme.statGrid}>
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
          value={averageRating === null ? '-' : averageRating.toFixed(1)}
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

      {/* Organisations read the bio in Overview; course creators have no Overview tab. */}
      {!isOrganisation && bio ? (
        <SectionPanel title='Bio' description='Professional background and teaching profile.'>
          <p className='text-muted-foreground max-w-prose text-sm leading-6 whitespace-pre-line'>
            {bio}
          </p>
        </SectionPanel>
      ) : null}

      <SectionTabs
        tabs={tabs}
        value={tab}
        onValueChange={setTab}
        hrefFor={hrefFor}
        label='Instructor sections'
        sticky
      >
        {isOrganisation ? (
          <SectionTabPanel value='overview' className='space-y-4'>
            {bio ? (
              <SectionPanel title='Bio' description='Professional background and teaching profile.'>
                <p className='text-muted-foreground max-w-prose text-sm leading-6 whitespace-pre-line'>
                  {bio}
                </p>
              </SectionPanel>
            ) : null}
            <div className='grid gap-4 xl:grid-cols-2'>
              <SectionPanel
                title='Identity data'
                description='Bio data from the linked user account.'
              >
                <DetailGrid
                  columns={3}
                  items={[
                    { label: 'Full name', value: name },
                    { label: 'User no.', value: user?.user_no ?? '-' },
                    { label: 'Username', value: user?.username ?? '-' },
                    { label: 'Email', value: email ?? '-' },
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

              <SectionPanel
                title='Professional profile'
                description='Instructor-owned profile data.'
              >
                <DetailGrid
                  columns={3}
                  items={[
                    {
                      label: 'Instructor UUID',
                      value: (
                        <span className='font-mono text-xs break-all'>{instructorUuid || '-'}</span>
                      ),
                    },
                    { label: 'Headline', value: instructor?.professional_headline ?? '-' },
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
                      value: email ?? '-',
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
          </SectionTabPanel>
        ) : null}

        <SectionTabPanel value='classes'>
          <SectionPanel
            title={config.classesTitle}
            description={config.classesDescription}
            actions={
              isOrganisation ? (
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
              ) : (
                <Button size='sm' disabled title='Class assignment is unavailable in this view'>
                  <BookOpen className='size-4' />
                  Assign class
                </Button>
              )
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
                title={config.classesEmptyTitle}
                description={config.classesEmptyDescription}
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
                    {assignedClasses.map(item => {
                      const active = isClassActive(item);
                      return (
                        <tr key={item.uuid} className='border-border/60 border-b last:border-0'>
                          <td className='px-3 py-3'>
                            <p className='text-foreground font-medium'>{item.title}</p>
                            <p className='text-muted-foreground text-xs'>
                              {item.course_uuid
                                ? courseMap[item.course_uuid]?.name ||
                                  (coursesLoading ? 'Loading course…' : 'Course unavailable')
                                : 'Standalone class'}
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
                              status={active ? 'active' : 'inactive'}
                              label={active ? 'Active' : 'Inactive'}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionPanel>
        </SectionTabPanel>

        {isOrganisation ? (
          <SectionTabPanel value='students'>
            {/* Fetches its own roster, so it mounts only when opened. */}
            {tab === 'students' ? (
              <InstructorStudentsPanel
                organisationUuid={organisationUuid}
                instructorUuid={instructorUuid}
              />
            ) : null}
          </SectionTabPanel>
        ) : null}

        <SectionTabPanel value='credentials'>
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
        </SectionTabPanel>

        <SectionTabPanel value='history'>
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
                      <p className='text-muted-foreground mt-2 max-w-prose leading-6'>
                        {item.responsibilities}
                      </p>
                    ) : null}
                  </div>
                )}
              />
            )}
          </SectionPanel>
        </SectionTabPanel>

        <SectionTabPanel value='reviews'>
          <div className='grid gap-4 xl:grid-cols-[0.65fr_1.35fr]'>
            <SectionPanel title='Rating summary' description='Student feedback aggregate.'>
              <DetailGrid
                columns={1}
                items={[
                  {
                    label: 'Average rating',
                    value: averageRating === null ? '-' : averageRating.toFixed(1),
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
                        <p className='text-muted-foreground mt-2 max-w-prose leading-6'>
                          {item.comments}
                        </p>
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
        </SectionTabPanel>

        {isOrganisation ? (
          <SectionTabPanel value='documents'>
            <SectionPanel
              title='Documents'
              description='Uploaded instructor verification documents.'
            >
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
                        <th className='text-muted-foreground px-3 py-2 font-medium'>
                          Verification
                        </th>
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
                            <p className='text-muted-foreground text-xs'>
                              {item.original_filename}
                            </p>
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
          </SectionTabPanel>
        ) : null}

        <SectionTabPanel value='payables'>
          <SectionPanel title='Instructor payables' description={config.payablesDescription}>
            {isOrganisation && payablesQuery.isLoading ? (
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
        </SectionTabPanel>
      </SectionTabs>
    </main>
  );
}

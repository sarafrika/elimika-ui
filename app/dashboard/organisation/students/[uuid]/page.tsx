'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  GraduationCap,
  Mail,
  Percent,
  Phone,
  School,
  Shield,
  UserRound,
  Users,
  WalletCards,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ComponentType, ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { StatusBadge, statusToneClass, type StatusTone } from '@/app/dashboard/admin/_components/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity, extractList, extractPage } from '@/lib/api-helpers';
import { formatCount, toNumber } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import type {
  Certificate,
  OrganisationStudentPerformance,
  Student,
  StudentEnrolmentSummaryDto,
  StudentGroupRosterEntry,
  User,
} from '@/services/client';
import {
  getStudentByIdOptions,
  getStudentCertificatesOptions,
  getStudentPerformanceOptions,
  getStudentSummariesOptions,
  getUserByUuidOptions,
  listRosterOptions,
  searchStudentsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { generateWalletId, institutionRef } from '@/src/lib/wallet-id';

const EMPTY_UUID = '00000000-0000-0000-0000-000000000000';
const tabListClass =
  'h-auto w-full justify-start gap-7 overflow-x-auto rounded-none border-b border-border/70 bg-transparent p-0';
const tabTriggerClass =
  'rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-1 text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none';

type DetailItem = {
  label: ReactNode;
  value: ReactNode;
};

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

function initials(name?: string | null) {
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

function ageFromDate(value?: Date | string | null) {
  if (!value) return '-';
  const born = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(born.getTime())) return '-';
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const monthDelta = today.getMonth() - born.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < born.getDate())) {
    age -= 1;
  }
  return age >= 0 ? `${age} years` : '-';
}

function displayName(
  rosterEntry?: StudentGroupRosterEntry,
  student?: Student | null,
  user?: User | null
) {
  return (
    rosterEntry?.full_name?.trim() ||
    student?.full_name?.trim() ||
    user?.full_name?.trim() ||
    `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() ||
    rosterEntry?.email ||
    user?.email ||
    'Student'
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

function summaryStatus(summary?: StudentEnrolmentSummaryDto) {
  const total = toNumber(summary?.total);
  const completed = toNumber(summary?.completed);
  if (total === 0) return 'No classes yet';
  return completed >= total ? 'Completed' : 'Active';
}

function firstStudentProfile(searchResult: unknown) {
  return extractPage<Student>(searchResult).items[0] ?? null;
}

function getCertificateScope(certificate: Certificate) {
  if (certificate.course_uuid) return `Course ${certificate.course_uuid}`;
  if (certificate.program_uuid) return `Program ${certificate.program_uuid}`;
  return 'General award';
}

export default function OrganisationStudentDetailPage() {
  const params = useParams<{ uuid: string }>();
  const routeUuid = decodeURIComponent(params?.uuid ?? '');
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const [tab, setTab] = useState('overview');

  const rosterQuery = useQuery({
    ...listRosterOptions({
      path: { organisationUuid },
      query: { pageable: { page: 0, size: 500 } },
    }),
    enabled: Boolean(organisationUuid),
    retry: false,
  });
  const roster = extractPage<StudentGroupRosterEntry>(rosterQuery.data).items;
  const routeRosterEntry = useMemo(
    () => roster.find(item => item.student_uuid === routeUuid),
    [roster, routeUuid]
  );

  const summariesQuery = useQuery({
    ...getStudentSummariesOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
    retry: false,
  });
  const summaries = extractList<StudentEnrolmentSummaryDto>(summariesQuery.data);
  const routeSummary = useMemo(
    () => summaries.find(item => item.student_uuid === routeUuid),
    [routeUuid, summaries]
  );

  const studentByUserQuery = useQuery({
    ...searchStudentsOptions({
      query: {
        searchParams: { user_uuid_eq: routeRosterEntry?.student_uuid ?? EMPTY_UUID },
        pageable: { page: 0, size: 1 },
      },
    }),
    enabled: Boolean(routeRosterEntry?.student_uuid),
    retry: false,
  });
  const studentByRouteQuery = useQuery({
    ...getStudentByIdOptions({ path: { uuid: routeSummary?.student_uuid ?? EMPTY_UUID } }),
    enabled: Boolean(routeSummary?.student_uuid),
    retry: false,
  });
  const studentFromUser = firstStudentProfile(studentByUserQuery.data);
  const studentFromRoute = extractEntity<Student>(studentByRouteQuery.data);
  const student = studentFromUser ?? studentFromRoute;
  const studentProfileUuid = student?.uuid ?? routeSummary?.student_uuid ?? '';
  const studentUserUuid = student?.user_uuid ?? routeRosterEntry?.student_uuid ?? '';

  const routeUserQuery = useQuery({
    ...getUserByUuidOptions({ path: { uuid: studentUserUuid || EMPTY_UUID } }),
    enabled: Boolean(studentUserUuid),
    retry: false,
  });
  const user = extractEntity<User>(routeUserQuery.data);
  const resolvedUserUuid = user?.uuid ?? studentUserUuid;
  const rosterEntry = useMemo(
    () =>
      routeRosterEntry ??
      roster.find(
        item =>
          item.student_uuid === studentUserUuid ||
          item.student_uuid === resolvedUserUuid ||
          (!!user?.email && item.email === user.email)
      ),
    [resolvedUserUuid, roster, routeRosterEntry, studentUserUuid, user?.email]
  );

  const performanceQuery = useQuery({
    ...getStudentPerformanceOptions({
      path: { organisationUuid, studentUuid: studentProfileUuid || EMPTY_UUID },
    }),
    enabled: Boolean(organisationUuid && studentProfileUuid),
    retry: false,
  });
  const certificatesQuery = useQuery({
    ...getStudentCertificatesOptions({
      path: { studentUuid: studentProfileUuid || EMPTY_UUID },
    }),
    enabled: Boolean(studentProfileUuid),
    retry: false,
  });

  const performance = extractList<OrganisationStudentPerformance>(performanceQuery.data);
  const certificates = extractList<Certificate>(certificatesQuery.data);
  const summary = useMemo(
    () =>
      routeSummary ??
      summaries.find(
        item =>
          item.student_uuid === studentProfileUuid ||
          item.student_uuid === routeUuid ||
          item.student_uuid === resolvedUserUuid
      ),
    [resolvedUserUuid, routeSummary, routeUuid, studentProfileUuid, summaries]
  );

  const totalSessions = performance.reduce(
    (total, item) => total + toNumber(item.total_sessions),
    0
  );
  const attendedSessions = performance.reduce((total, item) => total + toNumber(item.attended), 0);
  const absentSessions = performance.reduce((total, item) => total + toNumber(item.absent), 0);
  const attendanceRate =
    totalSessions > 0
      ? Math.round((attendedSessions / totalSessions) * 100)
      : toNumber(summary?.total) > 0
        ? Math.round((toNumber(summary?.completed) / toNumber(summary?.total)) * 100)
        : 0;
  const name = displayName(rosterEntry, student, user);
  const avatarUrl = toAuthenticatedMediaUrl(user?.profile_image_url ?? rosterEntry?.profile_image_url);
  const joinedDate = rosterEntry?.joined_date ?? student?.created_date ?? user?.created_date;
  const primaryLoading =
    routeUserQuery.isLoading ||
    studentByUserQuery.isLoading ||
    studentByRouteQuery.isLoading ||
    rosterQuery.isLoading;
  const secondaryLoading =
    summariesQuery.isLoading || (Boolean(studentProfileUuid) && performanceQuery.isLoading);
  const hasOrganisationRecord = Boolean(rosterEntry || summary || performance.length > 0);
  const notFound = !primaryLoading && !secondaryLoading && !hasOrganisationRecord;
  const guardianContacts = student?.allGuardianContacts ?? [];
  const userUuidForDisplay = resolvedUserUuid || routeUuid;
  const studentStatus = summaryStatus(summary);

  if ((primaryLoading || secondaryLoading) && !hasOrganisationRecord) {
    return (
      <main className='mx-auto w-full max-w-[2200px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[2400px]'>
        <Skeleton className='h-8 w-44 rounded-md' />
        <Skeleton className='h-36 w-full rounded-md' />
        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-6'>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className='h-[88px] rounded-md' />
          ))}
        </div>
        <div className='grid gap-4 xl:grid-cols-2'>
          <Skeleton className='h-80 rounded-md' />
          <Skeleton className='h-80 rounded-md' />
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className='mx-auto w-full max-w-[2200px] px-3 py-8 sm:px-5 lg:px-6 2xl:max-w-[2400px]'>
        <EmptyState
          icon={UserRound}
          title='Student not found in this organisation'
          description='The selected student could not be resolved from the organisation roster.'
          action={
            <Button asChild variant='outline'>
              <Link href='/dashboard/organisation/students'>
                <ArrowLeft className='size-4' />
                Back to students
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
        <Link href='/dashboard/organisation/students'>
          <ArrowLeft className='size-4' />
          Back to students
        </Link>
      </Button>

      <header className='border-border/70 bg-card rounded-md border px-5 py-5 shadow-sm'>
        <div className='flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between'>
          <div className='flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center'>
            <Avatar className='size-16 shrink-0 rounded-md'>
              {avatarUrl ? <AvatarImage src={avatarUrl} alt='' /> : null}
              <AvatarFallback className='bg-primary/10 text-primary rounded-md text-xl font-semibold'>
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <h1 className='text-foreground truncate text-2xl font-semibold tracking-tight sm:text-3xl'>
                  {name}
                </h1>
                <StatusBadge status={user?.active ? 'active' : 'inactive'} />
                <StatusBadge
                  status={studentProfileUuid ? 'active' : 'pending'}
                  label={studentProfileUuid ? 'Student profile' : 'Profile pending'}
                />
                <StatusBadge status={studentStatus} />
              </div>
              <p className='text-muted-foreground mt-1 max-w-4xl text-sm'>
                {student?.bio ||
                  rosterEntry?.stream_label ||
                  rosterEntry?.group_name ||
                  'Organisation student record'}
              </p>
              <div className='mt-3 flex flex-wrap items-center gap-2'>
                {organisation?.name ? (
                  <Badge variant='outline' className='rounded-md'>
                    <School className='mr-1 size-3.5' />
                    {organisation.name}
                  </Badge>
                ) : null}
                {rosterEntry?.group_name ? (
                  <Badge variant='secondary' className='rounded-md'>
                    <Users className='mr-1 size-3.5' />
                    {rosterEntry.group_name}
                  </Badge>
                ) : null}
                {rosterEntry?.tier ? (
                  <Badge variant='outline' className='rounded-md'>
                    <GraduationCap className='mr-1 size-3.5' />
                    {rosterEntry.tier}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
          <div className='flex flex-wrap gap-2'>
            {user?.email ?? rosterEntry?.email ? (
              <Button asChild variant='outline'>
                <a href={`mailto:${user?.email ?? rosterEntry?.email}`}>
                  <Mail className='size-4' />
                  Email
                </a>
              </Button>
            ) : null}
            {user?.phone_number ?? rosterEntry?.phone_number ? (
              <Button asChild variant='outline'>
                <a href={`tel:${user?.phone_number ?? rosterEntry?.phone_number}`}>
                  <Phone className='size-4' />
                  Call
                </a>
              </Button>
            ) : null}
            {userUuidForDisplay ? (
              <Button asChild variant='secondary'>
                <Link href={`/profile-user/${userUuidForDisplay}?domain=student`}>
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
          label='Org classes'
          value={formatCount(performance.length, '0')}
          hint='with activity'
          icon={BookOpen}
          tone='info'
        />
        <MetricTile
          label='Active sessions'
          value={formatCount(summary?.total ?? totalSessions, '0')}
          hint='excluding waitlist'
          icon={CalendarDays}
          tone='neutral'
        />
        <MetricTile
          label='Attendance'
          value={`${attendanceRate}%`}
          hint={`${formatCount(attendedSessions || summary?.completed, '0')} attended`}
          icon={Percent}
          tone={attendanceRate >= 80 ? 'success' : attendanceRate > 0 ? 'warning' : 'neutral'}
        />
        <MetricTile
          label='Attended'
          value={formatCount(attendedSessions || summary?.completed, '0')}
          hint='marked present'
          icon={CheckCircle2}
          tone='success'
        />
        <MetricTile
          label='Missed'
          value={formatCount(absentSessions, '0')}
          hint='marked absent'
          icon={XCircle}
          tone={absentSessions > 0 ? 'warning' : 'neutral'}
        />
        <MetricTile
          label='Certificates'
          value={formatCount(certificates.length, '0')}
          hint={`${formatCount(certificates.filter(item => item.is_valid !== false).length, '0')} valid`}
          icon={Award}
          tone='success'
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className='space-y-4'>
        <TabsList className={tabListClass}>
          <TabsTrigger value='overview' className={tabTriggerClass}>
            <ClipboardList className='size-4' />
            Overview
          </TabsTrigger>
          <TabsTrigger value='performance' className={tabTriggerClass}>
            <BookOpen className='size-4' />
            Performance
          </TabsTrigger>
          <TabsTrigger value='guardians' className={tabTriggerClass}>
            <Shield className='size-4' />
            Guardians
          </TabsTrigger>
          <TabsTrigger value='certificates' className={tabTriggerClass}>
            <Award className='size-4' />
            Certificates
          </TabsTrigger>
          <TabsTrigger value='audit' className={tabTriggerClass}>
            <FileCheck className='size-4' />
            Audit
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
                  { label: 'Email', value: user?.email ?? rosterEntry?.email ?? '-' },
                  { label: 'Phone', value: user?.phone_number ?? rosterEntry?.phone_number ?? '-' },
                  { label: 'Gender', value: formatEnumLabel(user?.gender) },
                  { label: 'Date of birth', value: formatDate(user?.dob ?? rosterEntry?.dob) },
                  { label: 'Age', value: ageFromDate(user?.dob ?? rosterEntry?.dob) },
                  { label: 'Account status', value: user?.active ? 'Active' : 'Inactive' },
                  {
                    label: 'User UUID',
                    value: (
                      <span className='font-mono text-xs break-all'>{userUuidForDisplay || '-'}</span>
                    ),
                  },
                ]}
              />
            </SectionPanel>

            <SectionPanel title='Organisation relationship' description='School, group, and class placement.'>
              <DetailGrid
                columns={3}
                items={[
                  { label: 'Organisation', value: organisation?.name ?? '-' },
                  {
                    label: 'Organisation status',
                    value: organisation?.active ? 'Active' : 'Inactive',
                  },
                  {
                    label: 'Organisation verified',
                    value: organisation?.admin_verified ? 'Yes' : 'No',
                  },
                  { label: 'Group', value: rosterEntry?.group_name ?? 'Ungrouped' },
                  { label: 'Tier', value: rosterEntry?.tier ?? '-' },
                  { label: 'Stream', value: rosterEntry?.stream_label ?? '-' },
                  { label: 'Joined group', value: formatDateTime(rosterEntry?.joined_date) },
                  {
                    label: 'Group UUID',
                    value: (
                      <span className='font-mono text-xs break-all'>
                        {rosterEntry?.group_uuid ?? '-'}
                      </span>
                    ),
                  },
                  { label: 'Roster status', value: rosterEntry ? 'Member' : 'Not assigned to group' },
                ]}
              />
            </SectionPanel>

            <SectionPanel title='Student profile' description='Student-domain fields and profile metadata.'>
              <DetailGrid
                columns={3}
                items={[
                  {
                    label: 'Student UUID',
                    value: (
                      <span className='font-mono text-xs break-all'>
                        {studentProfileUuid || '-'}
                      </span>
                    ),
                  },
                  { label: 'Demographic tag', value: formatEnumLabel(student?.demographic_tag) },
                  { label: 'Student full name', value: student?.full_name ?? '-' },
                  { label: 'Profile created', value: formatDateTime(student?.created_date) },
                  { label: 'Profile updated', value: formatDateTime(student?.updated_date) },
                  { label: 'Joined organisation', value: formatDateTime(joinedDate) },
                  {
                    label: 'Wallet ID',
                    value: <span className='font-mono text-xs'>{generateWalletId(userUuidForDisplay)}</span>,
                  },
                  {
                    label: 'Institution ref',
                    value: (
                      <span className='font-mono text-xs'>
                        {institutionRef('ELM', userUuidForDisplay)}
                      </span>
                    ),
                  },
                  { label: 'Bio', value: student?.bio ?? '-' },
                ]}
              />
            </SectionPanel>

            <SectionPanel title='Contact channels' description='Primary student and guardian contact points.'>
              <DetailGrid
                columns={2}
                items={[
                  {
                    label: (
                      <span className='inline-flex items-center gap-1'>
                        <Mail className='size-3.5' />
                        Student email
                      </span>
                    ),
                    value: user?.email ?? rosterEntry?.email ?? '-',
                  },
                  {
                    label: (
                      <span className='inline-flex items-center gap-1'>
                        <Phone className='size-3.5' />
                        Student phone
                      </span>
                    ),
                    value: user?.phone_number ?? rosterEntry?.phone_number ?? '-',
                  },
                  {
                    label: 'Primary guardian',
                    value: student?.first_guardian_name ?? '-',
                  },
                  {
                    label: 'Primary guardian phone',
                    value: student?.first_guardian_mobile ?? student?.primaryGuardianContact ?? '-',
                  },
                ]}
              />
            </SectionPanel>
          </div>
        </TabsContent>

        <TabsContent value='performance' className='mt-0'>
          <SectionPanel
            title='Organisation class performance'
            description="Attendance and participation in this organisation's own classes only."
            actions={
              <Button asChild size='sm' variant='outline'>
                <Link href='/dashboard/organisation/invite-students'>
                  <Users className='size-4' />
                  Invite to class
                </Link>
              </Button>
            }
          >
            {performanceQuery.isLoading ? (
              <div className='space-y-2'>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className='h-14 w-full rounded-md' />
                ))}
              </div>
            ) : performanceQuery.error ? (
              <EmptyPanel
                icon={BookOpen}
                title='Performance unavailable'
                description='The organisation-scoped performance endpoint could not return this learner at the moment.'
              />
            ) : performance.length === 0 ? (
              <EmptyPanel
                icon={BookOpen}
                title='No organisation class activity'
                description='Enrol this student into one of your classes to see attendance and class progress here.'
              />
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full min-w-[980px] text-sm'>
                  <thead>
                    <tr className='border-border/70 border-b text-left'>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Class</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Sessions</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Attended</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Missed</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Attendance</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Last session</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.map(item => {
                      const rowRate = Math.min(
                        Math.max(Math.round(toNumber(item.attendance_rate)), 0),
                        100
                      );
                      return (
                        <tr
                          key={item.class_definition_uuid ?? item.class_title}
                          className='border-border/60 border-b last:border-0'
                        >
                          <td className='px-3 py-3'>
                            <p className='text-foreground font-medium'>{item.class_title ?? 'Class'}</p>
                            <p className='text-muted-foreground text-xs break-all'>
                              {item.class_definition_uuid ?? '-'}
                            </p>
                          </td>
                          <td className='px-3 py-3'>{formatCount(item.total_sessions, '0')}</td>
                          <td className='px-3 py-3'>{formatCount(item.attended, '0')}</td>
                          <td className='px-3 py-3'>{formatCount(item.absent, '0')}</td>
                          <td className='px-3 py-3'>
                            <div className='flex w-44 items-center gap-3'>
                              <Progress value={rowRate} className='h-2 flex-1' />
                              <span className='text-muted-foreground w-10 text-right text-xs'>
                                {rowRate}%
                              </span>
                            </div>
                          </td>
                          <td className='text-muted-foreground px-3 py-3'>
                            {formatDateTime(item.last_session_at)}
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

        <TabsContent value='guardians' className='mt-0'>
          <div className='grid gap-4 xl:grid-cols-[0.9fr_1.1fr]'>
            <SectionPanel title='Primary guardian' description='Main emergency contact.'>
              {student?.first_guardian_name || student?.first_guardian_mobile ? (
                <DetailGrid
                  columns={1}
                  items={[
                    { label: 'Name', value: student?.first_guardian_name ?? '-' },
                    {
                      label: 'Mobile',
                      value: student?.first_guardian_mobile ?? student?.primaryGuardianContact ?? '-',
                    },
                  ]}
                />
              ) : (
                <EmptyPanel
                  icon={Shield}
                  title='No primary guardian'
                  description='Primary guardian details have not been added to this student profile.'
                />
              )}
            </SectionPanel>

            <SectionPanel title='Secondary guardian' description='Alternative emergency contact.'>
              {student?.second_guardian_name || student?.second_guardian_mobile ? (
                <DetailGrid
                  columns={1}
                  items={[
                    { label: 'Name', value: student?.second_guardian_name ?? '-' },
                    {
                      label: 'Mobile',
                      value: student?.second_guardian_mobile ?? student?.secondaryGuardianContact ?? '-',
                    },
                  ]}
                />
              ) : (
                <EmptyPanel
                  icon={Shield}
                  title='No secondary guardian'
                  description='Secondary guardian details have not been added to this student profile.'
                />
              )}
            </SectionPanel>

            <SectionPanel
              title='All guardian contacts'
              description='Guardian contacts returned by the student profile.'
              className='xl:col-span-2'
            >
              {guardianContacts.length === 0 ? (
                <EmptyPanel
                  icon={Phone}
                  title='No guardian contacts'
                  description='Guardian phone numbers and linked contacts will appear here once available.'
                />
              ) : (
                <div className='flex flex-wrap gap-2'>
                  {guardianContacts.map(contact => (
                    <Badge key={contact} variant='outline' className='rounded-md px-2.5 py-1'>
                      <Phone className='mr-1 size-3.5' />
                      {contact}
                    </Badge>
                  ))}
                </div>
              )}
            </SectionPanel>
          </div>
        </TabsContent>

        <TabsContent value='certificates' className='mt-0'>
          <SectionPanel title='Certificates' description='Issued credentials connected to the student profile.'>
            {certificatesQuery.isLoading ? (
              <div className='space-y-2'>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className='h-14 w-full rounded-md' />
                ))}
              </div>
            ) : certificatesQuery.error ? (
              <EmptyPanel
                icon={Award}
                title='Certificates unavailable'
                description='Certificate data could not be loaded for this student profile.'
              />
            ) : certificates.length === 0 ? (
              <EmptyPanel
                icon={Award}
                title='No certificates issued'
                description='Certificates will appear here after the student completes eligible courses or programs.'
              />
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full min-w-[1040px] text-sm'>
                  <thead>
                    <tr className='border-border/70 border-b text-left'>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Certificate</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Scope</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Completed</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Issued</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Grade</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Status</th>
                      <th className='text-muted-foreground px-3 py-2 font-medium'>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map(item => (
                      <tr key={item.uuid ?? item.certificate_number} className='border-border/60 border-b last:border-0'>
                        <td className='px-3 py-3'>
                          <p className='text-foreground font-medium'>
                            {item.certificate_number ?? 'Certificate'}
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            {formatEnumLabel(item.certificate_type)}
                          </p>
                        </td>
                        <td className='text-muted-foreground px-3 py-3 break-all'>
                          {getCertificateScope(item)}
                        </td>
                        <td className='text-muted-foreground px-3 py-3'>
                          {formatDate(item.completion_date)}
                        </td>
                        <td className='text-muted-foreground px-3 py-3'>
                          {formatDateTime(item.issued_date)}
                        </td>
                        <td className='px-3 py-3'>
                          {item.grade_letter ?? (item.final_grade == null ? '-' : `${item.final_grade}%`)}
                        </td>
                        <td className='px-3 py-3'>
                          <StatusBadge
                            status={item.validity_status ?? (item.is_valid === false ? 'revoked' : 'valid')}
                          />
                        </td>
                        <td className='px-3 py-3'>
                          {item.certificate_url && item.is_downloadable !== false ? (
                            <Button asChild size='sm' variant='outline'>
                              <a href={item.certificate_url} target='_blank' rel='noreferrer'>
                                View
                              </a>
                            </Button>
                          ) : (
                            <span className='text-muted-foreground text-sm'>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionPanel>
        </TabsContent>

        <TabsContent value='audit' className='mt-0'>
          <div className='grid gap-4 xl:grid-cols-2'>
            <SectionPanel title='Identifiers' description='Cross-domain identifiers for support and audit.'>
              <DetailGrid
                columns={2}
                items={[
                  {
                    label: (
                      <span className='inline-flex items-center gap-1'>
                        <WalletCards className='size-3.5' />
                        Wallet ID
                      </span>
                    ),
                    value: <span className='font-mono text-xs'>{generateWalletId(userUuidForDisplay)}</span>,
                  },
                  {
                    label: 'Institution ref',
                    value: (
                      <span className='font-mono text-xs'>
                        {institutionRef('ELM', userUuidForDisplay)}
                      </span>
                    ),
                  },
                  {
                    label: 'Route UUID',
                    value: <span className='font-mono text-xs break-all'>{routeUuid}</span>,
                  },
                  {
                    label: 'Student UUID',
                    value: (
                      <span className='font-mono text-xs break-all'>
                        {studentProfileUuid || '-'}
                      </span>
                    ),
                  },
                  {
                    label: 'User UUID',
                    value: (
                      <span className='font-mono text-xs break-all'>{userUuidForDisplay || '-'}</span>
                    ),
                  },
                  {
                    label: 'Group UUID',
                    value: (
                      <span className='font-mono text-xs break-all'>
                        {rosterEntry?.group_uuid ?? '-'}
                      </span>
                    ),
                  },
                ]}
              />
            </SectionPanel>

            <SectionPanel title='Audit trail' description='Created and updated timestamps from user and student records.'>
              <DetailGrid
                columns={2}
                items={[
                  { label: 'User created', value: formatDateTime(user?.created_date) },
                  { label: 'User updated', value: formatDateTime(user?.updated_date) },
                  { label: 'User created by', value: user?.created_by ?? '-' },
                  { label: 'User updated by', value: user?.updated_by ?? '-' },
                  { label: 'Student profile created', value: formatDateTime(student?.created_date) },
                  { label: 'Student profile updated', value: formatDateTime(student?.updated_date) },
                  { label: 'Student created by', value: student?.created_by ?? '-' },
                  { label: 'Student updated by', value: student?.updated_by ?? '-' },
                ]}
              />
            </SectionPanel>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { Eye, Mail, MapPin, MoreHorizontal, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { KeyboardEvent } from 'react';
import { useMemo, useState } from 'react';

import { AvatarWithSkeleton } from '@/components/avatar-with-skeleton';
import { ALL_CATEGORIES, CategoryTabs, filterByCategoryTabs } from '@/components/category-tabs';
import { PageHeader } from '@/components/dashboard/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import { useUsersByIds } from '@/hooks/use-batched-lookups';
import { extractList, extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { getErrorMessage } from '@/lib/error-utils';
import { formatCount, toNumber } from '@/lib/metrics';
import type {
  Student,
  StudentEnrolmentSummaryDto,
  StudentGroupRosterEntry,
  User,
} from '@/services/client';
import {
  getStudentSummariesOptions,
  getUsersByOrganisationAndDomainOptions,
  listRosterOptions,
  searchStudentsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { generateWalletId, institutionRef } from '@/src/lib/wallet-id';

import { PendingInvitations } from './_components/pending-invitations';

const fullName = (student: StudentGroupRosterEntry) =>
  student.full_name?.trim() || student.email || null;

function statusVariant(status: string) {
  if (status === 'Active') return 'default' as const;
  if (status === 'Completed') return 'secondary' as const;
  if (status === 'No classes yet') return 'outline' as const;
  return 'destructive' as const;
}

type StudentRow = {
  id: string;
  name: string;
  email: string | null;
  image: string | null;
  groupName: string | null;
  branch: string | null;
  tier: string | null;
  status: 'Active' | 'Completed' | 'No classes yet';
  completedCourses: number;
  totalCourses: number;
  pct: number;
  category: string;
  subject: string | null;
  programType: null;
};

const EMPTY_UUID = '00000000-0000-0000-0000-000000000000';
const studentHref = (id: string) => `/dashboard/organisation/students/${encodeURIComponent(id)}`;

const statusFromSummary = (summary?: { total: number; completed: number }) => {
  if (!summary || summary.total === 0) return 'No classes yet';
  return summary.completed >= summary.total ? 'Completed' : 'Active';
};

const displayNameFromUser = (user?: User, profile?: Student) =>
  user?.full_name?.trim() ||
  user?.display_name?.trim() ||
  profile?.full_name?.trim() ||
  (profile?.uuid ? `Student ${profile.uuid.slice(0, 8)}` : 'Student');

const asSummaryMap = (summaries: StudentEnrolmentSummaryDto[] | undefined) => {
  const map = new Map<string, { total: number; completed: number }>();
  for (const summary of summaries ?? []) {
    if (!summary.student_uuid) continue;
    map.set(summary.student_uuid, {
      total: toNumber(summary.total),
      completed: toNumber(summary.completed),
    });
  }
  return map;
};

export default function StudentsPage() {
  const router = useRouter();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const rosterQuery = useQuery({
    ...listRosterOptions({
      path: { organisationUuid },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: Boolean(organisationUuid),
  });
  const summariesQuery = useQuery({
    ...getStudentSummariesOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });

  // Branch each student is affiliated to (this org's student affiliation), keyed by user uuid.
  const orgStudentsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'student' },
    }),
    enabled: Boolean(organisationUuid),
  });
  const branchByUserUuid = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of extractList<User>(orgStudentsQuery.data)) {
      if (!u.uuid) continue;
      const affiliation = (u.organisation_affiliations ?? []).find(
        a => a.organisation_uuid === organisationUuid
      );
      if (affiliation?.branch_name) map.set(u.uuid, affiliation.branch_name);
    }
    return map;
  }, [orgStudentsQuery.data, organisationUuid]);

  const summaries = useMemo(
    () => extractList<StudentEnrolmentSummaryDto>(summariesQuery.data),
    [summariesQuery.data]
  );
  const summaryByStudent = useMemo(() => {
    return asSummaryMap(summaries);
  }, [summaries]);

  const rosterPage = useMemo(
    () => extractPage<StudentGroupRosterEntry>(rosterQuery.data),
    [rosterQuery.data]
  );
  const roster = rosterPage.items;
  const totalRosterStudents = getTotalFromMetadata(rosterPage.metadata) || roster.length;
  const rosterUserUuids = useMemo(
    () =>
      Array.from(
        new Set(roster.map(student => student.student_uuid).filter((uuid): uuid is string => !!uuid))
      ).sort((a, b) => a.localeCompare(b)),
    [roster]
  );
  const studentProfilesQuery = useQuery({
    ...searchStudentsOptions({
      query: {
        searchParams: {
          user_uuid_in: rosterUserUuids.join(',') || EMPTY_UUID,
        },
        pageable: { page: 0, size: Math.max(rosterUserUuids.length, 1) },
      },
    }),
    enabled: rosterUserUuids.length > 0,
    retry: false,
  });
  const studentProfileByUserUuid = useMemo(() => {
    const map = new Map<string, Student>();
    for (const profile of extractPage<Student>(studentProfilesQuery.data).items) {
      if (profile.user_uuid) {
        map.set(profile.user_uuid, profile);
      }
    }
    return map;
  }, [studentProfilesQuery.data]);
  const summaryStudentUuids = useMemo(
    () =>
      Array.from(
        new Set(
          summaries.map(summary => summary.student_uuid).filter((uuid): uuid is string => !!uuid)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [summaries]
  );
  const summaryStudentProfilesQuery = useQuery({
    ...searchStudentsOptions({
      query: {
        searchParams: {
          uuid_in: summaryStudentUuids.join(',') || EMPTY_UUID,
        },
        pageable: { page: 0, size: Math.max(summaryStudentUuids.length, 1) },
      },
    }),
    enabled: summaryStudentUuids.length > 0,
    retry: false,
  });
  const studentProfileByUuid = useMemo(() => {
    const map = new Map<string, Student>();
    for (const profile of extractPage<Student>(summaryStudentProfilesQuery.data).items) {
      if (profile.uuid) {
        map.set(profile.uuid, profile);
      }
    }
    return map;
  }, [summaryStudentProfilesQuery.data]);
  const profileUserUuids = useMemo(
    () =>
      Array.from(
        new Set(
          [...studentProfileByUserUuid.values(), ...studentProfileByUuid.values()]
            .map(profile => profile.user_uuid)
            .filter((uuid): uuid is string => !!uuid)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [studentProfileByUserUuid, studentProfileByUuid]
  );
  const { userMap, isLoading: usersLoading } = useUsersByIds(profileUserUuids);

  const students = useMemo(() => {
    const rows: StudentRow[] = [];
    const representedStudentUuids = new Set<string>();

    for (const student of roster) {
      if (!student.student_uuid) continue;
      const profile = studentProfileByUserUuid.get(student.student_uuid);
      if (profile?.uuid) {
        representedStudentUuids.add(profile.uuid);
      }
      const user = profile?.user_uuid ? userMap[profile.user_uuid] : undefined;
      const summary =
        (profile?.uuid ? summaryByStudent.get(profile.uuid) : undefined) ??
        summaryByStudent.get(student.student_uuid);
      const pct =
        summary && summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;
      rows.push({
        id: student.student_uuid,
        name: fullName(student) ?? displayNameFromUser(user, profile),
        email: student.email ?? user?.email ?? null,
        image: toAuthenticatedMediaUrl(user?.profile_image_url ?? student.profile_image_url) ?? null,
        groupName: student.group_name ?? null,
        branch: branchByUserUuid.get(profile?.user_uuid ?? '') ?? null,
        tier: student.tier ?? null,
        status: statusFromSummary(summary),
        completedCourses: summary?.completed ?? 0,
        totalCourses: summary?.total ?? 0,
        pct,
        category: student.tier ?? student.group_name ?? 'Uncategorised',
        subject: student.stream_label ?? student.group_name ?? null,
        programType: null,
      });
    }

    for (const summary of summaries) {
      if (!summary.student_uuid || representedStudentUuids.has(summary.student_uuid)) continue;
      const profile = studentProfileByUuid.get(summary.student_uuid);
      const user = profile?.user_uuid ? userMap[profile.user_uuid] : undefined;
      const normalizedSummary = {
        total: toNumber(summary.total),
        completed: toNumber(summary.completed),
      };
      const pct =
        normalizedSummary.total > 0
          ? Math.round((normalizedSummary.completed / normalizedSummary.total) * 100)
          : 0;
      rows.push({
        id: summary.student_uuid,
        name: displayNameFromUser(user, profile),
        email: user?.email ?? null,
        image: toAuthenticatedMediaUrl(user?.profile_image_url) ?? null,
        groupName: 'Ungrouped',
        branch: branchByUserUuid.get(profile?.user_uuid ?? '') ?? null,
        tier: null,
        status: statusFromSummary(normalizedSummary),
        completedCourses: normalizedSummary.completed,
        totalCourses: normalizedSummary.total,
        pct,
        category: 'Enrolled students',
        subject: null,
        programType: null,
      });
    }

    return rows;
  }, [
    roster,
    studentProfileByUserUuid,
    studentProfileByUuid,
    summaries,
    summaryByStudent,
    userMap,
    branchByUserUuid,
  ]);

  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [subjectByCategory, setSubjectByCategory] = useState<Record<string, string>>({});
  const visibleStudents = useMemo(
    () => filterByCategoryTabs(students, activeCategory, subjectByCategory),
    [students, activeCategory, subjectByCategory]
  );
  const kpis = useMemo(
    () => ({
      total: Math.max(totalRosterStudents, students.length),
      active: students.filter(student => student.status === 'Active').length,
      completed: students.filter(student => student.status === 'Completed').length,
      noClasses: students.filter(student => student.status === 'No classes yet').length,
    }),
    [students, totalRosterStudents]
  );
  const studentsLoading =
    rosterQuery.isLoading ||
    summariesQuery.isLoading ||
    studentProfilesQuery.isLoading ||
    summaryStudentProfilesQuery.isLoading ||
    usersLoading;
  const loadError =
    rosterQuery.error ??
    summariesQuery.error ??
    studentProfilesQuery.error ??
    summaryStudentProfilesQuery.error;
  const errorDescription = getErrorMessage(loadError, 'Refresh the page or try again in a moment.');
  const openStudent = (id: string) => router.push(studentHref(id));
  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, id: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openStudent(id);
  };

  return (
    <div className='mx-auto w-full max-w-[2200px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[2400px]'>
      <PageHeader
        title='Students'
        description='Invite, onboard and manage students across your programs.'
        actions={
          <Button asChild size='sm'>
            <Link href='/dashboard/organisation/invite-students'>
              <Plus className='mr-2 h-4 w-4' /> Invite students
            </Link>
          </Button>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='border-l-primary border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{formatCount(kpis.total, '0')}</div>
            <div className='text-muted-foreground text-xs'>Students</div>
          </CardContent>
        </Card>
        <Card className='border-l-success border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{formatCount(kpis.active, '0')}</div>
            <div className='text-muted-foreground text-xs'>Active</div>
          </CardContent>
        </Card>
        <Card className='border-l-accent border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{formatCount(kpis.completed, '0')}</div>
            <div className='text-muted-foreground text-xs'>Completed</div>
          </CardContent>
        </Card>
        <Card className='border-l-warning border-l-4'>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{formatCount(kpis.noClasses, '0')}</div>
            <div className='text-muted-foreground text-xs'>No classes yet</div>
          </CardContent>
        </Card>
      </div>

      <PendingInvitations organisationUuid={organisationUuid} />

      {students.length > 0 && (
        <CategoryTabs
          items={students}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          subjectByCategory={subjectByCategory}
          onSubjectChange={setSubjectByCategory}
        />
      )}

      <div className='space-y-4'>
        {studentsLoading ? (
          <div className='space-y-2'>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className='h-14 w-full' />
            ))}
          </div>
        ) : loadError ? (
          <EmptyState
            icon={Users}
            title='Could not load students'
            description={errorDescription}
            action={
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  rosterQuery.refetch();
                  summariesQuery.refetch();
                  studentProfilesQuery.refetch();
                  summaryStudentProfilesQuery.refetch();
                }}
              >
                Retry
              </Button>
            }
          />
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            title='No students yet'
            description='Invite students by email or upload a CSV to onboard a whole cohort in one go.'
            action={
              <Button asChild size='sm'>
                <Link href='/dashboard/organisation/invite-students'>
                  <Plus className='mr-2 h-4 w-4' /> Invite students
                </Link>
              </Button>
            }
          />
        ) : visibleStudents.length === 0 ? (
          <EmptyState
            icon={Users}
            title='No students match this filter'
            description='Choose another category or subject to widen the list.'
          />
        ) : (
          <div className='overflow-x-auto rounded-lg border'>
            <Table className='min-w-[1080px]'>
              <TableHeader>
                <TableRow>
                  <TableHead className='whitespace-nowrap'>Student</TableHead>
                  <TableHead className='whitespace-nowrap'>Wallet ID</TableHead>
                  <TableHead className='whitespace-nowrap'>Institution Ref</TableHead>
                  <TableHead className='whitespace-nowrap'>Group</TableHead>
                  <TableHead className='whitespace-nowrap'>Branch</TableHead>
                  <TableHead className='whitespace-nowrap'>Status</TableHead>
                  <TableHead className='whitespace-nowrap'>Attendance</TableHead>
                  <TableHead className='text-right whitespace-nowrap'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleStudents.map(student => (
                  <TableRow
                    key={student.id}
                    role='link'
                    tabIndex={0}
                    className='hover:bg-muted/40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    onClick={() => openStudent(student.id)}
                    onKeyDown={event => handleRowKeyDown(event, student.id)}
                  >
                    <TableCell className='whitespace-nowrap'>
                      <div className='flex items-center gap-3'>
                        <AvatarWithSkeleton
                          src={student.image}
                          name={student.name}
                          className='h-8 w-8'
                        />
                        <div className='min-w-0'>
                          <div className='truncate font-medium'>{student.name}</div>
                          {student.email && (
                            <div className='text-muted-foreground truncate text-xs'>
                              {student.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='whitespace-nowrap'>
                      <span className='font-mono text-xs'>{generateWalletId(student.id)}</span>
                    </TableCell>
                    <TableCell className='whitespace-nowrap'>
                      <span className='text-muted-foreground font-mono text-xs'>
                        {institutionRef('ELM', student.id)}
                      </span>
                    </TableCell>
                    <TableCell className='whitespace-nowrap'>
                      <div className='min-w-0'>
                        <div className='truncate text-sm'>{student.groupName ?? 'Ungrouped'}</div>
                        {student.tier && (
                          <div className='text-muted-foreground truncate text-xs'>
                            {student.tier}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='whitespace-nowrap'>
                      {student.branch ? (
                        <Badge variant='outline' className='gap-1'>
                          <MapPin className='h-3 w-3' />
                          {student.branch}
                        </Badge>
                      ) : (
                        <span className='text-muted-foreground text-xs'>Org-wide</span>
                      )}
                    </TableCell>
                    <TableCell className='whitespace-nowrap'>
                      <Badge variant={statusVariant(student.status)}>{student.status}</Badge>
                    </TableCell>
                    <TableCell className='whitespace-nowrap'>
                      {student.totalCourses === 0 ? (
                        <span className='text-muted-foreground text-sm'>-</span>
                      ) : (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className='flex w-36 items-center gap-3'>
                                <Progress value={student.pct} className='h-2 flex-1' />
                                <span className='text-muted-foreground w-8 text-right text-xs'>
                                  {student.pct}%
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side='top'>
                              <p>
                                {formatCount(student.completedCourses, '0')} of{' '}
                                {formatCount(student.totalCourses, '0')} attended
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                    <TableCell className='text-right whitespace-nowrap'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                            aria-label={`Open actions for ${student.name}`}
                            onClick={event => event.stopPropagation()}
                          >
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem asChild>
                            <Link href={studentHref(student.id)}>
                              <Eye className='mr-2 h-4 w-4' /> View profile
                            </Link>
                          </DropdownMenuItem>
                          {student.email ? (
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${student.email}`}>
                                <Mail className='mr-2 h-4 w-4' /> Email student
                              </a>
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

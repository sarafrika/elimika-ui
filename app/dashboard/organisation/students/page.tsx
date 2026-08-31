'use client';

import { useQuery } from '@tanstack/react-query';
import { Eye, Mail, MoreHorizontal, Plus, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

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
  DropdownMenuSeparator,
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
import { extractPage, getTotalFromMetadata } from '@/lib/api-helpers';
import { getErrorMessage } from '@/lib/error-utils';
import { formatCount, toNumber } from '@/lib/metrics';
import type { StudentEnrolmentSummaryDto, StudentGroupRosterEntry } from '@/services/client';
import {
  getStudentSummariesOptions,
  listRosterOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { generateWalletId, institutionRef } from '@/src/lib/wallet-id';

import { PendingInvitations } from './_components/pending-invitations';

const fullName = (student: StudentGroupRosterEntry) =>
  student.full_name?.trim() || student.email || 'Unnamed student';

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
  tier: string | null;
  status: 'Active' | 'Completed' | 'No classes yet';
  completedCourses: number;
  totalCourses: number;
  pct: number;
  category: string;
  subject: string | null;
  programType: null;
};

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

  const summaryByStudent = useMemo(() => {
    return asSummaryMap(summariesQuery.data?.data);
  }, [summariesQuery.data]);

  const rosterPage = useMemo(
    () => extractPage<StudentGroupRosterEntry>(rosterQuery.data),
    [rosterQuery.data]
  );
  const roster = rosterPage.items;
  const totalRosterStudents = getTotalFromMetadata(rosterPage.metadata) || roster.length;

  const students = useMemo(
    () =>
      roster.flatMap<StudentRow>(student => {
        if (!student.student_uuid) return [];
        const summary = summaryByStudent.get(student.student_uuid);
        const pct =
          summary && summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;
        const status =
          !summary || summary.total === 0 ? 'No classes yet' : pct >= 100 ? 'Completed' : 'Active';
        return [
          {
            id: student.student_uuid,
            name: fullName(student),
            email: student.email ?? null,
            image: student.profile_image_url ?? null,
            groupName: student.group_name ?? null,
            tier: student.tier ?? null,
            status,
            completedCourses: summary?.completed ?? 0,
            totalCourses: summary?.total ?? 0,
            pct,
            category: student.tier ?? student.group_name ?? 'Uncategorised',
            subject: student.stream_label ?? student.group_name ?? null,
            programType: null,
          },
        ];
      }),
    [roster, summaryByStudent]
  );

  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [subjectByCategory, setSubjectByCategory] = useState<Record<string, string>>({});
  const visibleStudents = useMemo(
    () => filterByCategoryTabs(students, activeCategory, subjectByCategory),
    [students, activeCategory, subjectByCategory]
  );
  const kpis = useMemo(
    () => ({
      total: totalRosterStudents,
      active: students.filter(student => student.status === 'Active').length,
      completed: students.filter(student => student.status === 'Completed').length,
      noClasses: students.filter(student => student.status === 'No classes yet').length,
    }),
    [students, totalRosterStudents]
  );
  const loadError = rosterQuery.error;
  const errorDescription = getErrorMessage(loadError, 'Refresh the page or try again in a moment.');

  return (
    <div className='mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]'>
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
        {rosterQuery.isLoading ? (
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
                  <TableHead className='whitespace-nowrap'>Status</TableHead>
                  <TableHead className='whitespace-nowrap'>Course Completion</TableHead>
                  <TableHead className='text-right whitespace-nowrap'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleStudents.map(student => (
                  <TableRow key={student.id}>
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
                          <Button variant='ghost' size='icon' className='h-8 w-8'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() =>
                              toast.info('View student', {
                                description: `Opening ${student.name}'s profile.`,
                              })
                            }
                          >
                            <Eye className='mr-2 h-4 w-4' /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toast.info('Message student', {
                                description: `Opening conversation with ${student.name}.`,
                              })
                            }
                          >
                            <Mail className='mr-2 h-4 w-4' /> Message
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className='text-destructive focus:text-destructive'
                            onClick={() =>
                              toast.error('Student removed', {
                                description: `${student.name} has been removed.`,
                              })
                            }
                          >
                            <Trash2 className='mr-2 h-4 w-4' /> Remove
                          </DropdownMenuItem>
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

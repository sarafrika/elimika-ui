'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Mail, MoreHorizontal, Plus, Send, Trash2, Upload, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AvatarWithSkeleton } from '@/components/avatar-with-skeleton';
import { ALL_CATEGORIES, CategoryTabs, filterByCategoryTabs } from '@/components/category-tabs';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateWalletId, institutionRef } from '@/src/lib/wallet-id';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';

import { useOrganisation } from '@/context/organisation-context';
import { PendingInvitations } from './_components/pending-invitations';
import { extractEntity, extractPage } from '@/lib/api-helpers';
import type { ClassDefinition, User, Wallet } from '@/services/client';
import {
  createOrganisationUserMutation,
  getClassDefinitionsForOrganisationOptions,
  getStudentSummariesOptions,
  getUsersByOrganisationAndDomainOptions,
  getUsersByOrganisationOptions,
  getWalletOptions,
} from '@/services/client/@tanstack/react-query.gen';

const fullName = (u: User) =>
  `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'Unnamed';

function statusVariant(status: string) {
  if (status === 'Active') return 'default' as const;
  if (status === 'Completed') return 'secondary' as const;
  if (status === 'No classes yet') return 'outline' as const;
  return 'destructive' as const;
}

export default function StudentsPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const studentsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'student' },
    }),
    enabled: Boolean(organisationUuid),
  });
  const summariesQuery = useQuery({
    ...getStudentSummariesOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });

  const summaryByStudent = useMemo(() => {
    const map = new Map<string, { total: number; completed: number }>();
    for (const s of summariesQuery.data?.data ?? []) {
      if (s.student_uuid) map.set(s.student_uuid, { total: Number(s.total ?? 0), completed: Number(s.completed ?? 0) });
    }
    return map;
  }, [summariesQuery.data]);

  // Members without a resolvable uuid cannot be rendered or acted on, so they are dropped
  // rather than carried through as partially-undefined rows.
  const students = extractPage<User>(studentsQuery.data).items.flatMap(u => {
    if (!u.uuid) return [];
    const summary = summaryByStudent.get(u.uuid);
    const pct = summary && summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;
    const status = !summary || summary.total === 0 ? 'No classes yet' : pct >= 100 ? 'Completed' : 'Active';
    return [{
      id: u.uuid,
      name: fullName(u),
      status,
      completedCourses: summary?.completed ?? 0,
      totalCourses: summary?.total ?? 0,
      pct,
      category: 'Uncategorised',
    }];
  });

  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [subjectByCategory, setSubjectByCategory] = useState<Record<string, string>>({});
  const visibleStudents = useMemo(
    () => filterByCategoryTabs(students, activeCategory, subjectByCategory),
    [students, activeCategory, subjectByCategory]
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <PageHeader
        title="Students"
        description="Invite, onboard and manage students across your programs."
        action={
          <Button asChild size="sm">
            <Link href="/dashboard/organisation/invite-students">
              <Plus className="mr-2 h-4 w-4" /> Invite students
            </Link>
          </Button>
        }
      />

      <PendingInvitations organisationUuid={organisationUuid} />

      <CategoryTabs
        items={students}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        subjectByCategory={subjectByCategory}
        onSubjectChange={setSubjectByCategory}
      />

      <div className="space-y-4">
        {studentsQuery.isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : visibleStudents.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students yet"
            description="Invite students by email or upload a CSV to onboard a whole cohort in one go."
            action={
              <Button asChild size="sm">
                <Link href="/dashboard/organisation/invite-students">
                  <Plus className="mr-2 h-4 w-4" /> Invite students
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table className="min-w-[1040px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Student</TableHead>
                  <TableHead className="whitespace-nowrap">Wallet ID</TableHead>
                  <TableHead className="whitespace-nowrap">Institution Ref</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Course Completion</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleStudents.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <AvatarWithSkeleton src="" name={student.name} className="h-8 w-8" />
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="font-mono text-xs">{generateWalletId(student.id)}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="font-mono text-xs text-muted-foreground">{institutionRef('ELM', student.id)}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={statusVariant(student.status)}>{student.status}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {student.totalCourses === 0 ? (
                        <span className="text-muted-foreground text-sm">—</span>
                      ) : (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex w-36 items-center gap-3">
                                <Progress value={student.pct} className="h-2 flex-1" />
                                <span className="w-8 text-right text-xs text-muted-foreground">{student.pct}%</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>
                                {student.completedCourses} of {student.totalCourses} attended
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.info('View student', { description: `Opening ${student.name}'s profile.` })}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info('Message student', { description: `Opening conversation with ${student.name}.` })}>
                            <Mail className="mr-2 h-4 w-4" /> Message
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => toast.error('Student removed', { description: `${student.name} has been removed.` })}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Remove
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

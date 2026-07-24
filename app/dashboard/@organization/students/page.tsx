// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOrganisation } from '@/context/organisation-context';
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
  if (status === 'Invited') return 'outline' as const;
  return 'destructive' as const;
}

/** Lazily fetches a student's Skills Wallet balance. */
function WalletCell({ userUuid }: { userUuid?: string }) {
  const walletQuery = useQuery({
    ...getWalletOptions({ path: { userUuid: userUuid ?? '' } }),
    enabled: Boolean(userUuid),
    retry: false,
  });
  if (!userUuid) return <span className="text-muted-foreground">—</span>;
  if (walletQuery.isLoading) return <Skeleton className="h-4 w-16" />;
  const wallet = extractEntity<Wallet>(walletQuery.data);
  if (walletQuery.isError || !wallet || wallet.balance_amount == null) {
    return <span className="text-muted-foreground">—</span>;
  }
  return <span>{`${wallet.currency_code ?? 'KSh'} ${Number(wallet.balance_amount).toLocaleString()}`}</span>;
}

function InviteStudentsDialog({ organisationUuid }: { organisationUuid: string }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const createStudent = useMutation(createOrganisationUserMutation());

  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const classes: ClassDefinition[] = (
    (classesQuery.data?.data ?? []) as Array<{ class_definition?: ClassDefinition }>
  )
    .map(c => c.class_definition)
    .filter((c): c is ClassDefinition => Boolean(c?.uuid));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Invite students
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite students</DialogTitle>
          <DialogDescription>Send invitations one at a time or upload a CSV.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="single">
          <TabsList className="mb-4">
            <TabsTrigger value="single">Single invite</TabsTrigger>
            <TabsTrigger value="bulk">Bulk upload</TabsTrigger>
          </TabsList>
          <TabsContent value="single">
            <form
              className="space-y-3"
              onSubmit={e => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = (form.elements.namedItem('s-name') as HTMLInputElement)?.value || '';
                const email = (form.elements.namedItem('s-email') as HTMLInputElement)?.value || '';
                const phone = (form.elements.namedItem('s-phone') as HTMLInputElement)?.value || '';
                const [first, ...rest] = name.trim().split(' ');
                if (!first || !email) {
                  toast.error('Name and email are required.');
                  return;
                }
                createStudent.mutate(
                  {
                    path: { uuid: organisationUuid },
                    body: {
                      first_name: first,
                      last_name: rest.join(' ') || first,
                      email,
                      phone_number: phone || undefined,
                      domain_name: 'student',
                    },
                  },
                  {
                    onSuccess: async () => {
                      setOpen(false);
                      toast.success('Invitation sent', { description: `${name} will receive an email shortly.` });
                      await qc.invalidateQueries({
                        queryKey: getUsersByOrganisationOptions({
                          path: { uuid: organisationUuid },
                          query: { pageable: { page: 0, size: 100 } },
                        }).queryKey,
                      });
                    },
                    onError: err => toast.error(err instanceof Error ? err.message : 'Unable to invite student.'),
                  }
                );
              }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="s-name">Full name</Label>
                  <Input id="s-name" name="s-name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-phone">Phone</Label>
                  <Input id="s-phone" name="s-phone" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-email">Email</Label>
                <Input id="s-email" name="s-email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label>Assign to class</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={classes.length ? 'Select a class' : 'No classes yet'} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.uuid} value={c.uuid as string}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createStudent.isPending}>
                  <Send className="mr-2 h-4 w-4" /> Send invite
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="bulk">
            <div className="space-y-3">
              <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 text-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drop a CSV file here, or</p>
                <Button variant="outline" size="sm">
                  Browse files
                </Button>
              </div>
              <Textarea rows={4} placeholder={'name,email,phone,class\nJane Doe,jane@example.com,+2547...'} />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setOpen(false);
                    toast.success('Bulk invites queued', { description: "We'll email each row and notify you when done." });
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" /> Send invites
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
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

  const students = extractPage<User>(studentsQuery.data).items.map(u => {
    const summary = u.uuid ? summaryByStudent.get(u.uuid) : undefined;
    const pct = summary && summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;
    const status = !summary || summary.total === 0 ? 'Invited' : pct >= 100 ? 'Completed' : 'Active';
    return {
      id: u.uuid,
      name: fullName(u),
      status,
      completedCourses: summary?.completed ?? 0,
      totalCourses: summary?.total ?? 0,
      pct,
      category: 'Uncategorised',
    };
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
        action={<InviteStudentsDialog organisationUuid={organisationUuid} />}
      />

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
            action={<InviteStudentsDialog organisationUuid={organisationUuid} />}
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Student</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Course Completion</TableHead>
                  <TableHead className="whitespace-nowrap">Wallet Balance</TableHead>
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
                    <TableCell className="whitespace-nowrap">
                      <WalletCell userUuid={student.id} />
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

// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Eye, LayoutList, MoreHorizontal, PauseCircle, Plus, Send, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ALL_CATEGORIES, CategoryTabs, filterByCategoryTabs } from '@/components/category-tabs';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import { extractList, extractPage } from '@/lib/api-helpers';
import type { ClassDefinition, ClassEnrolmentCountDto, TrainingBranch, User } from '@/services/client';
import {
  deactivateClassDefinitionMutation,
  getClassDefinitionsForOrganisationOptions,
  getClassEnrolmentCountsOptions,
  getTrainingBranchesByOrganisationOptions,
  getUsersByOrganisationAndDomainOptions,
} from '@/services/client/@tanstack/react-query.gen';

const categoryLabel = (cd: ClassDefinition) =>
  cd.location_type === 'ONLINE' ? 'Virtual' : cd.location_type === 'HYBRID' ? 'Hybrid' : 'In-Person';
const instructorInitials = (u?: User) =>
  u ? `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || (u.email?.[0] ?? '?').toUpperCase() : '?';
const instructorName = (u?: User) => (u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'Instructor' : '—');

export default function ClassesPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const router = useRouter();
  const queryClient = useQueryClient();

  const classesQuery = useQuery({ ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }), enabled: Boolean(organisationUuid) });
  const countsQuery = useQuery({ ...getClassEnrolmentCountsOptions({ path: { organisationUuid } }), enabled: Boolean(organisationUuid) });
  const instructorsQuery = useQuery({ ...getUsersByOrganisationAndDomainOptions({ path: { uuid: organisationUuid, domainName: 'instructor' } }), enabled: Boolean(organisationUuid) });
  const venuesQuery = useQuery({ ...getTrainingBranchesByOrganisationOptions({ path: { uuid: organisationUuid }, query: { pageable: { page: 0, size: 200 } } }), enabled: Boolean(organisationUuid) });

  const classDefinitions: ClassDefinition[] = useMemo(
    () => (classesQuery.data?.data ?? []).map(c => c.class_definition).filter((c): c is ClassDefinition => Boolean(c?.uuid)),
    [classesQuery.data]
  );
  const enrolledByClass = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of extractList<ClassEnrolmentCountDto>(countsQuery.data)) if (c.class_definition_uuid) map.set(c.class_definition_uuid, Number(c.enrolled ?? 0));
    return map;
  }, [countsQuery.data]);
  const instructorsByUuid = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of extractPage<User>(instructorsQuery.data).items) if (u.uuid) map.set(u.uuid, u);
    return map;
  }, [instructorsQuery.data]);
  const venuesByUuid = useMemo(() => {
    const map = new Map<string, TrainingBranch>();
    for (const v of extractPage<TrainingBranch>(venuesQuery.data).items) if (v.uuid) map.set(v.uuid, v);
    return map;
  }, [venuesQuery.data]);

  const rows = useMemo(
    () => classDefinitions.map(cd => {
      const scheduled = Number(cd.scheduled_session_count ?? 0);
      const completed = Number(cd.completed_session_count ?? 0);
      const venue = cd.venue_resource_uuid ? venuesByUuid.get(cd.venue_resource_uuid) : undefined;
      return {
        uuid: cd.uuid as string,
        title: cd.title,
        category: categoryLabel(cd),
        subject: null as string | null,
        programType: null,
        instructor: instructorsByUuid.get(cd.default_instructor_uuid ?? ''),
        venueName: venue?.branch_name ?? cd.location_name ?? (cd.location_type === 'ONLINE' ? 'Online' : '—'),
        start: cd.default_start_time,
        capacity: cd.max_participants ?? null,
        enrolled: enrolledByClass.get(cd.uuid as string) ?? 0,
        completion: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
        status: cd.is_active === false ? 'Inactive' : 'Active',
      };
    }),
    [classDefinitions, enrolledByClass, instructorsByUuid, venuesByUuid]
  );

  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [subjectByCategory, setSubjectByCategory] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => filterByCategoryTabs(rows, activeCategory, subjectByCategory, null), [rows, activeCategory, subjectByCategory]);

  const kpis = useMemo(() => ({
    total: rows.length,
    active: rows.filter(r => r.status === 'Active').length,
    inactive: rows.filter(r => r.status === 'Inactive').length,
    enrolled: rows.reduce((a, r) => a + r.enrolled, 0),
  }), [rows]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }).queryKey });
  const deactivateMutation = useMutation({
    ...deactivateClassDefinitionMutation(),
    onSuccess: () => { refresh(); toast.success('Class suspended'); },
    onError: () => toast.error('Could not suspend class'),
  });
  const suspend = (uuid: string) => deactivateMutation.mutate({ path: { uuid } });
  const suspendSelected = () => {
    const active = filtered.filter(r => selectedIds.has(r.uuid) && r.status === 'Active');
    active.forEach(r => deactivateMutation.mutate({ path: { uuid: r.uuid } }));
    if (active.length) toast.success(`Suspending ${active.length} class${active.length === 1 ? '' : 'es'}`);
    setSelectedIds(new Set());
  };

  const inViewSelected = filtered.filter(r => selectedIds.has(r.uuid)).length;
  const allViewChecked = filtered.length > 0 && inViewSelected === filtered.length ? true : inViewSelected > 0 ? 'indeterminate' : false;
  const toggleAll = (v: boolean) => setSelectedIds(prev => {
    const next = new Set(prev);
    filtered.forEach(r => (v ? next.add(r.uuid) : next.delete(r.uuid)));
    return next;
  });
  const toggleOne = (uuid: string, v: boolean) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (v) next.add(uuid); else next.delete(uuid);
    return next;
  });

  const loading = classesQuery.isLoading;
  const createButton = (
    <Button asChild className="gap-1.5">
      <Link href="/dashboard/classes/new"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Create class</span><span className="sm:hidden">Create</span></Link>
    </Button>
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <PageHeader title="Classes" description="Schedule cohorts, assign instructors, and track capacity." action={createButton} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary"><CardContent className="p-6"><div className="text-2xl font-bold">{kpis.total}</div><div className="text-xs text-muted-foreground">Total classes</div></CardContent></Card>
        <Card className="border-l-4 border-l-success"><CardContent className="p-6"><div className="text-2xl font-bold">{kpis.active}</div><div className="text-xs text-muted-foreground">Active</div></CardContent></Card>
        <Card className="border-l-4 border-l-warning"><CardContent className="p-6"><div className="text-2xl font-bold">{kpis.inactive}</div><div className="text-xs text-muted-foreground">Inactive</div></CardContent></Card>
        <Card className="border-l-4 border-l-teal-400"><CardContent className="p-6"><div className="text-2xl font-bold">{kpis.enrolled}</div><div className="text-xs text-muted-foreground">Enrolled students</div></CardContent></Card>
      </div>

      {rows.length > 0 && (
        <CategoryTabs items={rows} activeCategory={activeCategory} onCategoryChange={setActiveCategory} subjectByCategory={subjectByCategory} onSubjectChange={setSubjectByCategory} />
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <LayoutList className="mx-auto h-8 w-8 text-muted-foreground" />
          <div className="mt-2 font-medium">No classes yet</div>
          <p className="text-sm text-muted-foreground">Post a class for a course you're approved to offer — instructors can then apply.</p>
          <Button asChild className="mt-4 gap-1.5"><Link href="/dashboard/classes/new"><Plus className="h-4 w-4" /> Create class</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
              <span className="text-sm"><span className="font-medium">{inViewSelected}</span> of {filtered.length} selected</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={suspendSelected} disabled={deactivateMutation.isPending}><PauseCircle className="mr-2 h-4 w-4" /> Suspend selected</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear</Button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto rounded-lg border">
            <Table className="min-w-[960px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"><Checkbox aria-label="Select all classes in view" checked={allViewChecked} onCheckedChange={v => toggleAll(Boolean(v))} /></TableHead>
                  <TableHead className="whitespace-nowrap">Class</TableHead>
                  <TableHead className="min-w-[110px] whitespace-nowrap">Mode</TableHead>
                  <TableHead className="whitespace-nowrap">Instructor</TableHead>
                  <TableHead className="whitespace-nowrap">Venue</TableHead>
                  <TableHead className="whitespace-nowrap">Schedule</TableHead>
                  <TableHead className="min-w-[140px] whitespace-nowrap">Capacity</TableHead>
                  <TableHead className="min-w-[140px] whitespace-nowrap">Completion</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => {
                  const capPct = r.capacity ? Math.min(100, Math.round((r.enrolled / r.capacity) * 100)) : 0;
                  return (
                    <TableRow key={r.uuid} data-state={selectedIds.has(r.uuid) ? 'selected' : undefined}>
                      <TableCell><Checkbox aria-label={`Select ${r.title}`} checked={selectedIds.has(r.uuid)} onCheckedChange={v => toggleOne(r.uuid, Boolean(v))} /></TableCell>
                      <TableCell className="whitespace-nowrap font-medium">{r.title}</TableCell>
                      <TableCell className="min-w-[110px] whitespace-nowrap"><Badge variant="outline" className="text-xs">{r.category}</Badge></TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 shrink-0">
                            {r.instructor?.profile_image_url && <AvatarImage src={r.instructor.profile_image_url} alt={instructorName(r.instructor)} />}
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">{instructorInitials(r.instructor)}</AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground">{instructorName(r.instructor)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{r.venueName}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{r.start ? dayjs(r.start).format('ddd, DD MMM · HH:mm') : '—'}</TableCell>
                      <TableCell className="min-w-[140px]">
                        <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>{r.enrolled}{r.capacity ? `/${r.capacity}` : ''}</span>{r.capacity ? <span>{capPct}%</span> : null}</div>
                        <Progress value={capPct} className="h-2" />
                      </TableCell>
                      <TableCell className="min-w-[140px]">
                        <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>{r.completion}%</span></div>
                        <Progress value={r.completion} className="h-2" />
                      </TableCell>
                      <TableCell className="whitespace-nowrap"><Badge variant={r.status === 'Active' ? 'default' : 'secondary'}>{r.status}</Badge></TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push('/dashboard/calendar')}><Eye className="mr-2 h-4 w-4" /> View schedule</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/dashboard/students')}><Users className="mr-2 h-4 w-4" /> Manage enrolment</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push('/dashboard/notifications')}><Send className="mr-2 h-4 w-4" /> Message class</DropdownMenuItem>
                            {r.status === 'Active' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" disabled={deactivateMutation.isPending} onClick={() => suspend(r.uuid)}><PauseCircle className="mr-2 h-4 w-4" /> Suspend class</DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

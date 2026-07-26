// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { Archive, BookOpen, Briefcase, Eye, MoreHorizontal, Pencil, PlusSquare } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ALL_CATEGORIES, CategoryTabs, filterByCategoryTabs } from '@/components/category-tabs';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import { extractEntity } from '@/lib/api-helpers';
import type { ClassDefinition, Course, CourseTrainingApplication, User } from '@/services/client';
import {
  getClassDefinitionsForOrganisationOptions,
  getCourseByUuidOptions,
  getUsersByOrganisationAndDomainOptions,
  searchTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';

const currency = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
});

const PROGRAM_TYPES = [
  'Short courses',
  'Boot camps',
  'Professional Certificate',
  'TVET',
  'Diploma programs',
  'Postgraduate programs',
  'Degree programs',
];

/** Rate-card cells → Lovable's pricing-tier vocabulary (session format + location). */
const RATE_TIERS: { method: string; fmt: string; loc: string; key: keyof NonNullable<CourseTrainingApplication['rate_card']> }[] = [
  { method: 'Group In-Person', fmt: 'GROUP', loc: 'IN_PERSON', key: 'group_inperson_rate' },
  { method: 'Group Virtual', fmt: 'GROUP', loc: 'ONLINE', key: 'group_online_rate' },
  { method: 'Private In-Person', fmt: 'INDIVIDUAL', loc: 'IN_PERSON', key: 'private_inperson_rate' },
  { method: 'Private Virtual', fmt: 'INDIVIDUAL', loc: 'ONLINE', key: 'private_online_rate' },
];

const normStatus = (s?: string): string => {
  const v = (s ?? '').toLowerCase();
  if (v === 'approved' || v === 'accepted') return 'Active';
  if (v === 'rejected' || v === 'revoked' || v === 'withdrawn') return 'Rejected';
  if (v === 'completed') return 'Completed';
  return 'Pending';
};

const instructorInitials = (u?: User) =>
  u ? `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || (u.email?.[0] ?? '?').toUpperCase() : '?';
const instructorName = (u?: User) =>
  u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'Instructor' : '—';

function CourseImage({ src, alt }: { src?: string | null; alt: string }) {
  if (src) {
    return <img src={src} alt={alt} className="h-12 w-16 shrink-0 rounded-md object-cover" />;
  }
  return (
    <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-primary/5">
      <BookOpen className="h-5 w-5 text-primary/70" />
    </div>
  );
}

function CourseActions({ status, onArchive }: { status: string; onArchive: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => toast.info('Course details', { description: 'Opening course details.' })}>
          <Eye className="mr-2 h-4 w-4" /> View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.info('Edit course', { description: 'Opening the course editor.' })}>
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => toast.info('Post a job', { description: 'Drafting an instructor job for this course.' })}>
          <Briefcase className="mr-2 h-4 w-4" /> Post a job
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.info('Create class', { description: 'Starting a new class from this course.' })}>
          <PlusSquare className="mr-2 h-4 w-4" /> Create class
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onArchive} disabled={status === 'Archived'}>
          <Archive className="mr-2 h-4 w-4" /> Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function CoursesPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  // Approved/engaged courses the org is running come from its training applications (which carry the rate card).
  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({
      query: {
        searchParams: { applicant_uuid_eq: organisationUuid, applicant_type_eq: 'organisation' },
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: Boolean(organisationUuid),
  });
  const applications: CourseTrainingApplication[] = applicationsQuery.data?.data?.content ?? [];

  // Class definitions give the real instructor + lesson count per delivery method.
  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const classDefByKey = useMemo(() => {
    const map = new Map<string, ClassDefinition>();
    for (const c of classesQuery.data?.data ?? []) {
      const cd = c.class_definition as ClassDefinition | undefined;
      if (cd?.course_uuid) map.set(`${cd.course_uuid}|${cd.session_format}|${cd.location_type}`, cd);
    }
    return map;
  }, [classesQuery.data]);

  const instructorsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({ path: { uuid: organisationUuid, domainName: 'instructor' } }),
    enabled: Boolean(organisationUuid),
  });
  const instructorsByUuid = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of (instructorsQuery.data?.data ?? []) as User[]) if (u.uuid) map.set(u.uuid, u);
    return map;
  }, [instructorsQuery.data]);

  // Resolve each linked course once for name / subject-area / image.
  const distinctCourseUuids = useMemo(
    () => Array.from(new Set(applications.map(a => a.course_uuid).filter(Boolean) as string[])),
    [applications]
  );
  const courseQueries = useQueries({
    queries: distinctCourseUuids.map(uuid => ({
      ...getCourseByUuidOptions({ path: { uuid } }),
      enabled: Boolean(uuid),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const courseByUuid = useMemo(() => {
    const map = new Map<string, Course>();
    courseQueries.forEach((q, i) => {
      const course = extractEntity<Course>(q.data);
      if (course) map.set(distinctCourseUuids[i], course);
    });
    return map;
  }, [courseQueries, distinctCourseUuids]);

  const [archived, setArchived] = useState<Record<string, true>>({});
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [subjectByCategory, setSubjectByCategory] = useState<Record<string, string>>({});
  const [activeProgramType, setActiveProgramType] = useState<string | null>(null);

  // One entry per (application × rate-card tier) — a course appears once per delivery method it's priced for.
  const rows = useMemo(
    () =>
      applications.flatMap(app => {
        const courseUuid = app.course_uuid ?? '';
        const course = courseByUuid.get(courseUuid);
        const cats = course?.category_names ?? [];
        const category = cats[0] ?? 'General';
        const subject = cats[1] ?? cats[0] ?? null;
        const name = course?.name ?? app.course_uuid ?? 'Course';
        const image = course?.banner_url ?? course?.thumbnail_url ?? null;
        const baseStatus = archived[app.uuid as string] ? 'Archived' : normStatus(app.status);

        const tiers = RATE_TIERS.filter(t => Number(app.rate_card?.[t.key] ?? 0) > 0);
        const effectiveTiers = tiers.length ? tiers : [{ method: '—', fmt: '', loc: '', key: '' }];

        return effectiveTiers.map((tier, idx) => {
          const cd = tier.fmt ? classDefByKey.get(`${courseUuid}|${tier.fmt}|${tier.loc}`) : undefined;
          return {
            rowKey: `${app.uuid}-${idx}`,
            category,
            subject,
            programType: null,
            displayName: effectiveTiers.length > 1 ? `${name} — ${tier.method}` : name,
            subjectLabel: subject ?? '—',
            method: tier.method,
            amount: tier.key ? Number(app.rate_card?.[tier.key] ?? 0) : (cd?.training_fee ?? 0),
            lessons: cd ? Number(cd.scheduled_session_count ?? 0) : 0,
            instructor: instructorsByUuid.get(cd?.default_instructor_uuid ?? ''),
            image,
            status: baseStatus,
          };
        });
      }),
    [applications, courseByUuid, classDefByKey, instructorsByUuid, archived]
  );

  const filteredRows = useMemo(
    () => filterByCategoryTabs(rows, activeCategory, subjectByCategory, activeProgramType),
    [rows, activeCategory, subjectByCategory, activeProgramType]
  );

  const handleArchive = (appUuid: string, name: string) => {
    setArchived(prev => ({ ...prev, [appUuid]: true }));
    toast.success('Course archived', { description: `${name} has been archived.` });
  };

  const loading = applicationsQuery.isLoading;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <PageHeader title="Courses & Programs" description="Approved courses your organisation is running." />

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Courses your organisation is approved to run will appear here once you apply to train."
        />
      ) : (
        <>
          <CategoryTabs
            items={rows}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            subjectByCategory={subjectByCategory}
            onSubjectChange={setSubjectByCategory}
            allProgramTypes={PROGRAM_TYPES}
            activeProgramType={activeProgramType}
            onProgramTypeChange={setActiveProgramType}
          />

          <div className="space-y-4">
            <div className="space-y-3">
              {/* Mobile card list */}
              <div className="sm:hidden">
                {filteredRows.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">No courses available.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredRows.map(row => (
                      <div key={row.rowKey} className="flex items-start gap-3 p-3">
                        <CourseImage src={row.image} alt={row.displayName} />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="truncate font-medium">{row.displayName}</span>
                            <Badge variant={row.status === 'Active' ? 'default' : 'secondary'} className="shrink-0">
                              {row.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{row.subjectLabel}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs">{row.method}</Badge>
                            <Badge variant="outline" className="text-xs">
                              {row.amount > 0 ? currency.format(row.amount) : '—'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{row.lessons} Lessons</Badge>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <Avatar className="h-6 w-6 shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                                  {instructorInitials(row.instructor)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate text-sm text-muted-foreground">{instructorName(row.instructor)}</span>
                            </div>
                            <CourseActions status={row.status} onArchive={() => handleArchive(row.rowKey.split('-')[0], row.displayName)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto rounded-lg border sm:block">
                <Table className="min-w-[820px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24 whitespace-nowrap">Image</TableHead>
                      <TableHead className="whitespace-nowrap">Course</TableHead>
                      <TableHead className="min-w-[120px] whitespace-nowrap">Subject</TableHead>
                      <TableHead className="whitespace-nowrap">Lecture Type</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Amount</TableHead>
                      <TableHead className="whitespace-nowrap">Lessons #</TableHead>
                      <TableHead className="whitespace-nowrap">Instructor</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                          No courses available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRows.map(row => (
                        <TableRow key={row.rowKey}>
                          <TableCell className="whitespace-nowrap">
                            <CourseImage src={row.image} alt={row.displayName} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium">{row.displayName}</TableCell>
                          <TableCell className="min-w-[120px] whitespace-nowrap">{row.subjectLabel}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="outline" className="text-xs">{row.method}</Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right font-mono">
                            {row.amount > 0 ? currency.format(row.amount) : '—'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{row.lessons}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                  {instructorInitials(row.instructor)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-muted-foreground">{instructorName(row.instructor)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant={row.status === 'Active' ? 'default' : 'secondary'}>{row.status}</Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            <CourseActions status={row.status} onArchive={() => handleArchive(row.rowKey.split('-')[0], row.displayName)} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

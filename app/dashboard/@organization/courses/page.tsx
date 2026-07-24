// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import { Archive, BookOpen, Briefcase, Eye, MoreHorizontal, Pencil, PlusSquare } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CategoryTabs, filterByCategoryTabs } from '@/components/category-tabs';
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
import { extractPage } from '@/lib/api-helpers';
import type { ClassDefinition, User } from '@/services/client';
import {
  getClassDefinitionsForOrganisationOptions,
  getUsersByOrganisationAndDomainOptions,
} from '@/services/client/@tanstack/react-query.gen';

const currency = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
});

/** Real delivery method label in Lovable's vocabulary, derived from session_format + location_type. */
const methodLabel = (cd: ClassDefinition) => {
  const fmt = cd.session_format === 'INDIVIDUAL' ? 'Private' : 'Group';
  if (cd.location_type === 'HYBRID') return `${fmt} Hybrid`;
  const loc = cd.location_type === 'ONLINE' ? 'Virtual' : 'In-Person';
  return `${fmt} ${loc}`;
};

/** Delivery mode used as the category dimension for the tabs. */
const categoryLabel = (cd: ClassDefinition) =>
  cd.location_type === 'ONLINE' ? 'Virtual' : cd.location_type === 'HYBRID' ? 'Hybrid' : 'In-Person';

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
          <Eye className="mr-2 h-4 w-4" />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.info('Edit course', { description: 'Opening the course editor.' })}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => toast.info('Post a job', { description: 'Drafting an instructor job for this course.' })}>
          <Briefcase className="mr-2 h-4 w-4" />
          Post a job
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.info('Create class', { description: 'Starting a new class from this course.' })}>
          <PlusSquare className="mr-2 h-4 w-4" />
          Create class
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onArchive} disabled={status === 'Archived'}>
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const ALL_CATEGORIES = 'All';

export default function CoursesPage() {
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';

  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });

  const instructorsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'instructor' },
    }),
    enabled: Boolean(organisationUuid),
  });

  const instructorsByUuid = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of extractPage<User>(instructorsQuery.data).items) {
      if (u.uuid) map.set(u.uuid, u);
    }
    return map;
  }, [instructorsQuery.data]);

  const classDefinitions: ClassDefinition[] = useMemo(
    () =>
      (classesQuery.data?.data ?? [])
        .map(c => c.class_definition)
        .filter((c): c is ClassDefinition => Boolean(c?.uuid)),
    [classesQuery.data]
  );

  // Course-uuid grouping so a course running in multiple modes shows "Course — Method".
  const courseUuidCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const cd of classDefinitions) {
      if (cd.course_uuid) counts.set(cd.course_uuid, (counts.get(cd.course_uuid) ?? 0) + 1);
    }
    return counts;
  }, [classDefinitions]);

  const [archived, setArchived] = useState<Record<string, true>>({});
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [subjectByCategory, setSubjectByCategory] = useState<Record<string, string>>({});

  const courses = useMemo(
    () =>
      classDefinitions.map(cd => {
        const method = methodLabel(cd);
        const siblings = cd.course_uuid ? (courseUuidCounts.get(cd.course_uuid) ?? 1) : 1;
        const status = archived[cd.uuid as string]
          ? 'Archived'
          : cd.is_active === false
            ? 'Inactive'
            : 'Active';
        return {
          rowKey: cd.uuid as string,
          category: categoryLabel(cd),
          subject: null as string | null,
          programType: null as string | null,
          displayName: siblings > 1 ? `${cd.title} — ${method}` : cd.title,
          subjectLabel: '—',
          method,
          amount: cd.training_fee ?? 0,
          lessons: Number(cd.scheduled_session_count ?? 0),
          instructor: instructorsByUuid.get(cd.default_instructor_uuid ?? ''),
          image: cd.thumbnail_url ?? null,
          status,
        };
      }),
    [classDefinitions, courseUuidCounts, instructorsByUuid, archived]
  );

  const rows = useMemo(
    () => filterByCategoryTabs(courses, activeCategory, subjectByCategory, null),
    [courses, activeCategory, subjectByCategory]
  );

  const handleArchive = (rowKey: string, name: string) => {
    setArchived(prev => ({ ...prev, [rowKey]: true }));
    toast.success('Course archived', { description: `${name} has been archived.` });
  };

  const loading = classesQuery.isLoading;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-4 sm:px-5 lg:px-6 2xl:max-w-[1840px]">
      <PageHeader title="Courses & Programs" description="Approved courses your organisation is running." />

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Courses your organisation is approved to run will appear here once you create classes."
        />
      ) : (
        <>
          <CategoryTabs
            items={courses}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            subjectByCategory={subjectByCategory}
            onSubjectChange={setSubjectByCategory}
          />

          <div className="space-y-4">
            <div className="space-y-3">
              {/* Mobile card list */}
              <div className="sm:hidden">
                {rows.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">No courses available.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {rows.map(row => (
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
                            <Badge variant="outline" className="text-xs">
                              {row.method}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {row.amount > 0 ? currency.format(row.amount) : '—'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {row.lessons} Lessons
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <Avatar className="h-6 w-6 shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                                  {instructorInitials(row.instructor)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate text-sm text-muted-foreground">
                                {instructorName(row.instructor)}
                              </span>
                            </div>
                            <CourseActions status={row.status} onArchive={() => handleArchive(row.rowKey, row.displayName)} />
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
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                          No courses available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map(row => (
                        <TableRow key={row.rowKey}>
                          <TableCell className="whitespace-nowrap">
                            <CourseImage src={row.image} alt={row.displayName} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-medium">{row.displayName}</TableCell>
                          <TableCell className="min-w-[120px] whitespace-nowrap text-muted-foreground">
                            {row.subjectLabel}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="outline" className="text-xs">
                              {row.method}
                            </Badge>
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
                            <CourseActions status={row.status} onArchive={() => handleArchive(row.rowKey, row.displayName)} />
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

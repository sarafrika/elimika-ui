// @ts-nocheck -- 1:1 Lovable port; @hey-api generated-client type drift
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Archive,
  BookOpen,
  Briefcase,
  Eye,
  MoreHorizontal,
  Pencil,
  PlusSquare,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ALL_CATEGORIES, CategoryTabs, filterByCategoryTabs } from '@/components/category-tabs';
import { ImageWithFallback } from '@/components/data/image-with-fallback';
import { surfaceTheme } from '@/components/data-display';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOrganisation } from '@/context/organisation-context';
import {
  useCategoriesByIds,
  useCoursesByIds,
  useInstructorsByIds,
  useProgramsByIds,
} from '@/hooks/use-batched-lookups';
import { APPROVAL_QUERY_FRESHNESS, STALE_TIMES } from '@/lib/query-client';
import { offeredMethods, type TrainingMethod } from '@/lib/rate-card';
import { cn } from '@/lib/utils';
import type { ClassDefinition, Instructor, User } from '@/services/client';
import {
  getClassDefinitionsForOrganisationOptions,
  getUsersByOrganisationAndDomainOptions,
  searchTrainingApplicationsOptions,
  searchProgramTrainingApplicationsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { createClassHref, postJobHref } from '@/src/features/organisation/class-builder/routes';
import { lowestRatesLabel } from '@/src/features/rate-card/application-display';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import {
  approvedTrainingDetailsHref,
  approvedTrainingItems,
  approvedTrainingPrefill,
} from './approved-training';

const PAGE_SIZE = 20;

const PROGRAM_TYPES = [
  'Short courses',
  'Boot camps',
  'Professional Certificate',
  'TVET',
  'Diploma programs',
  'Postgraduate programs',
  'Degree programs',
];

/** A training method as the class definitions key it: session format and location. */
const methodClassKey = (method: TrainingMethod) =>
  `${method.format}|${method.location === 'online' ? 'ONLINE' : 'IN_PERSON'}`;

const normStatus = (s?: string): string => {
  const v = (s ?? '').toLowerCase();
  if (v === 'approved' || v === 'accepted') return 'Active';
  if (v === 'rejected' || v === 'revoked' || v === 'withdrawn') return 'Rejected';
  if (v === 'completed') return 'Completed';
  return 'Pending';
};

type ClassInstructor = { name: string; imageUrl?: string | null } | undefined;

const instructorInitials = (i: ClassInstructor) =>
  i
    ? i.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join('')
        .toUpperCase() || '?'
    : '?';
const instructorName = (i: ClassInstructor) => i?.name ?? '—';

function CourseImage({ src, alt }: { src?: string | null; alt: string }) {
  return (
    <ImageWithFallback
      src={src}
      alt={alt}
      width={64}
      height={48}
      sizes='64px'
      className='h-12 w-16 shrink-0 rounded-md object-cover'
      fallback={
        <div className='from-primary/15 to-primary/5 flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-gradient-to-br'>
          <BookOpen className='text-primary/70 h-5 w-5' />
        </div>
      }
    />
  );
}

function CourseActions({
  status,
  onArchive,
  onView,
  onPostJob,
  onCreateClass,
}: {
  status: string;
  onArchive: () => void;
  onView: () => void;
  onPostJob: () => void;
  onCreateClass: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='h-8 w-8' onClick={e => e.stopPropagation()}>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' onClick={e => e.stopPropagation()}>
        <DropdownMenuItem onClick={onView}>
          <Eye className='mr-2 h-4 w-4' /> View details
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => toast.info('Edit course', { description: 'Opening the course editor.' })}
        >
          <Pencil className='mr-2 h-4 w-4' /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onPostJob}>
          <Briefcase className='mr-2 h-4 w-4' /> Post a job
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCreateClass}>
          <PlusSquare className='mr-2 h-4 w-4' /> Create class
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onArchive} disabled={status === 'Archived'}>
          <Archive className='mr-2 h-4 w-4' /> Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function CoursesPage() {
  const router = useRouter();
  const organisation = useOrganisation();
  const organisationUuid = organisation?.uuid ?? '';
  const [page, setPage] = useState(0);
  const goToItem = (row: { kind: 'course' | 'program'; itemUuid: string }) =>
    router.push(approvedTrainingDetailsHref(row.kind, row.itemUuid));
  const postJobForItem = (row: { kind: 'course' | 'program'; itemUuid: string }) =>
    router.push(postJobHref(approvedTrainingPrefill(row.kind, row.itemUuid)));
  const goToNewClass = (row: { kind: 'course' | 'program'; itemUuid: string }) =>
    router.push(createClassHref(approvedTrainingPrefill(row.kind, row.itemUuid)));

  const search = {
    searchParams: {
      applicant_uuid_eq: organisationUuid,
      applicant_type_eq: 'organisation',
      status_eq: 'approved',
    },
    pageable: { page, size: PAGE_SIZE },
  };
  const applicationsQuery = useQuery({
    ...searchTrainingApplicationsOptions({ query: search }),
    enabled: Boolean(organisationUuid),
    staleTime: STALE_TIMES.live,
    ...APPROVAL_QUERY_FRESHNESS,
  });
  const programApplicationsQuery = useQuery({
    ...searchProgramTrainingApplicationsOptions({ query: search }),
    enabled: Boolean(organisationUuid),
    staleTime: STALE_TIMES.live,
    ...APPROVAL_QUERY_FRESHNESS,
  });
  const applications = useMemo(
    () =>
      approvedTrainingItems(
        organisationUuid,
        applicationsQuery.data?.error || applicationsQuery.data?.success === false
          ? []
          : (applicationsQuery.data?.data?.content ?? []),
        programApplicationsQuery.data?.error || programApplicationsQuery.data?.success === false
          ? []
          : (programApplicationsQuery.data?.data?.content ?? [])
      ),
    [organisationUuid, applicationsQuery.data, programApplicationsQuery.data]
  );
  const totalPages = Math.max(
    1,
    applicationsQuery.data?.data?.metadata?.totalPages ?? 1,
    programApplicationsQuery.data?.data?.metadata?.totalPages ?? 1
  );

  // Class definitions give the real instructor + lesson count per delivery method.
  const classesQuery = useQuery({
    ...getClassDefinitionsForOrganisationOptions({ path: { organisationUuid } }),
    enabled: Boolean(organisationUuid),
  });
  const classDefByKey = useMemo(() => {
    const map = new Map<string, ClassDefinition>();
    for (const c of classesQuery.data?.data ?? []) {
      const cd = c.class_definition as ClassDefinition | undefined;
      if (cd?.program_uuid)
        map.set(`program:${cd.program_uuid}|${cd.session_format}|${cd.location_type}`, cd);
      else if (cd?.course_uuid)
        map.set(`course:${cd.course_uuid}|${cd.session_format}|${cd.location_type}`, cd);
    }
    return map;
  }, [classesQuery.data]);

  const instructorsQuery = useQuery({
    ...getUsersByOrganisationAndDomainOptions({
      path: { uuid: organisationUuid, domainName: 'instructor' },
    }),
    enabled: Boolean(organisationUuid),
  });
  const orgUsersByUuid = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of (instructorsQuery.data?.data ?? []) as User[]) if (u.uuid) map.set(u.uuid, u);
    return map;
  }, [instructorsQuery.data]);
  const classInstructorUuids = useMemo(
    () =>
      Array.from(
        new Set(
          Array.from(classDefByKey.values())
            .map(cd => cd.default_instructor_uuid)
            .filter(Boolean) as string[]
        )
      ),
    [classDefByKey]
  );
  const { instructorMap } = useInstructorsByIds(classInstructorUuids);
  const resolveInstructor = useCallback(
    (instructorUuid?: string | null): ClassInstructor => {
      if (!instructorUuid) return undefined;
      const profile: Instructor | undefined = instructorMap[instructorUuid];
      const user = orgUsersByUuid.get(profile?.user_uuid ?? instructorUuid);
      const name =
        profile?.full_name?.trim() ||
        `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() ||
        user?.email ||
        '';
      if (!name) return undefined;
      return { name, imageUrl: toAuthenticatedMediaUrl(user?.profile_image_url) };
    },
    [instructorMap, orgUsersByUuid]
  );

  // Batch only the approved entities on this page, regardless of row count.
  const courseIds = useMemo(
    () => applications.flatMap(item => (item.kind === 'course' && item.uuid ? [item.uuid] : [])),
    [applications]
  );
  const programIds = useMemo(
    () => applications.flatMap(item => (item.kind === 'program' && item.uuid ? [item.uuid] : [])),
    [applications]
  );
  const { courseMap, isLoading: coursesLoading } = useCoursesByIds(courseIds);
  const { programMap, isLoading: programsLoading } = useProgramsByIds(programIds);
  const categoryIds = useMemo(
    () =>
      Object.values(programMap).flatMap(program =>
        program.category_uuid ? [program.category_uuid] : []
      ),
    [programMap]
  );
  const { categoryMap } = useCategoriesByIds(categoryIds);

  const [archived, setArchived] = useState<Record<string, true>>({});
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [subjectByCategory, setSubjectByCategory] = useState<Record<string, string>>({});
  const [activeProgramType, setActiveProgramType] = useState<string | null>(null);

  // One row per approved course or programme, with delivery methods summarised.
  const rows = useMemo(
    () =>
      applications.map(({ kind, uuid: itemUuid, application: app }) => {
        const course = kind === 'course' ? courseMap[itemUuid] : undefined;
        const program = kind === 'program' ? programMap[itemUuid] : undefined;
        const cats = course?.category_names ?? [];
        const category = program
          ? (categoryMap[program.category_uuid ?? '']?.name ?? 'General')
          : (cats[0] ?? 'General');
        const subject = cats[1] ?? cats[0] ?? null;
        const name =
          program?.title ?? course?.name ?? (kind === 'program' ? 'Programme' : 'Course');
        const image =
          toAuthenticatedMediaUrl(
            program?.banner_url ??
              program?.thumbnail_url ??
              course?.banner_url ??
              course?.thumbnail_url
          ) ?? null;
        const rowKey = `${kind}:${itemUuid}`;
        const status = archived[rowKey] ? 'Archived' : normStatus(app.status);

        const methods = offeredMethods(app.rate_card);
        const classDefs = methods
          .map(method => classDefByKey.get(`${kind}:${itemUuid}|${methodClassKey(method)}`))
          .filter((cd): cd is ClassDefinition => Boolean(cd));

        const instructors = Array.from(
          new Map(
            classDefs
              .map(cd => resolveInstructor(cd.default_instructor_uuid))
              .filter((i): i is NonNullable<ClassInstructor> => Boolean(i))
              .map(i => [i.name, i])
          ).values()
        );

        return {
          rowKey,
          kind,
          itemUuid,
          category,
          subject,
          programType: program?.program_type ?? null,
          displayName: name,
          subjectLabel: subject ?? '—',
          methods: methods.map(method => method.label),
          rates: lowestRatesLabel(app.rate_card) ?? '—',
          lessons: classDefs.reduce((sum, cd) => sum + Number(cd.scheduled_session_count ?? 0), 0),
          instructor: instructors[0],
          extraInstructorCount: Math.max(instructors.length - 1, 0),
          image,
          status,
        };
      }),
    [applications, courseMap, programMap, categoryMap, classDefByKey, resolveInstructor, archived]
  );

  const filteredRows = useMemo(
    () => filterByCategoryTabs(rows, activeCategory, subjectByCategory, activeProgramType),
    [rows, activeCategory, subjectByCategory, activeProgramType]
  );

  const handleArchive = (appUuid: string, name: string) => {
    setArchived(prev => ({ ...prev, [appUuid]: true }));
    toast.success('Training item archived', { description: `${name} has been archived.` });
  };

  const loading =
    applicationsQuery.isLoading ||
    programApplicationsQuery.isLoading ||
    coursesLoading ||
    programsLoading;
  const error =
    applicationsQuery.error ||
    programApplicationsQuery.error ||
    applicationsQuery.data?.error ||
    programApplicationsQuery.data?.error ||
    applicationsQuery.data?.success === false ||
    programApplicationsQuery.data?.success === false;

  return (
    <div className={`${surfaceTheme.pageWide} space-y-6 py-4`}>
      <PageHeader
        title='Courses & Programs'
        description='Courses and programmes your organisation is approved to train.'
      />

      {error ? (
        <EmptyState
          icon={BookOpen}
          title='Could not load approved training'
          description='Please try again to load your approved courses and programmes.'
          action={
            <Button
              onClick={() => {
                void applicationsQuery.refetch();
                void programApplicationsQuery.refetch();
              }}
            >
              Try again
            </Button>
          }
        />
      ) : loading ? (
        <div className='space-y-2'>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className='h-14 w-full' />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title='No approved courses or programmes'
          description='Courses and programmes will appear here once your organisation is approved to train them.'
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

          <div className='space-y-4'>
            <div className='space-y-3'>
              {/* Mobile card list */}
              <div className='sm:hidden'>
                {filteredRows.length === 0 ? (
                  <div className='text-muted-foreground py-12 text-center'>
                    No courses or programmes available.
                  </div>
                ) : (
                  <div className='divide-border divide-y'>
                    {filteredRows.map(row => (
                      <div
                        key={row.rowKey}
                        role='button'
                        tabIndex={0}
                        onClick={() => goToItem(row)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            goToItem(row);
                          }
                        }}
                        className={cn(
                          'hover:bg-muted/40 flex cursor-pointer items-start gap-3 p-3',
                          row.kind === 'program' && 'bg-primary/5 hover:bg-primary/10'
                        )}
                      >
                        <CourseImage src={row.image} alt={row.displayName} />
                        <div className='min-w-0 flex-1 space-y-1.5'>
                          <div className='flex items-start justify-between gap-2'>
                            <div className='min-w-0'>
                              <span className='block truncate font-medium'>{row.displayName}</span>
                            </div>
                            <Badge
                              variant={row.status === 'Active' ? 'default' : 'secondary'}
                              className='shrink-0'
                            >
                              {row.status}
                            </Badge>
                          </div>
                          <p className='text-muted-foreground text-xs'>{row.subjectLabel}</p>
                          <div className='flex flex-wrap items-center gap-2'>
                            {row.methods.length === 0 ? (
                              <Badge variant='outline' className='text-xs'>
                                —
                              </Badge>
                            ) : (
                              row.methods.map(method => (
                                <Badge key={method} variant='outline' className='text-xs'>
                                  {method}
                                </Badge>
                              ))
                            )}
                            <Badge variant='outline' className='text-xs'>
                              {row.rates}
                            </Badge>
                            <Badge variant='outline' className='text-xs'>
                              {row.lessons} Lessons
                            </Badge>
                          </div>
                          <div className='flex items-center justify-between gap-2'>
                            <div className='flex min-w-0 items-center gap-2'>
                              <Avatar className='h-6 w-6 shrink-0'>
                                {row.instructor?.imageUrl && (
                                  <AvatarImage
                                    src={row.instructor.imageUrl}
                                    alt={instructorName(row.instructor)}
                                  />
                                )}
                                <AvatarFallback className='bg-primary/10 text-primary text-[10px] font-semibold'>
                                  {instructorInitials(row.instructor)}
                                </AvatarFallback>
                              </Avatar>
                              <span className='text-muted-foreground truncate text-sm'>
                                {instructorName(row.instructor)}
                                {row.extraInstructorCount > 0
                                  ? ` +${row.extraInstructorCount}`
                                  : ''}
                              </span>
                            </div>
                            <CourseActions
                              status={row.status}
                              onView={() => goToItem(row)}
                              onPostJob={() => postJobForItem(row)}
                              onCreateClass={() => goToNewClass(row)}
                              onArchive={() => handleArchive(row.rowKey, row.displayName)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop table */}
              <div className='hidden overflow-x-auto rounded-lg border sm:block'>
                <Table className='min-w-[820px]'>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-24 whitespace-nowrap'>Image</TableHead>
                      <TableHead className='whitespace-nowrap'>Course / Programme</TableHead>
                      <TableHead className='min-w-[120px] whitespace-nowrap'>Subject</TableHead>
                      <TableHead className='whitespace-nowrap'>Lecture Type</TableHead>
                      <TableHead className='text-right whitespace-nowrap'>Amount</TableHead>
                      <TableHead className='whitespace-nowrap'>Lessons #</TableHead>
                      <TableHead className='whitespace-nowrap'>Instructor</TableHead>
                      <TableHead className='whitespace-nowrap'>Status</TableHead>
                      <TableHead className='text-right whitespace-nowrap'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className='text-muted-foreground h-24 text-center'>
                          No courses or programmes available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRows.map(row => (
                        <TableRow
                          key={row.rowKey}
                          onClick={() => goToItem(row)}
                          className={cn(
                            'hover:bg-muted/50 cursor-pointer',
                            row.kind === 'program' && 'bg-primary/5 hover:bg-primary/10'
                          )}
                        >
                          <TableCell className='whitespace-nowrap'>
                            <CourseImage src={row.image} alt={row.displayName} />
                          </TableCell>
                          <TableCell className='font-medium whitespace-nowrap'>
                            {row.displayName}
                          </TableCell>
                          <TableCell className='min-w-[120px] whitespace-nowrap'>
                            {row.subjectLabel}
                          </TableCell>
                          <TableCell>
                            <div className='flex flex-wrap gap-1'>
                              {row.methods.length === 0 ? (
                                <Badge variant='outline' className='text-xs'>
                                  —
                                </Badge>
                              ) : (
                                row.methods.map(method => (
                                  <Badge key={method} variant='outline' className='text-xs'>
                                    {method}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell className='text-right font-mono whitespace-nowrap'>
                            {row.rates}
                          </TableCell>
                          <TableCell className='whitespace-nowrap'>{row.lessons}</TableCell>
                          <TableCell className='whitespace-nowrap'>
                            <div className='flex items-center gap-2'>
                              <Avatar className='h-8 w-8 shrink-0'>
                                <AvatarFallback className='bg-primary/10 text-primary text-xs font-semibold'>
                                  {instructorInitials(row.instructor)}
                                </AvatarFallback>
                              </Avatar>
                              <span className='text-muted-foreground'>
                                {instructorName(row.instructor)}
                                {row.extraInstructorCount > 0
                                  ? ` +${row.extraInstructorCount}`
                                  : ''}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className='whitespace-nowrap'>
                            <Badge variant={row.status === 'Active' ? 'default' : 'secondary'}>
                              {row.status}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-right whitespace-nowrap'>
                            <CourseActions
                              status={row.status}
                              onView={() => goToItem(row)}
                              onPostJob={() => postJobForItem(row)}
                              onCreateClass={() => goToNewClass(row)}
                              onArchive={() => handleArchive(row.rowKey, row.displayName)}
                            />
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
      {!error && !loading && totalPages > 1 ? (
        <div className='flex items-center justify-end gap-3'>
          <Button
            variant='outline'
            disabled={page === 0}
            onClick={() => setPage(value => value - 1)}
          >
            Previous
          </Button>
          <span className='text-muted-foreground text-sm'>
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant='outline'
            disabled={page + 1 >= totalPages}
            onClick={() => setPage(value => value + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}

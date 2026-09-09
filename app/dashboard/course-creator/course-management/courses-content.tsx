'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCourseCreator } from '@/context/course-creator-context';
import {
  useOfferingCounts,
  type OfferingCounts,
  type OfferingCountState,
} from '@/hooks/use-offering-counts';
import { STALE_TIMES } from '@/lib/query-client';
import { cn } from '@/lib/utils';
import type { Course, PageMetadata, TrainingProgram } from '@/services/client';
import {
  deleteCourseMutation,
  deleteTrainingProgramMutation,
  getAllCategoriesOptions,
  searchCoursesOptions,
  searchCoursesQueryKey,
  searchTrainingProgramsOptions,
  searchTrainingProgramsQueryKey,
} from '@/services/client/@tanstack/react-query.gen';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isValid } from 'date-fns';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Layers,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import CoursesLoading from './loading';

const CatalogueWorkspace = dynamic(
  () =>
    import('@/app/dashboard/admin/catalogue/_components/catalogue-workspace').then(
      module => module.CatalogueWorkspace
    ),
  { loading: () => <Skeleton className='h-96 w-full rounded-2xl' /> }
);

// Each page combines two bounded result sets so both types appear in the library.
const PAGE_SIZE = 10;
const STATUS_OPTIONS = [
  ['all', 'All statuses'],
  ['published', 'Published'],
  ['draft', 'Draft'],
  ['in_review', 'In review'],
  ['archived', 'Archived'],
] as const;

type Offering = { type: 'courses'; item: Course } | { type: 'programs'; item: TrainingProgram };

function titleOf(offering: Offering) {
  return offering.type === 'courses' ? offering.item.name : offering.item.title;
}

function previewHref(offering: Offering) {
  const segment = offering.type === 'courses' ? 'preview' : 'programs';
  return `/dashboard/course-creator/course-management/${segment}/${offering.item.uuid}`;
}

function editHref(offering: Offering) {
  const segment = offering.type === 'courses' ? 'create-course' : 'create-program';
  return `/dashboard/course-creator/courses/${segment}?id=${offering.item.uuid}`;
}

function totalOf(metadata: PageMetadata | undefined, fallback: number) {
  return Number(metadata?.totalElements ?? fallback);
}

function pagesOf(metadata: PageMetadata | undefined, count: number, page: number) {
  if (metadata?.totalPages !== undefined) return metadata.totalPages;
  if (metadata?.totalElements !== undefined)
    return Math.ceil(Number(metadata.totalElements) / PAGE_SIZE);
  return page + (metadata?.hasNext || count === PAGE_SIZE ? 2 : 1);
}

export default function CourseCreatorCoursesContent() {
  const creator = useCourseCreator();
  const creatorUuid = creator.profile?.uuid;
  const [contentType, setContentType] = useState<'all' | 'courses' | 'programs'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);
  const deferredSearch = useDeferredValue(debouncedSearch);
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Offering | null>(null);
  const [pagination, setPagination] = useState({ key: '', page: 0 });
  const filterKey = JSON.stringify([creatorUuid, contentType, deferredSearch, status, category]);
  const page = pagination.key === filterKey ? pagination.page : 0;
  const setPage = (nextPage: number) => setPagination({ key: filterKey, page: nextPage });
  const qc = useQueryClient();

  const sharedFilters = {
    course_creator_uuid_eq: creatorUuid,
    ...(status !== 'all' ? { status_eq: status } : {}),
  };
  const courseOptions = searchCoursesOptions({
    query: {
      searchParams: {
        ...sharedFilters,
        ...(deferredSearch ? { name_like: deferredSearch } : {}),
        // Category filtering is applied client-side below using the fetched records.
      },
      pageable: { page, size: PAGE_SIZE },
    },
  });
  const programOptions = searchTrainingProgramsOptions({
    query: {
      searchParams: {
        ...sharedFilters,
        ...(deferredSearch ? { title_like: deferredSearch } : {}),
        // Category filtering is applied client-side below using the fetched records.
      },
      pageable: { page, size: PAGE_SIZE },
    },
  });
  const coursesQuery = useQuery({
    ...courseOptions,
    enabled: !!creatorUuid,
    staleTime: STALE_TIMES.entity,
  });
  const programsQuery = useQuery({
    ...programOptions,
    enabled: !!creatorUuid,
    staleTime: STALE_TIMES.entity,
  });
  const categoriesQuery = useQuery({
    ...getAllCategoriesOptions({ query: { pageable: { page: 0, size: 100 } } }),
    enabled: !!creatorUuid,
    staleTime: STALE_TIMES.reference,
  });
  const coursesData =
    coursesQuery.data?.error || coursesQuery.data?.success === false
      ? undefined
      : coursesQuery.data?.data;
  const programsData =
    programsQuery.data?.error || programsQuery.data?.success === false
      ? undefined
      : programsQuery.data?.data;
  const coursesTotal = totalOf(coursesData?.metadata, coursesData?.content?.length ?? 0);
  const programsTotal = totalOf(programsData?.metadata, programsData?.content?.length ?? 0);
  const total =
    (contentType !== 'programs' ? coursesTotal : 0) +
    (contentType !== 'courses' ? programsTotal : 0);
  const totalPages = Math.max(
    contentType !== 'programs'
      ? pagesOf(coursesData?.metadata, coursesData?.content?.length ?? 0, page)
      : 0,
    contentType !== 'courses'
      ? pagesOf(programsData?.metadata, programsData?.content?.length ?? 0, page)
      : 0,
    1
  );
  const offerings = useMemo(() => {
    const items: Offering[] = [];
    if (contentType !== 'programs')
      coursesData?.content?.forEach(item => items.push({ type: 'courses', item }));
    if (contentType !== 'courses')
      programsData?.content?.forEach(item => items.push({ type: 'programs', item }));
    // Apply client-side category filter when a category is selected.
    const filtered =
      category === 'all'
        ? items
        : items.filter(off => {
            if (off.type === 'courses') {
              // `category_uuids` is an array on courses
              const cu = (off.item as Course).category_uuids ?? [];
              return cu.includes(category);
            }
            // Programs use a single `category_uuid` field
            return (off.item as TrainingProgram).category_uuid === category;
          });

    return filtered.sort((a, b) => {
      const aDate = a.item.updated_date ? new Date(a.item.updated_date).getTime() : 0;
      const bDate = b.item.updated_date ? new Date(b.item.updated_date).getTime() : 0;
      return bDate - aDate || titleOf(a).localeCompare(titleOf(b));
    });
  }, [contentType, coursesData, programsData, category]);
  const countReferences = useMemo(
    () =>
      !creatorUuid || catalogueOpen
        ? []
        : offerings.flatMap(offering =>
            offering.item.uuid ? [{ type: offering.type, uuid: offering.item.uuid }] : []
          ),
    [offerings, creatorUuid, catalogueOpen]
  );
  const offeringCounts = useOfferingCounts(countReferences);
  const categories = useMemo(() => {
    if (categoriesQuery.data?.error || categoriesQuery.data?.success === false) return [];
    return [...(categoriesQuery.data?.data?.content ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [categoriesQuery.data]);
  const loading =
    creator.isLoading || (!!creatorUuid && (coursesQuery.isPending || programsQuery.isPending));
  const failed =
    coursesQuery.isError ||
    programsQuery.isError ||
    coursesQuery.data?.error ||
    programsQuery.data?.error ||
    coursesQuery.data?.success === false ||
    programsQuery.data?.success === false;
  const deleteCourse = useMutation(deleteCourseMutation());
  const deleteProgram = useMutation(deleteTrainingProgramMutation());
  const deleting = deleteCourse.isPending || deleteProgram.isPending;

  useEffect(() => {
    if (!loading && !failed && page >= totalPages)
      setPagination({ key: filterKey, page: totalPages - 1 });
  }, [loading, failed, page, totalPages, filterKey]);

  const handleDelete = async () => {
    if (!deleteTarget?.item.uuid || deleting) return;
    try {
      const variables = { path: { uuid: deleteTarget.item.uuid } };
      const result =
        deleteTarget.type === 'courses'
          ? await deleteCourse.mutateAsync(variables)
          : await deleteProgram.mutateAsync(variables);
      if (result?.error || result?.success === false)
        throw new Error(result.message || 'Unable to delete this offering.');
      const kind = deleteTarget.type === 'courses' ? 'Course' : 'Program';
      setDeleteTarget(null);
      await Promise.all([
        qc.invalidateQueries({
          queryKey: searchCoursesQueryKey({
            query: { searchParams: { course_creator_uuid_eq: creatorUuid }, pageable: {} },
          }),
          exact: false,
        }),
        qc.invalidateQueries({
          queryKey: searchTrainingProgramsQueryKey({
            query: { searchParams: { course_creator_uuid_eq: creatorUuid }, pageable: {} },
          }),
          exact: false,
        }),
      ]);
      toast.success(`${kind} deleted successfully`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to delete this offering. Please try again.'
      );
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setCategory('all');
  };
  // A shorter stream may finish before the other; clamp its consumed rows independently.
  const consumed =
    (contentType !== 'programs' ? Math.min(page * PAGE_SIZE, coursesTotal) : 0) +
    (contentType !== 'courses' ? Math.min(page * PAGE_SIZE, programsTotal) : 0);

  return (
    <div className='mx-auto w-full px-4 pt-6 pb-12 sm:px-6 lg:px-8'>
      <header className='flex flex-col justify-between gap-6 border-b pb-7 xl:flex-row xl:items-end'>
        <div>
          <h1 className='text-2xl font-bold'>Courses &amp; programs</h1>
          <p className='text-muted-foreground max-w-xl text-sm leading-relaxed'>
            Manage your courses, build learning pathways, and track publishing and pricing from one
            place.
          </p>
        </div>
        <dl className='flex shrink-0 gap-1' aria-label='Library overview'>
          {[
            [coursesTotal + programsTotal, 'offerings'],
            [coursesTotal, 'courses'],
            [programsTotal, 'programs'],
          ].map(([value, label]) => (
            <div key={label} className='min-w-24 border-l px-4 py-2'>
              <dt className='text-muted-foreground text-xs tracking-wider uppercase'>{label}</dt>
              <dd className='mt-1 font-mono text-xl'>
                {loading || failed ? '—' : Number(value).toLocaleString()}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <div className='my-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center'>
        <div
          className='bg-muted inline-flex w-full rounded-sm border p-1 sm:w-fit'
          role='group'
          aria-label='Content type'
        >
          {(
            [
              ['all', 'All content'],
              ['courses', 'Courses'],
              ['programs', 'Programs'],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              variant='ghost'
              size='sm'
              aria-pressed={contentType === value}
              onClick={() => setContentType(value)}
              className={cn(
                'flex-1 rounded-md px-4 text-sm sm:flex-none',
                contentType === value && 'bg-card text-foreground hover:bg-card shadow-sm'
              )}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className='grid grid-cols-2 gap-2 sm:flex sm:flex-wrap'>
          <Button
            variant='ghost'
            className='col-span-2 rounded-sm text-sm'
            onClick={() => setCatalogueOpen(value => !value)}
            aria-expanded={catalogueOpen}
          >
            <BookOpen className='size-4' />
            View catalogue
          </Button>
          <Button variant='outline' className='rounded-sm text-sm' asChild>
            <Link href='/dashboard/course-creator/courses/create-course'>
              <Plus className='size-4' />
              Create course
            </Link>
          </Button>
          <Button className='rounded-sm text-sm' asChild>
            <Link href='/dashboard/course-creator/courses/create-program'>
              <Layers className='size-4' />
              Bundle courses
            </Link>
          </Button>
        </div>
      </div>

      {catalogueOpen ? (
        <section className='space-y-4' aria-label='Catalogues'>
          <div className='flex justify-end'>
            <Button variant='outline' size='sm' onClick={() => setCatalogueOpen(false)}>
              <X className='size-4' />
              Close catalogue
            </Button>
          </div>
          <CatalogueWorkspace scope='course_creator' />
        </section>
      ) : (
        <Card className='shadow-primary/5 gap-0 overflow-hidden rounded-2xl py-0 shadow-lg'>
          <div className='flex flex-col gap-3 border-b p-4 sm:flex-row'>
            <div className='relative flex-1'>
              <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2' />
              <Input
                type='search'
                aria-label='Search courses and programs by title'
                placeholder='Search courses and programs by title'
                value={search}
                onChange={event => setSearch(event.target.value)}
                className='bg-muted/30 h-10 rounded-sm pl-10 text-sm'
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger
                aria-label='Filter by status'
                className='bg-muted/30 h-10 w-full rounded-sm text-sm sm:w-40'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div
            className='bg-muted/15 flex items-center gap-2 overflow-x-auto border-b px-4 py-3'
            role='group'
            aria-label='Filter by category'
          >
            <span className='text-muted-foreground mr-1 hidden font-mono text-xs tracking-wider uppercase sm:inline'>
              Category
            </span>
            <Button
              size='sm'
              variant='outline'
              aria-pressed={category === 'all'}
              onClick={() => setCategory('all')}
              className={cn(
                'h-8 shrink-0 rounded-full px-3 text-sm',
                category === 'all' && 'bg-primary/10 text-primary border-primary/10'
              )}
            >
              All
            </Button>
            {categories.map(
              item =>
                item.uuid && (
                  <Button
                    key={item.uuid}
                    size='sm'
                    variant='outline'
                    aria-pressed={category === item.uuid}
                    onClick={() => setCategory(item.uuid ?? 'all')}
                    className={cn(
                      'h-8 shrink-0 rounded-full px-3 text-sm',
                      category === item.uuid && 'bg-primary/10 text-primary border-primary/10'
                    )}
                  >
                    {item.name}
                  </Button>
                )
            )}
            {(search || status !== 'all' || category !== 'all') && (
              <Button
                variant='ghost'
                size='sm'
                onClick={resetFilters}
                className='ml-auto h-7 shrink-0 text-xs'
              >
                <X className='size-3' />
                Clear filters
              </Button>
            )}
          </div>
          <CardContent className='p-0' aria-busy={loading || search.trim() !== deferredSearch}>
            {loading ? (
              <CoursesLoading />
            ) : !creatorUuid ? (
              <EmptyState
                variant='plain'
                icon={BookOpen}
                title='Creator profile unavailable'
                description='Complete your course creator profile to manage your learning library.'
              />
            ) : failed ? (
              <EmptyState
                variant='plain'
                title='Unable to load your library'
                description='Please try again to load your courses and programs.'
                action={
                  <Button
                    variant='outline'
                    onClick={() => {
                      void coursesQuery.refetch();
                      void programsQuery.refetch();
                    }}
                  >
                    Try again
                  </Button>
                }
              />
            ) : offerings.length === 0 ? (
              <EmptyState
                variant='plain'
                icon={BookOpen}
                title={
                  search || status !== 'all' || category !== 'all'
                    ? 'No matching content'
                    : 'Your library starts here'
                }
                description={
                  search || status !== 'all' || category !== 'all'
                    ? 'Try a different title or remove a filter.'
                    : 'Create a course or bundle courses into a learning program.'
                }
                action={
                  search || status !== 'all' || category !== 'all' ? (
                    <Button variant='outline' onClick={resetFilters}>
                      Clear filters
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link href='/dashboard/course-creator/courses/create-course'>
                        Create course
                      </Link>
                    </Button>
                  )
                }
              />
            ) : (
              <Table className='min-w-[1080px]'>
                <TableHeader>
                  <TableRow className='hover:bg-transparent [&>th]:h-12 [&>th]:px-3 [&>th]:text-sm [&>th]:font-medium'>
                    <TableHead className='w-[34%] !pl-5'>Course or program</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Revenue split</TableHead>
                    <TableHead>Instructors</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>
                      <span className='sr-only'>Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offerings.map(offering => (
                    <OfferingRow
                      key={`${offering.type}-${offering.item.uuid ?? titleOf(offering)}`}
                      offering={offering}
                      counts={offeringCounts.get(`${offering.type}-${offering.item.uuid}`)}
                      onDelete={() => setDeleteTarget(offering)}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          {!loading && !failed && creatorUuid && (
            <div className='text-muted-foreground flex items-center justify-between gap-3 border-t px-4 py-3 text-xs'>
              <span aria-live='polite'>
                {total === 0
                  ? '0 offerings'
                  : `Showing ${consumed + 1}–${consumed + offerings.length} of ${total} offerings`}
              </span>
              <nav className='flex shrink-0 items-center gap-1' aria-label='Library pagination'>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8 rounded-md'
                  aria-label='Previous page'
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className='size-4' />
                </Button>
                <span
                  aria-current='page'
                  className='bg-foreground text-background flex h-8 min-w-8 items-center justify-center rounded-md px-2 font-mono'
                >
                  {page + 1}
                </span>
                <span className='px-1'>of {totalPages}</span>
                <Button
                  variant='outline'
                  size='icon'
                  className='size-8 rounded-md'
                  aria-label='Next page'
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className='size-4' />
                </Button>
              </nav>
            </div>
          )}
        </Card>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={open => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.type === 'courses' ? 'course' : 'program'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <strong>{deleteTarget ? titleOf(deleteTarget) : ''}</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant='outline' disabled={deleting} onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant='destructive' disabled={deleting} onClick={handleDelete}>
              {deleting && <Spinner />} {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function OfferingCount({ count }: { count?: OfferingCountState }) {
  if (count?.pending) {
    return (
      <span role='status' aria-label='Loading count'>
        <Skeleton className='h-6 w-12' />
      </span>
    );
  }
  if (count?.value === undefined) {
    return (
      <div className='text-muted-foreground flex items-center gap-1 text-xs'>
        <span>Unavailable</span>
        {count && (
          <Button variant='ghost' size='sm' className='h-7 px-2 text-xs' onClick={count.retry}>
            Retry
          </Button>
        )}
      </div>
    );
  }
  return (
    <span
      className='font-mono tabular-nums'
      title={count.description}
      aria-label={`${count.value}: ${count.description}`}
    >
      {count.value.toLocaleString()}
    </span>
  );
}

function OfferingRow({
  offering,
  counts,
  onDelete,
}: {
  offering: Offering;
  counts?: OfferingCounts;
  onDelete: () => void;
}) {
  const { item } = offering;
  const title = titleOf(offering);
  const status = item.status.toLowerCase();
  const updated = item.updated_date ? new Date(item.updated_date) : null;
  const thumbnail =
    offering.type === 'courses' ? toAuthenticatedMediaUrl(offering.item.thumbnail_url) : null;
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const description = item.description
    ?.replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  const statusLabel =
    STATUS_OPTIONS.find(([value]) => value === status)?.[1] ?? status.replaceAll('_', ' ');
  const Icon = offering.type === 'courses' ? BookOpen : Layers;

  return (
    <TableRow className='hover:bg-primary/[0.025] [&>td]:px-3 [&>td]:py-4 [&>td]:text-sm'>
      <TableCell className='!pl-2'>
        <div className='flex w-full items-center gap-3'>
          <div
            className={cn(
              'relative flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md',
              offering.type === 'courses'
                ? 'bg-primary/15 text-primary'
                : 'bg-success/15 text-success'
            )}
          >
            {thumbnail && failedImage !== thumbnail ? (
              <Image
                src={thumbnail}
                alt=''
                fill
                unoptimized
                sizes='64px'
                className='object-cover'
                onError={() => setFailedImage(thumbnail)}
              />
            ) : (
              <>
                <div className='absolute -top-4 -right-1 h-24 w-5 rotate-[28deg] bg-current opacity-20' />
                <Icon className='size-5' />
              </>
            )}
          </div>

          {/* flex-1 is important */}
          <div className='w-full min-w-0 flex-1'>
            {item.uuid ? (
              <Link
                href={previewHref(offering)}
                className='hover:text-primary line-clamp-2 block text-sm leading-6 font-semibold'
                title={title}
              >
                {title}
              </Link>
            ) : (
              <span className='line-clamp-2 block font-semibold' title={title}>
                {title}
              </span>
            )}

            <p
              className='text-muted-foreground mt-0.5 max-w-100 truncate text-sm'
              title={description || 'No description added yet.'}
            >
              {description || 'No description added yet.'}
            </p>

            <div className='mt-1 flex min-w-0 items-center gap-2'>
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold',
                  offering.type === 'courses'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-primary/10 text-primary'
                )}
              >
                <Icon className='size-3' />
                {offering.type === 'courses' ? 'Course' : 'Program'}
              </span>

              {offering.type === 'courses' && (
                <p
                  className='text-muted-foreground min-w-0 truncate text-xs'
                  title={
                    offering.item.training_requirements
                      ? `${offering.item.training_requirements.length} training requirements`
                      : item.uuid
                        ? 'View training requirements'
                        : 'Requirements unavailable'
                  }
                >
                  {offering.item.training_requirements ? (
                    `${offering.item.training_requirements.length} training requirements`
                  ) : item.uuid ? (
                    <Link
                      href={previewHref(offering)}
                      className='hover:text-primary block truncate underline underline-offset-2'
                    >
                      View training requirements
                    </Link>
                  ) : (
                    'Requirements unavailable'
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className='font-medium whitespace-nowrap'>
          {formatCurrency(
            offering.type === 'courses' ? offering.item.minimum_training_fee : offering.item.price
          )}
        </span>
        <span className='text-muted-foreground mt-1 block text-xs whitespace-nowrap'>
          {offering.type === 'courses' ? 'min. / trainee / hour' : 'program price'}
        </span>
      </TableCell>
      <TableCell>
        {offering.type === 'courses' ? (
          <span
            className='font-mono text-sm whitespace-nowrap'
            title='Creator share / instructor share'
          >
            {offering.item.creator_share_percentage}%{' '}
            <span className='text-muted-foreground'>/</span>{' '}
            {offering.item.instructor_share_percentage}%
          </span>
        ) : (
          <span className='text-muted-foreground' title='Revenue shares are configured per course'>
            Per course
          </span>
        )}
      </TableCell>
      <TableCell>
        <OfferingCount count={counts?.trainers} />
      </TableCell>
      <TableCell>
        <OfferingCount count={counts?.students} />
      </TableCell>
      <TableCell>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
            status === 'published'
              ? 'bg-success/15 text-success'
              : status === 'in_review'
                ? 'bg-warning/15 text-warning'
                : 'bg-muted text-muted-foreground'
          )}
        >
          <span className='size-1.5 rounded-full bg-current' />
          {statusLabel}
        </span>
      </TableCell>
      <TableCell className='text-muted-foreground whitespace-nowrap'>
        {updated && isValid(updated) ? format(updated, 'dd MMM yyyy') : '—'}
      </TableCell>
      <TableCell className='!pr-4'>
        <div className='flex items-center justify-end gap-1'>
          {item.uuid && (
            <>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground size-8 rounded-md'
                asChild
              >
                <Link href={editHref(offering)} aria-label={`Edit ${title}`}>
                  <Edit className='size-4' />
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='text-muted-foreground size-8 rounded-md'
                    aria-label={`More actions for ${title}`}
                  >
                    <MoreHorizontal className='size-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem asChild>
                    <Link href={previewHref(offering)}>
                      <Eye className='size-4' />
                      Preview {offering.type === 'courses' ? 'course' : 'program'}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={editHref(offering)}>
                      <Edit className='size-4' />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className='text-destructive focus:text-destructive'
                    onSelect={onDelete}
                  >
                    <Trash2 className='size-4' />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function formatCurrency(value?: number | null) {
  if (value == null) return 'Not set';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(value);
}

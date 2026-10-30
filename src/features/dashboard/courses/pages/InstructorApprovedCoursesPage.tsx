'use client';

import { ALL_CATEGORIES, CategoryTabs, filterByCategoryTabs } from '@/components/category-tabs';
import { surfaceTheme } from '@/components/data-display';
import { AsyncSection } from '@/components/data/async-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useInstructor } from '@/context/instructor-context';
import { useInstructorApprovedOfferings } from '@/hooks/use-instructor-approved-offerings';
import { formatRateAmount } from '@/lib/rate-card';
import type { Course, CourseTrainingRateCard } from '@/services/client/types.gen';
import { formatDurationFromParts } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { lowestRatesLabel } from '@/src/features/rate-card/application-display';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { BookOpen, Eye, MoreHorizontal, PlusSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type ApprovedOfferingRow = {
  rowKey: string;
  uuid: string;
  source: 'course' | 'program';
  category: string;
  subject: string;
  programType: string | null;
  displayName: string;
  classLimit: number | null;
  subjectLabel: string;
  durationLabel: string;
  rateLabel: string;
  image: string | null;
  status: string;
};

function CourseImage({ src, alt }: { src?: string | null; alt: string }) {
  if (src) {
    return <img src={src} alt={alt} className='h-12 w-16 shrink-0 rounded-md object-cover' />;
  }

  return (
    <div className='from-primary/15 to-primary/5 flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-gradient-to-br'>
      <BookOpen className='text-primary/70 h-5 w-5' />
    </div>
  );
}

function CourseActions({
  onView,
  onCreateClass,
}: {
  onView: () => void;
  onCreateClass: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8'
          aria-label='Offering actions'
          onClick={event => event.stopPropagation()}
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' onClick={event => event.stopPropagation()}>
        <DropdownMenuItem onClick={onView}>
          <Eye className='mr-2 h-4 w-4' />
          View details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreateClass}>
          <PlusSquare className='mr-2 h-4 w-4' />
          Create class
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getCourseRate(course: Course) {
  const rate = course.minimum_training_fee ?? course.price;
  return typeof rate === 'number' ? rate : undefined;
}

function getCourseCategory(course: Course) {
  return course.category_names?.[0] ?? 'General';
}

/** The lowest approved rate on each basis; without a card, the course's minimum fee. */
function formatRateLabel(rateCard?: CourseTrainingRateCard | null, fallbackRate?: number) {
  return (
    lowestRatesLabel(rateCard) ??
    (typeof fallbackRate === 'number' ? `Min. ${formatRateAmount(fallbackRate)}` : '—')
  );
}

export default function InstructorApprovedCoursesPage() {
  const router = useRouter();
  const instructor = useInstructor();
  const instructorUuid = instructor?.uuid ?? '';
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [subjectByCategory, setSubjectByCategory] = useState<Record<string, string>>({});

  const {
    approvedCourses,
    approvedPrograms,
    isLoading: loading,
    error,
    refetch,
  } = useInstructorApprovedOfferings(instructorUuid);

  const rows = useMemo<ApprovedOfferingRow[]>(() => {
    const courseRows: ApprovedOfferingRow[] = approvedCourses.map(course => ({
      rowKey: `course:${course.uuid}`,
      uuid: course.uuid,
      source: 'course',
      category: getCourseCategory(course),
      subject: course.category_names?.[0] ?? '',
      programType: null,
      displayName: course.name ?? 'Course',
      classLimit: course.class_limit ?? null,
      subjectLabel: course.category_names?.join(', ') || '—',
      durationLabel:
        formatDurationFromParts(
          course.duration_hours,
          course.duration_minutes,
          course.total_duration_display
        ) || 'Duration unavailable',
      rateLabel: formatRateLabel(course.application.rate_card, getCourseRate(course)),
      image: toAuthenticatedMediaUrl(course.banner_url ?? course.thumbnail_url) ?? null,
      status: 'Approved',
    }));
    const programRows: ApprovedOfferingRow[] = approvedPrograms.map(program => ({
      rowKey: `program:${program.uuid}`,
      uuid: program.uuid,
      source: 'program',
      category: 'Programs',
      subject: program.program_type ?? '',
      programType: program.program_type ?? null,
      displayName: program.title,
      classLimit: program.class_limit ?? null,
      subjectLabel: program.program_type ?? '—',
      durationLabel:
        formatDurationFromParts(
          program.total_duration_hours,
          program.total_duration_minutes,
          program.total_duration_display
        ) || 'Duration unavailable',
      rateLabel: formatRateLabel(program.application.rate_card),
      image: toAuthenticatedMediaUrl(program.banner_url ?? program.thumbnail_url) ?? null,
      status: 'Approved',
    }));
    return [...courseRows, ...programRows].sort((left, right) =>
      left.displayName.localeCompare(right.displayName)
    );
  }, [approvedCourses, approvedPrograms]);

  const filteredRows = useMemo(
    () => filterByCategoryTabs(rows, activeCategory, subjectByCategory),
    [activeCategory, rows, subjectByCategory]
  );

  const goToOffering = (row: ApprovedOfferingRow) => {
    if (row.source === 'program') {
      router.push(`/dashboard/instructor/programs/${row.uuid}`);
    } else {
      router.push(`/dashboard/instructor/courses/${row.uuid}`);
    }
  };

  const createClass = (row: ApprovedOfferingRow) => {
    router.push(`/dashboard/instructor/classes/new?${row.source}Uuid=${row.uuid}`);
  };

  return (
    <div className={`${surfaceTheme.pageWide} space-y-6 py-4`}>
      <AsyncSection
        error={error}
        onRetry={refetch}
        errorTitle='Couldn’t load your approved courses and programs'
      >
        {loading ? (
          <div className='space-y-2'>
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className='h-14 w-full' />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title='No approved courses or programs yet'
            description='Once your training application is approved, the course or program will appear here.'
          />
        ) : (
          <>
            <CategoryTabs
              items={rows}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              subjectByCategory={subjectByCategory}
              onSubjectChange={setSubjectByCategory}
            />

            <div className='space-y-4'>
              <div className='sm:hidden'>
                {filteredRows.length === 0 ? (
                  <div className='text-muted-foreground py-12 text-center'>
                    No courses or programs available.
                  </div>
                ) : (
                  <div className='divide-border divide-y rounded-lg border'>
                    {filteredRows.map(row => (
                      <div
                        key={row.rowKey}
                        role='button'
                        tabIndex={0}
                        onClick={() => goToOffering(row)}
                        onKeyDown={event => {
                          if (event.target !== event.currentTarget) return;
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            goToOffering(row);
                          }
                        }}
                        className='hover:bg-muted/40 flex cursor-pointer items-start gap-3 p-3'
                      >
                        <CourseImage src={row.image} alt={row.displayName} />
                        <div className='min-w-0 flex-1 space-y-1.5'>
                          <div className='flex items-start justify-between gap-2'>
                            <span className='min-w-0 font-medium'>
                              {row.displayName}
                              <Badge variant='outline' className='ml-2'>
                                {row.source === 'program' ? 'Program' : 'Course'}
                              </Badge>
                            </span>
                            <Badge className='shrink-0'>{row.status}</Badge>
                          </div>
                          <p className='text-muted-foreground text-xs'>{row.subjectLabel}</p>
                          <div className='flex flex-wrap items-center gap-2'>
                            <Badge variant='outline' className='text-xs'>
                              {row.durationLabel}
                            </Badge>
                            <Badge variant='outline' className='text-xs'>
                              Class limit {row.classLimit ?? 'Open'}
                            </Badge>
                            <Badge variant='outline' className='text-xs'>
                              {row.rateLabel}
                            </Badge>
                          </div>
                          <div className='flex items-center justify-end'>
                            <CourseActions
                              onView={() => goToOffering(row)}
                              onCreateClass={() => createClass(row)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className='hidden overflow-x-auto rounded-lg border sm:block'>
                <Table className='min-w-[820px]'>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-24 whitespace-nowrap'>Image</TableHead>
                      <TableHead className='whitespace-nowrap'>Course or program</TableHead>
                      <TableHead className='min-w-[120px] whitespace-nowrap'>Subject</TableHead>
                      <TableHead className='whitespace-nowrap'>Class limit</TableHead>
                      <TableHead className='text-right whitespace-nowrap'>Rate</TableHead>
                      <TableHead className='whitespace-nowrap'>Status</TableHead>
                      <TableHead className='text-right whitespace-nowrap'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className='text-muted-foreground h-24 text-center'>
                          No courses or programs available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRows.map(row => (
                        <TableRow
                          key={row.rowKey}
                          onClick={() => goToOffering(row)}
                          className='hover:bg-muted/50 cursor-pointer'
                        >
                          <TableCell className='whitespace-nowrap'>
                            <CourseImage src={row.image} alt={row.displayName} />
                          </TableCell>
                          <TableCell className='font-medium whitespace-nowrap'>
                            {row.displayName}
                            <Badge variant='outline' className='ml-2'>
                              {row.source === 'program' ? 'Program' : 'Course'}
                            </Badge>
                          </TableCell>
                          <TableCell className='min-w-[120px] whitespace-nowrap'>
                            {row.subjectLabel}
                          </TableCell>
                          <TableCell className='whitespace-nowrap'>
                            {row.classLimit ?? 'Open'}
                          </TableCell>
                          <TableCell className='text-right font-mono whitespace-nowrap'>
                            {row.rateLabel}
                          </TableCell>
                          <TableCell className='whitespace-nowrap'>
                            <Badge>{row.status}</Badge>
                          </TableCell>
                          <TableCell className='text-right whitespace-nowrap'>
                            <CourseActions
                              onView={() => goToOffering(row)}
                              onCreateClass={() => createClass(row)}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </AsyncSection>
    </div>
  );
}

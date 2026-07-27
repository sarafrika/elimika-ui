'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { InstructorClassWithSchedule } from '@/hooks/use-instructor-classes-with-schedules';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  Users
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  formatPreferredScheduleLabel,
  type DateFilter,
} from './new-class-page.utils';

const CLASSES_PER_PAGE = 8;

function getVisiblePageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, currentPage - 1, currentPage, currentPage + 1, totalPages];
}

function getClassStatus(classItem: InstructorClassWithSchedule) {
  const activeSessions =
    classItem.schedule?.filter(instance => instance.status?.toUpperCase() !== 'CANCELLED').length ?? 0;
  if (activeSessions === 0) return 'Draft';
  if (activeSessions > 0 && activeSessions < 5) return 'Ongoing';
  return 'Published';
}

export function ClassSidebar({
  isLoading,
  classes,
  selectedClassUuid,
  searchTerm,
  draftSearchTerm,
  dateFilter,
  onSelectClass,
  onSearchChange,
  onDateFilterChange,
  instructorView = true
}: {
  isLoading: boolean;
  classes: InstructorClassWithSchedule[];
  selectedClassUuid: string | null;
  searchTerm: string;
  draftSearchTerm: string;
  dateFilter: DateFilter;
  onSelectClass: (classUuid: string) => void;
  onSearchChange: (value: string) => void;
  onDateFilterChange: (value: DateFilter) => void;
  instructorView?: boolean
}) {
  const hasSearchTerm = searchTerm.trim().length > 0;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(Math.ceil(classes.length / CLASSES_PER_PAGE), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * CLASSES_PER_PAGE;
  const paginatedClasses = classes.slice(pageStartIndex, pageStartIndex + CLASSES_PER_PAGE);
  const visiblePageNumbers = useMemo(
    () => getVisiblePageNumbers(safeCurrentPage, totalPages),
    [safeCurrentPage, totalPages]
  );
  const resultStart = classes.length ? pageStartIndex + 1 : 0;
  const resultEnd = Math.min(pageStartIndex + paginatedClasses.length, classes.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, searchTerm]);

  useEffect(() => {
    setCurrentPage(page => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <section className='rounded-lg border border-border/70 bg-card/85 p-3 shadow-sm backdrop-blur'>
      <div className='mb-4 flex items-center gap-3 px-1 pt-1'>
        <Select value={dateFilter} onValueChange={value => onDateFilterChange(value as DateFilter)}>
          <SelectTrigger className='h-10 w-full rounded-md border-border/70 bg-background/75 shadow-none'>
            <SelectValue placeholder='Filter by date' />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value='current-day'>Today&apos;s Classes</SelectItem>
            <SelectItem value='current-week'>Current week</SelectItem>
            <SelectItem value='upcoming'>Upcoming Classes</SelectItem>
            <SelectItem value='all'>All scheduled dates</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='mb-4 space-y-2'>
        <div className='relative'>
          <Search className='pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={draftSearchTerm}
            onChange={event => onSearchChange(event.target.value)}
            placeholder='Search classes'
            className='h-10 rounded-md border-border/70 bg-background/75 pl-9 pr-4 text-sm shadow-none'
            aria-label='Search instructor classes'
          />
        </div>
      </div>

      <div className='space-y-2'>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className='h-[110px] rounded-lg' />
          ))
        ) : classes.length === 0 ? (
          <div className='rounded-lg border border-dashed border-border/70 p-6 text-center'>
            <p className='font-medium text-foreground'>
              {hasSearchTerm ? 'No classes match this search' : 'No classes for this filter'}
            </p>
            <p className='mt-1 text-sm text-muted-foreground'>
              {hasSearchTerm
                ? 'Try another class title or course name.'
                : 'Switch the date filter to load more classes.'}
            </p>
          </div>
        ) : (
          paginatedClasses.map(classItem => {
            const isSelected = classItem.uuid === selectedClassUuid;
            const imageUrl = toAuthenticatedMediaUrl(
              classItem.course?.thumbnail_url ?? classItem.course?.banner_url
            );
            const activeSessions =
              classItem.schedule?.filter(instance => instance.status?.toUpperCase() !== 'CANCELLED')
                .length ?? 0;

            return (
              <button
                key={classItem.uuid}
                type='button'
                onClick={() => classItem.uuid && onSelectClass(classItem.uuid)}
                className={`w-full rounded-lg border px-3 py-3 text-left transition-all ${isSelected
                  ? 'border-primary/40 bg-primary/10 shadow-sm'
                  : 'border-border/70 bg-background/70 hover:border-primary/30 hover:bg-primary/5'
                  }`}
              >
                <div className='flex gap-3'>
                  {/* <div className='relative h-[76px] w-[96px] shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted'>
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={classItem.title}
                        fill
                        className='object-cover'
                        unoptimized={isAuthenticatedMediaUrl(imageUrl)}
                      />
                    ) : (
                      <div className='bg-primary/10 text-primary flex h-full w-full items-center justify-center'>
                        <CalendarDays className='size-5' />
                      </div>
                    )}
                  </div> */}

                  <div className='min-w-0 flex-1'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-semibold text-foreground'>
                          {classItem.title}
                        </p>

                      </div>

                      <span className='inline-flex shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>
                        {getClassStatus(classItem)}
                      </span>
                    </div>

                    <p className='line-clamp-2 text-xs text-muted-foreground'>
                      {classItem.course?.name || 'Linked course not available'}
                    </p>

                    {instructorView && <div className='mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2'>
                      <span className='inline-flex items-center gap-1.5'>
                        <Users className='size-3.5 shrink-0' />

                        {
                          new Set(
                            ((classItem.enrollments ?? []) as Array<{ student_uuid?: string }>)
                              .map(enrollment => enrollment.student_uuid)
                              .filter(Boolean)
                          ).size
                        } enrollments
                      </span>

                    </div>}

                    <div className='mt-2 flex items-center gap-1.5 text-xs text-muted-foreground'>
                      <CalendarDays className='size-3.5 shrink-0' />
                      <span className='truncate'>
                        {formatPreferredScheduleLabel(classItem)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {!isLoading && classes.length > CLASSES_PER_PAGE ? (
        <div className='mt-4 space-y-3 border-t border-border/70 pt-3'>
          <p className='px-1 text-xs text-muted-foreground'>
            Showing {resultStart}-{resultEnd} of {classes.length} classes
          </p>

          <div className='flex items-center justify-between gap-2'>
            <button
              type='button'
              onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
              disabled={safeCurrentPage === 1}
              className='inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background/70 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-background/70'
              aria-label='Show previous classes'
            >
              <ChevronLeft className='h-4 w-4' />
            </button>

            <div className='flex min-w-0 items-center justify-center gap-1'>
              {visiblePageNumbers.map((pageNumber, index) => {
                const previousPageNumber = visiblePageNumbers[index - 1];
                const shouldShowGap =
                  previousPageNumber !== undefined && pageNumber - previousPageNumber > 1;

                return (
                  <div key={pageNumber} className='flex items-center gap-1'>
                    {shouldShowGap ? (
                      <span className='px-1 text-xs text-muted-foreground'>...</span>
                    ) : null}
                    <button
                      type='button'
                      onClick={() => setCurrentPage(pageNumber)}
                      aria-current={pageNumber === safeCurrentPage ? 'page' : undefined}
                      className={`flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${pageNumber === safeCurrentPage
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                    >
                      {pageNumber}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type='button'
              onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
              disabled={safeCurrentPage === totalPages}
              className='inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background/70 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-background/70'
              aria-label='Show next classes'
            >
              <ChevronRight className='h-4 w-4' />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

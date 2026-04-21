import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ClassInstanceItem, DateFilter } from './new-class-page.utils';
import { formatTimeRange } from './new-class-page.utils';

const CLASSES_PER_PAGE = 7;

function getClassIconClass(index: number) {
  const styles = [
    'bg-primary/10 text-primary',
    'bg-accent/10 text-accent',
    'bg-success/10 text-success',
    'bg-warning/10 text-warning',
  ];

  return styles[index % styles.length] ?? styles[0];
}

// ✅ NEW: Format date like "3rd April 2026"
function formatDateWithOrdinal(dateValue?: string | Date | null) {
  if (!dateValue) return 'TBD';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'TBD';

  const day = date.getDate();
  const year = date.getFullYear();
  const month = date.toLocaleString('en-GB', { month: 'long' });

  const getOrdinal = (n: number) => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  return `${day}${getOrdinal(day)} ${month} ${year}`;
}

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

export function ClassSidebar({
  isLoading,
  classes,
  selectedInstanceUuid,
  searchTerm,
  draftSearchTerm,
  dateFilter,
  onSelectClass,
  onSearchChange,
  onDateFilterChange,
}: {
  isLoading: boolean;
  classes: ClassInstanceItem[];
  selectedInstanceUuid: string | null;
  searchTerm: string;
  draftSearchTerm: string;
  dateFilter: DateFilter;
  onSelectClass: (instanceUuid: string) => void;
  onSearchChange: (value: string) => void;
  onDateFilterChange: (value: DateFilter) => void;
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
    <section className='border-border/70 bg-card/85 rounded-lg border p-3 shadow-sm backdrop-blur'>
      <div className='mb-4 flex items-center gap-3 px-1 pt-1'>
        <Select
          value={dateFilter}
          onValueChange={value => onDateFilterChange(value as DateFilter)}
        >
          <SelectTrigger className='w-full border-border/70 bg-background/75 h-10 rounded-md shadow-none'>
            <SelectValue placeholder='Filter by date' />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value='current-day'>Today's Classes</SelectItem>
            <SelectItem value='current-week'>Current week</SelectItem>
            <SelectItem value='upcoming'>Upcoming Classes</SelectItem>
            <SelectItem value='all'>All scheduled dates</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='mb-4 space-y-2'>
        <div className='relative'>
          <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            value={draftSearchTerm}
            onChange={event => onSearchChange(event.target.value)}
            placeholder='Search classes'
            className='border-border/70 bg-background/75 h-10 rounded-md pr-4 pl-9 text-sm shadow-none'
            aria-label='Search instructor classes'
          />
        </div>


      </div>

      <div className='space-y-2'>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className='h-[90px] rounded-lg' />
          ))
        ) : classes.length === 0 ? (
          <div className='border-border/70 rounded-lg border border-dashed p-6 text-center'>
            <p className='text-foreground font-medium'>
              {hasSearchTerm ? 'No classes match this search' : 'No classes for this filter'}
            </p>
            <p className='text-muted-foreground mt-1 text-sm'>
              {hasSearchTerm
                ? 'Try another class name or course title.'
                : 'Switch the date filter to load more class instances.'}
            </p>
          </div>
        ) : (
          paginatedClasses.map((classItem, index) => {
            const isSelected = classItem.instanceUuid === selectedInstanceUuid;
            const classIndex = pageStartIndex + index;

            return (
              <button
                key={classItem.instanceUuid}
                type='button'
                onClick={() => onSelectClass(classItem.instanceUuid)}
                className={`w-full rounded-lg border px-3.5 py-3 text-left transition-all ${isSelected
                  ? 'border-primary/40 bg-primary/10 shadow-sm'
                  : 'border-border/70 bg-background/70 hover:border-primary/30 hover:bg-primary/5'
                  }`}
              >
                <div className='grid grid-cols-[minmax(0,1fr)_auto] gap-3'>
                  <div className='flex min-w-0 gap-2.5'>
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${getClassIconClass(classIndex)}`}
                    >
                      <BookOpen className='h-3.5 w-3.5' />
                    </span>

                    <div className='min-w-0'>
                      <p className='text-foreground truncate text-sm leading-5 font-semibold'>
                        {classItem.courseName || classItem.title}
                      </p>

                      <div className='flex flex-row items-center justify-between'>
                        <div>
                          <p className='text-muted-foreground mt-1 text-xs'>
                            {formatTimeRange(classItem.start_time, classItem.end_time)}
                          </p>
                          <p className='text-muted-foreground text-[11px]'>
                            {formatDateWithOrdinal(classItem.start_time)}
                          </p>
                        </div>

                        <span className='text-primary bg-primary/10 inline-flex rounded px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase'>
                          Lecture
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* <div className='grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 pl-7'>
                  <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                    <Users className='h-3.5 w-3.5' />
                    <span>{classItem.classItem.max_participants ?? 0} students</span>
                  </p>

                  <div className='text-right'>
                    <p className='text-foreground text-sm font-semibold'>
                      {fee ? `$${fee}` : ''}
                    </p>
                  </div>
                </div> */}
              </button>
            );
          })
        )}
      </div>

      {!isLoading && classes.length > CLASSES_PER_PAGE ? (
        <div className='border-border/70 mt-4 space-y-3 border-t pt-3'>
          <p className='text-muted-foreground px-1 text-xs'>
            Showing {resultStart}-{resultEnd} of {classes.length} classes
          </p>

          <div className='flex items-center justify-between gap-2'>
            <button
              type='button'
              onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
              disabled={safeCurrentPage === 1}
              className='border-border/70 bg-background/70 text-foreground hover:bg-muted focus-visible:ring-ring disabled:text-muted-foreground disabled:hover:bg-background/70 inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60'
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
                      <span className='text-muted-foreground px-1 text-xs'>...</span>
                    ) : null}
                    <button
                      type='button'
                      onClick={() => setCurrentPage(pageNumber)}
                      aria-current={pageNumber === safeCurrentPage ? 'page' : undefined}
                      className={`focus-visible:ring-ring flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none ${pageNumber === safeCurrentPage
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
              className='border-border/70 bg-background/70 text-foreground hover:bg-muted focus-visible:ring-ring disabled:text-muted-foreground disabled:hover:bg-background/70 inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60'
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

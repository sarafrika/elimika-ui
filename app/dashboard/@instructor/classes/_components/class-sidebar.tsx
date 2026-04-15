import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, MoreHorizontal, Search, Users } from 'lucide-react';
import type { ClassInstanceItem, DateFilter } from './new-class-page.utils';
import {
  formatTimeRange,
  getInstanceStatus
} from './new-class-page.utils';

function getClassIconClass(index: number) {
  const styles = [
    'bg-primary/10 text-primary',
    'bg-accent/10 text-accent',
    'bg-success/10 text-success',
    'bg-warning/10 text-warning',
  ];

  return styles[index % styles.length] ?? styles[0];
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

  return (
    <section className='border-border/70 bg-card/85 rounded-lg border p-3 shadow-sm backdrop-blur'>
      <div className='mb-4 flex items-center justify-between gap-3 px-1 pt-1'>
        <h2 className='text-foreground text-lg font-semibold'>Today&apos;s Classes</h2>
        <button
          type='button'
          className='text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-md p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none'
          aria-label='Open class options'
        >
          <MoreHorizontal className='h-5 w-5' />
        </button>
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

        <Select value={dateFilter} onValueChange={value => onDateFilterChange(value as DateFilter)}>
          <SelectTrigger className='border-border/70 bg-background/75 h-10 rounded-md shadow-none'>
            <SelectValue placeholder='Filter by date' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='current-day'>Current day</SelectItem>
            <SelectItem value='current-week'>Current week</SelectItem>
            <SelectItem value='upcoming'>Upcoming</SelectItem>
            <SelectItem value='all'>All scheduled dates</SelectItem>
          </SelectContent>
        </Select>
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
          classes.slice(0, 7).map((classItem, index) => {
            const isSelected = classItem.instanceUuid === selectedInstanceUuid;
            const fee = classItem.classItem.training_fee ?? 0;
            const status = getInstanceStatus(classItem.start_time, classItem.end_time);

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
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${getClassIconClass(index)}`}
                    >
                      <BookOpen className='h-3.5 w-3.5' />
                    </span>
                    <div className='min-w-0'>
                      <p className='text-foreground truncate text-sm leading-5 font-semibold'>
                        {classItem.courseName || classItem.title}
                      </p>

                      <div className='flex flex-row items-center justify-between' >
                        <p className='text-muted-foreground mt-1 text-xs'>
                          {formatTimeRange(classItem.start_time, classItem.end_time)}
                        </p>
                        <span className='text-primary bg-primary/10 inline-flex rounded px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase'>
                          Lecture
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 pl-7'>
                  <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                    <Users className='h-3.5 w-3.5' />
                    <span>{classItem.classItem.max_participants ?? 0} students</span>
                  </p>
                  <div className='text-right'>
                    <p className='text-foreground text-sm font-semibold'>{fee ? `$${fee}` : ''}</p>
                    {/* <p className='text-foreground mt-2 text-sm font-semibold'>
                      {fee ? `$${fee}` : formatDateTime(classItem.start_time).split(',')[0]}
                    </p> */}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

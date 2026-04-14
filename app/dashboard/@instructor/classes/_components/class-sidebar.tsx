import { BrandPill } from '@/components/ui/brand-pill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { NotebookPen, Search } from 'lucide-react';
import type { ClassInstanceItem, DateFilter } from './new-class-page.utils';
import {
  formatDateTime,
  formatDuration,
  getInstanceStatus,
} from './new-class-page.utils';

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
    <Card className='border-border/70 bg-card shadow-sm'>
      <CardHeader className='space-y-4 pb-4'>
        <div className='space-y-2'>
          <BrandPill
            icon={<NotebookPen className='h-3.5 w-3.5' />}
            className='px-3 py-1 text-[10px]'
          >
            Classes
          </BrandPill>
          <div>
            <CardTitle className='text-lg'>Instructor schedule</CardTitle>
            <p className='text-muted-foreground mt-1 text-sm'>
              Browse every class instance assigned to you and open the one you need to teach.
            </p>
          </div>
        </div>

        <div className='space-y-2'>
          <div className='relative'>
            <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              value={draftSearchTerm}
              onChange={event => onSearchChange(event.target.value)}
              placeholder='Search classes'
              className='bg-background h-10 rounded-full border-border/70 pr-4 pl-9 text-sm'
              aria-label='Search instructor classes'
            />
          </div>

          <Select value={dateFilter} onValueChange={value => onDateFilterChange(value as DateFilter)}>
            <SelectTrigger className='bg-background h-10 rounded-full border-border/70'>
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
      </CardHeader>

      <CardContent className='space-y-3'>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className='h-[128px] rounded-[20px]' />
          ))
        ) : classes.length === 0 ? (
          <div className='border-border/70 rounded-[24px] border border-dashed p-6 text-center'>
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
          classes.map(classItem => {
            const isSelected = classItem.instanceUuid === selectedInstanceUuid;

            return (
              <button
                key={classItem.instanceUuid}
                type='button'
                onClick={() => onSelectClass(classItem.instanceUuid)}
                className={`w-full rounded-[20px] border px-3 py-3 text-left transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border/70 bg-background/80 hover:bg-primary/10'
                }`}
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0 space-y-1.5'>
                    <p className='text-foreground truncate text-sm font-semibold'>{classItem.title}</p>
                    <p className='text-muted-foreground truncate text-[11px]'>{classItem.courseName}</p>
                  </div>
                  <BrandPill className='shrink-0 px-2.5 py-1 text-[10px] normal-case tracking-normal'>
                    {getInstanceStatus(classItem.start_time, classItem.end_time)}
                  </BrandPill>
                </div>

                <div className='mt-3 space-y-2'>
                  <div className='bg-card/90 rounded-[16px] border border-border/60 px-3 py-2'>
                    <div className='flex items-center justify-between gap-3'>
                      <p className='text-foreground truncate text-[11px] font-medium'>
                        {formatDateTime(classItem.start_time)}
                      </p>
                    </div>
                    <p className='text-muted-foreground mt-1 text-[10px]'>
                      {formatDuration(classItem.start_time, classItem.end_time)}
                    </p>
                    <p className='text-muted-foreground mt-1 truncate text-[10px]'>
                      {classItem.location_name || 'Location to be confirmed'}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

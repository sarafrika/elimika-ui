import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { InstructorClassWithSchedule } from '@/hooks/use-instructor-classes-with-schedules';
import { BarChart3, CalendarDays, CircleDot, GraduationCap, UserRound, Users } from 'lucide-react';
import HTMLTextPreview from '../../../../../components/editors/html-text-preview';
import type { ClassInstanceItem, DateFilter } from './new-class-page.utils';
import {
  formatDateTime,
  formatDuration,
  formatLabel,
  getInstanceStatus,
} from './new-class-page.utils';

export function ClassDeliveryStatusTab({
  isLoadingClasses,
  selectedClass,
  selectedClassEntry,
  dateFilter,
  difficultyMap,
  instructorName,
  roleLabel = 'Instructor view',
  studentCount,
  totalInstances,
  completionRate,
  visibleInstances,
  onAddClasses,
}: {
  isLoadingClasses: boolean;
  selectedClass: InstructorClassWithSchedule | null;
  selectedClassEntry: ClassInstanceItem | null;
  dateFilter: DateFilter;
  difficultyMap: Record<string, string>;
  instructorName?: string | null;
  roleLabel?: string;
  studentCount: number;
  totalInstances: number;
  completionRate: number;
  visibleInstances: InstructorClassWithSchedule['schedule'];
  onAddClasses: () => void;
}) {
  const filterLabel =
    dateFilter === 'current-day'
      ? 'Current day'
      : dateFilter === 'current-week'
        ? 'Current week'
        : dateFilter === 'upcoming'
          ? 'Upcoming'
          : 'All scheduled dates';
  const courseName = selectedClass?.course?.name || selectedClass?.title || 'No linked course';
  const difficulty = selectedClass?.course?.difficulty_uuid
    ? (difficultyMap[selectedClass.course.difficulty_uuid] ?? 'General')
    : 'General';
  const tableDescription =
    dateFilter === 'current-day'
      ? 'Showing class instances happening today for the selected class.'
      : dateFilter === 'current-week'
        ? 'Showing class instances happening in the current week, arranged by date.'
        : dateFilter === 'upcoming'
          ? 'Showing upcoming class instances for the selected class.'
          : 'Showing every scheduled instance for the selected class, arranged by date.';

  return (
    <div className='space-y-3'>
      {isLoadingClasses || !selectedClass || !selectedClassEntry ? (
        <div className='space-y-3'>
          <Skeleton className='h-56 rounded-lg' />
          <Skeleton className='h-80 rounded-lg' />
        </div>
      ) : (
        <>
          <div className='grid gap-3 2xl:grid-cols-[minmax(0,1fr)_320px]'>
            <section className='border-border/70 bg-card/90 overflow-hidden rounded-lg border shadow-sm backdrop-blur'>
              {/* <div className='m-3 flex justify-start sm:justify-end'>
                <Button
                  type='button'
                  onClick={onAddClasses}
                  className='bg-primary text-primary-foreground hover:bg-accent h-10 rounded-md px-8 font-semibold'
                >
                  Add classes
                </Button>
              </div> */}

              <div className='border-border/70 border-b p-4 md:p-5'>
                <div className='space-y-2'>
                  <h2 className='text-foreground text-2xl leading-tight font-semibold md:text-3xl'>
                    {selectedClass.title}
                  </h2>
                  <div className='text-muted-foreground line-clamp-3 max-w-4xl text-sm leading-6'>
                    <HTMLTextPreview htmlContent={selectedClass?.course?.description as string ||
                      selectedClass.description as string} />
                  </div>
                </div>

                <div className='text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm'>
                  <span className='inline-flex items-center gap-1.5'>
                    <CircleDot className='h-4 w-4' />
                    {totalInstances} total instances
                  </span>
                  <span className='inline-flex items-center gap-1.5'>
                    <GraduationCap className='h-4 w-4' />
                    {difficulty}
                  </span>
                  <span className='inline-flex items-center gap-1.5'>
                    <Users className='h-4 w-4' />
                    {studentCount} unique students
                  </span>
                  <span className='inline-flex items-center gap-1.5'>
                    <UserRound className='h-4 w-4' />
                    {instructorName || roleLabel}
                  </span>
                </div>
              </div>

              <div className='grid gap-3 p-4 sm:grid-cols-2 md:p-5 xl:grid-cols-3'>
                <div className='border-border/70 bg-background/70 rounded-md border p-4'>
                  <p className='text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase'>
                    <CalendarDays className='h-4 w-4' />
                    Filter
                  </p>
                  <p className='text-foreground mt-2 text-lg font-semibold'>{filterLabel}</p>
                </div>
                <div className='border-border/70 bg-background/70 rounded-md border p-4'>
                  <p className='text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase'>
                    <BarChart3 className='h-4 w-4' />
                    Delivery rate
                  </p>
                  <p className='text-foreground mt-2 text-lg font-semibold'>{completionRate}%</p>
                  <Progress
                    value={completionRate}
                    className='bg-muted mt-3 h-2.5'
                    indicatorClassName='bg-success'
                  />
                </div>
                <div className='border-border/70 bg-background/70 rounded-md border p-4 sm:col-span-2 xl:col-span-1'>
                  <p className='text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase'>
                    <CircleDot className='h-4 w-4' />
                    Visible instances
                  </p>
                  <p className='text-foreground mt-2 text-lg font-semibold'>
                    {visibleInstances.length}
                  </p>
                </div>
              </div>
            </section>

            <aside className='border-border/70 bg-card/90 rounded-lg border p-4 shadow-sm backdrop-blur'>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>Class Summary</h3>
              <div className='space-y-4'>
                <div className='border-border/70 flex items-start justify-between gap-3 border-b pb-3'>
                  <span className='text-muted-foreground text-sm'>Course</span>
                  <span className='text-foreground max-w-[180px] text-right text-sm font-medium'>
                    {courseName}
                  </span>
                </div>
                <div className='border-border/70 flex items-start justify-between gap-3 border-b pb-3'>
                  <span className='text-muted-foreground text-sm'>Session format</span>
                  <span className='text-foreground text-right text-sm font-medium'>
                    {formatLabel(selectedClass.session_format)}
                  </span>
                </div>
                <div className='border-border/70 flex items-start justify-between gap-3 border-b pb-3'>
                  <span className='text-muted-foreground text-sm'>Completion</span>
                  <span className='text-foreground text-right text-sm font-medium'>
                    {completionRate}%
                  </span>
                </div>
                <div className='flex items-start justify-between gap-3'>
                  <span className='text-muted-foreground text-sm'>Students</span>
                  <span className='text-foreground text-right text-sm font-medium'>
                    {studentCount}
                  </span>
                </div>
              </div>
            </aside>
          </div>

          <section className='border-border/70 bg-card/90 rounded-lg border p-4 shadow-sm backdrop-blur md:p-5'>
            <div className='mb-4'>
              <h3 className='text-foreground text-xl font-semibold'>Class instances</h3>
              <p className='text-muted-foreground mt-1 text-sm'>{tableDescription}</p>
            </div>
            <div className='overflow-x-auto'>
              <Table className='min-w-[780px]'>
                <TableHeader>
                  <TableRow className='hover:bg-transparent'>
                    <TableHead>Session</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Class Duration</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleInstances.length > 0 ? (
                    visibleInstances.map((instance, index) => (
                      <TableRow key={instance.uuid || `${selectedClass.uuid}-${index}`}>
                        <TableCell className='font-medium'>{index + 1}</TableCell>
                        <TableCell>{formatDateTime(instance.start_time)}</TableCell>
                        <TableCell>
                          {formatDuration(instance.start_time, instance.end_time)}
                        </TableCell>
                        <TableCell>
                          {instance.location_name ||
                            selectedClass.location_name ||
                            formatLabel(selectedClass.location_type)}
                        </TableCell>
                        <TableCell>
                          {getInstanceStatus(instance.start_time, instance.end_time)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className='hover:bg-transparent'>
                      <TableCell colSpan={5} className='text-muted-foreground py-10 text-center'>
                        No class instances match the current date filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

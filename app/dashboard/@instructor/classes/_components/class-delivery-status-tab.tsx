import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { CircleDot, GraduationCap, UserRound, Users } from 'lucide-react';
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
  studentCount: number;
  totalInstances: number;
  completionRate: number;
  visibleInstances: InstructorClassWithSchedule['schedule'];
  onAddClasses: () => void;
}) {
  return (
    <Card className='border-border/70 bg-card shadow-sm'>
      <CardContent className='space-y-6 p-4 sm:p-6'>
        {isLoadingClasses || !selectedClass || !selectedClassEntry ? (
          <div className='space-y-4'>
            <Skeleton className='h-44 rounded-[28px]' />
            <Skeleton className='h-72 rounded-[28px]' />
          </div>
        ) : (
          <>
            <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]'>
              <div className='rounded-[28px] border border-border/70 bg-background/80'>
                <div className='border-border/70 flex flex-col gap-5 border-b p-5 lg:flex-row lg:items-start lg:justify-between'>
                  <div className='flex min-w-0 gap-4'>
                    <div className='min-w-0 space-y-4'>
                      <div className='space-y-2'>
                        <h2 className='text-foreground text-2xl font-semibold'>{selectedClass.title}</h2>
                        <p className='text-muted-foreground text-sm leading-6'>
                          {selectedClass.course?.description ||
                            selectedClass.description ||
                            'Review the selected class, its scheduled instances, and the enrolled students.'}
                        </p>
                      </div>

                      <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-sm'>
                        <span className='inline-flex items-center gap-1.5'>
                          <CircleDot className='h-4 w-4' />
                          {totalInstances} total instances
                        </span>
                        <span className='inline-flex items-center gap-1.5'>
                          <GraduationCap className='h-4 w-4' />
                          {selectedClass.course?.difficulty_uuid
                            ? difficultyMap[selectedClass.course.difficulty_uuid]
                            : 'General'}
                        </span>
                        <span className='inline-flex items-center gap-1.5'>
                          <Users className='h-4 w-4' />
                          {studentCount} unique students
                        </span>
                        <span className='inline-flex items-center gap-1.5'>
                          <UserRound className='h-4 w-4' />
                          {instructorName || 'Instructor view'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type='button'
                    onClick={onAddClasses}
                    className='rounded-md border border-border/70 bg-primary hover:bg-accent'
                  >
                    Add classes
                  </Button>
                </div>

                <div className='grid gap-4 p-5 md:grid-cols-3'>
                  <div className='rounded-[20px] border border-border/70 bg-card p-4'>
                    <p className='text-muted-foreground text-xs uppercase tracking-[0.18em]'>Filter</p>
                    <p className='text-foreground mt-2 text-lg font-semibold'>
                      {dateFilter === 'current-day'
                        ? 'Current day'
                        : dateFilter === 'current-week'
                          ? 'Current week'
                          : dateFilter === 'upcoming'
                            ? 'Upcoming'
                            : 'All scheduled dates'}
                    </p>
                  </div>
                  <div className='rounded-[20px] border border-border/70 bg-card p-4'>
                    <p className='text-muted-foreground text-xs uppercase tracking-[0.18em]'>
                      Delivery rate
                    </p>
                    <p className='text-foreground mt-2 text-lg font-semibold'>{completionRate}%</p>
                    <Progress value={completionRate} className='mt-3 h-2' />
                  </div>
                  <div className='rounded-[20px] border border-border/70 bg-card p-4'>
                    <p className='text-muted-foreground text-xs uppercase tracking-[0.18em]'>
                      Visible instances
                    </p>
                    <p className='text-foreground mt-2 text-lg font-semibold'>
                      {visibleInstances.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className='rounded-[28px] border border-border/70 bg-background/80 p-5'>
                <div className='space-y-4'>
                  <div className='flex items-start justify-between gap-3 border-b border-border/70 pb-3'>
                    <span className='text-muted-foreground text-sm'>Course</span>
                    <span className='text-foreground max-w-[140px] text-right text-sm font-medium'>
                      {selectedClass.course?.name || 'No linked course'}
                    </span>
                  </div>
                  <div className='flex items-start justify-between gap-3 border-b border-border/70 pb-3'>
                    <span className='text-muted-foreground text-sm'>Session format</span>
                    <span className='text-foreground text-right text-sm font-medium'>
                      {formatLabel(selectedClass.session_format)}
                    </span>
                  </div>
                  <div className='flex items-start justify-between gap-3 border-b border-border/70 pb-3'>
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
              </div>
            </div>

            <Card className='border-border/70 bg-background/80 shadow-none'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-lg'>Class instances</CardTitle>
                <p className='text-muted-foreground text-sm'>
                  {dateFilter === 'current-day'
                    ? 'Showing class instances happening today for the selected class.'
                    : dateFilter === 'current-week'
                      ? 'Showing class instances happening in the current week, arranged by date.'
                      : dateFilter === 'upcoming'
                        ? 'Showing upcoming class instances for the selected class.'
                        : 'Showing every scheduled instance for the selected class, arranged by date.'}
                </p>
              </CardHeader>
              <CardContent className='pt-0'>
                <Table>
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
                          <TableCell>{formatDuration(instance.start_time, instance.end_time)}</TableCell>
                          <TableCell>
                            {instance.location_name ||
                              selectedClass.location_name ||
                              formatLabel(selectedClass.location_type)}
                          </TableCell>
                          <TableCell>{getInstanceStatus(instance.start_time, instance.end_time)}</TableCell>
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
              </CardContent>
            </Card>
          </>
        )}
      </CardContent>
    </Card>
  );
}

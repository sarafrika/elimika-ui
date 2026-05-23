'use client';

import { Card, CardContent } from '@/components/ui/card';
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
import { formatDateTime, formatDuration, formatLabel, getInstanceStatus } from './new-class-page.utils';

type ClassScheduleTabProps = {
  isLoading: boolean;
  selectedClass: InstructorClassWithSchedule | null;
};

export function ClassScheduleTab({ isLoading, selectedClass }: ClassScheduleTabProps) {
  if (isLoading || !selectedClass) {
    return (
      <Card className='border-border/70 bg-card shadow-sm'>
        <CardContent className='space-y-3 p-4 md:p-5'>
          <Skeleton className='h-14 rounded-lg' />
          <Skeleton className='h-14 rounded-lg' />
          <Skeleton className='h-14 rounded-lg' />
        </CardContent>
      </Card>
    );
  }

  const schedule = (selectedClass.schedule ?? [])
    .filter(instance => instance.status?.toUpperCase() !== 'CANCELLED')
    .sort((left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime());

  return (
    <Card className='border-border/70 bg-card shadow-sm'>
      <CardContent className='space-y-4 p-4 md:p-5'>
        <div className='space-y-1'>
          <h3 className='text-foreground text-xl font-semibold'>Schedule</h3>
          <p className='text-muted-foreground text-sm'>
            The upcoming sessions for {selectedClass.title} are listed below.
          </p>
        </div>

        <div className='overflow-x-auto'>
          <Table className='min-w-[760px]'>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.length > 0 ? (
                schedule.map((instance, index) => (
                  <TableRow key={instance.uuid ?? `${selectedClass.uuid}-${index}`}>
                    <TableCell className='font-medium'>{index + 1}</TableCell>
                    <TableCell>{formatDateTime(instance.start_time)}</TableCell>
                    <TableCell>{formatDuration(instance.start_time, instance.end_time)}</TableCell>
                    <TableCell>
                      {instance.location_name || selectedClass.location_name || formatLabel(selectedClass.location_type)}
                    </TableCell>
                    <TableCell>{formatLabel(getInstanceStatus(instance.start_time, instance.end_time))}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className='py-10 text-center text-muted-foreground'>
                    No scheduled sessions for this class yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

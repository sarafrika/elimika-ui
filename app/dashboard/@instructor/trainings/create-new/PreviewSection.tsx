'use client';

import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Clock, Users } from 'lucide-react';
import { useMemo } from 'react';
import { ClassDetails, ScheduleSettings } from './page';

export const PreviewSection = ({
  classDetails,
  scheduleSettings,
  courseData,
  courseLessons,
  occurrenceCount,
}: {
  classDetails: ClassDetails;
  scheduleSettings: ScheduleSettings;
  courseData?: any;
  courseLessons?: any[];
  occurrenceCount: number;
}) => {
  const totalHours = useMemo(() => {
    if (scheduleSettings.allDay) return 12;

    const { startTime, endTime } = scheduleSettings.startClass;
    if (!startTime || !endTime) return 0;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    // @ts-ignore
    const start = startH + startM / 60;
    // @ts-ignore
    const end = endH + endM / 60;
    const diff = end >= start ? end - start : 24 - start + end;

    return Number(diff.toFixed(2));
  }, [scheduleSettings]);

  const ratePerLesson = parseFloat(classDetails.rate_card || '0') * totalHours || 0;
  const lessonsCount = courseLessons?.length || 0;
  const totalFee = ratePerLesson * lessonsCount;

  return (
    <Card className='overflow-hidden border shadow-sm'>
      <div className='bg-muted/50 border-b px-6 py-4'>
        <h3 className='text-foreground text-lg font-semibold'>Preview</h3>
      </div>

      {/* Summary Stats */}
      <div className='grid grid-cols-1 gap-4 border-b p-6 md:grid-cols-3'>
        <div className='flex items-center gap-3'>
          <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
            <Clock className='text-primary h-5 w-5' />
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Duration</p>
            <p className='text-foreground text-lg font-semibold'>{totalHours} hours</p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
            <Users className='text-primary h-5 w-5' />
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Max Participants</p>
            <p className='text-foreground text-lg font-semibold'>{classDetails.class_limit || 0}</p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
            <Calendar className='text-primary h-5 w-5' />
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Occurrences</p>
            <p className='text-foreground text-lg font-semibold'>{occurrenceCount}</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <Table>
        <TableBody>
          <TableRow className='hover:bg-transparent'>
            <TableCell className='bg-muted/30 w-1/3 py-4 font-semibold'>Course</TableCell>
            <TableCell className='bg-card py-4'>
              {courseData?.name || classDetails.course_uuid}
            </TableCell>
          </TableRow>

          <TableRow className='hover:bg-transparent'>
            <TableCell className='bg-muted/30 py-4 font-semibold'>Title</TableCell>
            <TableCell className='bg-card py-4'>{classDetails.title}</TableCell>
          </TableRow>

          <TableRow className='hover:bg-transparent'>
            <TableCell className='bg-muted/30 py-4 font-semibold'>Type</TableCell>
            <TableCell className='bg-card py-4'>{classDetails.class_type}</TableCell>
          </TableRow>

          <TableRow className='hover:bg-transparent'>
            <TableCell className='bg-muted/30 py-4 font-semibold'>Start Date</TableCell>
            <TableCell className='bg-card py-4'>
              {scheduleSettings.startClass.date
                ? new Date(scheduleSettings.startClass.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '—'}
            </TableCell>
          </TableRow>

          <TableRow className='hover:bg-transparent'>
            <TableCell className='bg-muted/30 py-4 font-semibold'>Time</TableCell>
            <TableCell className='bg-card py-4'>
              {scheduleSettings.allDay
                ? 'All Day'
                : `${scheduleSettings.startClass.startTime || '—'} - ${scheduleSettings.startClass.endTime || '—'}`}
            </TableCell>
          </TableRow>

          <TableRow className='hover:bg-transparent'>
            <TableCell className='bg-muted/30 py-4 font-semibold'>Total Fee</TableCell>
            <TableCell className='bg-card text-primary py-4 font-bold'>
              KES {totalFee.toLocaleString()}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* Lessons */}
      {courseLessons && courseLessons.length > 0 && (
        <div className='border-t'>
          <div className='bg-muted/50 px-6 py-3'>
            <h4 className='text-foreground font-semibold'>Lessons ({lessonsCount})</h4>
          </div>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/30 hover:bg-muted/30'>
                <TableHead className='text-foreground font-semibold'>Lesson</TableHead>
                <TableHead className='text-foreground font-semibold'>Title</TableHead>
                <TableHead className='text-foreground font-semibold'>Sequence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseLessons
                .slice()
                .sort((a, b) => Number(a.lesson_sequence || 0) - Number(b.lesson_sequence || 0))
                .map((lesson, index) => (
                  <TableRow key={lesson.uuid || index}>
                    <TableCell>Lesson {lesson.lesson_number || index + 1}</TableCell>
                    <TableCell>{lesson.title || 'Untitled'}</TableCell>
                    <TableCell>{lesson.lesson_sequence || index + 1}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};

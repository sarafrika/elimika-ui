'use client';

import { Card } from '@/components/ui/card';
import { Calendar, Clock, Users } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import type { ClassDetailsCourse, ClassDetailsLesson } from '@/hooks/use-class-details';
import { ClassDetails, ScheduleSettings } from './page';
import { ScheduleMode, ScheduledSessionInstance } from './schedule-utils';

export const PreviewSection = ({
  classDetails,
  scheduleSettings,
  scheduleMode,
  customSessions,
  courseData,
  courseLessons,
  occurrenceCount,
}: {
  classDetails: ClassDetails;
  scheduleSettings: ScheduleSettings;
  scheduleMode: ScheduleMode;
  customSessions: ScheduledSessionInstance[];
  courseData?: ClassDetailsCourse;
  courseLessons?: ClassDetailsLesson[];
  occurrenceCount: number;
}) => {
  const totalHours = useMemo(() => {
    if (scheduleMode === 'custom') {
      return customSessions.reduce((sum, session) => sum + session.hours, 0);
    }

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
  }, [customSessions, scheduleMode, scheduleSettings]);

  const ratePerLesson = parseFloat(classDetails.rate_card || '0') * totalHours || 0;
  const lessonsCount = courseLessons?.length || 0;
  const totalFee = ratePerLesson * lessonsCount;

  return (
    <Card className='overflow-hidden border shadow-sm pt-0'>
      <div className='bg-muted/50 border-b px-4 py-4 sm:px-6'>
        <h3 className='text-foreground text-lg font-semibold'>Preview</h3>
      </div>

      {/* Summary Stats */}
      <div className='grid grid-cols-1 gap-4 border-b p-4 sm:grid-cols-2 sm:p-6 md:grid-cols-3'>
        <div className='flex min-w-0 items-center gap-3'>
          <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
            <Clock className='text-primary h-5 w-5' />
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Duration</p>
            <p className='text-foreground text-lg font-semibold'>{totalHours} hours</p>
          </div>
        </div>

        <div className='flex min-w-0 items-center gap-3'>
          <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
            <Users className='text-primary h-5 w-5' />
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Max Participants</p>
            <p className='text-foreground text-lg font-semibold'>{classDetails.class_limit || 0}</p>
          </div>
        </div>

        <div className='flex min-w-0 items-center gap-3'>
          <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
            <Calendar className='text-primary h-5 w-5' />
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Occurrences</p>
            <p className='text-foreground text-lg font-semibold'>
              {scheduleMode === 'custom' ? customSessions.length : occurrenceCount}
            </p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className='divide-y'>
        <DetailRow label='Course'>{courseData?.name || classDetails.course_uuid}</DetailRow>
        <DetailRow label='Title'>{classDetails.title}</DetailRow>
        <DetailRow label='Type'>{classDetails.class_type}</DetailRow>
        <DetailRow label='Start Date'>
          {(scheduleMode === 'custom' ? customSessions[0]?.date : scheduleSettings.startClass.date)
            ? new Date(
              `${
                scheduleMode === 'custom' ? customSessions[0]?.date : scheduleSettings.startClass.date
              }T00:00:00`
            ).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
            : '—'}
        </DetailRow>
        <DetailRow label='Time'>
          {scheduleMode === 'custom'
            ? customSessions.length > 0
              ? `${customSessions[0].startTime} - ${customSessions[0].endTime}`
              : '—'
            : scheduleSettings.allDay
              ? 'All Day'
              : `${scheduleSettings.startClass.startTime || '—'} - ${scheduleSettings.startClass.endTime || '—'}`}
        </DetailRow>
        <DetailRow label='Total Fee' valueClassName='text-primary font-bold'>
          KES {totalFee.toLocaleString()}
        </DetailRow>
      </div>

      {/* Lessons */}
      {courseLessons && courseLessons.length > 0 && (
        <div className='border-t'>
          <div className='bg-muted/50 px-4 py-3 sm:px-6'>
            <h4 className='text-foreground font-semibold'>Lessons ({lessonsCount})</h4>
          </div>
          <div className='space-y-3 p-4 sm:p-6'>
            <div className='space-y-3 md:hidden'>
              {courseLessons
                .slice()
                .sort((a, b) => Number(a.lesson_sequence || 0) - Number(b.lesson_sequence || 0))
                .map((lesson, index) => (
                  <div key={lesson.uuid || index} className='rounded-lg border bg-card p-3'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <p className='text-sm font-semibold text-foreground'>
                          Lesson {lesson.lesson_number || index + 1}
                        </p>
                        <p className='text-muted-foreground truncate text-sm'>
                          {lesson.title || 'Untitled'}
                        </p>
                      </div>
                      <div className='text-muted-foreground shrink-0 text-sm'>
                        #{lesson.lesson_sequence || index + 1}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className='hidden overflow-hidden rounded-lg border md:block'>
              <table className='w-full'>
                <thead className='bg-muted/50'>
                  <tr className='border-b'>
                    <th className='p-3 text-left text-sm font-medium'>Lesson</th>
                    <th className='p-3 text-left text-sm font-medium'>Title</th>
                    <th className='p-3 text-left text-sm font-medium'>Sequence</th>
                  </tr>
                </thead>
                <tbody>
                  {courseLessons
                    .slice()
                    .sort((a, b) => Number(a.lesson_sequence || 0) - Number(b.lesson_sequence || 0))
                    .map((lesson, index) => (
                      <tr key={lesson.uuid || index} className='border-b last:border-0'>
                        <td className='p-3'>Lesson {lesson.lesson_number || index + 1}</td>
                        <td className='p-3'>{lesson.title || 'Untitled'}</td>
                        <td className='p-3'>{lesson.lesson_sequence || index + 1}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

const DetailRow = ({
  label,
  children,
  valueClassName,
}: {
  label: string;
  children: ReactNode;
  valueClassName?: string;
}) => {
  return (
    <div className='grid gap-3 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(150px,0.85fr)_minmax(0,2.15fr)] lg:gap-4'>
      <div className='bg-muted/30 rounded-md px-3 py-2 text-sm font-semibold lg:bg-transparent lg:p-0'>
        {label}
      </div>
      <div className={`min-w-0 break-words text-sm text-foreground ${valueClassName || ''}`}>
        {children}
      </div>
    </div>
  );
};

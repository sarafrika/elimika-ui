'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { Calendar, CheckCircle2, Clock, Copy, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { getAllDifficultyLevelsOptions } from '../../../../../services/client/@tanstack/react-query.gen';
import { ClassDetails, ScheduleSettings } from './page';

export const ClassPreviewFormPage = ({
  classDetails,
  classUuid,
  scheduleSettings,
  courseData,
  courseLessons,
}: {
  classDetails: ClassDetails;
  classUuid: string;
  scheduleSettings: ScheduleSettings;
  courseData?: any;
  courseLessons?: any[];
}) => {
  const { data: difficulty } = useQuery(getAllDifficultyLevelsOptions());
  const difficultyLevels = difficulty?.data;

  const getDifficultyNameFromUUID = (uuid: string): string | undefined => {
    return difficultyLevels?.find(level => level.uuid === uuid)?.name;
  };

  const registrationLink = courseData?.uuid
    ? `https://elimika.sarafrika.com/dashboard/browse-courses/enroll/${courseData.uuid}`
    : '';
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link to clipboard');
    }
  };

  const totalHours = (() => {
    if (scheduleSettings.allDay) {
      return 12;
    }

    const { startTime, endTime } = scheduleSettings.startClass;

    if (!startTime || !endTime) return 0;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const start = startH + startM / 60;
    const end = endH + endM / 60;

    const diff = end >= start ? end - start : 24 - start + end;

    return Number(diff.toFixed(2));
  })();

  const ratePerLesson = parseFloat(classDetails.rate_card) * totalHours || 0;
  const lessonsCount = courseLessons?.length || 0;
  const totalFee = ratePerLesson * lessonsCount;

  const handlePublish = () => {
    // Implement publish logic here
    toast.success('Class published successfully!');
  };

  const handleSaveDraft = () => {
    // Implement save draft logic here
    toast.success('Class saved as draft!');
  };

  const formatClassType = (classType: string) => {
    const typeMap: Record<string, string> = {
      group_inperson_rate: 'In-person Group Class',
      group_online_rate: 'Online Group Class',
      private_inperson_rate: 'In-person Private Class',
      private_online_rate: 'Online Private Class',
    };
    return typeMap[classType] || classType;
  };

  return (
    <div className='mx-auto max-w-5xl px-6'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h2 className='text-foreground mb-2 text-xl font-bold'>Review Your Class</h2>
          <p className='text-muted-foreground'>Review all details before publishing your class</p>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            type='button'
            variant='outline'
            onClick={handleSaveDraft}
            size='lg'
            className='px-6'
          >
            Save as Draft
          </Button>

          <Button type='button' onClick={handlePublish} size='lg' className='px-8'>
            <CheckCircle2 className='mr-2 h-4 w-4' />
            Publish Class
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className='mb-8 grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Card className='border p-5 shadow-md'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
              <Clock className='text-primary h-5 w-5' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Duration</p>
              <p className='text-foreground text-lg font-semibold'>{totalHours} hours</p>
            </div>
          </div>
        </Card>

        <Card className='border p-5 shadow-md'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
              <Users className='text-primary h-5 w-5' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Max Participants</p>
              <p className='text-foreground text-lg font-semibold'>
                {classDetails.class_limit || courseData?.class_limit || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className='border p-5 shadow-md'>
          <div className='flex items-center gap-3'>
            <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
              <Calendar className='text-primary h-5 w-5' />
            </div>
            <div>
              <p className='text-muted-foreground text-sm'>Total Lessons</p>
              <p className='text-foreground text-lg font-semibold'>{lessonsCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Class Details Card */}
      <Card className='mb-6 overflow-hidden rounded-xl shadow-lg'>
        <div className='bg-muted/50 border-b px-6 py-4'>
          <h3 className='text-foreground text-lg font-semibold'>Class Details</h3>
        </div>
        <Table>
          <TableBody>
            <TableRow className='border-b hover:bg-transparent'>
              <TableCell className='bg-muted/30 w-1/3 py-5 font-semibold'>Course Title</TableCell>
              <TableCell className='bg-card py-5'>
                <div className='flex items-center justify-between'>
                  <span className='font-medium'>
                    {courseData?.name || classDetails.course_uuid || '-'}
                  </span>
                  {registrationLink && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => copyToClipboard(registrationLink)}
                      className='text-primary hover:text-primary/80 flex items-center gap-2'
                    >
                      <Copy className='h-4 w-4' />
                      {copied ? 'Copied!' : 'Copy link'}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
            <TableRow className='border-b hover:bg-transparent'>
              <TableCell className='bg-muted/30 py-5 font-semibold'>Class Title</TableCell>
              <TableCell className='bg-card py-5 font-medium'>
                {classDetails.title || '-'}
              </TableCell>
            </TableRow>
            <TableRow className='border-b hover:bg-transparent'>
              <TableCell className='bg-muted/30 py-5 font-semibold'>Tagline/Categories</TableCell>
              <TableCell className='bg-card py-5'>
                <div className='flex flex-wrap gap-2'>
                  {(Array.isArray(classDetails.categories)
                    ? classDetails.categories
                    : classDetails.categories
                      ? [classDetails.categories]
                      : courseData?.category_names || []
                  ).map((cat: string, idx: number) => (
                    <span key={idx} className='bg-muted rounded-full px-3 py-1 text-sm font-medium'>
                      {cat}
                    </span>
                  ))}
                </div>
              </TableCell>
            </TableRow>
            <TableRow className='border-b hover:bg-transparent'>
              <TableCell className='bg-muted/30 py-5 font-semibold'>Target Audience</TableCell>
              <TableCell className='bg-card space-y-2 py-5'>
                <p className='font-medium'>
                  {getDifficultyNameFromUUID(courseData?.difficulty_uuid) ||
                    classDetails.targetAudience ||
                    '-'}
                </p>
                <p className='text-muted-foreground text-sm'>
                  Ages {courseData?.age_lower_limit || '-'} - {courseData?.age_upper_limit || '-'}
                </p>
                <p className='text-muted-foreground text-sm'>
                  {classDetails.class_limit || courseData?.class_limit || '-'} max participants
                </p>
              </TableCell>
            </TableRow>
            <TableRow className='hover:bg-transparent'>
              <TableCell className='bg-muted/30 py-5 font-semibold'>Class Type</TableCell>
              <TableCell className='bg-card py-5'>
                <div className='flex items-center justify-between'>
                  <span className='font-medium'>
                    {formatClassType(classDetails.class_type) || 'Not specified'}
                  </span>
                  <span className='text-foreground text-lg font-bold'>
                    Ksh {parseFloat(classDetails.rate_card || '0').toLocaleString()}/hr
                  </span>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {/* Location and Classroom Card */}
      <Card className='mb-6 overflow-hidden rounded-xl shadow-lg'>
        <div className='bg-muted/50 border-b px-6 py-4'>
          <h3 className='text-foreground text-lg font-semibold'>Location & Classroom</h3>
        </div>
        <Table>
          <TableBody>
            <TableRow className='border-b hover:bg-transparent'>
              <TableCell className='bg-muted/30 w-1/3 py-5 font-semibold'>Location Type</TableCell>
              <TableCell className='bg-card py-5 font-medium'>
                {classDetails.location_type
                  ? classDetails.location_type.charAt(0).toUpperCase() +
                    classDetails.location_type.slice(1).replace('_', ' ')
                  : '-'}
              </TableCell>
            </TableRow>
            <TableRow className='hover:bg-transparent'>
              <TableCell className='bg-muted/30 py-5 font-semibold'>
                Classroom/Meeting Link
              </TableCell>
              <TableCell className='bg-card py-5 font-medium'>
                {classDetails.location_name || 'Not specified'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {/* Schedule Details Card */}
      <Card className='mb-6 overflow-hidden rounded-xl shadow-lg'>
        <div className='bg-muted/50 border-b px-6 py-4'>
          <h3 className='text-foreground text-lg font-semibold'>Schedule Details</h3>
        </div>
        <Table>
          <TableBody>
            <TableRow className='border-b hover:bg-transparent'>
              <TableCell className='bg-muted/30 w-1/3 py-5 font-semibold'>Start Date</TableCell>
              <TableCell className='bg-card py-5 font-medium'>
                {scheduleSettings.startClass.date
                  ? new Date(scheduleSettings.startClass.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '-'}
              </TableCell>
            </TableRow>
            <TableRow className='border-b hover:bg-transparent'>
              <TableCell className='bg-muted/30 py-5 font-semibold'>Time</TableCell>
              <TableCell className='bg-card py-5'>
                <div className='flex items-center gap-4'>
                  <p className='font-medium'>
                    {scheduleSettings.allDay
                      ? 'All Day'
                      : `${scheduleSettings.startClass.startTime || '-'} - ${scheduleSettings.startClass.endTime || '-'}`}
                  </p>
                  <span className='bg-muted rounded-full px-3 py-1 text-sm font-medium'>
                    {totalHours} hours
                  </span>
                </div>
              </TableCell>
            </TableRow>
            <TableRow className='border-b hover:bg-transparent'>
              <TableCell className='bg-muted/30 py-5 font-semibold'>Recurrence</TableCell>
              <TableCell className='bg-card py-5 font-medium'>
                {scheduleSettings.repeat.unit === 'week' && scheduleSettings.repeat.days?.length
                  ? `Every ${scheduleSettings.repeat.interval} week(s) on ${scheduleSettings.repeat.days.map(d => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d]).join(', ')}`
                  : `Every ${scheduleSettings.repeat.interval} ${scheduleSettings.repeat.unit}(s)`}
              </TableCell>
            </TableRow>
            <TableRow className='hover:bg-transparent'>
              <TableCell className='bg-muted/30 py-5 font-semibold'>Registration Period</TableCell>
              <TableCell className='bg-card py-5 font-medium'>
                {scheduleSettings.registrationPeriod.continuous
                  ? 'Continuous registration'
                  : scheduleSettings.registrationPeriod.start &&
                      scheduleSettings.registrationPeriod.end
                    ? `${new Date(scheduleSettings.registrationPeriod.start).toLocaleDateString()} - ${new Date(scheduleSettings.registrationPeriod.end).toLocaleDateString()}`
                    : 'Not set'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {/* Lessons Order Card */}
      {courseLessons && courseLessons.length > 0 && (
        <Card className='mb-6 overflow-hidden rounded-xl shadow-lg'>
          <div className='bg-muted/50 flex items-center justify-between border-b px-6 py-4'>
            <h3 className='text-foreground text-lg font-semibold'>Lessons Order</h3>
            <span className='bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-semibold'>
              {lessonsCount} lesson{lessonsCount !== 1 ? 's' : ''}
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableRow className='bg-muted/30 hover:bg-muted/30 border-b'>
                <TableHead className='text-foreground py-4 font-semibold'>Lesson #</TableHead>
                <TableHead className='text-foreground font-semibold'>Title</TableHead>
                <TableHead className='text-foreground font-semibold'>Duration</TableHead>
                <TableHead className='text-foreground font-semibold'>Sequence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseLessons
                .slice()
                .sort((a, b) => Number(a.lesson_sequence || 0) - Number(b.lesson_sequence || 0))
                .map((lesson, index) => (
                  <TableRow key={lesson.uuid || index} className='hover:bg-muted/20 border-b'>
                    <TableCell className='py-4 font-medium'>
                      Lesson {lesson.lesson_number || index + 1}
                    </TableCell>
                    <TableCell className='font-medium'>{lesson.title || 'Untitled'}</TableCell>
                    <TableCell className='text-muted-foreground'>
                      {lesson.duration || '-'}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {lesson.lesson_sequence || index + 1}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Order Total Card */}
      <Card className='border-primary/20 overflow-hidden rounded-xl border-2 shadow-lg'>
        <div className='from-primary/10 via-primary/5 to-primary/10 flex items-center justify-between bg-gradient-to-r px-6 py-6'>
          <div>
            <span className='text-foreground mb-2 block text-lg font-bold'>
              Estimated Total Fee
            </span>
            <span className='text-muted-foreground text-sm'>
              Rate per lesson: Ksh {ratePerLesson.toLocaleString()} × {lessonsCount} lesson
              {lessonsCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className='text-right'>
            <div className='text-foreground text-3xl font-bold'>
              Ksh {totalFee.toLocaleString()}
            </div>
            <div className='text-muted-foreground mt-1 text-sm'>Total course fee</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

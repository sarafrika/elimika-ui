'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format, isAfter } from 'date-fns';
import { BookOpen, Calendar } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
// Import hooks
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useStudent } from '@/context/student-context';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { useDifficultyLevels } from '@/hooks/use-difficultyLevels';
import { resolveLessonContentSource } from '@/lib/lesson-content-preview';
import type { GetClassScheduleResponse, GetEnrollmentsForClassResponse } from '@/services/client';
// Import your API functions
import {
  getClassDefinitionOptions,
  getClassScheduleOptions,
  getCourseByUuidOptions,
  getEnrollmentsForClassOptions,
  getInstructorByUuidOptions,
  submitInstructorReviewMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { CustomLoadingState } from '../../../../@course_creator/_components/loading-state';
import { FeedbackDialog } from '../../../../_components/review-instructor-modal';
import { ClassPageHeader } from './ClassPageHeader';
import { CourseProgramSection, type LessonContent, type LessonModule } from './CourseProgram';
import { LessonDetailsSidebar } from './LessonDetailsSidebar';
import { NextClassCard } from './NextClassCard';
import { ReadingMode } from './ReadingMode';
import {
  ScheduleDetailsDialog,
  type ClassScheduleItem as ScheduleDetailsItem,
} from './StudentDetailsDialog';
import { ClassScheduleCalendar, type ClassScheduleItem } from './SudentClassSchedule';
import { VideoPlayer } from './VideoPlayer';
import { WeeklyScheduleList } from './WeeklyScheduleList';

// Import components

type ClassEnrollment = NonNullable<GetEnrollmentsForClassResponse['data']>[number];
type ApiClassScheduleItem = NonNullable<
  NonNullable<GetClassScheduleResponse['data']>['content']
>[number] & {
  student_attended?: boolean | null;
};

function toScheduleDetailsItem(schedule: ClassScheduleItem): ScheduleDetailsItem {
  return {
    uuid: schedule.uuid,
    start_time: schedule.start_time,
    end_time: schedule.end_time,
    title: schedule.title,
    location_type: schedule.location_type,
    location_name: schedule.location_name,
    status: schedule.status,
    duration_formatted: schedule.duration_formatted,
    instructor_name: schedule.instructor_name,
    student_attended: schedule.student_attended,
  };
}

function normalizeScheduleItem(
  schedule: ApiClassScheduleItem,
  instructorName?: string
): ClassScheduleItem | null {
  if (!schedule.uuid || !schedule.class_definition_uuid) {
    return null;
  }

  const startTime = new Date(schedule.start_time);
  const endTime = new Date(schedule.end_time);

  return {
    uuid: schedule.uuid,
    class_definition_uuid: schedule.class_definition_uuid,
    start_time: String(schedule.start_time),
    end_time: String(schedule.end_time),
    timezone: schedule.timezone,
    title: schedule.title,
    location_type: schedule.location_type === 'ONLINE' ? 'ONLINE' : 'PHYSICAL',
    location_name: schedule.location_name ?? null,
    status: schedule.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED',
    duration_minutes: Number(schedule.duration_minutes ?? 0),
    duration_formatted:
      schedule.duration_formatted ??
      `${Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)))} mins`,
    time_range:
      schedule.time_range ?? `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`,
    is_currently_active: Boolean(schedule.is_currently_active),
    can_be_cancelled: Boolean(schedule.can_be_cancelled),
    instructor_name: instructorName,
    student_attended:
      typeof schedule.student_attended === 'boolean' ? schedule.student_attended : null,
  };
}

export default function ClassDetailsPage() {
  const params = useParams();
  const classId = params?.id as string;
  const student = useStudent();
  const { difficultyMap } = useDifficultyLevels();
  const { replaceBreadcrumbs } = useBreadcrumb();

  // State Management
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleDetailsItem | null>(null);
  const [showCourseProgram, setShowCourseProgram] = useState(true);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LessonContent | null>(null);

  // Feedback/Rating states
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [clarityRating, setClarityRating] = useState(0);
  const [engagementRating, setEngagementRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [headline, setHeadline] = useState('');

  // Media player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReading, setIsReading] = useState(false);

  // API Queries
  const { data: classData, isLoading: classLoading } = useQuery({
    ...getClassDefinitionOptions({ path: { uuid: classId } }),
    enabled: !!classId,
  });

  const classDefinition = classData?.data?.class_definition;

  const { data: instructor, isLoading: instructorLoading } = useQuery({
    ...getInstructorByUuidOptions({
      path: { uuid: classDefinition?.default_instructor_uuid as string },
    }),
    enabled: !!classDefinition?.default_instructor_uuid,
  });

  const { data: course, isLoading: courseLoading } = useQuery({
    ...getCourseByUuidOptions({
      path: { uuid: classDefinition?.course_uuid as string },
    }),
    enabled: !!classDefinition?.course_uuid,
  });

  const { data: classEnrollments } = useQuery({
    ...getEnrollmentsForClassOptions({
      path: { uuid: classDefinition?.uuid as string },
    }),
    enabled: !!classDefinition?.uuid,
  });

  const { data: classSchedules } = useQuery({
    ...getClassScheduleOptions({
      path: { uuid: classDefinition?.uuid as string },
      query: { pageable: {} },
    }),
    enabled: !!classDefinition?.uuid,
  });

  const normalizedSchedules = useMemo(
    () =>
      (classSchedules?.data?.content ?? [])
        .map(schedule => normalizeScheduleItem(schedule, instructor?.full_name))
        .filter((schedule): schedule is ClassScheduleItem => schedule !== null),
    [classSchedules?.data?.content, instructor?.full_name]
  );

  const studentEnrollment = classEnrollments?.data?.find(
    (enrollment: ClassEnrollment) => enrollment?.student_uuid === student?.uuid
  );

  const {
    isLoading: isAllLessonsDataLoading,
    lessons: lessonsWithContent,
    contentTypeMap,
  } = useCourseLessonsWithContent({ courseUuid: course?.data?.uuid as string });

  const courseProgramLessons = useMemo(() => {
    return (lessonsWithContent ?? []).flatMap(item => {
      if (!item.lesson.uuid) {
        return [];
      }

      const lesson: LessonModule = {
        lesson: {
          uuid: item.lesson.uuid,
          title: item.lesson.title,
          description: item.lesson.description,
        },
        content: {
          data: (item.content?.data ?? []).flatMap(content => {
            if (!content.uuid) {
              return [];
            }

            const lessonContent: LessonContent = {
              uuid: content.uuid,
              title: content.title,
              type: String(contentTypeMap[content.content_type_uuid] ?? 'content'),
              content_type_uuid: content.content_type_uuid,
              content_text: content.content_text,
              file_url: content.file_url,
              duration: content.file_size_display,
              description: content.description,
            };

            return [lessonContent];
          }),
        },
      };

      return [lesson];
    });
  }, [contentTypeMap, lessonsWithContent]);

  // Mutations
  const reviewInstructor = useMutation(submitInstructorReviewMutation());

  // Computed Values
  const nextClass = useMemo(() => {
    const now = new Date();
    const upcoming = normalizedSchedules
      .filter(schedule => isAfter(new Date(schedule.start_time), now))
      .sort(
        (left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime()
      );
    return upcoming[0] || null;
  }, [normalizedSchedules]);

  const joinClassHref = useMemo(() => {
    const link = classDefinition?.meeting_link?.trim();
    return link ? link : null;
  }, [classDefinition?.meeting_link]);

  const nextClassLocationLabel = useMemo(() => {
    if (!nextClass) return 'your class location';

    return (
      nextClass.location_name ||
      classDefinition?.location_name ||
      (nextClass.location_type === 'ONLINE' ? 'online classroom' : 'the classroom listed for this class')
    );
  }, [classDefinition?.location_name, nextClass]);

  const joinClassNote = useMemo(() => {
    if (joinClassHref) return null;
    if (!nextClass) return null;

    return `This session does not have a meeting link. Please attend the physical class at ${nextClassLocationLabel}.`;
  }, [joinClassHref, nextClass, nextClassLocationLabel]);

  const progress = useMemo(() => {
    const totalLessons =
      lessonsWithContent?.reduce((total, item) => {
        if (item.content && Array.isArray(item.content.data)) {
          return total + item.content.data.length;
        }
        return total;
      }, 0) ?? 0;

    const completedLessons = 0; // TODO: Get from actual completion data
    const percentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return { totalLessons, completedLessons, percentage };
  }, [lessonsWithContent]);

  // Effects
  useEffect(() => {
    if (classDefinition) {
      replaceBreadcrumbs([
        { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
        { id: 'schedule', title: 'Schedule', url: '/dashboard/schedule' },
        {
          id: 'training-page',
          title: classDefinition.title,
          url: `/dashboard/schedule/classes/${classDefinition.uuid}`,
          isLast: true,
        },
      ]);
    }
  }, [classDefinition, replaceBreadcrumbs]);

  useEffect(() => {
    const firstLesson = courseProgramLessons[0];

    if (firstLesson && !selectedLesson) {
      setExpandedModules([firstLesson.lesson.uuid]);
      setSelectedLesson(firstLesson.content.data[0] ?? null);
    }
  }, [courseProgramLessons, selectedLesson]);

  // Handlers
  const handleSubmitFeedback = () => {
    if (!classDefinition || !studentEnrollment?.uuid || !instructor?.uuid || !student?.uuid) {
      toast.error('Class or student enrollment not found');
      return;
    }

    const enrollmentUuid = studentEnrollment.uuid;
    const instructorUuid = instructor.uuid;
    const studentUuid = student.uuid;

    reviewInstructor.mutate(
      {
        body: {
          enrollment_uuid: enrollmentUuid,
          instructor_uuid: instructorUuid,
          student_uuid: studentUuid,
          comments: feedbackComment,
          headline: headline,
          is_anonymous: false,
          rating: rating,
          clarity_rating: clarityRating,
          engagement_rating: engagementRating,
          punctuality_rating: punctualityRating,
        },
        path: { instructorUuid },
      },
      {
        onSuccess: data => {
          toast.success(data?.message);
          setShowFeedbackDialog(false);
          setFeedbackComment('');
          setHeadline('');
          setRating(0);
          setClarityRating(0);
          setEngagementRating(0);
          setPunctualityRating(0);
        },
        onError: data => {
          toast.error(data?.message);
        },
      }
    );
  };

  const handleLessonSelect = (lesson: LessonContent) => {
    setSelectedLesson(lesson);
    setIsPlaying(false);
    setIsReading(false);
  };

  // MAKE CHANGES HERE
  const handleStartLesson = () => {
    if (!selectedLesson) return;

    const contentType = contentTypeMap[selectedLesson.content_type_uuid];

    if (contentType === 'video') {
      setIsPlaying(true);
    } else if (contentType === 'pdf' || contentType === 'text') {
      setIsReading(true);
    }
  };

  const handleMarkComplete = () => {
    toast.message('This feature is under development');
  };

  const handleToggleModule = (uuid: string) => {
    setExpandedModuleId(prev => (prev === uuid ? null : uuid));
  };

  // Loading State
  const loading = classLoading || instructorLoading || courseLoading || isAllLessonsDataLoading;

  if (loading) {
    return <CustomLoadingState subHeading='Fetching class information...' />;
  }

  const contentTypeName = selectedLesson ? contentTypeMap[selectedLesson.content_type_uuid] : null;

  return (
    <div className='bg-background min-h-screen'>
      {/* Header */}
      <ClassPageHeader
        thumbnailUrl={course?.data?.thumbnail_url}
        title={classDefinition?.title || ''}
        description={classDefinition?.description || ''}
        duration={classDefinition?.duration_formatted || ''}
        difficulty={
          difficultyMap && course?.data?.difficulty_uuid
            ? (difficultyMap[course.data.difficulty_uuid] ?? 'N/A')
            : 'N/A'
        }
        instructorName={instructor?.full_name || ''}
        onRateInstructor={() => setShowFeedbackDialog(true)}
      />

      {/* Progress Bar */}
      <div className='border-b'>
        <div className='mx-auto max-w-7xl px-4 py-4 sm:px-6'>
          <Progress value={progress.percentage} className='mb-2 h-2' />
          <p className='text-sm font-medium'>{Math.round(progress.percentage)}% completed</p>
        </div>
      </div>

      {/* Next Class Section */}
      <NextClassCard
        nextClass={nextClass}
        joinHref={joinClassHref}
        joinLabel='Join Class'
        locationNote={joinClassNote}
        onJoinClass={schedule => {
          if (joinClassHref) {
            window.open(joinClassHref, '_blank', 'noopener,noreferrer');
            return;
          }

          toast.message(
            `${schedule.title} is a physical session. Please attend at ${nextClassLocationLabel}.`
          );
        }}
      />

      {/* Main Content */}
      <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8'>
        {/* Action Buttons */}
        <div className='mb-6 flex flex-col gap-3 sm:flex-row'>
          <Button
            variant='outline'
            onClick={() => setShowCalendar(true)}
            className='w-full gap-2 sm:w-auto'
          >
            <Calendar className='h-4 w-4' />
            View Schedule Calendar
          </Button>

          <Button
            variant='outline'
            onClick={() => setShowCourseProgram(!showCourseProgram)}
            className='w-full gap-2 sm:w-auto'
          >
            <BookOpen className='h-4 w-4' />
            {showCourseProgram ? 'Hide' : 'Show'} Course Program
          </Button>
        </div>

        {/* Content Grid */}
        <div className='mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Course Program */}
          {showCourseProgram && (
            <div className='lg:col-span-2'>
              <CourseProgramSection
                isVisible={showCourseProgram}
                onToggleVisibility={() => setShowCourseProgram(false)}
                lessons={courseProgramLessons}
                expandedModuleId={expandedModuleId}
                onToggleModule={handleToggleModule}
                selectedLesson={selectedLesson}
                onLessonSelect={handleLessonSelect}
                contentTypeMap={contentTypeMap}
              />
            </div>
          )}

          {/* Lesson Details Sidebar */}
          <div className={showCourseProgram ? '' : 'lg:col-span-3'}>
            <LessonDetailsSidebar
              lesson={selectedLesson}
              onStartLesson={handleStartLesson}
              onMarkComplete={handleMarkComplete}
              totalLessons={progress.totalLessons}
              completedLessons={progress.completedLessons}
              overallProgress={Math.round(progress.percentage)}
              timeSpent='0'
              contentTypeMap={contentTypeMap}
            />
          </div>
        </div>

        {/* Weekly Schedule */}
        <WeeklyScheduleList
          schedules={normalizedSchedules}
          onScheduleClick={schedule => {
            const selected = normalizedSchedules.find(item => item.uuid === schedule.uuid);
            if (selected) {
              setSelectedSchedule(toScheduleDetailsItem(selected));
            }
          }}
        />
      </div>

      {/* Dialogs and Modals */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className='max-h-[90vh] max-w-[95vw] overflow-y-auto p-4 sm:max-w-4xl sm:p-6'>
          <DialogHeader>
            <DialogTitle className='text-base sm:text-lg'>Class Schedule Calendar</DialogTitle>
          </DialogHeader>
          <ClassScheduleCalendar
            schedules={normalizedSchedules}
            onScheduleClick={schedule => {
              setSelectedSchedule(toScheduleDetailsItem(schedule));
              setShowCalendar(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <ScheduleDetailsDialog
        schedule={selectedSchedule}
        isOpen={!!selectedSchedule}
        onClose={() => setSelectedSchedule(null)}
        joinHref={joinClassHref}
        joinLabel='Join Class'
        locationNote={joinClassNote}
        onJoinClass={schedule => {
          if (joinClassHref) {
            window.open(joinClassHref, '_blank', 'noopener,noreferrer');
            return;
          }

          toast.message(
            `${schedule.title} is a physical session. Please attend at ${nextClassLocationLabel}.`
          );
        }}
      />

      <FeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
        headline={headline}
        onHeadlineChange={setHeadline}
        feedback={feedbackComment}
        onFeedbackChange={setFeedbackComment}
        rating={rating}
        onRatingChange={setRating}
        clarityRating={clarityRating}
        onClarityRatingChange={setClarityRating}
        engagementRating={engagementRating}
        onEngagementRatingChange={setEngagementRating}
        punctualityRating={punctualityRating}
        onPunctualityRatingChange={setPunctualityRating}
        isSubmitting={reviewInstructor.isPending}
        onSubmit={handleSubmitFeedback}
      />

      <VideoPlayer
        isOpen={isPlaying && contentTypeName === 'video'}
        onClose={() => setIsPlaying(false)}
        videoUrl={resolveLessonContentSource(selectedLesson, 'video')}
        title={selectedLesson?.title}
      />

      <ReadingMode
        isOpen={isReading && (contentTypeName === 'pdf' || contentTypeName === 'text')}
        onClose={() => setIsReading(false)}
        title={selectedLesson?.title || ''}
        description={selectedLesson?.description}
        content={resolveLessonContentSource(selectedLesson, contentTypeName)}
        contentType={contentTypeName as 'text' | 'pdf'}
      />
    </div>
  );
}

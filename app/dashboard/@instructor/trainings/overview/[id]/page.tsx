'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  BookOpen,
  CalendarDays,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Facebook,
  FileQuestion,
  FileText,
  Globe,
  Linkedin,
  MapPin,
  MessageCircle,
  Share2,
  Twitter,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CourseTrainingRequirements } from '@/app/dashboard/_components/course-training-requirements';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { LessonContentViewerDialog } from '@/components/lesson-content/LessonContentPreview';
import { LinkShareCard } from '@/components/shared/link-share-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import type { ClassDetailsScheduleItem } from '@/hooks/use-class-details';
import { useClassRoster } from '@/hooks/use-class-roster';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { useInstructorInfo } from '@/hooks/use-instructor-info';
import { getResourceIcon } from '@/lib/resources-icon';
import { buildSocialShareUrl, openShareWindow, type SharePlatform } from '@/lib/share';
import { getCourseAssessmentsOptions } from '@/services/client/@tanstack/react-query.gen';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useClassDetails } from '../../../../../../hooks/use-class-details';
import { useProgramLessonsWithContent } from '../../../../../../hooks/use-programlessonwithcontent';
import { useScheduleStats } from '../../../../../../hooks/use-schedule-stats';
import {
  ClassScheduleCalendar,
  type ClassScheduleItem as CalendarScheduleItem,
} from '../../../../@student/schedule/classes/[id]/SudentClassSchedule';

export interface ContentItem {
  uuid: string;
  title: string;
  content_type_uuid: string;
  content_text?: string;
  file_url?: string | null;
  value?: string | null;
  description?: string;
}

const socialShareActions: Array<{
  icon: typeof Facebook;
  label: string;
  platform: SharePlatform;
}> = [
  { icon: Facebook, label: 'Facebook', platform: 'facebook' },
  { icon: Twitter, label: 'Twitter', platform: 'twitter' },
  { icon: Linkedin, label: 'LinkedIn', platform: 'linkedin' },
  { icon: MessageCircle, label: 'WhatsApp', platform: 'whatsapp' },
  { icon: Share2, label: 'Email', platform: 'email' },
];

export default function ClassPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;
  const { replaceBreadcrumbs } = useBreadcrumb();
  const [siteOrigin, setSiteOrigin] = useState('');

  // State for video player and reading mode
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const [selectedLesson, setSelectedLesson] = useState<ContentItem | null>(null);
  const [contentTypeName, setContentTypeName] = useState<string>('');

  useEffect(() => {
    if (!classId) return;

    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'trainings',
        title: 'Training Classes',
        url: '/dashboard/trainings',
      },
      {
        id: 'preview-training',
        title: 'Preview',
        url: `/dashboard/trainings/overview/${classId}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, classId]);

  useEffect(() => {
    setSiteOrigin(window.location.origin);
  }, []);

  const { data: combinedClass, isLoading: classIsLoading } = useClassDetails(classId as string);
  const classData = combinedClass?.class;
  const course = combinedClass?.course;
  const programCourses = combinedClass?.pCourses;
  const program = combinedClass?.program;
  const schedules = combinedClass?.schedule ?? [];
  const scheduleStats = useScheduleStats(
    useMemo(
      () =>
        schedules.map(schedule => ({
          duration_minutes: Number(schedule.duration_minutes ?? 0),
        })),
      [schedules]
    )
  );
  const calendarSchedules = useMemo<CalendarScheduleItem[]>(
    () =>
      schedules.map((schedule: ClassDetailsScheduleItem) => ({
        uuid: schedule.uuid ?? '',
        class_definition_uuid: schedule.class_definition_uuid ?? classId,
        start_time: new Date(schedule.start_time).toISOString(),
        end_time: new Date(schedule.end_time).toISOString(),
        timezone: schedule.timezone ?? 'UTC',
        title: schedule.title ?? classData?.title ?? 'Class session',
        location_type: schedule.location_type === 'ONLINE' ? 'ONLINE' : 'PHYSICAL',
        status: schedule.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED',
        duration_minutes: Number(schedule.duration_minutes ?? 0),
        duration_formatted: String(schedule.duration_formatted ?? ''),
        time_range: String(schedule.time_range ?? ''),
        is_currently_active: Boolean(schedule.is_currently_active),
        can_be_cancelled: Boolean(schedule.can_be_cancelled),
      })),
    [classData?.title, classId, schedules]
  );
  const totalAmount = (classData?.training_fee! * scheduleStats?.totalHours) as number;
  const amountPayable = totalAmount;

  // Format dates
  const { formattedStart, formattedEnd } = useMemo(() => {
    if (!classData) {
      return { formattedStart: '', formattedEnd: '' };
    }

    try {
      const start = classData?.default_start_time ? new Date(classData.default_start_time) : null;
      const end = classData?.default_end_time ? new Date(classData.default_end_time) : null;

      return {
        formattedStart: start ? format(start, 'MMM dd, yyyy • hh:mm a') : 'N/A',
        formattedEnd: end ? format(end, 'MMM dd, yyyy • hh:mm a') : 'N/A',
      };
    } catch (e) {
      return { formattedStart: 'N/A', formattedEnd: 'N/A' };
    }
  }, [classData]);

  const { data: cAssesssment } = useQuery({
    ...getCourseAssessmentsOptions({
      path: { courseUuid: classData?.course_uuid as string },
      query: { pageable: {} },
    }),
    enabled: !!classData?.course_uuid,
  });

  const { instructorInfo } = useInstructorInfo({
    instructorUuid: classData?.default_instructor_uuid as string,
  });
  // @ts-expect-error
  const instructor = instructorInfo?.data;

  const {
    isLoading: isAllLessonsDataLoading,
    lessons: lessonsWithContent,
    contentTypeMap,
  } = useCourseLessonsWithContent({ courseUuid: classData?.course_uuid as string });

  const {
    isLoading: isLoading,
    coursesWithLessons,
    contentTypeMap: programContentTypeMap,
  } = useProgramLessonsWithContent({
    programUuid: classData?.program_uuid as string,
    programCourses: programCourses,
  });

  const isClassForProgram = !!classData?.program_uuid;
  const isClassForCourse = !!classData?.course_uuid;

  const totalProgramLessons = coursesWithLessons?.reduce((sum, courseData) => {
    return sum + (courseData.lessons?.length || 0);
  }, 0);

  const registrationLink = useMemo(() => {
    if (!siteOrigin) return '';

    if (course?.uuid) {
      return `${siteOrigin}/dashboard/courses/available-classes/${course.uuid}/enroll?id=${classId}`;
    }

    if (program?.uuid) {
      return `${siteOrigin}/dashboard/courses/available-programs/${program.uuid}/enroll?id=${classId}`;
    }

    return '';
  }, [classId, course?.uuid, program?.uuid, siteOrigin]);

  const inviteLink = useMemo(() => {
    if (!siteOrigin) return '';

    if (course?.uuid) {
      return `${siteOrigin}/class-invite?id=${classId}`;
    }

    if (program?.uuid) {
      return `${siteOrigin}/program-invite?id=${classId}`;
    }

    return '';
  }, [classId, course?.uuid, program?.uuid, siteOrigin]);

  // const totalLessons = classData.schedule.skills.reduce((acc, skill) => acc + skill.lessons.length, 0);
  // const totalHours = classData.schedule.skills.reduce((total, skill) => {
  //     return total + skill.lessons.reduce((skillTotal, lesson) => {
  //         return skillTotal + (parseInt(lesson.duration) || 0);
  //     }, 0);
  // }, 0) / 60;

  // const totalFee = classData?.visibility.isFree ? 0 : classData.visibility.price * totalLessons;
  const totalAssignments = cAssesssment?.data?.content?.length || 0;

  const { roster } = useClassRoster(classId);

  // Handle viewing content
  const handleViewContent = (content: ContentItem, contentType: string) => {
    setSelectedLesson(content);
    setContentTypeName(contentType);
    setIsViewerOpen(true);
  };

  if (isAllLessonsDataLoading || classIsLoading) {
    return (
      <div className='flex flex-col gap-6 space-y-2'>
        <Skeleton className='h-[150px] w-full' />

        <div className='flex flex-row items-center justify-between gap-4'>
          <Skeleton className='h-[250px] w-2/3' />
          <Skeleton className='h-[250px] w-1/3' />
        </div>

        <Skeleton className='h-[100px] w-full' />
      </div>
    );
  }

  return (
    <div className='mb-20 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div>
            {classData?.is_active ? (
              <>
                <h1 className='text-success text-2xl font-semibold'>Active Class</h1>
                <p className='text-muted-foreground'>
                  Your class is live and accepting new students.
                </p>
              </>
            ) : (
              <>
                <h1 className='text-foreground text-2xl font-semibold'>Inactive Class</h1>
                <p className='text-muted-foreground'>
                  This class is currently not active. Activate it to allow student enrollment.
                </p>
              </>
            )}
          </div>
        </div>

        <Button
          onClick={() => router.push(`/dashboard/trainings/create-new?id=${classData?.uuid}`)}
          variant='outline'
          className='gap-2'
        >
          <Edit className='h-4 w-4' />
          Edit Class
        </Button>
      </div>

      {/* Status Banner */}
      <div>
        {classData?.is_active ? (
          <Card className='border-success/30 bg-success/10'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <CheckCircle className='text-success h-6 w-6' />
                <div>
                  <h3 className='text-success font-semibold'>Class Published Successfully!</h3>
                  <p className='text-success text-sm'>
                    Your class is now live and students can enroll. Share the registration link to
                    start getting enrollments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className='border-warning/40 bg-warning/10'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='text-warning h-6 w-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01M21 12A9 9 0 1112 3a9 9 0 019 9z'
                  />
                </svg>
                <div>
                  <h3 className='text-warning font-semibold'>Class is Currently Inactive</h3>
                  <p className='text-warning text-sm'>
                    Students cannot enroll in this class until it's activated. You can activate it
                    from your dashboard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Class Preview Card */}
      <Card className='border-2'>
        <CardHeader>
          <div className='space-y-3'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1'>
                <CardTitle className='mb-2 text-2xl'>{classData?.title}</CardTitle>
                <div className='flex flex-wrap gap-2'>
                  {course?.category_names?.map((category: string, idx: number) => (
                    <Badge key={idx} variant='outline' className='text-xs'>
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
              {/* {classData.coverImage && (
          <Image
            src={""}
            alt="Class cover"
            className="w-32 h-20 object-cover rounded-lg"
            width={32}
            height={20}
          />
        )} */}
            </div>

            {classData?.description && (
              <div className='text-muted-foreground'>
                <RichTextRenderer maxChars={100} htmlString={classData?.description as string} />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className='space-y-6'>
          {/* Primary Info Grid */}
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            <div className='space-y-1'>
              <div className='text-muted-foreground flex items-center gap-2'>
                <Users className='h-4 w-4' />
                <span className='text-xs'>Instructor</span>
              </div>
              <div className='font-medium'>{instructor?.full_name}</div>
            </div>

            <div className='space-y-1'>
              <div className='text-muted-foreground flex items-center gap-2'>
                <Clock className='h-4 w-4' />
                <span className='text-xs'>Duration ({classData?.duration_formatted}/class)</span>
              </div>
              <div className='font-medium'>{scheduleStats?.totalHours}</div>
            </div>

            <div className='space-y-1'>
              <div className='text-muted-foreground flex items-center gap-2'>
                <BookOpen className='h-4 w-4' />
                <span className='text-xs'>Lessons</span>
              </div>
              <div className='font-medium'>{lessonsWithContent?.length || totalProgramLessons}</div>
            </div>

            <div className='space-y-1'>
              <div className='text-muted-foreground flex items-center gap-2'>
                <FileText className='h-4 w-4' />
                <span className='text-xs'>Assignments/Quizzes</span>
              </div>
              <div className='font-medium'>{totalAssignments}</div>
            </div>
          </div>

          {/* Secondary Info */}
          <div className='flex flex-wrap items-center gap-6 border-t pt-4'>
            <div className='flex items-center gap-2 text-sm'>
              <CalendarDays className='text-muted-foreground h-4 w-4' />
              <span className='text-muted-foreground'>Start Date</span>
              <span className='font-medium'>{formattedStart}</span>
            </div>

            {classData?.location_type && (
              <div className='flex items-center gap-2 text-sm'>
                <MapPin className='text-muted-foreground h-4 w-4' />
                <span className='font-medium'>{classData?.location_type}</span>
              </div>
            )}

            <div className='flex items-center gap-2 text-sm'>
              <span className='font-medium'>KES {amountPayable.toFixed(2)}</span>
            </div>

            <div className='flex items-center gap-2 text-sm'>
              <Users className='text-muted-foreground h-4 w-4' />
              <span className='font-medium'>
                {roster?.length} / {classData?.max_participants} students
              </span>
            </div>
          </div>

          {/* {classData.targetAudience.map((audience, index) => (
      <Badge key={index} variant="outline">{audience}</Badge>
    ))} */}
        </CardContent>
      </Card>

      {/* Class Management Tabs */}
      <Tabs defaultValue='details' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='details'>Class Details</TabsTrigger>
          <TabsTrigger value='schedule'>Schedule</TabsTrigger>
          <TabsTrigger value='skills'>Skills</TabsTrigger>
          <TabsTrigger value='students'>Students</TabsTrigger>
        </TabsList>

        <TabsContent value='details' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Class Information</CardTitle>
            </CardHeader>

            <CardContent className='space-y-6'>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                {/* Left Column */}
                <div className='space-y-4'>
                  <div className='border-border bg-muted/50 rounded-lg border p-4'>
                    <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                      Course
                    </span>
                    {course?.uuid && (
                      <div className='text-foreground mt-2 text-base font-semibold'>
                        {course?.name || '—'}
                      </div>
                    )}

                    {program?.uuid && (
                      <div className='text-foreground mt-2 text-base font-semibold'>
                        {programCourses && programCourses?.length > 0 ? (
                          <ul className='list-inside list-disc space-y-1'>
                            {programCourses?.map(c => <li key={c.uuid}>{c.name || '—'}</li>)}
                          </ul>
                        ) : (
                          '—'
                        )}
                      </div>
                    )}
                  </div>

                  <div className='border-border bg-muted/50 rounded-lg border p-4'>
                    <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                      Class Type
                    </span>
                    <div className='mt-2 flex items-center gap-2'>
                      {classData?.location_type === 'ONLINE' && (
                        <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full'>
                          <span className='text-primary text-xs font-bold'>ON</span>
                        </div>
                      )}
                      {classData?.location_type === 'IN_PERSON' && (
                        <div className='bg-accent/50 flex h-8 w-8 items-center justify-center rounded-full'>
                          <span className='text-accent-foreground text-xs font-bold'>IP</span>
                        </div>
                      )}
                      {classData?.location_type === 'HYBRID' && (
                        <div className='bg-secondary flex h-8 w-8 items-center justify-center rounded-full'>
                          <span className='text-secondary-foreground text-xs font-bold'>HY</span>
                        </div>
                      )}
                      <span className='text-foreground text-base font-semibold capitalize'>
                        {classData?.location_type?.toLowerCase().replace('_', ' ') || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className='space-y-4'>
                  <div className='border-border bg-muted/50 rounded-lg border p-4'>
                    <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                      Academic Period
                    </span>
                    <div className='mt-2 space-y-1 text-sm'>
                      {classData?.default_start_time && classData?.default_end_time ? (
                        <>
                          {/* Extract the date from start_time */}
                          <div className='flex items-center gap-2'>
                            <span className='text-muted-foreground font-medium'>Date:</span>
                            <span className='text-foreground font-semibold'>
                              {new Date(classData.default_start_time).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span className='text-foreground font-semibold'>
                              {new Date(classData.default_start_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className='text-foreground font-semibold'>
                              {new Date(classData.default_end_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className='text-foreground'>—</span>
                      )}
                    </div>
                  </div>

                  <div className='border-border bg-muted/50 rounded-lg border p-4'>
                    <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                      Visibility
                    </span>
                    <div className='mt-2 flex items-center gap-2'>
                      {classData?.class_visibility === 'PUBLIC' ? (
                        <>
                          <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full'>
                            <Globe className='text-primary h-4 w-4' />
                          </div>
                          <div>
                            <div className='text-foreground text-base font-semibold'>Public</div>
                            <div className='text-muted-foreground text-xs'>Visible to everyone</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className='bg-muted flex h-8 w-8 items-center justify-center rounded-full'>
                            <Globe className='text-muted-foreground h-4 w-4' />
                          </div>
                          <div>
                            <div className='text-foreground text-base font-semibold'>Private</div>
                            <div className='text-muted-foreground text-xs'>Invitation only</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <CourseTrainingRequirements
                requirements={course?.training_requirements}
                viewerRole='instructor'
                description='Course delivery requirements for students, organisations, instructors, and creators.'
              />

              {/* Description Section - Full Width */}
              <div className='border-border bg-muted/50 rounded-lg border p-4'>
                <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                  Description
                </span>
                <div className='text-foreground mt-2'>
                  {classData?.description ? (
                    <RichTextRenderer maxChars={100} htmlString={classData.description as string} />
                  ) : (
                    <p className='text-muted-foreground text-sm italic'>No description provided</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='schedule' className='space-y-4'>
          <CardContent>
            <ClassScheduleCalendar schedules={calendarSchedules} />
          </CardContent>
        </TabsContent>

        <TabsContent value='skills' className='space-y-4'>
          <Card>
            <CardContent className='space-y-3 p-4'>
              {/* Loading State */}
              {(isAllLessonsDataLoading || isLoading) && <Spinner />}

              {/* Empty State - Course */}
              {isClassForCourse && !isAllLessonsDataLoading && lessonsWithContent?.length === 0 && (
                <div className='bg-muted/30 text-muted-foreground flex flex-col items-center justify-center rounded-lg p-6 text-center text-sm'>
                  <FileQuestion className='text-muted-foreground mb-3 h-8 w-8' />
                  <h4 className='font-medium'>No Class Resources</h4>
                  <p>This class doesn&apos;t have any resources/content yet.</p>
                </div>
              )}

              {/* Empty State - Program */}
              {isClassForProgram && !isLoading && coursesWithLessons?.length === 0 && (
                <div className='bg-muted/30 text-muted-foreground flex flex-col items-center justify-center rounded-lg p-6 text-center text-sm'>
                  <FileQuestion className='text-muted-foreground mb-3 h-8 w-8' />
                  <h4 className='font-medium'>No Program Resources</h4>
                  <p>This program doesn&apos;t have any resources/content yet.</p>
                </div>
              )}

              {/* Course Skills */}
              {isClassForCourse &&
                lessonsWithContent?.map((skill, skillIndex) => (
                  <div key={skillIndex}>
                    <div className='text-foreground mb-2 font-semibold'>
                      Lesson {skillIndex + 1}: {skill.lesson?.title}
                    </div>

                    {skill?.content?.data?.map((c, cIndex) => {
                      const contentTypeName = contentTypeMap[c.content_type_uuid] || 'file';

                      return (
                        <div
                          key={c.uuid}
                          className='border-border bg-card hover:bg-accent/50 mt-1.5 flex items-center justify-between rounded-lg border p-3 transition-colors'
                        >
                          <div className='flex items-center gap-3'>
                            {getResourceIcon(contentTypeName)}
                            <div>
                              <div className='text-foreground font-medium'>
                                {cIndex + 1}. {c.title}
                              </div>
                              <div className='text-muted-foreground text-sm capitalize'>
                                {contentTypeName}
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleViewContent(c, contentTypeName)}
                            variant='outline'
                            size='sm'
                            className='gap-2'
                          >
                            <Eye className='h-3 w-3' />
                            View
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ))}

              {/* Program Skills */}
              {isClassForProgram &&
                coursesWithLessons?.map((courseData, courseIndex) => (
                  <div key={courseData.course.uuid} className='space-y-4'>
                    {/* Course Header */}
                    <div className='border-border bg-muted/50 flex items-center gap-2 rounded-lg border p-4'>
                      <BookOpen className='text-primary h-5 w-5' />
                      <span className='text-foreground text-lg font-semibold'>
                        {courseData.course.name}
                      </span>
                    </div>

                    {/* Lessons within this course */}
                    {courseData.lessons.map((skill, skillIndex) => (
                      <div key={skill.lesson.uuid} className='ml-4'>
                        <div className='text-foreground mb-2 font-semibold'>
                          Lesson {skillIndex + 1}: {skill.lesson?.title}
                        </div>

                        {skill?.content?.data?.map((c, cIndex) => {
                          const contentTypeName =
                            programContentTypeMap[c.content_type_uuid] || 'file';

                          return (
                            <div
                              key={c.uuid}
                              className='border-border bg-card hover:bg-accent/50 mt-1.5 flex items-center justify-between rounded-lg border p-3 transition-colors'
                            >
                              <div className='flex items-center gap-3'>
                                {getResourceIcon(contentTypeName)}
                                <div>
                                  <div className='text-foreground font-medium'>
                                    {cIndex + 1}. {c.title}
                                  </div>
                                  <div className='text-muted-foreground text-sm capitalize'>
                                    {contentTypeName}
                                  </div>
                                </div>
                              </div>

                              <Button
                                onClick={() => handleViewContent(c, contentTypeName)}
                                variant='outline'
                                size='sm'
                                className='gap-2'
                              >
                                <Eye className='h-3 w-3' />
                                View
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='students' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
            </CardHeader>

            <CardContent>
              {!roster || roster.length === 0 ? (
                <div className='py-8 text-center'>
                  <Users className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                  <h3 className='text-foreground mb-2 font-medium'>No students enrolled yet</h3>
                  <p className='text-muted-foreground text-sm'>
                    Share your registration link to start getting enrollments
                  </p>
                </div>
              ) : (
                <div className='border-border rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Primary Guardian</TableHead>
                        <TableHead>Secondary Guardian</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {roster.map((entry, index) => {
                        // @ts-ignore
                        const student = entry.student?.data;
                        const user = entry.user;

                        return (
                          <TableRow key={index}>
                            {/* NAME */}
                            <TableCell className='font-medium'>
                              {user?.full_name || 'Unknown Student'}
                            </TableCell>

                            {/* EMAIL */}
                            <TableCell>{user?.email || '--'}</TableCell>

                            {/* PRIMARY GUARDIAN */}
                            <TableCell>{student?.primaryGuardianContact || '--'}</TableCell>

                            {/* SECONDARY GUARDIAN */}
                            <TableCell>{student?.secondaryGuardianContact || '--'}</TableCell>

                            {/* STATUS */}
                            <TableCell>
                              <Badge variant='success'>
                                {entry.enrollment?.status || 'UNKNOWN'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Registration Link and Sharing */}
      <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
        <LinkShareCard
          description='Send students directly to the class invite page.'
          title='Class Invite Link'
          url={inviteLink}
          footer={
            <div className='space-y-3'>
              <h4 className='text-sm font-medium'>Share via</h4>
              <div className='flex flex-wrap gap-2'>
                {socialShareActions.map(({ icon: Icon, label, platform }) => (
                  <Button
                    key={label}
                    aria-label={`Share class invite link on ${label}`}
                    className='gap-2'
                    disabled={!inviteLink}
                    onClick={() =>
                      openShareWindow(
                        buildSocialShareUrl(platform, {
                          title: classData?.title,
                          url: inviteLink,
                          description: `Check out this class: ${classData?.title ?? 'Class invite'}`,
                        })
                      )
                    }
                    size='sm'
                    variant='outline'
                  >
                    <Icon className='h-4 w-4' />
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          }
        />

        <LinkShareCard
          description='Copy or share the registration link for enrollment.'
          title='Registration Link'
          url={registrationLink}
          footer={
            <div className='space-y-3'>
              <h4 className='text-sm font-medium'>Share via</h4>
              <div className='flex flex-wrap gap-2'>
                {socialShareActions.map(({ icon: Icon, label, platform }) => (
                  <Button
                    key={label}
                    aria-label={`Share registration link on ${label}`}
                    className='gap-2'
                    disabled={!registrationLink}
                    onClick={() =>
                      openShareWindow(
                        buildSocialShareUrl(platform, {
                          title: classData?.title,
                          url: registrationLink,
                          description: `Check out this class: ${classData?.title ?? 'Registration link'}`,
                        })
                      )
                    }
                    size='sm'
                    variant='outline'
                  >
                    <Icon className='h-4 w-4' />
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          }
        />
      </div>

      <LessonContentViewerDialog
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        content={selectedLesson}
        contentType={contentTypeName}
      />
    </div>
  );
}

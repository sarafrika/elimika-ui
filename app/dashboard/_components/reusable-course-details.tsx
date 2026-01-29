'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import {
  getAllAssignmentsOptions,
  getAllDifficultyLevelsOptions,
  getAllQuizzesOptions,
  getCourseByUuidOptions,
  getCourseCreatorByUuidOptions,
  getCourseLessonsOptions
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Clock,
  FileText,
  Play,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CustomLoadingState } from '../@course_creator/_components/loading-state';
import { VideoPlayer } from '../@student/schedule/classes/[id]/VideoPlayer';

type CourseDetailsProps = {
  courseId?: string;
  handleEnroll?: () => void;
  userRole?: string;
};

interface ContentItem {
  uuid: string;
  title: string;
  content_type_uuid: string;
  content_text?: string;
  description?: string;
}

export default function ReusableCourseDetailsPage({
  courseId: propCourseId,
  handleEnroll,
  userRole,
}: CourseDetailsProps) {
  const router = useRouter();
  const params = useParams();
  const courseId = propCourseId || (params?.id as string);

  const { replaceBreadcrumbs } = useBreadcrumb();




  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<ContentItem | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseId as string } }),
    enabled: !!courseId,
  });
  const courseData = data?.data;

  useEffect(() => {
    if (courseData) {
      const isStudent = userRole === 'student';

      replaceBreadcrumbs([
        {
          id: 'dashboard',
          title: 'Dashboard',
          url: '/dashboard/overview',
        },
        {
          id: 'courses',
          title: 'Browse Courses',
          url: '/dashboard/browse-courses',
        },
        {
          id: 'course-details',
          title: courseData?.name,
          url: `/dashboard/browse-courses/${courseData?.uuid}`
        },
      ]);
    }
  }, [replaceBreadcrumbs, courseId, courseData, userRole]);

  const { data: creator } = useQuery({
    ...getCourseCreatorByUuidOptions({ path: { uuid: courseData?.course_creator_uuid as string } }),
    enabled: !!courseData?.course_creator_uuid,
  });
  // @ts-expect-error
  const courseCreator = creator?.data;

  // GET COURSE LESSONS
  const { data: courseLessons, isLoading: lessonsIsLoading } = useQuery({
    ...getCourseLessonsOptions({
      path: { courseUuid: courseId },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: !!courseId,
  });
  const lessons = courseLessons?.data?.content;
  const lessonUuids = lessons?.map((lesson: any) => lesson.uuid) || [];

  const {
    data: cAssignments,
    isLoading: assignmentLoading,
  } = useQuery({
    ...getAllAssignmentsOptions({ query: { pageable: {} } }),
  });

  const assignments = cAssignments?.data?.content;
  const filteredAssignments =
    assignments?.filter((assignment: any) => lessonUuids.includes(assignment.lesson_uuid)) || [];

  const {
    data: cQuizzes,
    isLoading: quizzesLoading,
  } = useQuery({
    ...getAllQuizzesOptions({ query: { pageable: {} } }),
  });

  const quizzes = cQuizzes?.data?.content;
  const filteredQuizzes =
    quizzes?.filter((quiz: any) => lessonUuids.includes(quiz.lesson_uuid)) || [];

  const { data: difficulty } = useQuery(getAllDifficultyLevelsOptions());
  const difficultyLevels = difficulty?.data;

  const getDifficultyNameFromUUID = (uuid: string): string | undefined => {
    return difficultyLevels?.find(level => level.uuid === uuid)?.name;
  };

  const {
    isLoading: isAllLessonsDataLoading,
    isFetching: isAllLessonDataFetching,
    lessons: lessonsWithContent,
  } = useCourseLessonsWithContent({ courseUuid: courseId as string });

  const isEverythingReady = !(
    isLoading ||
    isFetching ||
    isAllLessonsDataLoading ||
    isAllLessonDataFetching ||
    assignmentLoading ||
    quizzesLoading
  );

  if (!isEverythingReady) {
    return <CustomLoadingState subHeading='Loading your course details..' />;
  }

  return (
    <div className='mb-20 min-h-screen'>
      <div className='mx-auto'>
        {/* Course Header */}
        <div className='mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3'>
          <div className='lg:col-span-2'>
            <div className='mb-3 flex items-center gap-2'>
              <Badge className='bg-green-100 text-green-800'>
                {getDifficultyNameFromUUID(courseData?.difficulty_uuid as string)}
              </Badge>
            </div>

            <div className='flex flex-row items-center gap-3 mb-2'>
              <h1 className='text-lg font-bold'>{courseData?.name}</h1>
              <div className='flex items-center gap-2'>
                {courseData?.category_names?.map((category, index) => (
                  <Badge key={index} variant='outline' className='text-xs'>
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            <div className='mb-4 flex items-center gap-6'>
              <div className='flex items-center gap-1'>
                <Users className='h-4 w-4' />
                <span>{courseData?.class_limit} class limit</span>
              </div>
            </div>

            {/* Instructor */}
            <div className='flex items-center gap-3'>
              <Avatar className='min-h-12 min-w-12'>
                <AvatarFallback>
                  {courseCreator?.full_name
                    .split(' ')
                    .map((n: any) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p>{courseCreator?.full_name}</p>
                <p className='text-muted-foreground text-sm'>
                  {courseCreator?.professional_headline}
                </p>
              </div>
            </div>
          </div>

          {/* Enrollment Card */}
          <div>
            <Card>
              <CardContent className='p-6'>
                {/* Course Image/Video */}
                <div className='bg-muted mb-4 flex h-48 w-full items-center justify-center rounded-lg'>
                  {courseData?.intro_video_url ? (
                    <div className='relative h-full w-full'>
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <Button
                          size='lg'
                          className='rounded-full'
                          onClick={() => {
                            setSelectedLesson({
                              uuid: '',
                              title: courseData?.name || 'Course Introduction',
                              content_type_uuid: 'video',
                              content_text: courseData?.intro_video_url,
                              description: 'Course introduction video',
                            });
                            setIsPlaying(true);
                          }}
                        >
                          <Play className='h-6 w-6' />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className='flex flex-col items-center gap-2 text-center text-muted-foreground'>
                      <BookOpen className='h-12 w-12 text-primary/40' />
                      <p className='text-sm'>Intro video display not available</p>
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <div className='mb-4 text-center'>
                  <div className='mb-2 flex items-center justify-center gap-2'>
                    <span className='text-primary text-2xl font-bold'>
                      KES {courseData?.minimum_training_fee}
                    </span>
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    (minimum training fee (per hour per head))
                  </p>
                </div>

                {/* Action Buttons */}
                <div className='flex flex-col gap-1 space-y-3'>
                  {typeof handleEnroll === 'function' && (
                    <Button onClick={handleEnroll} className='w-full' size='lg'>
                      Enroll For Programs/Classes
                    </Button>
                  )}

                  {userRole === 'student' && (
                    <Button
                      onClick={() => {
                        router.push(`/dashboard/browse-courses/instructor/${courseData?.uuid}`);
                      }}
                      className='w-full'
                      size='lg'
                      variant={'outline'}
                    >
                      Search Instructor
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Course Overview - Single Card */}
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Course Overview</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Description */}
              <div>
                <h3 className='mb-3 text-lg font-semibold'>About This Course</h3>
                <RichTextRenderer htmlString={courseData?.description as string} />
              </div>

              <Separator />

              {/* Quick Stats */}
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                <div className='flex items-start gap-3'>
                  <div className='rounded-lg bg-primary/10 p-2'>
                    <FileText className='h-5 w-5 text-primary' />
                  </div>
                  <div>
                    <p className='text-2xl font-bold'>{lessonsWithContent?.length || 0}</p>
                    <p className='text-sm text-muted-foreground'>Lessons</p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <div className='rounded-lg bg-primary/10 p-2'>
                    <Clock className='h-5 w-5 text-primary' />
                  </div>
                  <div>
                    <p className='text-2xl font-bold'>{filteredQuizzes?.length || 0}</p>
                    <p className='text-sm text-muted-foreground'>Quizzes</p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <div className='rounded-lg bg-primary/10 p-2'>
                    <BookOpen className='h-5 w-5 text-primary' />
                  </div>
                  <div>
                    <p className='text-2xl font-bold'>{filteredAssignments?.length || 0}</p>
                    <p className='text-sm text-muted-foreground'>Assignments</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Prerequisites */}
              {courseData?.prerequisites && (
                <div>
                  <h3 className='mb-3 text-lg font-semibold'>Prerequisites</h3>
                  <RichTextRenderer htmlString={courseData?.prerequisites as string} />
                </div>
              )}

              {courseData?.prerequisites && <Separator />}

              {/* What You'll Learn */}
              <div>
                <h3 className='mb-3 text-lg font-semibold'>What You'll Learn</h3>
                <div className='flex flex-col items-start justify-center gap-2'>
                  {lessonsWithContent?.slice(0, 6).map((lesson: any, index: number) => (
                    <div key={lesson?.lesson?.uuid} className='flex items-start gap-2'>
                      <div className='h-5 w-5 shrink-0 rounded-full bg-green-100 flex items-center justify-center'>
                        <span className='text-xs text-green-700'>{index + 1}</span>
                      </div>
                      <p className='text-sm'>{lesson?.lesson?.title}</p>
                    </div>
                  ))}
                  {lessonsWithContent?.length > 6 && (
                    <p className='text-sm text-muted-foreground col-span-2'>
                      ...and {lessonsWithContent.length - 6} more lessons
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Video Player Modal */}
        <VideoPlayer
          isOpen={isPlaying}
          onClose={() => setIsPlaying(false)}
          videoUrl={selectedLesson?.content_text || ''}
          title={selectedLesson?.title}
        />
      </div>
    </div>
  );
}
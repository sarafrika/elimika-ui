'use client';

import HTMLTextPreview from '@/components/editors/html-text-preview';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import {
  getAllAssignmentsOptions,
  getAllDifficultyLevelsOptions,
  getAllQuizzesOptions,
  getCourseAssessmentsOptions,
  getCourseByUuidOptions,
  getCourseCreatorByUuidOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Download,
  FileQuestion,
  FileText,
  ImageIcon,
  Link2,
  Play,
  Star,
  Users,
  Video,
  Volume2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { type JSX, useState } from 'react';
import { CustomLoadingState } from '../@course_creator/_components/loading-state';

type CourseDetailsProps = {
  courseId?: string;
  handleEnroll?: () => void;
  userRole?: string;
};

export default function ReusableCourseDetailsPage({
  courseId: propCourseId,
  handleEnroll,
  userRole,
}: CourseDetailsProps) {
  const router = useRouter();
  const params = useParams();
  const courseId = propCourseId || (params?.id as string);

  const [activeTab, setActiveTab] = useState('overview');
  const { replaceBreadcrumbs } = useBreadcrumb();

  const { data, isLoading, isFetching } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseId as string } }),
    enabled: !!courseId,
  });
  const courseData = data?.data;

  const { data: creator } = useQuery({
    ...getCourseCreatorByUuidOptions({ path: { uuid: courseData?.course_creator_uuid as string } }),
    enabled: !!courseData?.course_creator_uuid,
  });
  // @ts-expect-error
  const courseCreator = creator?.data;

  const {
    data: cAssesssment,
    isLoading: assessmentLoading,
    isFetching: assessmentFetching,
  } = useQuery({
    ...getCourseAssessmentsOptions({
      path: { courseUuid: courseId as string },
      query: { pageable: {} },
    }),
    enabled: !!courseId,
  });

  const {
    data: cAssignments,
    isLoading: assignmentLoading,
    isFetching: assignmentFetching,
  } = useQuery({
    ...getAllAssignmentsOptions({ query: { pageable: {} } }),
  });

  const {
    data: cQuizzes,
    isLoading: quizzesLoading,
    isFetching: quizzesFetching,
  } = useQuery({
    ...getAllQuizzesOptions({ query: { pageable: {} } }),
  });

  const { data: difficulty } = useQuery(getAllDifficultyLevelsOptions());
  const difficultyLevels = difficulty?.data;

  const getDifficultyNameFromUUID = (uuid: string): string | undefined => {
    return difficultyLevels?.find(level => level.uuid === uuid)?.name;
  };

  const {
    isLoading: isAllLessonsDataLoading,
    isFetching: isAllLessonDataFetching,
    lessons: lessonsWithContent,
    contentTypeMap,
  } = useCourseLessonsWithContent({ courseUuid: courseId as string });

  // useEffect(() => {
  //   if (courseData) {
  //     const isStudent = userRole === 'student';

  //     replaceBreadcrumbs([
  //       {
  //         id: 'dashboard',
  //         title: 'Dashboard',
  //         url: '/dashboard/overview',
  //       },
  //       {
  //         id: 'courses',
  //         title: isStudent ? 'Browse Courses' : 'Courses',
  //         url: isStudent ? '/dashboard/browse-courses' : '/dashboard/courses',
  //       },
  //       {
  //         id: 'course-details',
  //         title: courseData?.name,
  //         url: isStudent
  //           ? `/dashboard/browse-courses/${courseData?.uuid}`
  //           : `/dashboard/courses/${courseData?.uuid}`,
  //       },
  //     ]);
  //   }
  // }, [replaceBreadcrumbs, courseId, courseData, userRole]);

  const getResourceIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'pdf':
      case 'text':
      case 'file':
        return <FileText className='h-4 w-4' />;
      case 'video':
        return <Video className='h-4 w-4' />;
      case 'audio':
        return <Volume2 className='h-4 w-4' />;
      case 'image':
        return <ImageIcon className='h-4 w-4' />;
      case 'link':
        return <Link2 className='h-4 w-4' />;
      default:
        return <FileText className='h-4 w-4' />;
    }
  };

  const isEverythingReady = !(
    isLoading ||
    isFetching ||
    isAllLessonsDataLoading ||
    isAllLessonDataFetching ||
    assessmentLoading ||
    assessmentFetching ||
    assignmentLoading ||
    assignmentFetching ||
    quizzesLoading ||
    quizzesFetching
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
              {courseData?.category_names?.map((category, index) => (
                <Badge key={index} variant='outline' className='text-xs'>
                  {category}
                </Badge>
              ))}
            </div>

            <div className='mb-3 flex items-center gap-2'>
              <Badge className='bg-green-100 text-green-800'>
                {getDifficultyNameFromUUID(courseData?.difficulty_uuid as string)}
              </Badge>
            </div>

            <h1 className='mb-2 text-lg font-bold'>{courseData?.name}</h1>
            <p className='text-muted-foreground mb-4 text-[15px] italic'>
              {courseData?.is_free || 'N/A - Subtitle/tagline'}
            </p>

            <div className='mb-4 flex items-center gap-6'>
              <div className='flex items-center gap-1'>
                <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                <span>{'N/A'}</span>
              </div>
              <div className='flex items-center gap-1'>
                <Users className='h-4 w-4' />
                <span>{courseData?.class_limit} enrolled</span>
              </div>
              <div className='flex items-center gap-1'>
                <Clock className='h-4 w-4' />
                <span>{courseData?.total_duration_display}</span>
              </div>
            </div>

            {/* Instructor */}
            <div className='flex items-center gap-3'>
              <Avatar className='min-h-12 min-w-12'>
                {/* <AvatarImage src={courseData.instructor.avatar} /> */}
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
                <div className='mb-4 flex h-48 w-full items-center justify-center rounded-lg bg-muted'>
                  {courseData?.intro_video_url ? (
                    <div className='relative h-full w-full'>
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <Button size='lg' className='rounded-full'>
                          <Play className='h-6 w-6' />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <BookOpen className='text-primary/40 h-16 w-16' />
                  )}
                </div>

                {/* Pricing */}
                <div className='mb-4 text-center'>
                  <div className='mb-2 flex items-center justify-center gap-2'>
                    <span className='text-primary text-2xl font-bold'>KES {courseData?.price}</span>
                    {courseData?.price && (
                      <span className='text-muted-foreground text-lg line-through'>
                        KES {courseData?.price}
                      </span>
                    )}
                  </div>
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

                {/* Course Progress */}
                <div className='mt-6 bg-blue-200'>
                  <div className='mb-2 flex items-center justify-between'>
                    <span className='text-sm'>Course Progress</span>
                    <span className='text-sm'>
                      {/* {completedSkills}/{courseData.skills.length} skills */}
                      7/8 skills
                    </span>
                  </div>
                  <Progress value={25} className='mb-2' />
                  <p className='text-muted-foreground text-xs'>{Math.round(25)}% Complete</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Course Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-5'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='skills'>Skills</TabsTrigger>
            <TabsTrigger value='quizzes'>Quizzes</TabsTrigger>
            <TabsTrigger value='assignments'>Assignments</TabsTrigger>
            <TabsTrigger value='assessments'>Assessments</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Course Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='mb-4'>
                  <RichTextRenderer htmlString={courseData?.description as string} />
                </div>

                <CardContent>
                  <h4 className='mb-3'>Requirements</h4>
                  <ul className='space-y-2'>
                    <RichTextRenderer htmlString={courseData?.prerequisites as string} />
                  </ul>
                </CardContent>

                <Separator className='my-6' />

                <CardContent>
                  <h4 className='mb-3'>Equipment</h4>
                  {/* <p className="text-sm">{course.equipment}</p> */}
                </CardContent>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Creator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-start gap-4'>
                  <Avatar className='min-h-16 min-w-16'>
                    <AvatarImage src={courseCreator?.uuid} />
                    <AvatarFallback>
                      {courseCreator?.full_name
                        .split(' ')
                        .map((n: any) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4>{courseCreator?.full_name}</h4>
                    <div className='text-muted-foreground mb-2 text-sm'>
                      {courseCreator?.professional_headline}
                    </div>
                    <div className='text-sm'>
                      <RichTextRenderer htmlString={courseCreator?.bio} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='skills' className='space-y-4'>
            {lessonsWithContent?.length === 0 && (
              <div className='text-muted-foreground flex flex-col items-center justify-center py-12 text-center'>
                <FileQuestion className='mb-4 h-10 w-10 text-gray-400' />
                <h3 className='text-lg font-semibold'>No Lessons/Resources Found</h3>
                <p className='mt-1 text-sm'>There are no lessons under this course.</p>
              </div>
            )}

            {lessonsWithContent?.map((skill, skillIndex) => (
              <Card key={skill?.lesson?.uuid}>
                <CardHeader className='flex flex-row items-center space-y-0'>
                  <div className='flex flex-1 items-center gap-3'>
                    <div
                      className={`flex min-h-8 min-w-8 items-center justify-center rounded-full ${
                        skill?.lesson?.active
                          ? 'bg-green-100 text-green-600'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {skill?.lesson?.active ? (
                        <CheckCircle className='h-4 w-4' />
                      ) : (
                        <span>{skillIndex + 1}</span>
                      )}
                    </div>
                    <div>
                      <CardTitle className='text-base'>{skill?.lesson?.title}</CardTitle>
                      <div className='text-muted-foreground text-sm'>
                        <HTMLTextPreview htmlContent={skill?.lesson?.description as string} />
                      </div>
                      <p className='text-muted-foreground text-sm'>
                        {skill?.lesson?.duration_display}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className='space-y-3'>
                    <h5>Resources</h5>
                    {skill?.content?.data?.map((resource, resourceIndex) => {
                      const contentTypeName = contentTypeMap[resource.content_type_uuid] || 'file';

                      return (
                        <div
                          key={resourceIndex}
                          className='bg-muted/40 flex items-center gap-3 rounded px-3 py-4'
                        >
                          {getResourceIcon(contentTypeName)}

                          <div className='flex-1'>
                            <p className='text-sm font-medium'>{resource?.title}</p>
                            {/* {resource.duration && (
                                                            <p className="text-xs text-muted-foreground">{resource.duration}</p>
                                                        )} */}
                            <p className='text-muted-foreground text-xs'>Duration: </p>
                          </div>
                          <Button size='sm' variant='outline'>
                            {contentTypeName === 'video' ? (
                              <Play className='h-4 w-4' />
                            ) : (
                              <Download className='h-4 w-4' />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value='quizzes' className='space-y-4'>
            <p className='bg-red-200 text-xs italic'>
              Currently fetching all quizzes, shuold only fetch quizzes for this course
            </p>

            {cQuizzes?.data?.content?.length === 0 && (
              <div className='text-muted-foreground flex flex-col items-center justify-center py-12 text-center'>
                <FileQuestion className='mb-4 h-10 w-10 text-gray-400' />
                <h3 className='text-lg font-semibold'>No Quiz Found</h3>
                <p className='mt-1 text-sm'>There are no quizzes under this course.</p>
              </div>
            )}

            {cQuizzes?.data?.content?.map(quiz => (
              <Card key={quiz.uuid}>
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4>{quiz.title}</h4>
                      <div className='mt-2 gap-1 text-sm'>
                        <p>Instructions:</p>
                        <p>{quiz.instructions}</p>
                      </div>
                      <div className='text-muted-foreground mt-1 flex items-center gap-4 text-sm'>
                        {/* <span>{quiz.questions} questions</span> */}
                        <span>{quiz.time_limit_display}</span>
                        <span>Attempts allowed: {quiz.attempts_allowed}</span>
                      </div>
                    </div>
                    <Button>Start Quiz</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value='assignments' className='space-y-4'>
            <p className='bg-red-200 text-xs italic'>
              Currently fetching all assignments, shuold only fetch assignments for this course
            </p>

            {cAssignments?.data?.content?.length === 0 && (
              <div className='text-muted-foreground flex flex-col items-center justify-center py-12 text-center'>
                <FileQuestion className='mb-4 h-10 w-10 text-gray-400' />
                <h3 className='text-lg font-semibold'>No Assignment Found</h3>
                <p className='mt-1 text-sm'>There are no assignments under this course.</p>
              </div>
            )}

            {cAssignments?.data?.content?.map(assignment => (
              <Card key={assignment.uuid}>
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <h4>{assignment.title}</h4>
                      <div className='text-muted-foreground mt-1 mb-2 text-sm'>
                        <RichTextRenderer
                          htmlString={assignment.description as string}
                          maxChars={100}
                        />
                      </div>
                      <div className='text-muted-foreground mt-1 mb-2 flex flex-col text-sm'>
                        <p>Instruction:</p>
                        <RichTextRenderer
                          htmlString={assignment.instructions as string}
                          maxChars={100}
                        />
                      </div>
                      <p className='text-sm'>
                        Due:{' '}
                        {new Date(assignment?.due_date as any).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                          timeZoneName: 'short',
                        })}
                      </p>
                    </div>
                    <Button>View Assignment</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value='assessments' className='space-y-4'>
            {cAssesssment?.data?.content?.length === 0 && (
              <div className='text-muted-foreground flex flex-col items-center justify-center py-12 text-center'>
                <FileQuestion className='mb-4 h-10 w-10 text-gray-400' />
                <h3 className='text-lg font-semibold'>No Assessment Found</h3>
                <p className='mt-1 text-sm'>There are no assessments under this course.</p>
              </div>
            )}

            {cAssesssment?.data?.content?.map(assessment => (
              <Card key={assessment.uuid}>
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start gap-3'>
                      <Award className='text-primary mt-1 h-6 w-6' />
                      <div>
                        <h4>{assessment?.title}</h4>
                        <Badge variant='outline' className='mb-2'>
                          {assessment?.assessment_type}
                        </Badge>
                        <p className='text-muted-foreground text-sm'>{assessment?.description}</p>
                      </div>
                    </div>
                    <Button>View Details</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

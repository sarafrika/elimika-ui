'use client';

import HTMLTextPreview from '@/components/editors/html-text-preview';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useCourseRubrics } from '@/hooks/use-course-rubric';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import {
  getAllAssignmentsOptions,
  getAllDifficultyLevelsOptions,
  getAllQuizzesOptions,
  getCourseAssessmentsOptions,
  getCourseByUuidOptions,
  getCourseCreatorByUuidOptions,
  getCourseLessonsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  EyeIcon,
  FileQuestion,
  FileText,
  ImageIcon,
  Link2,
  Play,
  Star,
  Users,
  Video,
  Volume2
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { type JSX, useState } from 'react';
import { cn } from '../../../lib/utils';
import { Assignment } from '../../../services/client';
import { AssignmentViewer } from '../@course_creator/_components/assignment-viewer';
import { CustomLoadingState } from '../@course_creator/_components/loading-state';
import { QuizViewer } from '../@course_creator/_components/quiz-viewer';
import { useRubricDetails } from '../@course_creator/rubrics/rubric-chaining';
import { AudioPlayer } from '../@student/schedule/classes/[id]/AudioPlayer';
import { ReadingMode } from '../@student/schedule/classes/[id]/ReadingMode';
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

  const [activeTab, setActiveTab] = useState('overview');
  const { replaceBreadcrumbs } = useBreadcrumb();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isIntroVideoPlaying, setIsIntroVideoPlaying] = useState(false);

  const [selectedLesson, setSelectedLesson] = useState<ContentItem | null>(null);
  const [contentTypeName, setContentTypeName] = useState<string>('');

  // ...existing queries and useEffect...

  // ADD THIS FUNCTION
  const handleViewContent = (content: ContentItem, contentType: string) => {
    setSelectedLesson(content);
    setContentTypeName(contentType);

    if (contentType === 'video') {
      setIsPlaying(true);
    } else if (contentType === 'pdf' || contentType === 'text') {
      setIsReading(true);
    } else if (contentType === 'audio') {
      setIsAudioPlaying(true);
    }
  };

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

  const { data: courseRubrics, isLoading: rubric, errors } = useCourseRubrics(courseId as string);

  const [openRubricId, setOpenRubricId] = useState<string | null>(null);

  const toggleRubric = (id: string) => {
    setOpenRubricId(prev => (prev === id ? null : id));
  };


  const {
    data: cAssignments,
    isLoading: assignmentLoading,
    isFetching: assignmentFetching,
  } = useQuery({
    ...getAllAssignmentsOptions({ query: { pageable: {} } }),
  });

  const assignments = cAssignments?.data?.content;
  const filteredAssignments =
    assignments?.filter((assignment: any) => lessonUuids.includes(assignment.lesson_uuid)) || [];

  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const handleViewAssignment = (assignment: Assignment) => {
    setSelectedQuiz(null)
    setSelectedAssignment(assignment);
    setIsViewerOpen(true);
  };

  // const handleCloseViewer = () => {
  //   setIsViewerOpen(false);
  //   setTimeout(() => setSelectedAssignment(null), 300);
  // };

  const {
    data: cQuizzes,
    isLoading: quizzesLoading,
    isFetching: quizzesFetching,
  } = useQuery({
    ...getAllQuizzesOptions({ query: { pageable: {} } }),
  });

  const quizzes = cQuizzes?.data?.content;
  const filteredQuizzes =
    quizzes?.filter((quiz: any) => lessonUuids.includes(quiz.lesson_uuid)) || [];

  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleViewQuiz = (quiz: any) => {
    setSelectedAssignment(null)
    setSelectedQuiz(quiz);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setTimeout(() => setSelectedQuiz(null), 300);
  };

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
                <span>{courseData?.class_limit} class limit</span>
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
                <div className="bg-muted mb-4 flex h-48 w-full items-center justify-center rounded-lg">
                  {courseData?.intro_video_url ? (
                    <div className="relative h-full w-full">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                          size="lg"
                          className="rounded-full"
                          onClick={() => {
                            setSelectedLesson({
                              uuid: "",
                              title: courseData?.name || "Course Introduction",
                              content_type_uuid: "video",
                              content_text: courseData?.intro_video_url,
                              description: "Course introduction video",
                            });
                            setContentTypeName("video");
                            setIsPlaying(true);
                          }}
                        >
                          <Play className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                      <BookOpen className="h-12 w-12 text-primary/40" />
                      <p className="text-sm">Intro video display not available</p>
                    </div>
                  )}
                </div>

                {/* {courseData?.intro_video_url && (
                  <div className='w-full'>
                    <video src={courseData?.intro_video_url} controls className='w-full rounded-md' />
                  </div>
                )} */}

                {/* Pricing */}
                <div className='mb-4 text-center'>
                  <div className='mb-2 flex items-center justify-center gap-2'>
                    <span className='text-primary text-2xl font-bold'>
                      KES {courseData?.minimum_training_fee}
                    </span>
                    {courseData?.minimum_training_fee && (
                      <span className='text-muted-foreground text-lg line-through'>
                        KES {courseData?.minimum_training_fee}
                      </span>
                    )}
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

                {/* Course Progress */}
                {/* <div className='mt-6'>
                  <div className='mb-2 flex items-center justify-between'>
                    <span className='text-sm'>Course Progress</span>
                    <span className='text-sm'>
                      {completedSkills}/{courseData.skills.length} skills
                      7/8 skills
                    </span>
                  </div>
                  <Progress value={25} className='mb-2' />
                  <p className='text-muted-foreground text-xs'>{Math.round(25)}% Complete</p>
                </div> */}
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
                <FileQuestion className='text-muted-foreground mb-4 h-10 w-10' />
                <h3 className='text-lg font-semibold'>No Lessons/Resources Found</h3>
                <p className='mt-1 text-sm'>There are no lessons under this course.</p>
              </div>
            )}

            {lessonsWithContent?.map((skill, skillIndex) => (
              <Card key={skill?.lesson?.uuid}>
                <CardHeader className='flex flex-row items-center space-y-0'>
                  <div className='flex flex-1 items-center gap-3'>
                    <div
                      className={`flex min-h-8 min-w-8 items-center justify-center rounded-full ${skill?.lesson?.active
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
                        {/* {skill?.lesson?.duration_display} */}
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

                            <p className='text-muted-foreground text-xs'>Duration: </p>
                          </div>
                          {/* UPDATED BUTTON */}
                          <Button
                            onClick={() => handleViewContent(resource, contentTypeName)}
                            size="sm"
                            variant="outline"
                          >
                            {contentTypeName === "video" ? (
                              <Play className="h-4 w-4" />
                            ) : contentTypeName === "audio" ? (
                              <Volume2 className="h-4 w-4" />
                            ) : contentTypeName === "image" ? (
                              <ImageIcon className="h-4 w-4" />
                            ) : contentTypeName === "pdf" || contentTypeName === "text" ? (
                              <FileText className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
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

          <TabsContent value="quizzes" className="space-y-4">
            {filteredQuizzes?.length === 0 && (
              <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                <FileQuestion className="text-muted-foreground mb-4 h-10 w-10" />
                <h3 className="text-lg font-semibold">No Quiz Found</h3>
                <p className="mt-1 text-sm">There are no quizzes under this course.</p>
              </div>
            )}

            {filteredQuizzes?.map((quiz: any) => (
              <Card key={quiz.uuid}>
                <CardContent className="px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className='text-base'>{quiz?.title}</CardTitle>
                      <div className='text-muted-foreground text-sm'>
                        <p className="text-sm font-medium text-muted-foreground">
                          Instructions:
                        </p>
                        <HTMLTextPreview htmlContent={quiz.instructions || 'No instructions provided'}
                        />
                      </div>
                      <div className="text-muted-foreground mt-3 flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Duration:</span> {quiz.time_limit_display}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Attempts:</span> {quiz.attempts_allowed}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleViewQuiz(quiz)}
                      variant="default"
                      className="ml-4"
                    >
                      View Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value='assignments' className='space-y-4'>
            {filteredAssignments?.length === 0 && (
              <div className='text-muted-foreground flex flex-col items-center justify-center py-12 text-center'>
                <FileQuestion className='text-muted-foreground mb-4 h-10 w-10' />
                <h3 className='text-lg font-semibold'>No Assignment Found</h3>
                <p className='mt-1 text-sm'>There are no assignments under this course.</p>
              </div>
            )}

            {filteredAssignments?.map((assignment: any) => (
              <Card key={assignment.uuid}>
                <CardContent className='px-6'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <CardTitle className='text-base'>{assignment?.title}</CardTitle>
                      <div className='text-muted-foreground text-sm'>
                        <p className="text-sm font-medium text-muted-foreground">
                          Instructions:
                        </p>
                        <RichTextRenderer htmlString={assignment.instructions || 'No instructions provided'}
                          maxChars={100}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() => handleViewAssignment(assignment)}
                      variant="default"
                      className="shrink-0"
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="assessments" className="space-y-4">
            {courseRubrics?.length === 0 && (
              <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                <FileQuestion className="mb-4 h-10 w-10" />
                <h3 className="text-lg font-semibold">No Assessment Rubric Found</h3>
                <p className="mt-1 text-sm">There are no assessment rubrics linked to this course.</p>
              </div>
            )}

            {courseRubrics?.map((assessment: any) => {
              const isOpen = openRubricId === assessment.uuid;

              return (
                <Card key={assessment.uuid} className="overflow-hidden">
                  <CardContent className="px-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Award className="text-primary mt-1 h-6 w-6" />
                        <div>
                          <h4 className="font-semibold">{assessment?.rubric?.title}</h4>
                          <Badge variant="outline" className="mb-2">
                            {assessment?.rubric?.rubric_type}
                          </Badge>
                          <p className="text-muted-foreground text-sm">
                            {assessment?.rubric?.description}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => toggleRubric(assessment.uuid)}
                      >
                        {isOpen ? 'Hide Details' : 'View Details'}
                      </Button>
                    </div>
                  </CardContent>

                  {/* Slide-down content */}
                  <div
                    className={cn(
                      'transition-all duration-300 ease-in-out',
                      isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    {isOpen && (
                      <RubricDetailsTable rubric={assessment.rubric} />
                    )}
                  </div>
                </Card>
              );
            })}
          </TabsContent>

        </Tabs>


        <VideoPlayer
          isOpen={isPlaying && contentTypeName === 'video'}
          onClose={() => setIsPlaying(false)}
          videoUrl={selectedLesson?.content_text || ''}
          title={selectedLesson?.title}
        />

        <ReadingMode
          isOpen={isReading && (contentTypeName === 'pdf' || contentTypeName === 'text')}
          onClose={() => setIsReading(false)}
          title={selectedLesson?.title || ''}
          description={selectedLesson?.description}
          content={selectedLesson?.content_text || ''}
          contentType={contentTypeName as 'text' | 'pdf'}
        />

        <AudioPlayer
          isOpen={isAudioPlaying && contentTypeName === 'audio'}
          onClose={() => setIsAudioPlaying(false)}
          audioUrl={selectedLesson?.content_text || ''}
          title={selectedLesson?.title}
          description={selectedLesson?.description}
        />

        {selectedQuiz && (
          <QuizViewer
            quiz={selectedQuiz}
            open={isViewerOpen}
            onOpenChange={handleCloseViewer}
          />
        )}

        {selectedAssignment && (
          <AssignmentViewer
            assignment={selectedAssignment}
            open={isViewerOpen}
            onOpenChange={handleCloseViewer}
          // TODO: Add when API is ready
          // getAssignmentQuestionsOptions={getAssignmentQuestionsOptions}
          />
        )}
      </div>
    </div>
  );
}

function RubricDetailsTable({ rubric }: { rubric: any }) {
  const { criteria, matrix, isLoading } = useRubricDetails(rubric?.uuid);
  const levels = criteria[0]?.scoring ?? [];

  if (isLoading) {
    return (
      <div className="border-t bg-muted/30 px-6 py-10 text-sm text-muted-foreground">
        Loading rubric details…
      </div>
    );
  }

  if (!criteria || criteria.length === 0) {
    return (
      <div className="border-t bg-muted/30 px-6 py-10 text-sm text-muted-foreground">
        No rubric criteria available.
      </div>
    );
  }

  return (
    <div className="border-t bg-muted/30 px-6 pb-6 pt-4">
      {/* Header info */}
      <div className="mb-6 grid gap-2 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Min Passing Score</p>
          <p className="font-medium">{rubric.min_passing_score} of {rubric.total_weight} Points</p>

        </div>
        <div>
          <p className="text-sm text-muted-foreground">Category</p>
          <p className="font-medium">{rubric.rubric_category || '—'}</p>
        </div>

      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border px-4 py-2 text-left">
                Criteria
              </th>

              {levels.map((level: any) => (
                <th
                  key={level.level_uuid}
                  className="border border-border px-4 py-2 text-start"
                >
                  <div className="font-medium">
                    {level.description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {level.score_range} pts
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {criteria.map((criterion: any) => (
              <tr key={criterion.uuid}>
                <td className="border border-border px-4 py-3 font-medium align-top">
                  {criterion.component_name}
                </td>

                {criterion.scoring.map((score: any) => (
                  <td
                    key={score.level_uuid}
                    className="border border-border px-3 py-3 align-top text-muted-foreground"
                  >
                    {score.description || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


'use client';

import { CourseTrainingRequirements } from '@/app/dashboard/_components/course-training-requirements';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { resolveLessonContentSource } from '@/lib/lesson-content-preview';
import type { Assignment, CourseReview, DifficultyLevel, Lesson, Quiz } from '@/services/client';
import {
  getAllAssignmentsOptions,
  getAllDifficultyLevelsOptions,
  getAllQuizzesOptions,
  getCourseByUuidOptions,
  getCourseCreatorByUuidOptions,
  getCourseLessonsOptions,
  getCourseReviewsOptions,
  getCourseReviewsQueryKey,
  submitCourseReviewMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  HelpCircle,
  Play,
  Search,
  Star,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { EnrollmentLoadingState } from '@/src/features/dashboard/courses/components/EnrollmentLoadingState';
import { ReviewCard } from '../@instructor/reviews/review-card';
import { VideoPlayer } from '../@student/schedule/classes/[id]/VideoPlayer';
import { FeedbackDialog } from './review-instructor-modal';

type CourseDetailsProps = {
  courseId?: string;
  handleEnroll?: () => void;
  userRole?: string;
  student_uuid?: string;
};

interface ContentItem {
  uuid: string;
  title: string;
  content_type_uuid: string;
  content_text?: string;
  file_url?: string | null;
  value?: string | null;
  description?: string;
}

export default function ReusableCourseDetailsPage({
  courseId: propCourseId,
  handleEnroll,
  userRole,
  student_uuid,
}: CourseDetailsProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useParams();
  const courseId = propCourseId || (params?.id as string);
  const { activeDomain } = useUserDomain();

  const { replaceBreadcrumbs } = useBreadcrumb();

  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [headline, setHeadline] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<ContentItem | null>(null);

  const reviewCourseMut = useMutation(submitCourseReviewMutation());

  const handleSubmitFeedback = () => {
    reviewCourseMut.mutate(
      {
        body: {
          course_uuid: courseId as string,
          rating,
          student_uuid: student_uuid as string,
          comments: feedbackComment,
          headline,
          is_anonymous: false,
        },
        path: { courseUuid: courseId as string },
      },
      {
        onSuccess: data => {
          toast.success(data?.message);
          setShowFeedbackDialog(false);
          qc.invalidateQueries({
            queryKey: getCourseReviewsQueryKey({ path: { courseUuid: courseId as string } }),
          });
        },
        onError: error => {
          toast.error(error?.message);
          setShowFeedbackDialog(false);
        },
      }
    );
  };

  const { data, isLoading, isFetching } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseId as string } }),
    enabled: !!courseId,
  });
  const courseData = data?.data;

  const { data: reviews } = useQuery({
    ...getCourseReviewsOptions({ path: { courseUuid: courseId as string } }),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (courseData) {
      replaceBreadcrumbs([
        {
          id: 'dashboard',
          title: 'Dashboard',
          url: buildWorkspaceAliasPath(activeDomain, '/dashboard/overview'),
        },
        {
          id: 'courses',
          title: 'Browse Courses',
          url: buildWorkspaceAliasPath(activeDomain, '/dashboard/courses'),
        },
        {
          id: 'course-details',
          title: courseData?.name,
          url: buildWorkspaceAliasPath(activeDomain, `/dashboard/courses/${courseData?.uuid}`),
        },
      ]);
    }
  }, [replaceBreadcrumbs, courseId, courseData, userRole, activeDomain]);

  const { data: creator } = useQuery({
    ...getCourseCreatorByUuidOptions({ path: { uuid: courseData?.course_creator_uuid as string } }),
    enabled: !!courseData?.course_creator_uuid,
  });
  // @ts-expect-error
  const courseCreator = creator?.data;

  const { data: courseLessons } = useQuery({
    ...getCourseLessonsOptions({
      path: { courseUuid: courseId },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: !!courseId,
  });
  const lessons: Lesson[] = courseLessons?.data?.content ?? [];
  const lessonUuids = lessons
    .map(lesson => lesson.uuid)
    .filter((uuid): uuid is string => typeof uuid === 'string');

  const { data: cAssignments, isLoading: assignmentLoading } = useQuery({
    ...getAllAssignmentsOptions({ query: { pageable: {} } }),
  });
  const assignments: Assignment[] = cAssignments?.data?.content ?? [];
  const filteredAssignments = assignments.filter(assignment =>
    lessonUuids.includes(assignment.lesson_uuid)
  );

  const { data: cQuizzes, isLoading: quizzesLoading } = useQuery({
    ...getAllQuizzesOptions({ query: { pageable: {} } }),
  });
  const quizzes: Quiz[] = cQuizzes?.data?.content ?? [];
  const filteredQuizzes = quizzes.filter(quiz => lessonUuids.includes(quiz.lesson_uuid));

  const { data: difficulty } = useQuery(getAllDifficultyLevelsOptions());
  const difficultyLevels: DifficultyLevel[] = difficulty?.data ?? [];
  const getDifficultyName = (uuid: string) =>
    difficultyLevels.find(level => level.uuid === uuid)?.name;

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
    return (
      <EnrollmentLoadingState
        title='Loading your course details'
        description='We are gathering lessons, tasks, quizzes, and course information so the full learning overview is ready when the page opens.'
      />
    );
  }

  const difficultyName = getDifficultyName(courseData?.difficulty_uuid as string);
  const reviewItems: CourseReview[] = reviews?.data ?? [];
  const reviewCount = reviewItems.length;
  const avgRating =
    reviewCount > 0
      ? (reviewItems.reduce((sum, review) => sum + (review.rating || 0), 0) / reviewCount).toFixed(
        1
      )
      : null;
  const detailStats = [
    { label: 'Lessons', value: lessonsWithContent?.length || 0, icon: BookOpen },
    { label: 'Quizzes', value: filteredQuizzes?.length || 0, icon: HelpCircle },
    { label: 'Tasks', value: filteredAssignments?.length || 0, icon: ClipboardList },
    { label: 'Class limit', value: courseData?.class_limit || 0, icon: Users },
  ];

  return (
    <div className='mx-auto mb-24 min-h-screen w-full max-w-[1680px]'>
      <section className='border-border bg-card relative overflow-hidden rounded-[24px] border px-5 py-6 sm:px-6 lg:px-8'>
        <div className='from-primary/10 via-background absolute inset-0 bg-gradient-to-br to-transparent' />
        <div className='relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
          <div className='space-y-6'>
            <div className='flex flex-wrap items-center gap-2'>
              {difficultyName ? (
                <Badge className='bg-primary/10 text-primary rounded-full border-0 px-3 py-1 font-semibold'>
                  {difficultyName}
                </Badge>
              ) : null}
              {courseData?.category_names?.map((cat: string, i: number) => (
                <Badge
                  key={i}
                  variant='outline'
                  className='rounded-full border-border/70 bg-background/70'
                >
                  {cat}
                </Badge>
              ))}
            </div>

            <div className='space-y-3'>
              <h1 className='text-foreground text-[clamp(1.9rem,3.5vw,3.4rem)] font-semibold tracking-[-0.04em]'>
                {courseData?.name}
              </h1>
              <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-sm'>
                {avgRating ? (
                  <div className='flex items-center gap-2'>
                    <div className='flex'>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${s <= Math.round(Number(avgRating))
                            ? 'fill-warning text-warning'
                            : 'text-muted-foreground/40'
                            }`}
                        />
                      ))}
                    </div>
                    <span className='text-foreground font-semibold'>{avgRating}</span>
                    <span className='text-muted-foreground'>({reviewCount} reviews)</span>
                  </div>
                ) : (
                  <div className='text-muted-foreground flex items-center gap-2'>
                    <Star className='h-4 w-4' />
                    No reviews yet
                  </div>
                )}
                <div className='text-muted-foreground flex items-center gap-2'>
                  <Users className='h-4 w-4' />
                  {courseData?.class_limit} class limit
                </div>
              </div>
              <div className='text-muted-foreground max-w-4xl text-sm leading-6 sm:text-[0.95rem]'>
                <RichTextRenderer htmlString={courseData?.description as string} maxChars={260} />
              </div>
            </div>

            <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
              {detailStats.map(({ label, value, icon: Icon }) => (
                <Card key={label} className='rounded-[20px] border bg-background/80 p-4 shadow-none'>
                  <div className='flex items-center gap-3'>
                    <span className='bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-xl'>
                      <Icon className='h-4 w-4' />
                    </span>
                    <div>
                      <p className='text-muted-foreground text-xs font-medium'>{label}</p>
                      <p className='text-foreground text-lg font-semibold'>{value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className='rounded-[22px] border bg-background/75 p-4 shadow-none'>
              <div className='flex items-center gap-4'>
                <Avatar className='ring-primary/20 h-14 w-14 ring-2'>
                  <AvatarFallback className='bg-muted text-foreground font-semibold'>
                    {courseCreator?.full_name
                      ?.split(' ')
                      .map((n: string) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0'>
                  <p className='text-foreground text-sm font-semibold'>{courseCreator?.full_name}</p>
                  <p className='text-muted-foreground text-sm'>
                    {courseCreator?.professional_headline || 'Course creator'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className='rounded-[24px] border bg-background/85 p-5 shadow-none'>
            <div className='space-y-5'>
              <div className='from-primary/12 to-success/8 bg-gradient-to-br rounded-[20px] border p-4'>
                <div className='bg-muted relative flex h-44 items-center justify-center overflow-hidden rounded-[18px]'>
                  {courseData?.intro_video_url ? (
                    <button
                      type='button'
                      className='group flex flex-col items-center gap-2'
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
                      <span className='bg-primary shadow-primary/20 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-105'>
                        <Play className='fill-primary-foreground text-primary-foreground h-6 w-6' />
                      </span>
                      <span className='text-muted-foreground text-xs font-medium'>Watch intro</span>
                    </button>
                  ) : (
                    <div className='text-muted-foreground/70 flex flex-col items-center gap-2'>
                      <BookOpen className='h-10 w-10' />
                      <p className='text-xs'>No intro video</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className='text-muted-foreground text-xs font-medium uppercase tracking-[0.12em]'>
                  Minimum training fee
                </p>
                <p className='text-foreground mt-2 text-3xl font-semibold tracking-[-0.03em]'>
                  KES <span className='text-primary'>{courseData?.minimum_training_fee ?? 0}</span>
                </p>
                <p className='text-muted-foreground mt-1 text-sm'>Per hour, per learner.</p>
              </div>

              <div className='flex flex-col gap-3'>
                {typeof handleEnroll === 'function' && (
                  <Button
                    onClick={() =>
                      router.push(
                        buildWorkspaceAliasPath(
                          activeDomain,
                          `/dashboard/courses/available-classes/${courseData?.uuid}`
                        )
                      )
                    }
                    className='w-full rounded-xl font-semibold'
                    size='lg'
                  >
                    View available classes
                  </Button>
                )}
                <Button
                  onClick={() =>
                    router.push(
                      buildWorkspaceAliasPath(
                        activeDomain,
                        `/dashboard/courses/instructor?courseId=${courseData?.uuid}`
                      )
                    )
                  }
                  variant='outline'
                  className='w-full rounded-xl shadow-none'
                  size='lg'
                >
                  <Search className='mr-2 h-4 w-4' />
                  Find an instructor
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <div className='mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]'>
        <div className='space-y-8'>
          <Card className='rounded-[22px] border p-5 shadow-none sm:p-6'>
            <SectionLabel>About This Course</SectionLabel>
            <div className='prose prose-slate dark:prose-invert max-w-none'>
              <RichTextRenderer htmlString={courseData?.description as string} />
            </div>
          </Card>

          {courseData?.prerequisites && (
            <Card className='rounded-[22px] border p-5 shadow-none sm:p-6'>
              <SectionLabel>Prerequisites</SectionLabel>
              <div className='prose prose-slate dark:prose-invert max-w-none'>
                <RichTextRenderer htmlString={courseData?.prerequisites as string} />
              </div>
            </Card>
          )}

          <Card className='rounded-[22px] border p-5 shadow-none sm:p-6'>
            <div className='mb-6 flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <SectionLabel className='mb-0'>Student Reviews</SectionLabel>
                {reviewCount > 0 && (
                  <Badge variant='secondary' className='text-xs'>
                    {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              {userRole !== 'instructor' && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowFeedbackDialog(true)}
                  className='gap-2 rounded-xl shadow-none'
                >
                  <Star className='h-4 w-4' />
                  Write a Review
                </Button>
              )}
            </div>

            {reviewCount === 0 ? (
              <div className='border-border rounded-xl border border-dashed p-10 text-center'>
                <GraduationCap className='text-muted-foreground/40 mx-auto mb-3 h-8 w-8' />
                <p className='text-muted-foreground text-sm'>No reviews yet. Be the first!</p>
              </div>
            ) : (
              <div className='grid gap-4 sm:grid-cols-2'>
                {reviewItems
                  ?.slice(0, 6)
                  .map(review => <ReviewCard key={review.uuid} review={review} type='others' />)}
              </div>
            )}

            {reviewCount > 6 && (
              <button
                type='button'
                className='text-warning/60 dark:text-warning/40 mt-4 flex items-center gap-1 text-sm font-medium hover:underline'
              >
                View all {reviewCount} reviews <ChevronRight className='h-4 w-4' />
              </button>
            )}
          </Card>
        </div>

        <div className='space-y-6'>
          <CourseTrainingRequirements
            requirements={courseData?.training_requirements}
            viewerRole={
              userRole as
              | 'admin'
              | 'course_creator'
              | 'instructor'
              | 'organization'
              | 'student'
              | undefined
            }
            description='Review what is required for this course before enrollment or delivery.'
          />

          <Card className='rounded-[22px] border p-5 shadow-none sm:p-6'>
            <SectionLabel>Course Snapshot</SectionLabel>
            <div className='space-y-4'>
              {detailStats.map(({ label, value, icon: Icon }) => (
                <div key={label} className='flex items-center gap-3'>
                  <span className='bg-primary/10 text-primary inline-flex size-9 items-center justify-center rounded-xl'>
                    <Icon className='h-4 w-4' />
                  </span>
                  <div className='min-w-0 flex flex-row items-center gap-1'>
                    <p className='text-muted-foreground text-xl font-bold'>{value}</p>
                    <p className='text-foreground text-sm font-medium'>{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────── */}
      <VideoPlayer
        isOpen={isPlaying}
        onClose={() => setIsPlaying(false)}
        videoUrl={resolveLessonContentSource(selectedLesson, 'video')}
        title={selectedLesson?.title}
      />

      <FeedbackDialog
        type='others'
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
        headline={headline}
        onHeadlineChange={setHeadline}
        feedback={feedbackComment}
        onFeedbackChange={setFeedbackComment}
        rating={rating}
        onRatingChange={setRating}
        isSubmitting={reviewCourseMut.isPending}
        onSubmit={handleSubmitFeedback}
      />
    </div>
  );
}

/* ── tiny helper ─────────────────────────────────────────────── */
function SectionLabel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h2 className={`mb-4 text-xl font-bold tracking-tight ${className}`}>{children}</h2>;
}

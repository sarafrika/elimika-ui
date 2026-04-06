'use client';

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
import { CourseTrainingRequirements } from '@/app/dashboard/_components/course-training-requirements';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { resolveLessonContentSource } from '@/lib/lesson-content-preview';
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
import { CustomLoadingState } from '../@course_creator/_components/loading-state';
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
        { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
        { id: 'courses', title: 'Browse Courses', url: '/dashboard/all-courses' },
        {
          id: 'course-details',
          title: courseData?.name,
          url: `/dashboard/all-courses/${courseData?.uuid}`,
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

  const { data: courseLessons, isLoading: lessonsIsLoading } = useQuery({
    ...getCourseLessonsOptions({
      path: { courseUuid: courseId },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: !!courseId,
  });
  const lessons = courseLessons?.data?.content;
  const lessonUuids = lessons?.map((lesson: any) => lesson.uuid) || [];

  const { data: cAssignments, isLoading: assignmentLoading } = useQuery({
    ...getAllAssignmentsOptions({ query: { pageable: {} } }),
  });
  const assignments = cAssignments?.data?.content;
  const filteredAssignments =
    assignments?.filter((a: any) => lessonUuids.includes(a.lesson_uuid)) || [];

  const { data: cQuizzes, isLoading: quizzesLoading } = useQuery({
    ...getAllQuizzesOptions({ query: { pageable: {} } }),
  });
  const quizzes = cQuizzes?.data?.content;
  const filteredQuizzes = quizzes?.filter((q: any) => lessonUuids.includes(q.lesson_uuid)) || [];

  const { data: difficulty } = useQuery(getAllDifficultyLevelsOptions());
  const difficultyLevels = difficulty?.data;
  const getDifficultyName = (uuid: string) =>
    difficultyLevels?.find((l: any) => l.uuid === uuid)?.name;

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

  const difficultyName = getDifficultyName(courseData?.difficulty_uuid as string);
  const reviewCount = reviews?.data?.length || 0;
  const avgRating =
    reviewCount > 0
      ? (
          reviews!.data!.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviewCount
        ).toFixed(1)
      : null;

  return (
    <div className='mx-auto mb-24 min-h-screen max-w-7xl'>
      {/* ── HERO BAND ──────────────────────────────────────────────── */}
      <div className='border-border relative mb-12 overflow-hidden rounded-2xl border px-8 py-12 md:px-14 md:py-16'>
        {/* subtle grid texture */}
        <div
          className='pointer-events-none absolute inset-0 opacity-[0.04]'
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,transparent,transparent 39px,white 39px, white 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,white 39px,white 40px)',
          }}
        />

        <div className='relative grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]'>
          {/* LEFT — meta */}
          <div className='flex flex-col justify-between gap-8'>
            <div>
              {/* Tags */}
              <div className='mb-5 flex flex-wrap items-center gap-2'>
                {difficultyName && (
                  <span className='border-primary/40 bg-primary/10 text-primary rounded-full border px-3 py-0.5 text-xs font-semibold tracking-widest uppercase'>
                    {difficultyName}
                  </span>
                )}
                {courseData?.category_names?.map((cat: string, i: number) => (
                  <span
                    key={i}
                    className='border-border/50 bg-muted/30 text-muted-foreground rounded-full border px-3 py-0.5 text-xs'
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className='mb-4 text-3xl leading-tight font-extrabold tracking-tight md:text-4xl lg:text-5xl'>
                {courseData?.name}
              </h1>

              {/* Rating row */}
              {avgRating && (
                <div className='mb-5 flex items-center gap-2'>
                  <div className='flex'>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= Math.round(Number(avgRating))
                            ? 'fill-warning text-warning'
                            : 'text-muted-foreground/40'
                        }`}
                      />
                    ))}
                  </div>
                  <span className='text-warning text-sm font-semibold'>{avgRating}</span>
                  <span className='text-muted-foreground text-sm'>({reviewCount} reviews)</span>
                </div>
              )}

              {/* Class limit */}
              <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                <Users className='h-4 w-4' />
                <span>{courseData?.class_limit} class limit</span>
              </div>
            </div>

            {/* Instructor */}
            <div className='flex items-center gap-4'>
              <Avatar className='ring-primary/30 h-12 w-12 ring-2'>
                <AvatarFallback className='bg-muted text-foreground font-semibold'>
                  {courseCreator?.full_name
                    ?.split(' ')
                    .map((n: string) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className='text-foreground font-semibold'>{courseCreator?.full_name}</p>
                <p className='text-muted-foreground text-sm'>
                  {courseCreator?.professional_headline}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — enrollment card */}
          <div className='border-border flex flex-col gap-4 rounded-xl border bg-white/5 p-6 backdrop-blur-sm'>
            {/* Intro video / thumbnail */}
            <div className='bg-muted relative flex h-40 items-center justify-center overflow-hidden rounded-lg'>
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
                  <span className='bg-primary shadow-primary/30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-110'>
                    <Play className='fill-foreground text-foreground h-6 w-6' />
                  </span>
                  <span className='text-muted-foreground text-xs'>Watch intro</span>
                </button>
              ) : (
                <div className='text-muted-foreground/60 flex flex-col items-center gap-2'>
                  <BookOpen className='h-10 w-10' />
                  <p className='text-xs'>No intro video</p>
                </div>
              )}
            </div>

            {/* Price */}
            <div>
              <p className='text-foreground text-3xl font-extrabold'>
                KES <span className='text-primary'>{courseData?.minimum_training_fee}</span>
              </p>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                minimum training fee · per hour per head
              </p>
            </div>

            {/* CTAs */}
            <div className='flex flex-col gap-2'>
              {typeof handleEnroll === 'function' && (
                <Button
                  onClick={() =>
                    router.push(`/dashboard/all-courses/available-classes/${courseData?.uuid}`)
                  }
                  className='bg-primary hover:bg-primary/90 w-full font-semibold'
                  size='lg'
                >
                  Enroll for Programs / Classes
                </Button>
              )}
              {userRole === 'student' && (
                <Button
                  onClick={() =>
                    router.push(`/dashboard/all-courses/instructor/${courseData?.uuid}`)
                  }
                  variant='outline'
                  className='w-full'
                  size='lg'
                >
                  <Search className='mr-2 h-4 w-4' />
                  Find an Instructor
                </Button>
              )}
            </div>

            {/* Quick stat pills */}
            <div className='divide-border border-border bg-muted/30 mt-2 grid grid-cols-3 divide-x rounded-lg border'>
              {[
                { icon: BookOpen, value: lessonsWithContent?.length || 0, label: 'Lessons' },
                { icon: HelpCircle, value: filteredQuizzes?.length || 0, label: 'Quizzes' },
                { icon: ClipboardList, value: filteredAssignments?.length || 0, label: 'Tasks' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className='flex flex-col items-center py-3'>
                  <Icon className='text-primary mb-1 h-4 w-4' />
                  <span className='text-foreground text-lg font-bold'>{value}</span>
                  <span className='text-muted-foreground text-[10px]'>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ───────────────────────────────────────────────────── */}
      <div className='space-y-10'>
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

        {/* About */}
        <section>
          <SectionLabel>About This Course</SectionLabel>
          <div className='prose prose-slate dark:prose-invert max-w-none'>
            <RichTextRenderer htmlString={courseData?.description as string} />
          </div>
        </section>

        <Separator />

        {/* Prerequisites */}
        {courseData?.prerequisites && (
          <>
            <section>
              <SectionLabel>Prerequisites</SectionLabel>
              <div className='prose prose-slate dark:prose-invert max-w-none'>
                <RichTextRenderer htmlString={courseData?.prerequisites as string} />
              </div>
            </section>
            <Separator />
          </>
        )}

        {/* Reviews */}
        <section>
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
                className='gap-2'
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
              {reviews?.data
                ?.slice(0, 6)
                .map((review: any) => (
                  <ReviewCard key={review.uuid} review={review} type='others' />
                ))}
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
        </section>
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

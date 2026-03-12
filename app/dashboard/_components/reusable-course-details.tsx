'use client';

import RichTextRenderer from '@/components/editors/richTextRenders';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
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
    <div className='mb-24 min-h-screen max-w-7xl mx-auto'>
      {/* ── HERO BAND ──────────────────────────────────────────────── */}
      <div className='relative mb-12 overflow-hidden border border-border rounded-2xl px-8 py-12 md:px-14 md:py-16'>
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
                  <span className='rounded-full border border-primary/40 bg-primary/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-primary'>
                    {difficultyName}
                  </span>
                )}
                {courseData?.category_names?.map((cat: string, i: number) => (
                  <span
                    key={i}
                    className='rounded-full border border-border/50 bg-muted/30 px-3 py-0.5 text-xs text-muted-foreground'
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className='mb-4 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl lg:text-5xl'>
                {courseData?.name}
              </h1>

              {/* Rating row */}
              {avgRating && (
                <div className='mb-5 flex items-center gap-2'>
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
                  <span className='text-sm font-semibold text-warning'>{avgRating}</span>
                  <span className='text-sm text-muted-foreground'>({reviewCount} reviews)</span>
                </div>
              )}

              {/* Class limit */}
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Users className='h-4 w-4' />
                <span>{courseData?.class_limit} class limit</span>
              </div>
            </div>

            {/* Instructor */}
            <div className='flex items-center gap-4'>
              <Avatar className='h-12 w-12 ring-2 ring-primary/30'>
                <AvatarFallback className='bg-muted font-semibold text-foreground'>
                  {courseCreator?.full_name
                    ?.split(' ')
                    .map((n: string) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className='font-semibold text-foreground'>{courseCreator?.full_name}</p>
                <p className='text-sm text-muted-foreground'>{courseCreator?.professional_headline}</p>
              </div>
            </div>
          </div>

          {/* RIGHT — enrollment card */}
          <div className='flex flex-col gap-4 rounded-xl border border-border bg-white/5 p-6 backdrop-blur-sm'>
            {/* Intro video / thumbnail */}
            <div className='relative flex h-40 items-center justify-center overflow-hidden rounded-lg bg-muted'>
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
                  <span className='flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 transition-transform group-hover:scale-110'>
                    <Play className='h-6 w-6 fill-foreground text-foreground' />
                  </span>
                  <span className='text-xs text-muted-foreground'>Watch intro</span>
                </button>
              ) : (
                <div className='flex flex-col items-center gap-2 text-muted-foreground/60'>
                  <BookOpen className='h-10 w-10' />
                  <p className='text-xs'>No intro video</p>
                </div>
              )}
            </div>

            {/* Price */}
            <div>
              <p className='text-3xl font-extrabold text-foreground'>
                KES{' '}
                <span className='text-primary'>{courseData?.minimum_training_fee}</span>
              </p>
              <p className='mt-0.5 text-xs text-muted-foreground'>minimum training fee · per hour per head</p>
            </div>

            {/* CTAs */}
            <div className='flex flex-col gap-2'>
              {typeof handleEnroll === 'function' && (
                <Button
                  onClick={() =>
                    router.push(`/dashboard/all-courses/available-classes/${courseData?.uuid}`)
                  }
                  className='w-full bg-primary font-semibold hover:bg-primary/90'
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
            <div className='mt-2 grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-muted/30'>
              {[
                { icon: BookOpen, value: lessonsWithContent?.length || 0, label: 'Lessons' },
                { icon: HelpCircle, value: filteredQuizzes?.length || 0, label: 'Quizzes' },
                { icon: ClipboardList, value: filteredAssignments?.length || 0, label: 'Tasks' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className='flex flex-col items-center py-3'>
                  <Icon className='mb-1 h-4 w-4 text-primary' />
                  <span className='text-lg font-bold text-foreground'>{value}</span>
                  <span className='text-[10px] text-muted-foreground'>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ───────────────────────────────────────────────────── */}
      <div className='space-y-10'>

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
            <div className='rounded-xl border border-dashed border-border p-10 text-center'>
              <GraduationCap className='mx-auto mb-3 h-8 w-8 text-muted-foreground/40' />
              <p className='text-sm text-muted-foreground'>No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2'>
              {reviews?.data?.slice(0, 6).map((review: any) => (
                <ReviewCard key={review.uuid} review={review} type='others' />
              ))}
            </div>
          )}

          {reviewCount > 6 && (
            <button
              type='button'
              className='mt-4 flex items-center gap-1 text-sm font-medium text-warning/60 hover:underline dark:text-warning/40'
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
        videoUrl={selectedLesson?.content_text || ''}
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
  return (
    <h2
      className={`mb-4 text-xl font-bold tracking-tight ${className}`}
    >
      {children}
    </h2>
  );
}
'use client';

import HTMLTextPreview from '@/components/editors/html-text-preview';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import Spinner from '@/components/ui/spinner';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useCourseRubrics } from '@/hooks/use-course-rubric';
import {
  getCourseByUuidOptions,
  getCourseLessonsOptions,
  getCourseReviewsOptions,
  getCourseRubricsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  BookOpen,
  BookOpenCheck,
  CheckCircle,
  Clock,
  FileWarning,
  GraduationCap,
  Layers,
  MessageSquare,
  Scale,
  Users,
  Video,
} from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ReviewCard } from '../../../../@instructor/reviews/review-card';

export default function CoursePreviewComponent({ authorName }: { authorName?: string }) {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id;
  const { replaceBreadcrumbs } = useBreadcrumb();

  useEffect(() => {
    replaceBreadcrumbs([
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard/overview' },
      {
        id: 'course-management',
        title: 'Course Management',
        url: '/dashboard/course-management/drafts',
      },
      {
        id: 'preview',
        title: 'Preview',
        url: `/dashboard/course-management/preview/${courseId}`,
        isLast: true,
      },
    ]);
  }, [replaceBreadcrumbs, courseId]);

  const [open, setOpen] = useState(false);
  const handleConfirm = () => {
    router.push(`/dashboard/course-management/create-new-course?id=${courseId}`);
  };

  // FETCH COURSE DETAILS
  const { data: courseDetail, isLoading } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseId as string } }),
    enabled: !!courseId,
  });
  const course = courseDetail?.data;

  // FETCH LESSONS
  const { data: lessonsData } = useQuery({
    ...getCourseLessonsOptions({
      path: { courseUuid: courseId as string },
      query: { pageable: { page: 0, size: 100 } },
    }),
    enabled: !!courseId,
  });

  // FETCH ASSESSMENTS
  const { data: assessmentRubrics } = useQuery({
    ...getCourseRubricsOptions({
      path: { courseUuid: courseId as string },
      query: { pageable: {} },
    }),
    enabled: !!courseId,
  });

  const { data: reviewsData } = useQuery({
    ...getCourseReviewsOptions({ path: { courseUuid: courseId as string } }),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const reviews = reviewsData?.data || [];

  const { data: courseRubrics, isLoading: rubric, errors } = useCourseRubrics(courseId as string);

  if (isLoading) {
    return (
      <div className='flex flex-col gap-4'>
        <div className='bg-muted h-48 w-full animate-pulse rounded'></div>
        <div className='flex items-center justify-center'>
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-5xl space-y-10 p-6'>
      {/* Banner */}
      {course?.banner_url && (
        <div className='relative h-60 w-full overflow-hidden rounded-lg shadow-md'>
          <Image
            src={course.banner_url}
            alt='Course banner'
            className='h-full w-full object-cover'
            priority
            width={1200}
            height={300}
          />
        </div>
      )}

      {/* Course Header */}
      <section className='flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-4'>
          {course?.thumbnail_url && (
            <div className='relative h-20 w-20 overflow-hidden rounded-md shadow-sm'>
              <Image
                src={course.thumbnail_url}
                alt='Course thumbnail'
                className='h-full w-full object-cover'
                priority
                width={20}
                height={20}
              />
            </div>
          )}

          <div>
            <h1 className='text-3xl font-bold'>{course?.name}</h1>
            <p className='text-muted-foreground text-sm'>
              By {authorName || course?.course_creator_uuid || 'Course creator'}
            </p>
            <div className='mt-2 flex flex-wrap items-center gap-2'>
              {course?.category_names?.map((cat: string) => (
                <Badge key={cat} variant='secondary'>
                  {cat}
                </Badge>
              ))}
              {course?.difficulty_uuid && (
                <Badge variant='outline' className='text-xs'>
                  Difficulty: Intermediate
                </Badge>
              )}
              <Badge variant='outline' className='capitalize'>
                {course?.lifecycle_stage}
              </Badge>
            </div>
          </div>
        </div>

        <div className='flex gap-3'>
          {/* <Button size='lg'>Enroll Now</Button> */}
          <Button variant='outline' size='lg' onClick={() => setOpen(true)}>
            Edit Course
          </Button>
        </div>
      </section>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Course Overview</CardTitle>
          <CardDescription>A quick summary of what this course offers.</CardDescription>
        </CardHeader>
        <CardContent>
          <HTMLTextPreview htmlContent={course?.description ?? 'No description provided.'} />
        </CardContent>
      </Card>

      {/* Key Info Section */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>What You’ll Learn</CardTitle>
          </CardHeader>
          <CardContent>
            <HTMLTextPreview htmlContent={course?.objectives ?? 'No objectives provided.'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prerequisites</CardTitle>
          </CardHeader>
          <CardContent>
            <HTMLTextPreview htmlContent={course?.prerequisites ?? 'No prerequisites listed.'} />
          </CardContent>
        </Card>
      </div>

      {/* Lessons */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Content</CardTitle>
          <CardDescription>All lessons included in this course.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-2'>
          {lessonsData?.data?.content?.length ? (
            lessonsData.data.content
              .sort((a: any, b: any) => a.lesson_number - b.lesson_number)
              .map((lesson: any) => (
                <div key={lesson.uuid} className='border-b pb-4 last:border-0'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className='h-4 w-4 text-green-500' />
                    <h3 className='font-semibold'>{lesson.title}</h3>
                  </div>
                  <RichTextRenderer htmlString={lesson.description ?? 'No description.'} />
                </div>
              ))
          ) : (
            <EmptyState
              icon={BookOpen}
              title='No Lessons Available'
              description='Start by adding your first lesson to this course.'
              actionLabel='Add Lesson'
              onAction={handleConfirm}
            />
          )}
        </CardContent>
      </Card>

      {/* Assessments */}
      <Card>
        <CardHeader>
          <CardTitle>Course Assessment Rubrics</CardTitle>
          <CardDescription>Rubrics for Tests and quizzes included.</CardDescription>
        </CardHeader>
        <CardContent>
          {courseRubrics?.length ? (
            courseRubrics.map((assessment: any) => (
              <div key={assessment.uuid} className='border-b pt-2 pb-4 last:border-0'>
                <div className='flex items-center gap-2'>
                  <BookOpenCheck className='text-primary h-4 w-4' />
                  <h3 className='font-semibold'>{assessment?.rubric?.title ?? 'No title'}</h3>
                </div>
                <RichTextRenderer
                  htmlString={assessment?.rubric?.description ?? 'No description.'}
                />

                <div className='mt-1 flex flex-row space-x-4'>
                  {assessment.rubric?.duration_display && (
                    <p className='text-muted-foreground text-sm'>
                      <Clock className='mr-1 inline-block h-4 w-4' />
                      {assessment.rubric.duration_display}
                    </p>
                  )}

                  {assessment?.rubric?.total_weight != null && (
                    <p className='text-muted-foreground text-sm'>
                      <Scale className='mr-1 inline-block h-4 w-4' />
                      Weight: {assessment?.rubric?.total_weight}%
                    </p>
                  )}

                  {assessment?.rubric?.min_passing_score != null && (
                    <p className='text-muted-foreground text-sm'>
                      <CheckCircle className='mr-1 inline-block h-4 w-4' />
                      Passing score: {assessment?.rubric?.min_passing_score}%
                    </p>
                  )}

                  {assessment.rubric?.is_published ? (
                    <p className='text-muted-foreground text-sm'>Published </p>
                  ) : (
                    <p className='text-muted-foreground text-sm italic'>Not published</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={FileWarning}
              title='No Assessments Yet'
              description='You can create assessments once lessons are added.'
              actionLabel='Add Assessment'
              onAction={handleConfirm}
            />
          )}
        </CardContent>
      </Card>

      {/* Course Details & Meta Info */}
      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
          <CardDescription>Additional course information and limits.</CardDescription>
        </CardHeader>
        <CardContent className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <DetailItem icon={Users} label='Class Limit' value={course?.class_limit || 'Unlimited'} />
          <DetailItem icon={Clock} label='Total Duration' value={course?.total_duration_display} />
          <DetailItem
            icon={GraduationCap}
            label='Enrollment'
            value={course?.accepts_new_enrollments ? 'Open' : 'Closed'}
          />
          <DetailItem icon={Layers} label='Lifecycle Stage' value={course?.lifecycle_stage} />
          <DetailItem
            icon={Video}
            label='Intro Video'
            value={course?.intro_video_url ? 'Available' : 'Not provided'}
          />
          <DetailItem
            icon={BookOpen}
            label='Minimum Training Fee (per hour per head)'
            value={`KES ${course?.minimum_training_fee}`}
          />
          <DetailItem
            icon={CheckCircle}
            label='Revenue Split'
            value={`Instructor: ${course?.instructor_share_percentage}% / Creator: ${course?.creator_share_percentage}%`}
          />
          <DetailItem
            icon={Clock}
            label='Created On'
            value={course?.created_date ? format(new Date(course.created_date), 'PPP') : '—'}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <div className='space-y-1'>
            <CardTitle className='flex items-center gap-2'>
              <MessageSquare className='text-primary h-4 w-4' />
              Course Reviews
              <p className='text-muted-foreground text-xs'>
                (
                {reviews.length
                  ? `${reviews.length} review${reviews.length > 1 ? 's' : ''}`
                  : 'No reviews yet'}
                )
              </p>
            </CardTitle>
            <CardDescription>Student feedback and course ratings.</CardDescription>
          </div>
        </CardHeader>

        <CardContent className='p-0'>
          <div className='space-y-4 p-6'>
            {reviews?.length ? (
              reviews
                ?.slice(0, 5)
                ?.map(review => <ReviewCard key={review.uuid} review={review} type='others' />)
            ) : (
              <div className='border-border/60 text-muted-foreground border-t text-center text-sm'>
                No reviews yet for this course.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Confirmation Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <h3 className='text-lg font-semibold'>Edit Course</h3>
            <p className='text-muted-foreground text-sm'>
              Editing will unpublish this course. It will need re-approval before going live again.
            </p>
          </DialogHeader>
          <DialogFooter className='pt-4'>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Confirm & Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -----------------------------
  🔹 REUSABLE COMPONENTS
--------------------------------*/
function DetailItem({ icon: Icon, label, value }: any) {
  return (
    <div className='flex items-center text-sm'>
      <Icon className='text-muted-foreground mr-2 h-4 w-4' />
      <span className='font-medium'>{label}:</span>
      <span className='text-muted-foreground ml-1'>{value}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: any) {
  return (
    <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center'>
      <Icon className='text-muted-foreground mb-3 h-8 w-8' />
      <h3 className='text-lg font-semibold'>{title}</h3>
      <p className='text-muted-foreground mt-1 text-sm'>{description}</p>
      {actionLabel && (
        <Button variant='outline' className='mt-4' onClick={onAction}>
          + {actionLabel}
        </Button>
      )}
    </div>
  );
}

'use client';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  BookOpen,
  BookOpenCheck,
  CheckCircle,
  ChevronDown,
  Clock,
  Eye,
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
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CourseTrainingRequirements } from '@/app/dashboard/_components/course-training-requirements';
import HTMLTextPreview from '@/components/editors/html-text-preview';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import Spinner from '@/components/ui/spinner';
import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useCourseRubrics } from '@/hooks/use-course-rubric';
import { resolveLessonContentSource } from '@/lib/lesson-content-preview';
import {
  getCourseAssessmentsOptions,
  getCourseByUuidOptions,
  getCourseReviewsOptions,
} from '@/services/client/@tanstack/react-query.gen';
import { useCourseLessonsWithContent } from '../../../../../../hooks/use-courselessonwithcontent';
import { getResourceIcon } from '../../../../../../lib/resources-icon';
import { ReviewCard } from '../../../../@instructor/reviews/review-card';
import { ContentItem } from '../../../../@instructor/trainings/overview/[id]/page';
import { AudioPlayer } from '../../../../@student/schedule/classes/[id]/AudioPlayer';
import { ReadingMode } from '../../../../@student/schedule/classes/[id]/ReadingMode';
import { VideoPlayer } from '../../../../@student/schedule/classes/[id]/VideoPlayer';
import type {
  CourseAssessment,
  CourseRubricAssociation,
  LessonContent,
} from '@/services/client/types.gen';
import type { LucideIcon } from 'lucide-react';

type PreviewContentItem = ContentItem & LessonContent;

type CourseRubricWithDetails = CourseRubricAssociation & {
  rubric: {
    title?: string;
    description?: string;
    duration_display?: string;
    total_weight?: number;
    min_passing_score?: number;
    is_published?: boolean;
  } | null;
};

type DetailItemProps = {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
};

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

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

  const {
    isLoading: isAllLessonsDataLoading,
    lessons: lessonsWithContent,
    contentTypeMap,
  } = useCourseLessonsWithContent({ courseUuid: courseId as string });

  // FETCH COURSE DETAILS
  const { data: courseDetail, isLoading } = useQuery({
    ...getCourseByUuidOptions({ path: { uuid: courseId as string } }),
    enabled: !!courseId,
  });
  const course = courseDetail?.data;

  // FETCH ASSESSMENTS
  const { data: reviewsData } = useQuery({
    ...getCourseReviewsOptions({ path: { courseUuid: courseId as string } }),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const reviews = reviewsData?.data || [];

  const { data: courseRubrics, isLoading: rubric, errors } = useCourseRubrics(courseId as string);

  const { data: assessmentsData } = useQuery({
    ...getCourseAssessmentsOptions({
      path: { courseUuid: courseId as string },
      query: { pageable: {} },
    }),
    enabled: !!courseId,
  });
  const assessments: CourseAssessment[] = assessmentsData?.data?.content ?? [];
  const safeLessonsWithContent = useMemo(() => lessonsWithContent ?? [], [lessonsWithContent]);

  // State for video player and reading mode
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const [selectedLesson, setSelectedLesson] = useState<ContentItem | null>(null);
  const [contentTypeName, setContentTypeName] = useState<string>('');

  // Handle viewing content
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

      <CourseTrainingRequirements
        requirements={course?.training_requirements}
        viewerRole='course_creator'
        description='All training requirements grouped by the party responsible for providing them.'
      />

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
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle>Lesson Content</CardTitle>
            <CardDescription>All lessons included in this course.</CardDescription>
          </div>
          {safeLessonsWithContent.length > 0 && (
            <Badge variant='secondary' className='text-xs'>
              {safeLessonsWithContent.length} lesson{safeLessonsWithContent.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardHeader>

        <CardContent className='p-4'>
          {/* Loading State */}
          {(isAllLessonsDataLoading || isLoading) && (
            <div className='flex items-center justify-center py-12'>
              <Spinner />
            </div>
          )}

          {/* Empty State */}
          {!isAllLessonsDataLoading && !isLoading && safeLessonsWithContent.length === 0 && (
            <EmptyState
              icon={BookOpen}
              title='No Lessons Available'
              description='Start by adding your first lesson to this course.'
              actionLabel='Add Lesson'
              onAction={handleConfirm}
            />
          )}

          {/* Lessons List */}
          {!isAllLessonsDataLoading && !isLoading && safeLessonsWithContent.length > 0 && (
            <div className='space-y-2'>
              {safeLessonsWithContent.map((skill, skillIndex) => {
                const contentCount = skill?.content?.data?.length ?? 0;
                return (
                  <Collapsible key={skill?.lesson?.uuid ?? skillIndex}>
                    {/* Lesson Header — always visible, acts as trigger */}
                    <CollapsibleTrigger className='group w-full'>
                      <div className='border-border bg-muted/40 hover:bg-muted flex items-center gap-3 rounded-md border px-4 py-3 transition-colors'>
                        <span className='bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold'>
                          {skillIndex + 1}
                        </span>

                        <div className='min-w-0 flex-1 text-left'>
                          <p className='text-foreground text-sm leading-snug font-semibold'>
                            {skill?.lesson?.title}
                          </p>
                          {contentCount > 0 && (
                            <p className='text-muted-foreground text-xs'>
                              {contentCount} item{contentCount !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <ChevronDown className='text-muted-foreground h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180' />
                      </div>
                    </CollapsibleTrigger>

                    {/* Expandable content */}
                    <CollapsibleContent>
                      <div className='border-border mx-1 overflow-hidden rounded-b-xl border border-t-0'>
                        {/* Description */}
                        {skill?.lesson?.description && (
                          <div className='border-border text-muted-foreground border-b px-4 py-3 text-sm'>
                            <RichTextRenderer htmlString={skill.lesson.description} />
                          </div>
                        )}

                        {/* Content Items */}
                        {contentCount > 0 ? (
                          <div className='divide-border divide-y'>
                            {(skill.content?.data ?? []).map((c, cIndex) => {
                              const contentTypeName = contentTypeMap[c.content_type_uuid] || 'file';
                              return (
                                <div
                                  key={c.uuid}
                                  className='hover:bg-accent/40 flex items-center justify-between px-4 py-2.5 transition-colors'
                                >
                                  <div className='flex items-center gap-3'>
                                    <div className='bg-muted text-muted-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md'>
                                      {getResourceIcon(contentTypeName)}
                                    </div>
                                    <div>
                                      <p className='text-foreground text-sm leading-snug font-medium'>
                                        {cIndex + 1}. {c.title}
                                      </p>
                                      <p className='text-muted-foreground text-xs capitalize'>
                                        {contentTypeName}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() =>
                                      handleViewContent(c as PreviewContentItem, contentTypeName)
                                    }
                                    variant='ghost'
                                    size='sm'
                                    className='gap-1.5 text-xs'
                                  >
                                    <Eye className='h-3.5 w-3.5' />
                                    View
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className='text-muted-foreground px-4 py-3 text-xs'>
                            No content items for this lesson.
                          </p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
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
          {assessments?.length ? (
            assessments.map(assessment => {
              const hasRubric = Boolean(assessment?.rubric_uuid);

              return (
                <div key={assessment.uuid} className='border-b pt-2 pb-4 last:border-0'>
                  <div className='flex items-center gap-2'>
                    <BookOpenCheck className='text-primary h-4 w-4' />

                    <h3 className='font-semibold'>{assessment?.title ?? 'Untitled Assessment'}</h3>
                  </div>

                  <RichTextRenderer htmlString={assessment?.description ?? 'No description.'} />

                  <div className='mt-2 flex flex-wrap gap-6'>
                    {/* {assessment?.assessment_type && (
                      <p className="text-muted-foreground text-sm">
                        Type: {assessment.assessment_type}
                      </p>
                    )} */}
                    {/*
                    {assessment?.assessment_category && (
                      <p className="text-muted-foreground text-sm">
                        Category: {assessment.assessment_category}
                      </p>
                    )} */}

                    {assessment?.weight_percentage != null && (
                      <p className='text-muted-foreground text-sm'>
                        <Scale className='mr-1 inline-block h-4 w-4' />
                        Weight: {assessment.weight_display ?? `${assessment.weight_percentage}%`}
                      </p>
                    )}

                    {assessment?.is_required && (
                      <p className='text-muted-foreground text-sm'>
                        <CheckCircle className='mr-1 inline-block h-4 w-4' />
                        Required
                      </p>
                    )}

                    {/* {assessment?.is_major_assessment && (
                      <p className="text-muted-foreground text-sm">
                        Major Assessment
                      </p>
                    )} */}
                  </div>
                </div>
              );
            })
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

        <CardContent className='hidden'>
          {courseRubrics?.length ? (
            (courseRubrics as CourseRubricWithDetails[]).map(assessment => (
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

      {/* Video Player Modal */}
      <VideoPlayer
        isOpen={isPlaying && contentTypeName === 'video'}
        onClose={() => setIsPlaying(false)}
        videoUrl={resolveLessonContentSource(selectedLesson, 'video')}
        title={selectedLesson?.title}
      />

      {/* Reading Mode Modal */}
      <ReadingMode
        isOpen={isReading && (contentTypeName === 'pdf' || contentTypeName === 'text')}
        onClose={() => setIsReading(false)}
        title={selectedLesson?.title || ''}
        description={selectedLesson?.description}
        content={resolveLessonContentSource(selectedLesson, contentTypeName)}
        contentType={contentTypeName as 'text' | 'pdf'}
      />

      <AudioPlayer
        isOpen={isAudioPlaying && contentTypeName === 'audio'}
        onClose={() => setIsAudioPlaying(false)}
        audioUrl={resolveLessonContentSource(selectedLesson, 'audio')}
        title={selectedLesson?.title}
        description={selectedLesson?.description}
      />
    </div>
  );
}

/* -----------------------------
  🔹 REUSABLE COMPONENTS
--------------------------------*/
function DetailItem({ icon: Icon, label, value }: DetailItemProps) {
  return (
    <div className='flex items-center text-sm'>
      <Icon className='text-muted-foreground mr-2 h-4 w-4' />
      <span className='font-medium'>{label}:</span>
      <span className='text-muted-foreground ml-1'>{value}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
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

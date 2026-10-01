'use client';

/**
 * Class-specific pieces of the class hub pages (student learning hub, instructor training
 * hub): the schedule, the instructor, the share sheet and the review and delete actions.
 * The course content itself comes from the course-record blocks.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Calendar,
  CalendarClock,
  Clock,
  Globe,
  MapPin,
  Star,
  Trash2,
  User2,
  Video,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ComponentType, useState } from 'react';
import { toast } from 'sonner';
import { FeedbackSheet } from '@/src/features/dashboard/courses/components/feedback-sheet';
import { PreviewRow } from '@/app/dashboard/instructor/classes/new/_components/class-creation-preview-rail';
import { socialShareActions } from '@/app/dashboard/instructor/classes/overview/[id]/page';
import { ImageWithFallback } from '@/components/data/image-with-fallback';
import HTMLTextPreview from '@/components/editors/html-text-preview';
import { LinkShareCard } from '@/components/shared/link-share-card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUserProfile } from '@/context/profile-context';
import type { ClassDetailsScheduleItem, CombinedClassDetailsData } from '@/hooks/use-class-details';
import { useCourseEnrollmentsMap } from '@/hooks/use-enrollment-map';
import { buildSocialShareUrl, openShareWindow } from '@/lib/share';
import type { UserDomain } from '@/lib/types';
import type { Instructor } from '@/services/client';
import {
  deactivateClassDefinitionMutation,
  getClassDefinitionsForInstructorOptions,
  getClassDefinitionsForInstructorQueryKey,
  getInstructorRatingSummaryOptions,
  submitClassReviewMutation,
  submitInstructorReviewMutation,
  submitProgramReviewMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { roleScopedDashboardPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { invalidateReviewWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { type ClassHubViewer, scheduleTotalDuration, sessionDuration } from './class-hub';

/** The instructor record the class details query carries. */
export function classInstructor(classData: CombinedClassDetailsData | undefined) {
  return (classData?.instructor as { data?: Instructor } | undefined)?.data;
}

/* Header media ----------------------------------------------------------------------- */

/** The header card's media: the class's promo video, else its thumbnail, else an icon tile. */
export function ClassHeaderMedia({
  classData,
  fallbackIcon: FallbackIcon,
  label,
}: {
  classData: CombinedClassDetailsData | undefined;
  fallbackIcon: ComponentType<{ className?: string }>;
  label: string;
}) {
  const videoUrl = toAuthenticatedMediaUrl(classData?.class?.promotional_video_url ?? '');
  const imageUrl = toAuthenticatedMediaUrl(classData?.class?.thumbnail_url ?? '');
  const tile = (
    <div className='bg-primary/10 text-primary flex h-full w-full flex-col items-center justify-center gap-2'>
      <FallbackIcon className='size-10' />
      <span className='text-xs font-semibold tracking-[0.08em] uppercase'>{label}</span>
    </div>
  );

  return (
    <div className='bg-muted relative aspect-video w-full overflow-hidden rounded-xl'>
      {videoUrl ? (
        <video
          src={videoUrl}
          controls
          poster={imageUrl || undefined}
          className='h-full w-full object-cover'
        />
      ) : (
        <ImageWithFallback
          src={imageUrl || undefined}
          alt=''
          fill
          unoptimized
          className='object-cover'
          fallback={tile}
        />
      )}
    </div>
  );
}

/* Share ------------------------------------------------------------------------------ */

export function ShareLinkSheet({
  open,
  onOpenChange,
  title,
  description,
  linkTitle,
  url,
  shareTitle,
  shareDescription,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  linkTitle: string;
  url: string;
  shareTitle: string;
  shareDescription: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full overflow-y-auto sm:max-w-lg'>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className='px-4 pb-6'>
          <LinkShareCard
            title={linkTitle}
            description='Copy or share this link.'
            url={url}
            footer={
              <div className='space-y-3'>
                <h4 className='text-sm font-medium'>Share via</h4>
                <div className='flex flex-wrap gap-2'>
                  {socialShareActions.map(({ icon: Icon, label, platform }) => (
                    <Button
                      key={label}
                      size='sm'
                      variant='outline'
                      className='gap-2'
                      disabled={!url}
                      onClick={() =>
                        openShareWindow(
                          buildSocialShareUrl(platform, {
                            title: shareTitle,
                            url,
                            description: shareDescription,
                          })
                        )
                      }
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
      </SheetContent>
    </Sheet>
  );
}

/* Schedule --------------------------------------------------------------------------- */

function registrationPeriod(classData: CombinedClassDetailsData | undefined) {
  const start = classData?.class?.registration_period_start_date;
  const end = classData?.class?.registration_period_end_date;
  if (start && end) {
    return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
  }
  if (start) return `${new Date(start).toLocaleDateString()} (Continuous)`;
  return 'Continuous';
}

/** Where, how and when the class runs; the instructor can jump to the schedule editor. */
export function ClassScheduleSummary({
  classData,
  viewer,
  activeDomain,
}: {
  classData: CombinedClassDetailsData | undefined;
  viewer: ClassHubViewer;
  activeDomain: UserDomain | null;
}) {
  const router = useRouter();
  const klass = classData?.class;

  return (
    <section className='bg-card rounded-xl border'>
      <div className='border-b px-4 py-4 sm:px-5'>
        <h3 className='text-base font-bold'>Schedule summary</h3>
      </div>

      <PreviewRow icon={Globe} label='Lecture Type' value={klass?.location_type || 'N/A'} />
      <PreviewRow icon={MapPin} label='Location' value={klass?.location_name || 'N/A'} />
      <PreviewRow icon={Building2} label='Session Format' value={klass?.session_format || 'N/A'} />
      <PreviewRow
        icon={Calendar}
        label='Registration Period'
        value={registrationPeriod(classData)}
      />
      <PreviewRow
        icon={Calendar}
        label='Start Date'
        value={
          klass?.default_start_time
            ? new Date(klass.default_start_time).toLocaleDateString()
            : 'TBA'
        }
      />
      <PreviewRow
        icon={Clock}
        label='Total Hours'
        value={scheduleTotalDuration(classData?.schedule) || 'N/A'}
      />
      {klass?.meeting_link ? (
        <PreviewRow icon={Video} label='Meeting Link' value={klass.meeting_link} />
      ) : null}

      {viewer === 'instructor' ? (
        <div className='border-t p-4 sm:p-5'>
          <Button
            variant='outline'
            size='sm'
            className='h-9 w-full rounded-md'
            onClick={() =>
              router.push(
                roleScopedDashboardPath(activeDomain, `/dashboard/classes/new?id=${klass?.uuid}`)
              )
            }
          >
            Edit Schedule
          </Button>
        </div>
      ) : null}
    </section>
  );
}

/** Every session of the class, in date order, with the time it actually ran. */
export function ClassSessionsTable({
  classTitle,
  schedule,
}: {
  classTitle: string | undefined;
  schedule: readonly ClassDetailsScheduleItem[] | undefined;
}) {
  const sessions = [...(schedule ?? [])].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return (
    <section className='bg-card min-w-0 rounded-xl border'>
      <div className='flex items-center gap-2 border-b px-4 py-4 sm:px-5'>
        <CalendarClock className='text-primary size-4' aria-hidden />
        <h3 className='text-base font-bold'>Sessions</h3>
      </div>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time Spent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length > 0 ? (
              sessions.map((instance, index) => (
                <TableRow key={instance.uuid ?? index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{classTitle}</TableCell>
                  <TableCell>
                    <div className='flex flex-col'>
                      <span className='font-medium'>
                        {new Date(instance.start_time).toLocaleDateString()}
                      </span>
                      <span className='text-muted-foreground text-xs'>
                        {new Date(instance.start_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' - '}
                        {new Date(instance.end_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {'   '}({instance.duration_formatted})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{instance.status}</TableCell>
                  <TableCell>
                    {String(instance.status) === 'scheduled' ||
                    !instance.started_at ||
                    !instance.concluded_at
                      ? 'Pending'
                      : sessionDuration(String(instance.started_at), String(instance.concluded_at))}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className='text-muted-foreground py-10 text-center'>
                  No scheduled sessions for this class yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

/** The Schedule tab: the session list beside the class's summary card. */
export function ClassSchedulePanel({
  classData,
  viewer,
  activeDomain,
}: {
  classData: CombinedClassDetailsData | undefined;
  viewer: ClassHubViewer;
  activeDomain: UserDomain | null;
}) {
  return (
    <div className='grid items-start gap-[18px] xl:grid-cols-[minmax(0,1fr)_380px]'>
      <ClassSessionsTable classTitle={classData?.class?.title} schedule={classData?.schedule} />
      <ClassScheduleSummary classData={classData} viewer={viewer} activeDomain={activeDomain} />
    </div>
  );
}

/* Instructor ------------------------------------------------------------------------- */

/** "Meet your instructor", with the student's instructor review. */
export function ClassInstructorCard({
  classData,
}: {
  classData: CombinedClassDetailsData | undefined;
}) {
  const qc = useQueryClient();
  const userProfile = useUserProfile();
  const [showFullBio, setShowFullBio] = useState(false);

  const instructor = classInstructor(classData);

  const { data: instructorClassResp } = useQuery({
    ...getClassDefinitionsForInstructorOptions({
      path: { instructorUuid: instructor?.uuid as string },
    }),
    enabled: !!instructor?.uuid,
  });
  const instructorClassCount =
    instructorClassResp?.data?.filter(item => item.class_definition?.is_active).length ?? 0;

  const { data: instructorReviewResp } = useQuery({
    ...getInstructorRatingSummaryOptions({
      path: { instructorUuid: instructor?.uuid as string },
    }),
    enabled: !!instructor?.uuid,
  });
  const instructorRating = instructorReviewResp?.data?.average_rating;

  const studentUuid = userProfile?.student?.uuid as string | undefined;
  const courseUuid = classData?.course?.uuid as string;
  const { courseEnrollmentMap } = useCourseEnrollmentsMap([courseUuid]);
  const enrollmentUuid = courseEnrollmentMap?.[courseUuid]?.enrollments?.find(
    enrollment => enrollment.student_uuid === studentUuid
  )?.uuid;

  const [showFeedbackSheet, setShowFeedbackSheet] = useState(false);
  const [rating, setRating] = useState(0);
  const [clarityRating, setClarityRating] = useState(0);
  const [engagementRating, setEngagementRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [headline, setHeadline] = useState('');

  const reviewInstructor = useMutation(submitInstructorReviewMutation());
  const handleSubmitFeedback = () => {
    if (!classData?.class?.uuid || !instructor?.uuid || !studentUuid) {
      toast.error('Class or student enrollment not found');
      return;
    }

    const instructorUuid = instructor.uuid;
    reviewInstructor.mutate(
      {
        body: {
          enrollment_uuid: enrollmentUuid as string,
          instructor_uuid: instructorUuid,
          student_uuid: studentUuid,
          comments: feedbackComment,
          headline,
          is_anonymous: false,
          rating,
          clarity_rating: clarityRating,
          engagement_rating: engagementRating,
          punctuality_rating: punctualityRating,
        },
        path: { instructorUuid },
      },
      {
        async onSuccess(data) {
          toast.success(data?.message);
          setShowFeedbackSheet(false);
          setFeedbackComment('');
          setHeadline('');
          setRating(0);
          setClarityRating(0);
          setEngagementRating(0);
          setPunctualityRating(0);
          await invalidateReviewWorkflowQueries(qc);
        },
        onError: error => {
          toast.error(error?.message);
        },
      }
    );
  };

  const stats = [
    { label: 'Courses', value: instructorClassCount },
    { label: 'Students', value: 0 },
    { label: 'Rating', value: instructorRating },
  ];

  return (
    <section className='bg-card rounded-xl border px-5 py-[18px] shadow-sm'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <h3 className='flex items-center gap-2 text-[15px] font-bold'>
          <User2 className='text-primary size-4' aria-hidden />
          Meet your instructor
        </h3>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setShowFeedbackSheet(true)}
          className='gap-2'
        >
          <Star className='h-4 w-4' />
          Write a Review
        </Button>
      </div>

      <div className='flex flex-col items-start gap-4 sm:flex-row sm:gap-6'>
        <div className='bg-muted flex size-16 shrink-0 items-center justify-center rounded-full'>
          <User2 className='text-muted-foreground h-6 w-6' />
        </div>

        <div className='min-w-0 flex-1'>
          <h4 className='text-foreground text-sm font-bold sm:text-base'>
            {instructor?.full_name}
          </h4>
          <p className='text-muted-foreground mb-2 text-xs sm:text-sm'>
            {instructor?.professional_headline}
          </p>

          {instructor?.bio ? (
            <div className='mb-3 max-w-prose'>
              <div
                className={`text-muted-foreground text-xs leading-relaxed sm:text-sm ${
                  showFullBio ? '' : 'line-clamp-2'
                }`}
              >
                <HTMLTextPreview htmlContent={instructor.bio} />
              </div>
              <Button
                variant='link'
                className='mt-1 h-auto p-0 text-xs sm:text-sm'
                onClick={() => setShowFullBio(prev => !prev)}
              >
                {showFullBio ? 'Show less' : 'Show more'}
              </Button>
            </div>
          ) : null}

          <div className='flex flex-wrap gap-6 sm:gap-12'>
            {stats.map(stat => (
              <div key={stat.label}>
                <p className='text-foreground inline-flex items-center gap-1 text-sm font-black sm:text-base'>
                  {stat.value ?? 0}
                  {stat.label === 'Rating' ? (
                    <Star className='fill-warning text-warning size-4' aria-hidden />
                  ) : null}
                </p>
                <p className='text-muted-foreground text-xs'>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FeedbackSheet
        open={showFeedbackSheet}
        onOpenChange={setShowFeedbackSheet}
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
    </section>
  );
}

/* Reviews ---------------------------------------------------------------------------- */

function useReviewForm() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [headline, setHeadline] = useState('');
  return { open, setOpen, rating, setRating, comment, setComment, headline, setHeadline };
}

/** A learner's review of the class or programme: a button and its feedback form. */
export function WriteReviewButton({
  subject,
  subjectUuid,
}: {
  subject: 'class' | 'program';
  subjectUuid: string | undefined;
}) {
  const qc = useQueryClient();
  const profile = useUserProfile();
  const studentUuid = profile?.student?.uuid as string;
  const form = useReviewForm();

  const reviewClassMut = useMutation(submitClassReviewMutation());
  const reviewProgramMut = useMutation(submitProgramReviewMutation());

  const body = {
    rating: form.rating,
    student_uuid: studentUuid,
    comments: form.comment,
    headline: form.headline,
    is_anonymous: false,
  };
  const onSuccess = async (message?: string) => {
    toast.success(message ?? 'Review added successfully');
    form.setOpen(false);
    await invalidateReviewWorkflowQueries(qc);
  };
  const onError = (error: unknown) => {
    toast.error((error as { message?: string } | null)?.message ?? 'Unable to submit your review');
    form.setOpen(false);
  };

  const handleSubmit = () => {
    if (!subjectUuid) return;
    if (subject === 'class') {
      reviewClassMut.mutate(
        { body, path: { uuid: subjectUuid } },
        {
          onSuccess: data => onSuccess((data as { message?: string } | undefined)?.message),
          onError,
        }
      );
    } else {
      reviewProgramMut.mutate(
        { body, path: { programUuid: subjectUuid } },
        { onSuccess: () => onSuccess(), onError }
      );
    }
  };

  return (
    <>
      <Button variant='outline' size='sm' className='gap-2' onClick={() => form.setOpen(true)}>
        <Star className='h-4 w-4' />
        Write a Review
      </Button>
      <FeedbackSheet
        type='others'
        open={form.open}
        onOpenChange={form.setOpen}
        headline={form.headline}
        onHeadlineChange={form.setHeadline}
        feedback={form.comment}
        onFeedbackChange={form.setComment}
        rating={form.rating}
        onRatingChange={form.setRating}
        isSubmitting={reviewClassMut.isPending || reviewProgramMut.isPending}
        onSubmit={handleSubmit}
      />
    </>
  );
}

/* Delete ----------------------------------------------------------------------------- */

/** The instructor's "Delete class", behind a confirmation. */
export function DeleteClassButton({
  classData,
  activeDomain,
}: {
  classData: CombinedClassDetailsData | undefined;
  activeDomain: UserDomain | null;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const profile = useUserProfile();
  const [open, setOpen] = useState(false);
  const deleteClassMut = useMutation(deactivateClassDefinitionMutation());

  const handleDelete = () => {
    const uuid = classData?.class?.uuid;
    if (!uuid) return;
    deleteClassMut.mutate(
      { path: { uuid } },
      {
        onSuccess: () => {
          toast.success('Class deleted successfully');
          setOpen(false);
          qc.invalidateQueries({
            queryKey: getClassDefinitionsForInstructorQueryKey({
              path: { instructorUuid: profile?.instructor?.uuid as string },
            }),
          });
          router.push(roleScopedDashboardPath(activeDomain, '/dashboard/training-hub'));
        },
        onError: () => {
          toast.error('Failed to delete class');
        },
      }
    );
  };

  return (
    <>
      <Button
        variant='outline'
        size='sm'
        className='text-destructive hover:bg-destructive/10 hover:text-destructive gap-2'
        onClick={() => setOpen(true)}
      >
        <Trash2 className='h-4 w-4' />
        Delete Class
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-medium'>&ldquo;{classData?.class?.title}&rdquo;</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteClassMut.isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteClassMut.isPending ? 'Deleting...' : 'Delete Class'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* Assessment ------------------------------------------------------------------------- */

/** The graded coursework attached to the lessons, counted. */
export function AssignmentQuizCounts({
  assignments,
  quizzes,
}: {
  assignments: number;
  quizzes: number;
}) {
  return (
    <section className='bg-card grid gap-4 rounded-xl border px-5 py-[18px] shadow-sm sm:grid-cols-2'>
      <div>
        <h3 className='text-[15px] font-bold'>Assignments ({assignments})</h3>
        <p className='text-muted-foreground mt-1 text-sm'>
          {assignments} {assignments === 1 ? 'assignment' : 'assignments'} available · graded
          coursework that contributes to your final grade.
        </p>
      </div>
      <div>
        <h3 className='text-[15px] font-bold'>Quizzes ({quizzes})</h3>
        <p className='text-muted-foreground mt-1 text-sm'>
          {quizzes} {quizzes === 1 ? 'quiz' : 'quizzes'} available · assess your understanding of
          the course material.
        </p>
      </div>
    </section>
  );
}

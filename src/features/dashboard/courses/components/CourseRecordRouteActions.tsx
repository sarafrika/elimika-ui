'use client';

/**
 * The actions the four `all-courses/[id]` routes own.
 *
 * `CourseRecordPage` is read-only by design: it resolves what the viewer may
 * see from the API's `access` string and renders it. Anything that *changes*
 * something — or that navigates out of the record into another surface — stays
 * with the route, which is what this strip is.
 *
 * Three actions come across from the page these routes used to render:
 *
 * - **View available classes** — the enrolment path. The legacy screen pushed
 *   `/dashboard/<role>/courses/available-classes/<uuid>`; the href is passed in
 *   so each route keeps its own, already-existing destination.
 * - **Find an instructor** — the instructor directory, filtered to this course.
 * - **Write a review** — the one genuine mutation the legacy page owned.
 *
 * The review action is offered only when a student profile is actually on file.
 * The legacy screen rendered the button unconditionally and posted whatever
 * `student_uuid` it had, which on the admin and parent dashboards was
 * `undefined`; a review nobody can be attributed to is not worth collecting.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarRange, Search, Star } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useStudent } from '@/context/student-context';
import { cn } from '@/lib/utils';
import { submitCourseReviewMutation } from '@/services/client/@tanstack/react-query.gen';
import { invalidateReviewWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';

import { FeedbackDialog } from './review-instructor-modal';

export interface CourseRecordRouteActionsProps {
  courseUuid: string;
  /** Where "View available classes" goes — the route's own classes list. */
  classesHref: string;
  /** Where "Find an instructor" goes — the route's own instructor directory. */
  instructorsHref: string;
  className?: string;
}

export function CourseRecordRouteActions({
  courseUuid,
  classesHref,
  instructorsHref,
  className,
}: CourseRecordRouteActionsProps) {
  const queryClient = useQueryClient();
  const student = useStudent();
  const studentUuid = student?.uuid;

  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [headline, setHeadline] = useState('');
  const [comments, setComments] = useState('');

  const submitReview = useMutation(submitCourseReviewMutation());

  const handleSubmitReview = () => {
    if (!studentUuid) return;

    submitReview.mutate(
      {
        body: {
          course_uuid: courseUuid,
          student_uuid: studentUuid,
          rating,
          headline,
          comments,
          is_anonymous: false,
        },
        path: { courseUuid },
      },
      {
        async onSuccess(response) {
          toast.success(response?.message ?? 'Thanks — your review has been submitted.');
          setReviewOpen(false);
          setRating(0);
          setHeadline('');
          setComments('');
          await invalidateReviewWorkflowQueries(queryClient);
        },
        onError(error) {
          toast.error(error?.message ?? 'Your review could not be submitted. Please try again.');
        },
      }
    );
  };

  return (
    <div className={cn('my-4 flex flex-wrap items-center gap-2', className)}>
      <Button asChild size='sm' className='h-8 rounded-[10px]'>
        <Link href={classesHref}>
          <CalendarRange className='size-4' />
          View available classes
        </Link>
      </Button>

      <Button asChild variant='outline' size='sm' className='h-8 rounded-[10px]'>
        <Link href={instructorsHref}>
          <Search className='size-4' />
          Find an instructor
        </Link>
      </Button>

      {studentUuid ? (
        <Button
          variant='outline'
          size='sm'
          className='h-8 rounded-[10px]'
          onClick={() => setReviewOpen(true)}
        >
          <Star className='size-4' />
          Write a review
        </Button>
      ) : null}

      <FeedbackDialog
        type='others'
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        headline={headline}
        onHeadlineChange={setHeadline}
        feedback={comments}
        onFeedbackChange={setComments}
        rating={rating}
        onRatingChange={setRating}
        isSubmitting={submitReview.isPending}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
}

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarRange, Search, Star } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useStudent } from '@/context/student-context';
import { cn } from '@/lib/utils';
import { submitProgramReviewMutation } from '@/services/client/@tanstack/react-query.gen';
import { invalidateReviewWorkflowQueries } from '@/src/features/dashboard/workflow-query-invalidation';

import { FeedbackSheet } from '@/src/features/dashboard/courses/components/feedback-sheet';

interface ProgramRecordRouteActionsProps {
    programUuid: string;
    /** Where "View available classes" goes — the route's own classes list. */
    classesHref: string;
    /** Where "Find an instructor" goes — the route's own instructor directory. */
    instructorsHref: string;
    className?: string;
}

export function ProgramRecordRouteActions({
    programUuid,
    classesHref,
    instructorsHref,
    className,
}: ProgramRecordRouteActionsProps) {
    const queryClient = useQueryClient();
    const student = useStudent();
    const studentUuid = student?.uuid;

    const [reviewOpen, setReviewOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [headline, setHeadline] = useState('');
    const [comments, setComments] = useState('');

    const submitReview = useMutation(submitProgramReviewMutation());

    const handleSubmitReview = () => {
        if (!studentUuid) return;

        submitReview.mutate(
            {
                body: {
                    student_uuid: studentUuid,
                    rating,
                    headline,
                    comments,
                    is_anonymous: false,
                },
                path: { programUuid },
            },
            {
                async onSuccess(response) {
                    toast.success((response as { message?: string } | undefined)?.message ?? 'Thanks — your review has been submitted.');
                    setReviewOpen(false);
                    setRating(0);
                    setHeadline('');
                    setComments('');
                    await invalidateReviewWorkflowQueries(queryClient);
                },
                onError(error) {
                    toast.error((error as { message?: string } | null)?.message ?? 'Your review could not be submitted. Please try again.');
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

            <Button
                variant='outline'
                size='sm'
                className='h-8 rounded-[10px]'
                onClick={() => setReviewOpen(true)}
            >
                <Star className='size-4' />
                Write a review
            </Button>

            <FeedbackSheet
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

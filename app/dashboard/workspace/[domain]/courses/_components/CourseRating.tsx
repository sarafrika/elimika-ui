import type { CourseReview } from "@/services/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../../../../components/ui/button";
import { useUserProfile } from "../../../../../../context/profile-context";
import { getCourseReviewsQueryKey, submitCourseReviewMutation } from "../../../../../../services/client/@tanstack/react-query.gen";
import { FeedbackDialog } from "../../../../_components/review-instructor-modal";
import StarRating from "./StarRating";

const breakdown = [
  { stars: 5, pct: 0 },
  { stars: 4, pct: 0 },
  { stars: 3, pct: 0 },
  { stars: 2, pct: 0 },
  { stars: 1, pct: 0 },
];

type Props = {
  reviewCount: number;
  averageRating: string | null;
  reviews: CourseReview[];
  courseId: string;
};

export default function CourseRating({
  reviewCount,
  averageRating,
  reviews,
  courseId
}: Props) {
  const profile = useUserProfile();
  const student_uuid = profile?.student?.uuid;
  const rating = averageRating ? Number(averageRating) : 0;

  const dynamicBreakdown = breakdown.map((row) => {
    const matched = reviews.filter(
      (review) => Math.round(review.rating || 0) === row.stars
    ).length;

    const pct =
      reviewCount > 0 ? Math.round((matched / reviewCount) * 100) : row.pct;

    return { ...row, pct };
  });

  const qc = useQueryClient();
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [headline, setHeadline] = useState('');

  const reviewCourseMut = useMutation(submitCourseReviewMutation());

  const handleSubmitFeedback = () => {
    reviewCourseMut.mutate(
      {
        body: {
          course_uuid: courseId as string,
          rating: newRating,
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

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground sm:text-base">
        Course Rating
      </h3>

      <div className="mb-4 flex flex-col gap-4 sm:gap-6">
        {/* Rating summary */}
        <div className="flex flex-row items-center text-center gap-3">
          <p className="text-3xl font-black text-foreground sm:text-4xl">
            {rating ? rating.toFixed(1) : "0.0"}
          </p>

          <StarRating rating={rating} size="sm" showCount={false} />

          <p className="mt-1 text-xs text-muted-foreground">
            {reviewCount.toLocaleString()} review
            {reviewCount === 1 ? "" : "s"}
          </p>
        </div>

        {/* Breakdown */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {dynamicBreakdown.map((row) => (
            <div key={row.stars} className="flex items-center gap-2 text-xs">
              <div className="flex shrink-0 items-center gap-0.5 text-muted-foreground">
                <span>★</span>
                <span>{row.stars}</span>
              </div>

              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${row.pct}%` }}
                />
              </div>

              <span className="w-6 shrink-0 text-right text-muted-foreground">
                {row.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={() => setShowFeedbackDialog(true)}

        className="w-full h-10 rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground sm:text-sm">
        Write a Review
      </Button>


      <FeedbackDialog
        type='others'
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
        headline={headline}
        onHeadlineChange={setHeadline}
        feedback={feedbackComment}
        onFeedbackChange={setFeedbackComment}
        rating={newRating}
        onRatingChange={setNewRating}
        isSubmitting={reviewCourseMut.isPending}
        onSubmit={handleSubmitFeedback}
      />
    </div>
  );
}
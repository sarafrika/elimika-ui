"use client";

import { useMemo, useState } from "react";
import { useStudentsByIds } from "../../../../../../hooks/use-batched-lookups";
import { CourseReview } from "../../../../../../services/client";

type Props = {
    reviews: CourseReview[];
};

export default function CourseReviews({ reviews }: Props) {
    const [filter, setFilter] = useState<number | "all">("all");

    const reviewStudentIds = useMemo(
        () =>
            reviews
                .filter((review) => !review.is_anonymous)
                .map((review) => review.student_uuid)
                .filter(Boolean),
        [reviews]
    );
    const { studentMap } = useStudentsByIds(reviewStudentIds);

    const filterOptions: Array<number | "all"> = ["all", 5, 4, 3, 2, 1];

    const filteredReviews =
        filter === "all" ? reviews : reviews.filter((r) => r.rating === filter);

    const averageRating =
        reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1);

    const renderStars = (rating: number) =>
        Array.from({ length: 5 }).map((_, i) => (
            <span
                key={i}
                className={i < rating ? "text-warning" : "text-muted-foreground"}
            >
                ★
            </span>
        ));

    const getStudentName = (review: CourseReview) => {
        if (review.is_anonymous) return "Anonymous Student";

        const student = studentMap?.[review.student_uuid];

        if (!student) return "";

        return student.full_name;
    };

    if (reviews.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <h2 className="text-lg font-semibold text-foreground">
                    Student Reviews
                </h2>
                <p className="mt-2 text-sm">
                    There are no reviews for this course yet.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        Student Reviews
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {reviews.length} reviews in total
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                        {averageRating.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">Average rating</p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                {filterOptions.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={[
                            "rounded-full border px-3 py-1 text-xs transition-colors",
                            filter === f
                                ? "bg-primary text-primary-foreground border-primary"
                                : "hover:bg-muted border-border text-muted-foreground",
                        ].join(" ")}
                    >
                        {f === "all" ? (
                            "All"
                        ) : (
                            <>
                                {f} <span className="text-warning">★</span>
                            </>
                        )}
                    </button>
                ))}
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {filteredReviews.length > 0 ? (
                    filteredReviews.map((review) => {
                        const date = review.created_date
                            ? new Date(review.created_date).toLocaleDateString()
                            : "";

                        return (
                            <div
                                key={review.uuid}
                                className="rounded-xl border border-border bg-background p-5"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground">
                                            {review.headline}
                                        </h3>

                                        <p className="text-xs text-muted-foreground">
                                            {getStudentName(review)} • {date}
                                        </p>
                                    </div>

                                    {/* Rating */}
                                    <div className="flex items-center gap-1">
                                        {renderStars(review.rating)}
                                    </div>
                                </div>

                                {/* Comment */}
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                    {review.comments}
                                </p>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-10 border rounded-md border-dashed text-muted-foreground">
                        <h2 className="text-lg font-semibold text-foreground">
                            Student Reviews
                        </h2>
                        <p className="mt-2 text-sm">No reviews for this rating.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
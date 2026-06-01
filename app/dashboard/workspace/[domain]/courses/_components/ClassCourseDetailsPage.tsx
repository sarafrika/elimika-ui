"use client";

import { useBreadcrumb } from '@/context/breadcrumb-provider';
import { useInstructor } from '@/context/instructor-context';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import type {
    Assignment,
    Course,
    CourseReview,
    DifficultyLevel,
    Lesson,
    Quiz,
} from '@/services/client';
import { ApplicantTypeEnum } from '@/services/client';
import {
    getAllAssignmentsOptions,
    getAllCoursesOptions,
    getAllDifficultyLevelsOptions,
    getAllQuizzesOptions,
    getCourseByUuidOptions,
    getCourseCreatorByUuidOptions,
    getCourseReviewsOptions,
    searchTrainingApplicationsOptions,
    searchTrainingApplicationsQueryKey,
    submitTrainingApplicationMutation,
} from '@/services/client/@tanstack/react-query.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { EnrollmentLoadingState } from '@/src/features/dashboard/courses/components/EnrollmentLoadingState';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import NotesModal from '../../../../../../components/custom-modals/notes-modal';

import CourseDetailsHero from './CourseDetailsHero';
import CourseOverview from './CourseOverview';
import CourseRating from './CourseRating';
import { getEnrollHref } from './courses-data';
import CourseTabNav from './CourseTabNav';
import EnrollSidebar from './EnrollSidebar';
import ShareCourse from './ShareCourse';
import StudentsAlsoBought from './StudentsAlsoBought';

function getDurationLabel(course?: Course) {
    if (!course) return 'N/A';
    if (!course.duration_hours && !course.duration_minutes) {
        return 'N/A';
    }

    const hours = course.duration_hours ?? 0;
    const minutes = course.duration_minutes ?? 0;

    return `${hours} hours / ${minutes} minutes`;
}

export default function ClassCourseDetailsPage({
    courseId,
}: {
    courseId: string;
}) {
    const router = useRouter();
    const params = useParams();
    const { activeDomain } = useUserDomain();
    const instructor = useInstructor();
    const qc = useQueryClient();
    const { replaceBreadcrumbs } = useBreadcrumb();

    const resolvedCourseId = courseId || (params?.id as string);

    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const applyToTrainCourseMut = useMutation(submitTrainingApplicationMutation());
    const isInstructorDomain = activeDomain === 'instructor';


    const {
        data: courseResponse,
        isLoading: courseLoading,
        isFetching: courseFetching,
    } = useQuery({
        ...(resolvedCourseId
            ? getCourseByUuidOptions({
                path: { uuid: resolvedCourseId },
            })
            : {}),
        enabled: !!resolvedCourseId,
    });

    const course = courseResponse?.data as Course | undefined;

    const { data: creatorResponse, isLoading: creatorLoading } = useQuery({
        ...(course?.course_creator_uuid
            ? getCourseCreatorByUuidOptions({
                path: { uuid: course.course_creator_uuid },
            })
            : {}),
        enabled: !!course?.course_creator_uuid,
    });

    const creator = creatorResponse?.data;

    const { data: reviewsResponse, isLoading: reviewsLoading } = useQuery({
        ...getCourseReviewsOptions({ path: { courseUuid: resolvedCourseId }, }),
        enabled: !!resolvedCourseId,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const reviews: CourseReview[] = reviewsResponse?.data ?? [];

    const { data: difficultyResponse, isLoading: difficultyLoading } =
        useQuery(getAllDifficultyLevelsOptions());

    const difficultyLevels: DifficultyLevel[] =
        difficultyResponse?.data ?? [];

    const { data: assignmentsResponse, isLoading: assignmentLoading } =
        useQuery({
            ...getAllAssignmentsOptions({
                query: {
                    pageable: {
                        page: 0,
                        size: 1000,
                    },
                },
            }),
        });

    const assignments: Assignment[] =
        assignmentsResponse?.data?.content ?? [];

    const { data: quizzesResponse, isLoading: quizzesLoading } = useQuery({
        ...getAllQuizzesOptions({
            query: {
                pageable: {
                    page: 0,
                    size: 1000,
                },
            },
        }),
    });

    const quizzes: Quiz[] = quizzesResponse?.data?.content ?? [];

    const {
        isLoading: lessonsLoading,
        isFetching: lessonsFetching,
        lessons: lessonsWithContent,
    } = useCourseLessonsWithContent({
        courseUuid: resolvedCourseId,
    });

    const {
        data: relatedCoursesResponse,
        isLoading: relatedCoursesLoading,
    } = useQuery({
        ...getAllCoursesOptions({
            query: {
                pageable: {
                    page: 0,
                    size: 12,
                },
            },
        }),
        enabled: !!course?.course_creator_uuid,
    });

    const { data: trainingApplicationsResponse } = useQuery({
        ...searchTrainingApplicationsOptions({
            query: {
                pageable: {},
                searchParams: {
                    applicant_uuid_eq: instructor?.uuid ?? '',
                    course_uuid_eq: course?.uuid ?? '',
                },
            },
        }),
        enabled: isInstructorDomain && Boolean(instructor?.uuid) && Boolean(course?.uuid),
        refetchOnWindowFocus: false,
    });

    const lessons: Lesson[] = useMemo(
        () =>
            lessonsWithContent
                ?.map(item => item.lesson)
                .filter(Boolean) ?? [],
        [lessonsWithContent]
    );

    const lessonUuids = useMemo(
        () =>
            lessons
                .map(lesson => lesson.uuid)
                .filter((uuid): uuid is string => !!uuid),
        [lessons]
    );

    const filteredAssignments = useMemo(
        () =>
            assignments.filter(assignment =>
                lessonUuids.includes(assignment.lesson_uuid)
            ),
        [assignments, lessonUuids]
    );

    const filteredQuizzes = useMemo(
        () =>
            quizzes.filter(quiz =>
                lessonUuids.includes(quiz.lesson_uuid)
            ),
        [lessonUuids, quizzes]
    );

    const difficultyName = useMemo(
        () =>
            difficultyLevels.find(
                level => level.uuid === course?.difficulty_uuid
            )?.name ?? null,
        [course?.difficulty_uuid, difficultyLevels]
    );

    const reviewCount = reviews.length;

    const avgRating =
        reviewCount > 0
            ? (
                reviews.reduce(
                    (sum, review) => sum + (review.rating || 0),
                    0
                ) / reviewCount
            ).toFixed(1)
            : null;

    const creatorName = creator?.full_name ?? '';
    const creatorBio = creator?.bio ?? '';

    const creatorHeadline =
        creator?.professional_headline ??
        '';

    const durationLabel = getDurationLabel(course);
    const currentTrainingApplication = trainingApplicationsResponse?.data?.content?.[0] ?? null;
    const currentTrainingApplicationStatus = currentTrainingApplication?.status ?? null;
    const instructorActionLabel =
        currentTrainingApplicationStatus === 'approved'
            ? 'Approved'
            : currentTrainingApplicationStatus === 'pending'
                ? 'Pending'
                : currentTrainingApplicationStatus === 'revoked' ||
                    currentTrainingApplicationStatus === 'rejected'
                    ? 'Reapply to Train'
                    : 'Apply to Train';
    const instructorActionDisabled =
        currentTrainingApplicationStatus === 'approved' ||
        currentTrainingApplicationStatus === 'pending';

    const relatedCourses = useMemo(() => {
        const courses = relatedCoursesResponse?.data?.content ?? [];

        return courses
            .filter(
                item =>
                    item.uuid &&
                    item.uuid !== course?.uuid &&
                    item.course_creator_uuid ===
                    course?.course_creator_uuid
            )
            .slice(0, 3);
    }, [
        course?.course_creator_uuid,
        course?.uuid,
        relatedCoursesResponse?.data?.content,
    ]);

    const handleApplyToTrain = (data: {
        notes: string;
        private_online_rate: number;
        private_inperson_rate: number;
        group_online_rate: number;
        group_inperson_rate: number;
        rate_currency: string;
    }) => {
        if (!course?.uuid) {
            toast.error('Course details are not ready yet.');
            return;
        }

        if (!instructor?.uuid) {
            toast.error('Please wait for your instructor profile to load.');
            return;
        }

        applyToTrainCourseMut.mutate(
            {
                body: {
                    applicant_type: ApplicantTypeEnum.INSTRUCTOR,
                    applicant_uuid: instructor.uuid,
                    rate_card: {
                        currency: data.rate_currency,
                        private_online_rate: data.private_online_rate,
                        private_inperson_rate: data.private_inperson_rate,
                        group_online_rate: data.group_online_rate,
                        group_inperson_rate: data.group_inperson_rate,
                    },
                    application_notes: data.notes,
                },
                path: { courseUuid: course.uuid },
            },
            {
                onSuccess: response => {
                    qc.invalidateQueries({
                        queryKey: searchTrainingApplicationsQueryKey({
                            query: {
                                pageable: {},
                                searchParams: {
                                    applicant_uuid_eq: instructor.uuid,
                                    course_uuid_eq: course.uuid,
                                },
                            },
                        }),
                    });
                    qc.invalidateQueries({
                        queryKey: searchTrainingApplicationsQueryKey({
                            query: {
                                pageable: {},
                                searchParams: { applicant_uuid_eq: instructor.uuid },
                            },
                        }),
                    });
                    toast.success(response?.message ?? 'Application submitted successfully.');
                    setApplyModalOpen(false);
                },
                onError: error => {
                    toast.error(error?.message ?? 'Unable to submit course application');
                },
            }
        );
    };

    useEffect(() => {
        if (!course) return;

        replaceBreadcrumbs([
            {
                id: 'dashboard',
                title: 'Dashboard',
                url: buildWorkspaceAliasPath(
                    activeDomain,
                    '/dashboard/overview'
                ),
            },
            {
                id: 'courses',
                title: 'Browse Courses',
                url: buildWorkspaceAliasPath(
                    activeDomain,
                    '/dashboard/courses'
                ),
            },
            {
                id: 'course-details',
                title: course.name,
                url: buildWorkspaceAliasPath(
                    activeDomain,
                    `/dashboard/courses/${course.uuid}`
                ),
            },
        ]);
    }, [activeDomain, course, replaceBreadcrumbs]);

    const isEverythingReady = !(
        courseLoading ||
        courseFetching ||
        creatorLoading ||
        reviewsLoading ||
        difficultyLoading ||
        assignmentLoading ||
        quizzesLoading ||
        lessonsLoading ||
        lessonsFetching ||
        relatedCoursesLoading
    );

    if (!isEverythingReady) {
        return (
            <EnrollmentLoadingState
                title="Loading your course details"
                description="We are gathering lessons, tasks, quizzes, and course information so the full learning overview is ready when the page opens."
            />
        );
    }

    return (
        <div className="min-h-screen font-sans">
            <main className="mx-auto w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                <div className="mb-4 flex justify-end gap-2 sm:mb-6">
                    <button className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm transition-colors hover:border-foreground hover:text-foreground sm:text-sm">
                        {/* Share Icon */}
                        Share
                    </button>

                    <button className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm transition-colors hover:border-destructive hover:text-destructive sm:text-sm">
                        {/* Wishlist Icon */}
                        Wishlist
                    </button>
                </div>

                <div className="flex flex-col items-start gap-6 lg:flex-row lg:gap-8 xl:gap-10">
                    <div className="flex min-w-0 w-full flex-1 flex-col gap-5 sm:gap-6">
                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:p-6">
                            <CourseDetailsHero
                                course={course}
                                creatorName={creatorName}
                                creatorHeadline={creatorHeadline}
                                difficultyName={difficultyName}
                                reviewCount={reviewCount}
                                averageRating={avgRating}
                                lessonCount={lessons.length}
                                assignmentCount={filteredAssignments.length}
                                quizCount={filteredQuizzes.length}
                                durationLabel={durationLabel}
                            />
                        </div>

                        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                            <div className="px-4 pt-4 sm:px-5 sm:pt-5 lg:px-6">
                                <CourseTabNav
                                    reviewCount={reviewCount}
                                    lessonCount={lessons.length}
                                    assessmentCount={
                                        filteredAssignments.length +
                                        filteredQuizzes.length
                                    }
                                    requirementCount={
                                        course?.training_requirements
                                            ?.length ?? 0
                                    }
                                />
                            </div>

                            <div className="px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
                                <CourseOverview
                                    course={course}
                                    creatorName={creatorName}
                                    creatorHeadline={creatorHeadline}
                                    creatorBio={creatorBio}
                                    lessons={lessons}
                                    lessonsWithContent={
                                        lessonsWithContent ?? []
                                    }
                                    reviewCount={reviewCount}
                                    averageRating={avgRating}
                                />
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:p-6">
                            <StudentsAlsoBought
                                courses={relatedCourses}
                                activeDomain={activeDomain}
                                creatorName={creatorName}
                            />
                        </div>
                    </div>

                    <div className="flex w-full shrink-0 flex-col gap-4 sm:gap-5 lg:sticky lg:top-20 lg:w-80 xl:w-96">
                        <EnrollSidebar
                            course={course}
                            creatorName={creatorName}
                            activeDomain={activeDomain}
                            difficultyName={difficultyName}
                            lessonCount={lessons.length}
                            assessmentCount={
                                filteredAssignments.length +
                                filteredQuizzes.length
                            }
                            durationLabel={durationLabel}
                            becomeInstructorLabel={instructorActionLabel}
                            becomeInstructorDisabled={instructorActionDisabled}
                            handleBecomeInstructor={() => {
                                if (!isInstructorDomain) {
                                    return;
                                }

                                if (!instructor?.uuid) {
                                    toast.error('Please wait for your instructor profile to load.');
                                    return;
                                }

                                setApplyModalOpen(true);
                            }}
                            onEnroll={() =>
                                router.push(
                                    buildWorkspaceAliasPath(
                                        activeDomain,
                                        getEnrollHref(
                                            activeDomain,
                                            'course',
                                            course?.uuid as string
                                        )
                                    )
                                )
                            }
                            onSearchInstructor={() =>
                                router.push(
                                    buildWorkspaceAliasPath(
                                        activeDomain,
                                        `/dashboard/courses/instructor?courseId=${course?.uuid}`
                                    )
                                )
                            }
                        />

                        <CourseRating
                            reviewCount={reviewCount}
                            averageRating={avgRating}
                            reviews={reviews}
                            courseId={resolvedCourseId}
                        />

                        <ShareCourse />
                    </div>
                </div>

                {isInstructorDomain && course ? (
                    <NotesModal
                        open={applyModalOpen}
                        setOpen={setApplyModalOpen}
                        title='Apply to Train a Course'
                        description={
                            <div className='space-y-2'>
                                <p>
                                    You are applying to train the course titled{' '}
                                    <span className='font-semibold'>&ldquo;{course.name}&rdquo;</span>.
                                </p>
                                <p>
                                    Provider:{' '}
                                    <span className='font-medium'>{creatorName || 'Course Creator'}</span>
                                    {durationLabel ? ` · Duration: ${durationLabel}` : ''}
                                    {course.category_names?.[0] ? ` · Focus: ${course.category_names[0]}` : ''}
                                </p>
                                <p>
                                    Submit your application notes and set the amount you want to charge students
                                    per hour per head, while respecting the creator-set minimum shown below.
                                </p>
                            </div>
                        }
                        onSave={handleApplyToTrain}
                        saveText='Submit application'
                        cancelText='Cancel'
                        placeholder='Enter your application notes here...'
                        isLoading={applyToTrainCourseMut.isPending}
                        minimum_rate={course.minimum_training_fee ?? 0}
                    />
                ) : null}
            </main>
        </div>
    );
}

"use client";

import { useInstructor } from '@/context/instructor-context';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import type {
    Assignment,
    ClassReview,
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
    getAllTrainingProgramsOptions,
    getClassReviewsOptions,
    getCourseCreatorByUuidOptions,
    getCourseReviewsOptions,
    getCourseTrainingRequirementsOptions,
    getPublishedCoursesOptions,
    searchTrainingApplicationsOptions,
    searchTrainingApplicationsQueryKey,
    submitTrainingApplicationMutation
} from '@/services/client/@tanstack/react-query.gen';
import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { EnrollmentLoadingState } from '@/src/features/dashboard/courses/components/EnrollmentLoadingState';
import { buildWorkspaceAliasPath } from '@/src/features/dashboard/lib/active-domain-storage';
import { useUserProfile } from '@/src/features/profile/context/profile-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Heart, Share2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { QuizContentPreview } from '../../../../../../components/content-preview/QuizContentPreview';
import NotesModal from '../../../../../../components/custom-modals/notes-modal';
import { LinkShareCard } from '../../../../../../components/shared/link-share-card';
import { Button } from '../../../../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../../components/ui/table';
import { ClassDetailsScheduleItem, CombinedClassDetailsData } from '../../../../../../hooks/use-class-details';
import { buildSocialShareUrl, openShareWindow } from '../../../../../../lib/share';
import { socialShareActions } from '../../../../@instructor/classes/overview/[id]/page';
import { CourseTrainingRequirements } from '../../../../_components/course-training-requirements';
import CourseDetailsHero from './CourseDetailsHero';
import CourseFaq from './CourseFaq';
import CourseOverview, { ClassCourseCurriculum } from './CourseOverview';
import CourseRating, { ClassRating } from './CourseRating';
import CourseReviews from './CourseReviews';
import { formatDurationFromParts, getContentHref, getEnrollHref, stripHtml } from './courses-data';
import ClassCourseTabNav from './CourseTabNav';
import EnrollSidebar from './EnrollSidebar';
import ShareClassCourse, { ShareClass } from './ShareClassCourse';
import { UnifiedContentItem } from './SharedCoursesPage';
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
    classData,
    type,
}: {
    courseId: string;
    classData?: CombinedClassDetailsData;
    type: string | undefined
}) {
    const router = useRouter();
    const params = useParams();
    const { activeDomain } = useUserDomain();

    const [activeTab, setActiveTab] = useState('Overview');

    const instructor = useInstructor();
    const qc = useQueryClient();

    const resolvedCourseId = courseId || (params?.id as string);
    const classId = classData?.class?.uuid as string

    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);

    const applyToTrainCourseMut = useMutation(submitTrainingApplicationMutation());
    const isInstructorDomain = activeDomain === 'instructor';
    const isOrganisationDomain =
        activeDomain === 'organisation' || activeDomain === 'organisation_user';
    // Both instructors and organisations may apply to train an approved course.
    const canApplyToTrain = isInstructorDomain || isOrganisationDomain;
    const userProfile = useUserProfile();
    const organisationUuid = useMemo(() => {
        const affiliations = userProfile?.organisation_affiliations ?? [];
        return (affiliations.find(a => a.active) ?? affiliations[0])?.organisation_uuid;
    }, [userProfile?.organisation_affiliations]);
    const applicantUuid = isOrganisationDomain ? organisationUuid : instructor?.uuid;
    const applicantType = isOrganisationDomain
        ? ApplicantTypeEnum.ORGANISATION
        : ApplicantTypeEnum.INSTRUCTOR;

    const { data: coursesResponse, isLoading: coursesLoading } = useQuery({
        ...getPublishedCoursesOptions({
            query: {
                pageable: {
                    page: 0,
                    size: 18,
                },
            },
        }),
        refetchOnWindowFocus: false,
    });

    const { data: programsResponse, isLoading: programsLoading } = useQuery({
        ...getAllTrainingProgramsOptions({
            query: {
                pageable: {
                    page: 0,
                    size: 12,
                },
            },
        }),
        refetchOnWindowFocus: false,
    });

    const courses = useMemo(() => coursesResponse?.data?.content ?? [], [coursesResponse]);
    const programs = useMemo(() => programsResponse?.data?.content ?? [], [programsResponse]);

    const mappedPrograms = useMemo<UnifiedContentItem[]>(
        () =>
            programs.map(program => {
                const durationLabel = formatDurationFromParts(
                    program.total_duration_hours,
                    program.total_duration_minutes,
                    program.total_duration_display
                );

                return {
                    id: program.uuid ?? '',
                    kind: 'program',
                    title: program.title,
                    description: stripHtml(program.description),
                    createdAt: program.created_date ? new Date(program.created_date).getTime() : 0,
                    durationMinutes: program.total_duration_hours * 60 + program.total_duration_minutes,
                    durationLabel,
                    categoryLabels: [],
                    creatorUuid: program.course_creator_uuid,
                    creatorName: '',
                    price: program.price as string | number | undefined,
                    minimumRate: program.price as number,
                    imageUrl: undefined,
                    href: getContentHref("course_creator", 'program', program.uuid ?? ''),
                    enrolledClasses: 1,
                    secondaryMeta:
                        program.program_type ??
                        (program.price && program.price > 0 ? 'Paid Program' : 'Free Program'),
                    bundledCourseCount: 0,
                };
            }),
        [programs]
    );

    const mappedCourses = useMemo<UnifiedContentItem[]>(
        () =>
            courses.map(course => ({
                id: course.uuid ?? '',
                kind: 'course',
                title: course.name,
                description: stripHtml(course.description),
                createdAt: course.created_date ? new Date(course.created_date).getTime() : 0,
                durationMinutes: course.duration_hours * 60 + course.duration_minutes,
                durationLabel: formatDurationFromParts(
                    course.duration_hours,
                    course.duration_minutes,
                    course.total_duration_display
                ),
                categoryLabels: course.category_names ?? [],
                creatorUuid: course.course_creator_uuid,
                creatorName: '',
                levelLabel: '',
                price: course.price as string | number | undefined,
                minimumRate: course.minimum_training_fee as number ?? course.price as number,
                imageUrl: course.banner_url as string ?? course.thumbnail_url as string,
                href: getContentHref("course_creator", 'course', course.uuid ?? ''),
                enrolledClasses: 1,
                secondaryMeta:
                    course.category_names?.[0] ??
                    (course.price && course.price > 0 ? 'Paid Course' : 'Free Course'),

            })),
        [courses]
    );

    const course = useMemo(() => {
        if (!resolvedCourseId) return undefined;

        return courses.find(c => c.uuid === resolvedCourseId);
    }, [courses, resolvedCourseId]);

    const { data: cReqData } = useQuery({
        ...getCourseTrainingRequirementsOptions(({
            path: { courseUuid: resolvedCourseId as string },
            query: { pageable: {} }
        })),
        enabled: !!resolvedCourseId
    })
    const requirementCount = Number(cReqData?.data?.content?.length) ?? 0

    const courseShareLink =
        typeof window !== 'undefined'
            ? `${window.location.origin}${buildWorkspaceAliasPath(
                activeDomain,
                `/dashboard/courses/${course?.uuid}`
            )}`
            : '';


    const { data: creatorResponse, isLoading: creatorLoading } = useQuery({
        ...getCourseCreatorByUuidOptions({ path: { uuid: course?.course_creator_uuid as string }, }),
        enabled: !!course?.course_creator_uuid,
    });
    const creator = creatorResponse?.data;

    const myCourseItems = useMemo<UnifiedContentItem[]>(() => {
        const courseCreatorUuid = course?.course_creator_uuid;

        if (!courseCreatorUuid) { return []; }

        const creatorCourses = mappedCourses.filter(course => course.creatorUuid === courseCreatorUuid);
        const creatorPrograms = mappedPrograms.filter(program => program.creatorUuid === courseCreatorUuid);

        return [...creatorCourses, ...creatorPrograms].sort((a, b) => b.createdAt - a.createdAt);
    }, [mappedCourses, mappedPrograms, course?.course_creator_uuid]);


    const { data: reviewsResponse, isLoading: reviewsLoading } = useQuery({
        ...getCourseReviewsOptions({ path: { courseUuid: resolvedCourseId }, }),
        enabled: !!resolvedCourseId,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
    const courseReviews: CourseReview[] = reviewsResponse?.data ?? [];

    const { data: classReviewsResponse, isLoading: classReviewsLoading } = useQuery({
        ...getClassReviewsOptions({ path: { uuid: classId as string }, query: { pageable: {} } }),
        enabled: !!resolvedCourseId,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
    const classReviews: ClassReview[] = classReviewsResponse?.data?.content ?? [];

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

                },
            },
        }),
    });

    const quizzes: Quiz[] = quizzesResponse?.data?.content ?? [];
    console.log(quizzesResponse, "QUIZ RESP")

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
                    applicant_uuid_eq: applicantUuid ?? '',
                    course_uuid_eq: course?.uuid ?? '',
                },
            },
        }),
        enabled: canApplyToTrain && Boolean(applicantUuid) && Boolean(course?.uuid),
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

    console.log(filteredQuizzes, "FCCC")
    console.log(quizzes, "QUIZZ")

    const difficultyName = useMemo(
        () =>
            difficultyLevels.find(
                level => level.uuid === course?.difficulty_uuid
            )?.name ?? null,
        [course?.difficulty_uuid, difficultyLevels]
    );

    const courseReviewCount = courseReviews.length;
    const courseAvgRating =
        courseReviewCount > 0
            ? (
                courseReviews.reduce(
                    (sum, review) => sum + (review.rating || 0),
                    0
                ) / courseReviewCount
            ).toFixed(1)
            : null;

    const classReviewCount = classReviews.length;
    const classAvgRating =
        classReviewCount > 0
            ? (
                classReviews.reduce(
                    (sum, review) => sum + (review.rating || 0),
                    0
                ) / classReviewCount
            ).toFixed(1)
            : null;

    const reviewCount = type === "course" ? courseReviewCount : classReviewCount;
    const avgRating = type === "course" ? courseAvgRating : classAvgRating;


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

        if (!applicantUuid) {
            toast.error('Please wait for your profile to load.');
            return;
        }

        const submitterUuid = applicantUuid;
        const submitCourseUuid = course.uuid;

        applyToTrainCourseMut.mutate(
            {
                body: {
                    applicant_type: applicantType,
                    applicant_uuid: submitterUuid,
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
                                    applicant_uuid_eq: submitterUuid,
                                    course_uuid_eq: submitCourseUuid,
                                },
                            },
                        }),
                    });
                    qc.invalidateQueries({
                        queryKey: searchTrainingApplicationsQueryKey({
                            query: {
                                pageable: {},
                                searchParams: { applicant_uuid_eq: submitterUuid },
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

    const [siteOrigin, setSiteOrigin] = useState('');
    useEffect(() => {
        setSiteOrigin(window.location.origin);
    }, []);

    const registrationLink = useMemo(() => {
        if (!siteOrigin) return '';

        if (course?.uuid) {
            return `${siteOrigin}/dashboard/workspace/student/courses/available-classes/${course.uuid}/enroll?id=${classId}`;
        }

        return '';
    }, [classId, course?.uuid, siteOrigin]);

    const isEverythingReady = !(
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
                title={`Loading your ${type === "course" ? "course" : "class"} details`}
                description="We are gathering lessons, tasks, quizzes, and course information so the full learning overview is ready when the page opens."
            />
        );
    }

    const tabs = [
        'Overview',
        `Lessons (${lessons.length})`,
        `Assessment (${filteredAssignments?.length + filteredQuizzes?.length})`,
        `Requirements (${requirementCount})`,
        'Schedule',
        `Reviews (${reviewCount})`,
        'FAQs',
    ];

    return (
        <div className="min-h-screen font-sans">
            <main className="mx-auto w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                <div className="mb-4 flex justify-end gap-2 sm:mb-6">
                    <Button
                        onClick={() => {
                            if (type === "course") {
                                setShareOpen(true);
                            } else {
                                setInviteOpen(true);
                            }
                        }}
                        className="
      flex items-center gap-1.5 rounded-sm border border-border 
      bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm
      transition-colors duration-200 ease-in-out
      hover:bg-muted/50 hover:border-primary/45 hover:text-foreground
      sm:text-sm
    "
                    >
                        <Share2 className="h-3.5 w-3.5" />
                        Share
                    </Button>

                    <Button
                        className="
      flex items-center gap-1.5 rounded-sm border border-border 
      bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm
      transition-colors duration-200 ease-in-out
      hover:bg-destructive/10 hover:border-destructive hover:text-destructive
      sm:text-sm
    "
                    >
                        <Heart className="h-3.5 w-3.5" />
                        Wishlist
                    </Button>
                </div>

                <div className="flex flex-col items-start gap-6 lg:flex-row lg:gap-8 xl:gap-10">
                    <div className="flex min-w-0 w-full flex-1 flex-col gap-5 sm:gap-6">
                        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:p-6">
                            <CourseDetailsHero
                                course={course}
                                classData={classData}
                                type={type}
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
                                <ClassCourseTabNav
                                    tabs={tabs}
                                    activeTab={activeTab}
                                    onTabChange={setActiveTab}
                                />
                            </div>

                            <div className="px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
                                {activeTab === "Overview" && (
                                    <CourseOverview
                                        course={course}
                                        classData={classData}
                                        type={type}
                                        creatorName={creatorName}
                                        creatorHeadline={creatorHeadline}
                                        creatorBio={creatorBio}
                                        lessons={lessons}
                                        creatorCourseItems={myCourseItems}
                                        lessonsWithContent={
                                            lessonsWithContent ?? []
                                        }
                                        reviewCount={reviewCount}
                                        averageRating={avgRating}
                                    />)
                                }

                                {activeTab === `Lessons (${lessons.length})` &&
                                    <ClassCourseCurriculum
                                        lessonsWithContent={lessonsWithContent ?? []}
                                    />
                                }

                                {activeTab === `Assessment (${filteredAssignments?.length + filteredQuizzes?.length})` && (
                                    <CourseAssessments
                                        assignments={filteredAssignments}
                                        quizzes={filteredQuizzes}
                                    />
                                )}

                                {activeTab === `Requirements (${requirementCount})` &&
                                    <CourseTrainingRequirements
                                        requirements={cReqData?.data?.content}
                                        title='Course Training Requirements'
                                        description='Review what you need to prepare before registering for this class.'
                                        className='border-none shadow-none'
                                        viewerRole={activeDomain as string}
                                    />
                                }

                                {activeTab === 'Schedule' && (
                                    <CourseScheduleInfo
                                        type={type}
                                        schedule={classData?.schedule}
                                        classData={classData}
                                    />)}

                                {activeTab === `Reviews (${reviewCount})` && (
                                    type === "course" ? (
                                        <CourseReviews reviews={courseReviews} />
                                    ) : (
                                        <CourseReviews reviews={classReviews} />
                                    )
                                )}

                                {activeTab === "FAQs" && <CourseFaq faqs={[]} />}

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
                            classData={classData}
                            creatorName={creatorName}
                            activeDomain={activeDomain}
                            difficultyName={difficultyName}
                            type={type}
                            lessonCount={lessons.length}
                            assessmentCount={
                                filteredAssignments.length +
                                filteredQuizzes.length
                            }
                            durationLabel={durationLabel}
                            becomeInstructorLabel={instructorActionLabel}
                            becomeInstructorDisabled={instructorActionDisabled}
                            handleBecomeInstructor={() => {
                                if (!canApplyToTrain) {
                                    return;
                                }

                                if (!applicantUuid) {
                                    toast.error('Please wait for your profile to load.');
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
                            onInviteStudents={() => setInviteOpen(true)}
                            onApplyForFunding={() => {
                                router.push('/dashboard/skills-fund')
                            }}
                        />

                        {type === "course" ?
                            <CourseRating
                                reviewCount={courseReviewCount}
                                averageRating={courseAvgRating}
                                reviews={courseReviews}
                                courseId={resolvedCourseId}
                            /> :
                            <ClassRating
                                reviewCount={classReviewCount}
                                averageRating={classAvgRating}
                                reviews={classReviews}
                                courseId={resolvedCourseId}
                                classId={classId}
                            />}



                        {type === "course" ? <ShareClassCourse
                            courseTitle={course?.name ?? ''}
                            courseUrl={`${window.location.origin}${buildWorkspaceAliasPath(
                                activeDomain,
                                `/dashboard/courses/${course?.uuid}`
                            )}`}
                        /> :
                            <ShareClass
                                classTitle={classData?.class?.title ?? ''}
                                classUrl={registrationLink}
                            />}

                    </div>
                </div>

                {canApplyToTrain && course ? (
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
                                    {course?.category_names?.[0] ? ` · Focus: ${course?.category_names[0]}` : ''}
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


            <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Share Course</DialogTitle>
                        <DialogDescription>
                            Share this course with other learners and instructors.
                        </DialogDescription>
                    </DialogHeader>

                    <LinkShareCard
                        title="Course Link"
                        description="Copy or share this course link."
                        url={courseShareLink}
                        footer={
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium">Share via</h4>

                                <div className="flex flex-wrap gap-2">
                                    {socialShareActions.map(
                                        ({ icon: Icon, label, platform }) => (
                                            <Button
                                                key={label}
                                                size="sm"
                                                variant="outline"
                                                className="gap-2"
                                                disabled={!courseShareLink}
                                                onClick={() =>
                                                    openShareWindow(
                                                        buildSocialShareUrl(platform, {
                                                            title: course?.name ?? 'Course',
                                                            url: courseShareLink,
                                                            description: `Check out this course: ${course?.name}`,
                                                        })
                                                    )
                                                }
                                            >
                                                <Icon className="h-4 w-4" />
                                                {label}
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                        }
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Invite Student</DialogTitle>
                        <DialogDescription>
                            Share this class with learners.
                        </DialogDescription>
                    </DialogHeader>

                    <LinkShareCard
                        title="Class Registration Link"
                        description="Copy or share this class link."
                        url={registrationLink}
                        footer={
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium">Share via</h4>

                                <div className="flex flex-wrap gap-2">
                                    {socialShareActions.map(
                                        ({ icon: Icon, label, platform }) => (
                                            <Button
                                                key={label}
                                                size="sm"
                                                variant="outline"
                                                className="gap-2"
                                                disabled={!registrationLink}
                                                onClick={() =>
                                                    openShareWindow(
                                                        buildSocialShareUrl(platform, {
                                                            title: classData?.class?.title ?? 'Class',
                                                            url: registrationLink,
                                                            description: `Check out this class: ${classData?.class?.title}`,
                                                        })
                                                    )
                                                }
                                            >
                                                <Icon className="h-4 w-4" />
                                                {label}
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                        }
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

function CourseScheduleInfo({ type, classData, schedule }: { type: "course" | "class" | undefined, classData: CombinedClassDetailsData, schedule: ClassDetailsScheduleItem }) {
    const getDuration = (start?: string, end?: string) => {
        if (!start || !end) return "-";

        const diff = new Date(end).getTime() - new Date(start).getTime();

        if (isNaN(diff) || diff < 0) return "-";

        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        return hours > 0
            ? `${hours}h ${remainingMinutes}m`
            : `${remainingMinutes}m`;
    };

    return <>
        {type === "course" ?
            <div className="rounded-lg border border-muted/50 bg-muted/30 p-6">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                        <CalendarClock className="h-5 w-5" />
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-base font-semibold">
                            Your Class Schedule Will Be Provided After Enrollment
                        </h3>

                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Hello! 😊 Once you enroll in this course, you’ll receive full details about your class schedule.
                            This includes:
                        </p>

                        <ul className="ml-5 list-disc text-muted-foreground text-sm leading-relaxed space-y-1">
                            <li>Class dates and start times</li>
                            <li>Frequency and duration of sessions</li>
                            <li>How to join each session</li>
                        </ul>

                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Make sure your contact information is up to date so you don’t miss any updates.
                            You’ll have everything you need to plan and prepare for your classes right after enrollment.
                        </p>
                    </div>
                </div>
            </div> :
            <div className="overflow-x-auto">
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
                        {Array.isArray(schedule) && schedule.length > 0 ? (
                            [...schedule]
                                .sort(
                                    (a, b) =>
                                        new Date(a.start_time).getTime() -
                                        new Date(b.start_time).getTime()
                                )
                                .map((instance, index) => (
                                    <TableRow key={instance.uuid}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{classData?.class?.title}</TableCell>

                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {new Date(instance.start_time).toLocaleDateString()}
                                                </span>

                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(instance.start_time).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                    {" - "}
                                                    {new Date(instance.end_time).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                    {"   "}
                                                    ({instance.duration_formatted})
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell>{instance.status}</TableCell>

                                        <TableCell>
                                            {instance.status === "scheduled" || !instance.started_at || !instance.concluded_at
                                                ? "Pending"
                                                : getDuration(instance.started_at, instance.concluded_at)}
                                        </TableCell>
                                    </TableRow>
                                ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                    No scheduled sessions for this class yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        }
    </>
}

function CourseAssessments({
    assignments = [],
    quizzes = [],
}: { assignments: Assignment[], quizzes: Quiz[] }) {
    return (
        <div className="space-y-8">
            {/* Assignments */}
            <section>
                <div className="mb-4 flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Assignments</h2>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {assignments.length}
                    </span>
                </div>

                {assignments.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No assignments available.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {assignments.map((assignment) => (
                            <div
                                key={assignment.uuid}
                                className="rounded-lg border bg-card p-4"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold">{assignment.title}</h3>

                                        {assignment.due_date && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Due {new Date(assignment.due_date).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="text-sm text-muted-foreground">
                                        {assignment.max_points} pts
                                    </div>
                                </div>

                                {assignment.description && (
                                    <div
                                        className="prose prose-sm mt-4 max-w-none"
                                        dangerouslySetInnerHTML={{ __html: assignment.description }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className="border-t" />

            {/* Quizzes */}
            <section>
                <div className="mb-4 flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Quizzes</h2>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {quizzes.length}
                    </span>
                </div>

                {quizzes.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No quizzes available.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {quizzes.map((quiz) => (
                            <div key={quiz.uuid} className="rounded-lg bg-card">
                                <QuizContentPreview
                                    quizUuid={quiz.uuid}
                                    role="preview"
                                    questionsOpen={false}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

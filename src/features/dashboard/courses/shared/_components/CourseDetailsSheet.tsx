
"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
    BadgeCheck,
    BookOpen,
    CalendarDays,
    ClipboardList,
    Clock,
    GraduationCap,
    Layers,
    ListChecks,
    PiggyBank,
    Star,
    Users,
    UserSearch,
} from "lucide-react";

import { useCourseAssessmentsByCourseUuids } from "@/hooks/use-batched-lookups";
import { useCourseLessonsWithContent } from "@/hooks/use-courselessonwithcontent";
import type { Course, CourseReview, ProgramReview, TrainingProgram } from "@/services/client";
import {
    getCourseAssessmentsOptions,
    getCourseByUuidOptions,
    getCourseReviewsOptions,
    getCourseTrainingRequirementsOptions,
    getProgramCoursesOptions,
    getProgramReviewsOptions,
    getTrainingProgramByUuidOptions,
} from "@/services/client/@tanstack/react-query.gen";
import { useUserDomain } from "@/src/features/dashboard/context/user-domain-context";
import { stripHtml } from "@/src/features/dashboard/courses/shared/_components/courses-data";
import { buildWorkspaceAliasPath } from "@/src/features/dashboard/lib/active-domain-storage";
import { ImageWithFallback } from "../../../../../../components/data/image-with-fallback";
import { Skeleton } from "../../../../../../components/ui/skeleton";
import { isAuthenticatedMediaUrl, toAuthenticatedMediaUrl } from "../../../../../lib/media-url";

export function CourseDetailsSheet({
    itemId,
    type,
    open,
    onOpenChange,
}: {
    itemId: string | null;
    type: string;
    open: boolean;
    onOpenChange: (o: boolean) => void;
}) {
    const { activeDomain } = useUserDomain();
    const isCourse = type === "course";
    const isProgram = type === "program";
    const resolvedId = itemId ?? "";

    // ── Course-only data ──────────────────────────────────────────────
    const { data: courseResp, isLoading: courseLoading } = useQuery({
        ...getCourseByUuidOptions({
            path: { uuid: resolvedId },
        }),
        enabled: open && !!resolvedId && isCourse,
        placeholderData: undefined,
    });

    const course = courseResp?.data as Course | undefined;

    const { data: courseReqResp } = useQuery({
        ...getCourseTrainingRequirementsOptions({
            path: { courseUuid: resolvedId },
            query: { pageable: {} },
        }),
        enabled: open && !!resolvedId && isCourse,
        placeholderData: undefined,
    });

    const { data: courseAssessResp } = useQuery({
        ...getCourseAssessmentsOptions({
            path: { courseUuid: resolvedId },
            query: { pageable: {} },
        }),
        enabled: open && !!resolvedId && isCourse,
        placeholderData: undefined,
    });

    const { data: courseReviewsResp } = useQuery({
        ...getCourseReviewsOptions({ path: { courseUuid: resolvedId } }),
        enabled: open && !!resolvedId && isCourse,
        placeholderData: undefined,
    });
    const courseReviews: CourseReview[] = courseReviewsResp?.data ?? [];

    const { isLoading: lessonsLoading, lessons: lessonsWithContent } =
        useCourseLessonsWithContent({ courseUuid: isCourse ? resolvedId : "" });

    const courseLessons = useMemo(
        () => (lessonsWithContent ?? []).map(item => item.lesson).filter(Boolean),
        [lessonsWithContent]
    );

    // ── Program-only data ────────────────────────────────────────────
    const { data: programResp, isLoading: programLoading } = useQuery({
        ...getTrainingProgramByUuidOptions({ path: { uuid: resolvedId } }),
        enabled: !!itemId && open && isProgram,
        placeholderData: undefined,
    });
    const program = programResp?.data as TrainingProgram | undefined;

    const { data: programCoursesResp, isLoading: programCoursesLoading } = useQuery({
        ...getProgramCoursesOptions({ path: { programUuid: resolvedId } }),
        enabled: !!itemId && open && isProgram,
        placeholderData: undefined,
    });
    const bundledCourses: Course[] = programCoursesResp?.data ?? [];

    const bundledCourseUuids = useMemo(
        () => bundledCourses.map(c => c.uuid).filter((u): u is string => !!u),
        [bundledCourses]
    );

    const { data: programReviewsResp } = useQuery({
        ...getProgramReviewsOptions({
            path: { programUuid: resolvedId },
            query: { pageable: {} },
        }),
        enabled: !!itemId && open && isProgram,
    });
    const programReviews: ProgramReview[] = programReviewsResp?.data?.content ?? [];

    // Reuses the same batched-lookup hook ClassProgramDetailsPage uses to get
    // assessment schemes for every bundled course in one go.
    const { assessmentMap: programAssessmentMap } = useCourseAssessmentsByCourseUuids(
        isProgram ? bundledCourseUuids : []
    );

    const aggregatedRequirements = useMemo(
        () => bundledCourses.flatMap(c => c.training_requirements ?? []),
        [bundledCourses]
    );

    const totalDurationMinutes = useMemo(
        () =>
            bundledCourses.reduce(
                (sum, c) => sum + (c.duration_hours ?? 0) * 60 + (c.duration_minutes ?? 0),
                0
            ),
        [bundledCourses]
    );

    // ── Shared derived display data ──────────────────────────────────
    const reviews = isCourse ? courseReviews : programReviews;
    const reviewCount = reviews.length;
    const avgRating =
        reviewCount > 0
            ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount
            : null;

    const title = isCourse ? course?.name : program?.title;
    const description = isCourse ? course?.description : program?.description;
    const coverUrl = isCourse
        ? (course?.banner_url as string) ?? (course?.thumbnail_url as string)
        : undefined;

    const durationLabel = isCourse
        ? course?.duration_hours != null
            ? `${course.duration_hours}h ${course.duration_minutes ?? 0}m`
            : null
        : totalDurationMinutes > 0
            ? `${Math.floor(totalDurationMinutes / 60)}h ${totalDurationMinutes % 60}m`
            : null;

    const unitsLabel = isCourse ? "units" : "courses";
    const unitsCount = isCourse ? courseLessons.length : bundledCourses.length;

    const requirementsCount = isCourse
        ? courseReqResp?.data?.content?.length ?? 0
        : aggregatedRequirements.length;

    const studentRequirements = (
        isCourse
            ? (courseReqResp?.data?.content ?? [])
            : aggregatedRequirements
    ).filter(
        (requirement: any) => requirement.provided_by?.toLowerCase() === "student"
    );

    const assessmentCount = isCourse
        ? courseAssessResp?.data?.content?.length ?? 0
        : Object.values(programAssessmentMap ?? {}).flat().length;
    const assessments = isCourse
        ? (courseAssessResp?.data?.content ?? [])
        : Object.values(programAssessmentMap ?? {}).flat();


    const isLoading = isCourse
        ? courseLoading || lessonsLoading
        : programLoading || programCoursesLoading;


    if (!itemId) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="right" className="w-full sm:max-w-2xl" />
            </Sheet>
        );
    }


    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetDescription />

            <SheetContent side="right" className="px-4 pt-6 w-full sm:max-w-2xl overflow-y-auto">
                {isLoading || !title ? (
                    <div className="space-y-4 mt-4">
                        <Skeleton className="h-40 w-full rounded-lg" />
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                ) : (
                    <div className="space-y-5 text-sm">
                        <SheetHeader className="pb-0" >
                            <SheetTitle className="text-left">{title ?? "Details"}</SheetTitle>
                        </SheetHeader>

                        <ImageWithFallback
                            src={toAuthenticatedMediaUrl(coverUrl)}
                            alt={title}
                            fill={false}
                            width={800}
                            height={320}
                            className="h-40 w-full rounded-lg object-cover"
                            unoptimized={isAuthenticatedMediaUrl(toAuthenticatedMediaUrl(coverUrl))}
                            fallback={
                                <div className="flex h-40 w-full items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
                                    <BookOpen className="h-12 w-12 text-slate-400" />
                                </div>
                            }
                        />

                        <div className="flex flex-wrap gap-1.5">
                            {isCourse && course?.category_names?.[0] && (
                                <Badge variant="secondary">{course.category_names[0]}</Badge>
                            )}
                            {isCourse && course?.level && (
                                <Badge variant="outline">{course.level}</Badge>
                            )}

                            {isCourse && course?.skills_fund_eligible && (
                                <Badge className="bg-emerald-600 hover:bg-emerald-600">
                                    <PiggyBank className="mr-1 h-3 w-3" /> Skills Fund eligible
                                </Badge>
                            )}
                            {isProgram && program?.program_type && (
                                <Badge variant="secondary">
                                    <BadgeCheck className="mr-1 h-3 w-3" /> {program.program_type}
                                </Badge>
                            )}
                            {isProgram && (
                                <Badge variant="outline">
                                    {program?.status === "published" ? "Published Program" : "Training Program"}
                                </Badge>
                            )}
                        </div>

                        {description && <p className="text-slate-700">{stripHtml(description)}</p>}

                        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-slate-50/60 p-3 text-xs text-slate-700">
                            {avgRating != null && (
                                <div className="inline-flex items-center gap-1.5">
                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                    {avgRating.toFixed(1)} rating
                                </div>
                            )}
                            {durationLabel && (
                                <div className="inline-flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    {durationLabel}
                                </div>
                            )}
                            {isCourse && course?.age_group && (
                                <div className="inline-flex items-center gap-1.5">
                                    <GraduationCap className="h-3.5 w-3.5" />
                                    Age {course.age_group}
                                </div>
                            )}
                            {isProgram && program?.class_limit != null && (
                                <div className="inline-flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5" />
                                    Class limit {program.class_limit}
                                </div>
                            )}
                            <div className="inline-flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5" />
                                {unitsCount} {unitsLabel}
                            </div>
                        </div>

                        <Section icon={<CalendarDays className="h-4 w-4" />} title="Full schedule">
                            <p className="text-slate-700">
                                {isCourse
                                    ? course?.schedule_overview ??
                                    "Detailed schedule varies by class — open a class to see its weekly plan, session times, and delivery mode."
                                    : "Once you enroll, you'll receive the full schedule for every bundled course, including dates, times, and how to join each session."}
                            </p>
                        </Section>

                        <Section icon={<ClipboardList className="h-4 w-4" />} title="Prerequisites">
                            <p className="text-slate-700">
                                {isCourse
                                    ? stripHtml(course?.prerequisites) ?? "No formal prerequisites listed."
                                    : "Prerequisites vary by bundled course — review each course listed below."}
                            </p>
                        </Section>

                        <Section
                            icon={<ListChecks className="h-4 w-4" />}
                            title={`Requirements (${studentRequirements.length})`}
                        >
                            <p className="text-slate-700">
                                {studentRequirements.length > 0
                                    ? studentRequirements
                                        .map(
                                            (requirement: any) =>
                                                `${requirement.name} (${requirement.quantity ?? 0} ${requirement.unit ?? ""
                                                })`
                                        )
                                        .join(", ") + "."
                                    : "No student-provided materials required."}
                            </p>
                        </Section>


                        <Section
                            icon={<BookOpen className="h-4 w-4" />}
                            title={`Assessment (${assessmentCount})`}
                        >
                            <p className="text-slate-700">
                                {assessments.length > 0
                                    ? assessments
                                        .map(
                                            (assessment: any) =>
                                                `${assessment.title || "Untitled Assessment"} (${assessment.weight_percentage ?? 0}%)`
                                        )
                                        .join(", ") + "."
                                    : "Assessment details will be shared by the instructor."}
                            </p>
                        </Section>

                        {isCourse && courseLessons.length > 0 && (
                            <Section
                                icon={<Layers className="h-4 w-4" />}
                                title={`Units & lessons (${courseLessons.length})`}
                            >
                                <ol className="space-y-2">
                                    {courseLessons.map((l: any, i: number) => (
                                        <li key={l.uuid ?? i} className="rounded-md border bg-white p-2">
                                            <div className="text-sm font-medium text-slate-900">
                                                {i + 1}. {l.title}
                                            </div>
                                            {l.description && (
                                                <div className="mt-0.5 text-xs text-slate-500">
                                                    {stripHtml(l.description)}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ol>
                            </Section>
                        )}

                        {isProgram && bundledCourses.length > 0 && (
                            <Section
                                icon={<Layers className="h-4 w-4" />}
                                title={`Bundled courses (${bundledCourses.length})`}
                            >
                                <ol className="space-y-2">
                                    {bundledCourses.map((c, i) => (
                                        <li key={c.uuid ?? i} className="rounded-md border bg-white p-2">
                                            <div className="text-sm font-medium text-slate-900">
                                                {i + 1}. {c.name}
                                            </div>
                                            {c.description && (
                                                <div className="mt-0.5 text-xs text-slate-500">
                                                    {stripHtml(c.description)}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ol>
                            </Section>
                        )}

                        <Separator />

                        <div className="flex flex-wrap gap-2 pb-4">
                            <Button
                                asChild
                                className="bg-[#0f4c81] hover:bg-[#0d3f6c]"
                                onClick={() => onOpenChange(false)}
                            >
                                <Link
                                    href={buildWorkspaceAliasPath(
                                        activeDomain,
                                        isCourse
                                            ? `/dashboard/courses/${resolvedId}/classes`
                                            : `/dashboard/courses/available-programs/${resolvedId}`
                                    )}
                                >
                                    <Users className="mr-1 h-4 w-4" /> Join a Class
                                </Link>
                            </Button>

                            {isCourse && (
                                <Button asChild variant="outline" onClick={() => onOpenChange(false)}>
                                    <Link
                                        href={buildWorkspaceAliasPath(
                                            activeDomain,
                                            `/dashboard/courses/instructor?courseId=${resolvedId}`
                                        )}
                                    >
                                        <UserSearch className="mr-1 h-4 w-4" /> Search Instructor
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

function Section({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#0f4c81]">
                {icon}
                {title}
            </div>
            <div className="text-sm">{children}</div>
        </div>
    );
}
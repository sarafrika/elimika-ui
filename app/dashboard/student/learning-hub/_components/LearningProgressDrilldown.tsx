import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCourseLessonsWithContent, type CourseLessonWithContent } from "@/hooks/use-courselessonwithcontent";
import { useUserDomain } from "@/src/features/dashboard/context/user-domain-context";
import { buildWorkspaceAliasPath } from "@/src/features/dashboard/lib/active-domain-storage";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, BookOpen, CheckCircle2, Circle, PlayCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type EnrolCourse = {
    id: string;
    status: string;
    course_id: string;
    course?: { id: string; title: string; category: string | null; level: string | null; duration_hours: number | null } | null;
    class?: { id: string; title: string | null; starts_at: string | null; meeting_link: string | null } | null;
};

type LearningAction = {
    key: string;
    label: string;
    icon: LucideIcon;
    href?: string;
    query?: Record<string, string>;
    external?: string;
    primary?: boolean;
};

type CourseLessonState = {
    lessons: CourseLessonWithContent[];
    isLoading: boolean;
    isFetching: boolean;
};

function getLessonsSignature(lessons: CourseLessonWithContent[]): string {
    return lessons
        .map((entry) => {
            const lesson = entry.lesson;
            const contentCount = entry.content?.data?.length ?? 0;
            return `${lesson?.uuid ?? ""}:${lesson?.title ?? ""}:${contentCount}`;
        })
        .join("|");
}

function CourseLessonsRunner({
    courseUuid,
    onChange,
}: {
    courseUuid: string;
    onChange: (uuid: string, state: CourseLessonState) => void;
}) {
    const { isLoading, isFetching, lessons } = useCourseLessonsWithContent({
        courseUuid,
    });

    const typedLessons = useMemo(() => (lessons ?? []) as CourseLessonWithContent[], [lessons]);
    const signature = useMemo(() => getLessonsSignature(typedLessons), [typedLessons]);

    useEffect(() => {
        onChange(courseUuid, {
            lessons: typedLessons,
            isLoading: Boolean(isLoading),
            isFetching: Boolean(isFetching),
        });
        // typedLessons is intentionally excluded because the hook recreates the array each render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseUuid, isLoading, isFetching, onChange, signature]);

    return null;
}

function AggregatedCourseLessons({
    courseUuids,
    children,
}: {
    courseUuids: string[];
    children: (result: {
        lessonsByCourse: Record<string, CourseLessonWithContent[]>;
        isLoading: boolean;
        isFetching: boolean;
    }) => ReactNode;
}) {
    const [stateByUuid, setStateByUuid] = useState<Record<string, CourseLessonState>>({});

    const handleChange = useCallback((uuid: string, state: CourseLessonState) => {
        setStateByUuid((prev) => {
            const existing = prev[uuid];
            const sameLoading =
                existing?.isLoading === state.isLoading && existing?.isFetching === state.isFetching;
            const sameLessons =
                existing && getLessonsSignature(existing.lessons) === getLessonsSignature(state.lessons);

            if (existing && sameLoading && sameLessons) {
                return prev;
            }

            return { ...prev, [uuid]: state };
        });
    }, []);

    const lessonsByCourse = useMemo(() => {
        const map: Record<string, CourseLessonWithContent[]> = {};
        courseUuids.forEach((uuid) => {
            map[uuid] = stateByUuid[uuid]?.lessons ?? [];
        });
        return map;
    }, [courseUuids, stateByUuid]);

    const isLoading =
        courseUuids.length > 0 && courseUuids.some((uuid) => stateByUuid[uuid]?.isLoading ?? true);

    const isFetching =
        courseUuids.length > 0 && courseUuids.some((uuid) => stateByUuid[uuid]?.isFetching ?? true);

    return (
        <>
            {courseUuids.map((uuid) => (
                <CourseLessonsRunner
                    key={uuid}
                    courseUuid={uuid}
                    onChange={handleChange}
                />
            ))}
            {children({ lessonsByCourse, isLoading, isFetching })}
        </>
    );
}

export function LearningProgressDrilldown({ enrollments }: { enrollments: EnrolCourse[] }) {
    const { activeDomain } = useUserDomain();
    const active = useMemo(
        () => enrollments.filter((enrollment) => enrollment.status === "active" && enrollment.course?.id),
        [enrollments]
    );
    const activeCourseUuids = useMemo(
        () => active.map((enrollment) => enrollment.course!.id),
        [active]
    );
    const [selectedId, setSelectedId] = useState<string | null>(activeCourseUuids[0] ?? null);

    useEffect(() => {
        if (!selectedId || !activeCourseUuids.includes(selectedId)) {
            setSelectedId(activeCourseUuids[0] ?? null);
        }
    }, [activeCourseUuids, selectedId]);

    if (active.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Learning Progress</CardTitle>
                    <CardDescription>Lesson drilldown per active course</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Enrol in a course to see its lesson list.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <AggregatedCourseLessons courseUuids={activeCourseUuids}>
            {({ lessonsByCourse, isLoading, isFetching }) => {
                const selectedEnrollment =
                    active.find((enrollment) => enrollment.course?.id === selectedId) ?? active[0];
                const selectedCourseId = selectedEnrollment.course?.id ?? null;
                const selectedLessons = selectedCourseId ? lessonsByCourse[selectedCourseId] ?? [] : [];
                const selectedCompletedLessons = 0;
                const totalCompletedLessons = 0;
                const totalLessons = active.reduce(
                    (sum, enrollment) => sum + (lessonsByCourse[enrollment.course!.id]?.length ?? 0),
                    0
                );
                const overallProgress = totalLessons > 0 ? Math.round((totalCompletedLessons / totalLessons) * 100) : 0;
                const selectedFirstLesson = selectedLessons[0]?.lesson?.title;

                const actions: LearningAction[] = [];
                if (selectedFirstLesson) {
                    actions.push({
                        key: "open-first-lesson",
                        label: `Open first lesson: ${selectedFirstLesson}`,
                        icon: PlayCircle,
                        href: "/learning-hub",
                        query: { tab: "lessons" },
                        primary: true,
                    });
                }
                actions.push({
                    key: "view-courses",
                    label: "Review all active courses",
                    icon: BookOpen,
                    href: "/learning-hub",
                    query: { tab: "my-courses" },
                });
                actions.push({
                    key: "browse-catalog",
                    label: "Browse the course catalog",
                    icon: Sparkles,
                    href: buildWorkspaceAliasPath(activeDomain, "/dashboard/courses"),
                });

                return (
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base">Learning Progress</CardTitle>
                                    <CardDescription>
                                        Real lesson lists for each active course.
                                    </CardDescription>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-muted-foreground">Overall</div>
                                    <div className="text-lg font-semibold tabular-nums">{overallProgress}%</div>
                                    <div className="text-xs text-muted-foreground">
                                        {totalCompletedLessons}/{totalLessons} lessons complete
                                    </div>
                                </div>
                            </div>
                            <Progress value={overallProgress} className="mt-2 h-2" />
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>{active.length} course{active.length === 1 ? "" : "s"}</span>
                                {isLoading ? <span>Loading lesson details…</span> : null}
                                {!isLoading && isFetching ? <span>Refreshing lesson details…</span> : null}
                            </div>
                        </CardHeader>

                        <CardContent className="grid gap-4 md:grid-cols-[minmax(0,240px)_1fr]">
                            <div className="space-y-1 md:border-r md:pr-3">
                                {active.map((enrollment) => {
                                    const courseId = enrollment.course?.id;
                                    const courseLessons = courseId ? lessonsByCourse[courseId] ?? [] : [];
                                    const lessonCount = courseLessons.length;
                                    const completedLessons = 0;
                                    const progressValue = lessonCount > 0 ? Math.round((completedLessons / lessonCount) * 100) : 0;
                                    const isSelected = courseId === selectedCourseId;

                                    return (
                                        <button
                                            type="button"
                                            key={enrollment.id}
                                            onClick={() => setSelectedId(courseId ?? null)}
                                            className={`w-full rounded-md border p-2 text-left transition-colors ${isSelected
                                                ? "border-primary/20 bg-primary/5"
                                                : "border-transparent hover:border-border hover:bg-muted/50"
                                                }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <BookOpen className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-foreground truncate text-sm font-medium">
                                                        {enrollment.course?.title ?? "Course"}
                                                    </div>
                                                    <div className="flex flex-row items-center gap-2 mt-1 space-y-1">
                                                        <Progress value={progressValue} className="h-1" />
                                                        <span className="text-muted-foreground text-[10px] mb-1 tabular-nums">
                                                            {completedLessons}/{lessonCount}
                                                        </span>

                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-foreground text-sm font-semibold">
                                        {selectedEnrollment?.course?.title}
                                    </h3>
                                    {selectedEnrollment?.course?.level ? (
                                        <Badge variant="outline" className="text-[10px]">
                                            {selectedEnrollment?.course.level}
                                        </Badge>
                                    ) : null}
                                    {selectedEnrollment?.course?.category ? (
                                        <Badge variant="outline" className="text-[10px]">
                                            {selectedEnrollment?.course.category}
                                        </Badge>
                                    ) : null}
                                    <Badge variant="outline" className="text-[10px]">
                                        {selectedCompletedLessons}/{selectedLessons.length} completed
                                    </Badge>
                                </div>


                                <div>
                                    <div className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                                        Lessons
                                    </div>
                                    {selectedLessons.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">
                                            No lessons published yet for this course.
                                        </p>
                                    ) : (
                                        <ol className="space-y-2">
                                            {selectedLessons.map((entry, index) => {
                                                const lesson = entry.lesson;
                                                const isDone = index < selectedCompletedLessons;
                                                const isNext = index === selectedCompletedLessons;

                                                return (
                                                    <li
                                                        key={lesson.uuid ?? `${selectedCourseId}-${index}`}
                                                        className={`border-border/60 bg-background rounded-md border p-3 ${isNext ? "border-primary/20 bg-primary/5" : ""}`}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 text-foreground truncate text-[13px] font-medium">
                                                                    {isDone ? (
                                                                        <CheckCircle2 className="text-success h-4 w-4 shrink-0" />
                                                                    ) : (
                                                                        <Circle className={`h-4 w-4 shrink-0 ${isNext ? "text-primary" : "text-muted-foreground"}`} />
                                                                    )}
                                                                    <span>{index + 1}.</span>
                                                                    <p className="truncate">{lesson.title}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-muted-foreground text-[10px] uppercase tracking-wide">
                                                                    {isDone ? "Done" : isNext ? "Up next" : "Upcoming"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ol>
                                    )}
                                </div>

                                <div>
                                    <div className="text-muted-foreground mt-6 mb-2 text-xs font-medium uppercase tracking-wide">
                                        Next steps
                                    </div>
                                    <div className="space-y-2">
                                        {actions.map((action) => {
                                            const Icon = action.icon;
                                            const content = (
                                                <div
                                                    className={`flex items-center gap-2 rounded-md border p-2 text-sm mb-2 transition-colors ${action.primary
                                                        ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                                                        : "border-border hover:border-primary hover:text-primary"
                                                        }`}
                                                >
                                                    <Icon className="h-4 w-4 shrink-0" />
                                                    <span className="flex-1 truncate">{action.label}</span>
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                </div>
                                            );

                                            if (action.external) {
                                                return (
                                                    <a key={action.key} href={action.external} target="_blank" rel="noreferrer">
                                                        {content}
                                                    </a>
                                                );
                                            }

                                            return (
                                                <Link key={action.key} href={{ pathname: action.href, query: action.query }}>
                                                    {content}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    <Button asChild size="sm" variant="outline">
                                        <Link href="/learning-hub">Open learning hub</Link>
                                    </Button>
                                    <Button asChild size="sm" variant="outline">
                                        <Link href="/learning-hub?tab=my-courses">My courses</Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            }}
        </AggregatedCourseLessons>
    );
}

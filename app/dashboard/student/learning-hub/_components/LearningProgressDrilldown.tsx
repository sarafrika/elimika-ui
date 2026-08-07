import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    ArrowRight,
    Award,
    BookOpen,
    Calendar as CalendarIcon,
    CheckCircle2,
    Circle,
    FileCheck2,
    PlayCircle,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type EnrolCourse = {
    id: string;
    status: string;
    course_id: string;
    course?: { id: string; title: string; category: string | null; level: string | null; duration_hours: number | null } | null;
    class?: { id: string; title: string | null; starts_at: string | null; meeting_link: string | null } | null;
};

// ============================================================================
// MOCK DATA
// ----------------------------------------------------------------------------
// The original file destructured `data.modules`, `data.assessments`, etc. from
// an empty `const data = {}`, which meant every lookup silently resolved to
// `undefined`. Below is sample data shaped the way a real query would return
// it, keyed to the same course ids used in the mock enrollments passed down
// from LessonHubDashboardTab (course-1, course-2, course-3). Swap
// `MOCK_LEARNING_DATA` for a real query result whenever a backend exists.
// ============================================================================

const MOCK_MODULES: { id: string; course_id: string; title: string; position: number }[] = [
    { id: "m1-1", course_id: "course-1", title: "HTML, CSS & the Modern Web", position: 1 },
    { id: "m1-2", course_id: "course-1", title: "JavaScript Fundamentals", position: 2 },
    { id: "m1-3", course_id: "course-1", title: "Building UIs with React", position: 3 },
    { id: "m1-4", course_id: "course-1", title: "APIs & Backend Basics", position: 4 },
    { id: "m1-5", course_id: "course-1", title: "Databases & Auth", position: 5 },
    { id: "m1-6", course_id: "course-1", title: "Capstone Project", position: 6 },

    { id: "m2-1", course_id: "course-2", title: "Python & Jupyter Basics", position: 1 },
    { id: "m2-2", course_id: "course-2", title: "Working with Pandas", position: 2 },
    { id: "m2-3", course_id: "course-2", title: "Data Cleaning & Wrangling", position: 3 },
    { id: "m2-4", course_id: "course-2", title: "Visualization with Matplotlib", position: 4 },
    { id: "m2-5", course_id: "course-2", title: "Capstone Analysis", position: 5 },

    { id: "m3-1", course_id: "course-3", title: "Marketing Foundations", position: 1 },
    { id: "m3-2", course_id: "course-3", title: "SEO & Content Strategy", position: 2 },
    { id: "m3-3", course_id: "course-3", title: "Paid Social & Ads", position: 3 },
    { id: "m3-4", course_id: "course-3", title: "Campaign Capstone", position: 4 },
];

const MOCK_ASSESSMENTS = [
    { id: "as-1", course_id: "course-1", title: "JavaScript Fundamentals Quiz" },
    { id: "as-2", course_id: "course-1", title: "React Practical Exam" },
    { id: "as-3", course_id: "course-2", title: "Pandas Skills Check" },
    { id: "as-4", course_id: "course-3", title: "SEO Strategy Review" },
];

const MOCK_ATTEMPTS = [
    { id: "att-1", assessment_id: "as-1", status: "submitted", score: 88 },
    { id: "att-2", assessment_id: "as-3", status: "in_progress", score: null },
];

const MOCK_CERTS = [
    { id: "cert-1", course_id: "course-3", code: "ELM-CERT-3391", revoked: false },
];

const MOCK_BOOKINGS = [
    {
        id: "bk-1",
        slot: { course_id: "course-1", starts_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
    },
    {
        id: "bk-2",
        slot: { course_id: "course-2", starts_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString() },
    },
];

const MOCK_LEARNING_DATA = {
    modules: MOCK_MODULES,
    assessments: MOCK_ASSESSMENTS,
    attempts: MOCK_ATTEMPTS,
    certs: MOCK_CERTS,
    bookings: MOCK_BOOKINGS,
};

// Deterministic per-module completion until a real lesson-completion table exists.
function completedCount(courseId: string, total: number): number {
    if (total === 0) return 0;
    let hash = 0;
    for (let i = 0; i < courseId.length; i++) hash = (hash * 31 + courseId.charCodeAt(i)) >>> 0;
    return Math.min(total, Math.floor((hash % 100) / 100 * total) + Math.floor(total / 3));
}

export function LearningProgressDrilldown({ enrollments }: { enrollments: EnrolCourse[] }) {
    const active = useMemo(() => enrollments.filter((e) => e.status === "active"), [enrollments]);
    const [selectedId, setSelectedId] = useState<string | null>(active[0]?.course?.id ?? null);
    const selectedCourseId = selectedId ?? active[0]?.course?.id ?? null;

    const data = MOCK_LEARNING_DATA;

    if (active.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Learning Progress</CardTitle>
                    <CardDescription>Drilldown per course with completed lessons and next actions</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Enrol in a course to start tracking progress.</p>
                </CardContent>
            </Card>
        );
    }

    const modulesByCourse = new Map<string, { id: string; title: string; position: number }[]>();
    for (const m of data.modules) {
        const arr = modulesByCourse.get(m.course_id) ?? [];
        arr.push(m as any);
        modulesByCourse.set(m.course_id, arr);
    }
    const perCourse = active.map((e) => {
        const cid = e.course!.id;
        const mods = (modulesByCourse.get(cid) ?? []).sort((a, b) => a.position - b.position);
        const total = mods.length || 6;
        const done = completedCount(cid, total);
        const pct = Math.round((done / total) * 100);
        return { enrolment: e, modules: mods, total, done, pct };
    });

    const overall = Math.round(perCourse.reduce((s, c) => s + c.pct, 0) / perCourse.length);
    const selected = perCourse.find((c) => c.enrolment.course?.id === selectedCourseId) ?? perCourse[0];

    const courseAssessments = data.assessments.filter((a) => a.course_id === selected.enrolment.course?.id);
    const attemptsByAssessment = new Map(data.attempts.map((a) => [a.assessment_id, a]));
    const pendingAssessments = courseAssessments.filter((a) => {
        const at = attemptsByAssessment.get(a.id);
        return !at || at.status !== "submitted";
    });
    const cert = data.certs.find((c) => c.course_id === selected.enrolment.course?.id && !c.revoked);
    const nowMs = Date.now();
    const nextBooking = data.bookings
        .filter((b) => b.slot?.course_id === selected.enrolment.course?.id && b.slot?.starts_at && new Date(b.slot.starts_at).getTime() >= nowMs)
        .sort((a, b) => new Date(a.slot.starts_at).getTime() - new Date(b.slot.starts_at).getTime())[0];

    const nextModule = selected.modules[selected.done] ?? null;
    const isComplete = selected.pct >= 100;

    const actions: { key: string; label: string; icon: any; href?: string; query?: Record<string, string>; external?: string; primary?: boolean }[] = [];
    if (isComplete && !cert) {
        actions.push({ key: "cert-claim", label: "Claim your certificate", icon: Award, href: "/learning-hub", query: { tab: "certificates" }, primary: true });
    } else if (nextModule) {
        actions.push({
            key: "resume",
            label: `Resume: ${nextModule.title}`,
            icon: PlayCircle,
            href: "/learning-hub",
            query: { tab: "lessons" },
            primary: true,
        });
    }
    if (pendingAssessments.length > 0) {
        actions.push({
            key: "assess",
            label: `Take assessment: ${pendingAssessments[0].title}`,
            icon: FileCheck2,
            href: "/learning-hub",
            query: { tab: "assessments" },
        });
    }
    if (nextBooking) {
        actions.push({
            key: "class",
            label: `Attend next class ${new Date(nextBooking.slot.starts_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`,
            icon: CalendarIcon,
            href: "/learning-hub",
            query: { tab: "my-classes" },
        });
    } else {
        actions.push({
            key: "book",
            label: "Book a session with an instructor",
            icon: Sparkles,
            href: "/start-course",
        });
    }
    if (cert) {
        actions.push({ key: "view-cert", label: "View / download certificate", icon: Award, external: `/certificate/${cert.code}` });
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardTitle className="text-base">Learning Progress</CardTitle>
                        <CardDescription>Per-course status, completed lessons, and next actions</CardDescription>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-muted-foreground">Overall</div>
                        <div className="text-lg font-semibold tabular-nums">{overall}%</div>
                    </div>
                </div>
                <Progress value={overall} className="mt-2 h-2" />
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[minmax(0,240px)_1fr]">
                {/* Course list */}
                <div className="space-y-1 md:border-r md:pr-3">
                    {perCourse.map(({ enrolment, done, total, pct }) => {
                        const cid = enrolment.course?.id;
                        const isSelected = cid === selected.enrolment.course?.id;
                        return (
                            <button
                                key={enrolment.id}
                                onClick={() => setSelectedId(cid ?? null)}
                                className={`w-full rounded-md border p-2 text-left transition-colors ${isSelected ? "border-[#0f4c81] bg-[#0f4c81]/5" : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#0f4c81]" />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium text-slate-900">{enrolment.course?.title ?? "Course"}</div>
                                        <div className="mt-0.5 flex items-center gap-2">
                                            <Progress value={pct} className="h-1 flex-1" />
                                            <span className="text-[10px] tabular-nums text-slate-500">{done}/{total}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Details */}
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{selected.enrolment.course?.title}</h3>
                        {selected.enrolment.course?.level && <Badge variant="outline" className="text-[10px]">{selected.enrolment.course.level}</Badge>}
                        {selected.enrolment.course?.category && <Badge variant="outline" className="text-[10px]">{selected.enrolment.course.category}</Badge>}
                        <Badge
                            className={`text-[10px] ${isComplete ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                }`}
                        >
                            {isComplete ? "Ready for certificate" : `${selected.pct}% complete`}
                        </Badge>
                    </div>

                    <div>
                        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Lessons</div>
                        {selected.modules.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No lessons published yet.</p>
                        ) : (
                            <ol className="space-y-1">
                                {selected.modules.map((m, i) => {
                                    const done = i < selected.done;
                                    const isNext = i === selected.done;
                                    return (
                                        <li
                                            key={m.id}
                                            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${isNext ? "bg-[#0f4c81]/5 font-medium text-slate-900" : "text-slate-700"
                                                }`}
                                        >
                                            {done ? (
                                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                            ) : (
                                                <Circle className={`h-4 w-4 shrink-0 ${isNext ? "text-[#0f4c81]" : "text-slate-300"}`} />
                                            )}
                                            <span className="flex-1 truncate">{i + 1}. {m.title}</span>
                                            {done && <span className="text-[10px] uppercase tracking-wide text-emerald-600">Done</span>}
                                            {isNext && <span className="text-[10px] uppercase tracking-wide text-[#0f4c81]">Up next</span>}
                                        </li>
                                    );
                                })}
                            </ol>
                        )}
                    </div>

                    <div>
                        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Next recommended actions</div>
                        <div className="space-y-1.5">
                            {actions.length === 0 ? (
                                <p className="text-xs text-muted-foreground">You’re all caught up.</p>
                            ) : (
                                actions.map((a) => {
                                    const Icon = a.icon;
                                    const content = (
                                        <div
                                            className={`flex items-center gap-2 rounded-md border p-2 text-sm transition-colors ${a.primary
                                                ? "border-[#0f4c81] bg-[#0f4c81] text-white hover:bg-[#0f4c81]/90"
                                                : "border-slate-200 hover:border-[#0f4c81] hover:text-[#0f4c81]"
                                                }`}
                                        >
                                            <Icon className="h-4 w-4 shrink-0" />
                                            <span className="flex-1 truncate">{a.label}</span>
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </div>
                                    );
                                    if (a.external) {
                                        return (
                                            <a key={a.key} href={a.external} target="_blank" rel="noreferrer">
                                                {content}
                                            </a>
                                        );
                                    }
                                    return (
                                        <Link key={a.key} href={{ pathname: a.href, query: a.query }}>
                                            {content}
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                        <Button asChild size="sm" variant="outline">
                            <Link href="/learning-hub">Open course</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                            <Link href="/learning-hub">My classes</Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
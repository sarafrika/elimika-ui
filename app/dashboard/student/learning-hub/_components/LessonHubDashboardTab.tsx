import { Progress } from "@radix-ui/react-progress";
import { AlertCircle, ArrowRight, Award, Bell, BookOpen, CalendarIcon, CheckCircle2, ClipboardList, Clock, FileCheck2, Flame, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select";
import { LearningProgressDrilldown } from "./LearningProgressDrilldown";
import { LearningHubData } from "./useStudentLearningHubData";

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

const MOCK_ENROLLMENTS = [
    {
        id: "enr-1",
        status: "active",
        course_id: "course-1",
        created_at: new Date(now - 20 * day).toISOString(),
        course: { id: "course-1", title: "Full-Stack Web Development", category: "Technology", level: "Intermediate", duration_hours: 96, duration_weeks: 12 },
        instructor: { name: "Amina Kariuki" },
        class: {
            id: "cls-1",
            title: "Live Session: React Hooks Deep Dive",
            starts_at: new Date(now + 2 * day + 3 * 60 * 60 * 1000).toISOString(),
            meeting_link: "https://meet.example.com/react-hooks",
            venue: null,
            delivery_mode: "Online",
        },
    },
    {
        id: "enr-2",
        status: "active",
        course_id: "course-2",
        created_at: new Date(now - 9 * day).toISOString(),
        course: { id: "course-2", title: "Data Analysis with Python", category: "Data Science", level: "Beginner", duration_hours: 60, duration_weeks: 8 },
        instructor: { name: "Brian Otieno" },
        class: {
            id: "cls-2",
            title: "Workshop: Pandas Data Wrangling",
            starts_at: new Date(now + 5 * day + 5 * 60 * 60 * 1000).toISOString(),
            meeting_link: null,
            venue: "Elimika Hub, Nairobi",
            delivery_mode: "In-person",
        },
    },
    {
        id: "enr-3",
        status: "completed",
        course_id: "course-3",
        created_at: new Date(now - 90 * day).toISOString(),
        course: { id: "course-3", title: "Digital Marketing Essentials", category: "Business", level: "Beginner", duration_hours: 40, duration_weeks: 6 },
        instructor: { name: "Faith Njeri" },
        class: null,
    },
];

const MOCK_ATTENDANCE = [
    { id: "att-1", status: "present" },
    { id: "att-2", status: "present" },
    { id: "att-3", status: "present" },
    { id: "att-4", status: "absent" },
    { id: "att-5", status: "present" },
    { id: "att-6", status: "present" },
    { id: "att-7", status: "present" },
    { id: "att-8", status: "absent" },
];

const MOCK_GRADES = [
    { id: "g1", score: 88 },
    { id: "g2", score: 74 },
    { id: "g3", score: 91 },
];

const MOCK_REMINDER_ITEMS = [
    {
        kind: "assignment" as const,
        id: "asg-1",
        title: "Submit Portfolio Project Proposal",
        course: "Full-Stack Web Development",
        dueMs: now + 1 * day,
        overdue: false,
    },
    {
        kind: "assessment" as const,
        id: "as-3",
        title: "Pandas Skills Check",
        course: "Data Analysis with Python",
        dueMs: null,
        overdue: false,
        duration: 30,
    },
    {
        kind: "assignment" as const,
        id: "asg-2",
        title: "Peer Review: Landing Page Mockup",
        course: "Full-Stack Web Development",
        dueMs: now - 1 * day,
        overdue: true,
    },
];

// ---------- Dashboard ----------
interface LearningHubDataProps {
    learningHubData: LearningHubData
}

export function LessonHubDashboardTab({ learningHubData }: LearningHubDataProps) {
    const isLoading = false;
    const data = {
        enrollments: MOCK_ENROLLMENTS,
        attendance: MOCK_ATTENDANCE,
        grades: MOCK_GRADES,
    };

    console.log(learningHubData, "LH DATA")

    const enrollments = data.enrollments;
    const active = enrollments.filter((e: any) => e.status === "active");
    const completed = enrollments.filter((e: any) => e.status === "completed");
    const upcoming = enrollments
        .filter((e: any) => e.class?.starts_at && new Date(e.class.starts_at).getTime() >= now)
        .sort((a: any, b: any) => new Date(a.class.starts_at).getTime() - new Date(b.class.starts_at).getTime());
    const nextClass = upcoming[0];
    const att = data.attendance;
    const attendanceRate = att.length
        ? Math.round((att.filter((a: any) => a.status === "present").length / att.length) * 100)
        : 0;
    const grades = data.grades;
    const avgScore = grades.length
        ? Math.round(grades.reduce((s: number, g: any) => s + (Number(g.score) || 0), 0) / grades.length)
        : 0;

    // Filter + sort controls for Active Courses widget
    const [courseCategory, setCourseCategory] = useState<string>("all");
    const [courseLevel, setCourseLevel] = useState<string>("all");
    const [courseSort, setCourseSort] = useState<"recent" | "title" | "duration">("recent");
    const courseCategories = Array.from(new Set(active.map((e: any) => e.course?.category).filter(Boolean))) as string[];
    const courseLevels = Array.from(new Set(active.map((e: any) => e.course?.level).filter(Boolean))) as string[];
    const activeView = [...active]
        .filter((e: any) => courseCategory === "all" || e.course?.category === courseCategory)
        .filter((e: any) => courseLevel === "all" || e.course?.level === courseLevel)
        .sort((a: any, b: any) => {
            if (courseSort === "title") return (a.course?.title ?? "").localeCompare(b.course?.title ?? "");
            if (courseSort === "duration") return (b.course?.duration_weeks ?? 0) - (a.course?.duration_weeks ?? 0);
            return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
        });

    // Filter + sort controls for Upcoming Classes widget
    const [classMode, setClassMode] = useState<string>("all");
    const [classWindow, setClassWindow] = useState<"all" | "today" | "week">("all");
    const [classSort, setClassSort] = useState<"soonest" | "latest" | "title">("soonest");
    const classModes = Array.from(new Set(upcoming.map((e: any) => e.class?.delivery_mode).filter(Boolean))) as string[];
    const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
    const endOfWeek = new Date(now + 7 * day);
    const upcomingView = upcoming
        .filter((e: any) => classMode === "all" || e.class?.delivery_mode === classMode)
        .filter((e: any) => {
            const t = new Date(e.class.starts_at).getTime();
            if (classWindow === "today") return t <= endOfToday.getTime();
            if (classWindow === "week") return t <= endOfWeek.getTime();
            return true;
        })
        .sort((a: any, b: any) => {
            const ta = new Date(a.class.starts_at).getTime();
            const tb = new Date(b.class.starts_at).getTime();
            if (classSort === "title") return (a.class?.title ?? a.course?.title ?? "").localeCompare(b.class?.title ?? b.course?.title ?? "");
            if (classSort === "latest") return tb - ta;
            return ta - tb;
        });

    if (isLoading) {
        return <p className="text-sm text-muted-foreground">Loading your dashboard…</p>;
    }

    return (
        <div className="space-y-6">
            {/* Top stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Active Courses" value={active.length} icon={BookOpen} tint="bg-blue-50 text-blue-700" href="/learning-hub" query={{ tab: "my-courses" }} />
                <StatCard label="Upcoming Classes" value={upcoming.length} icon={CalendarIcon} tint="bg-indigo-50 text-indigo-700" href="/learning-hub" query={{ tab: "my-classes" }} />
                <StatCard label="Attendance" value={`${attendanceRate}%`} icon={Users} tint="bg-orange-50 text-orange-700" href="/attendance" />
                <StatCard label="Certificates" value={completed.length} icon={Award} tint="bg-emerald-50 text-emerald-700" href="/learning-hub" query={{ tab: "certificates" }} />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Continue learning */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <div>
                            <CardTitle className="text-base">Continue Learning</CardTitle>
                            <CardDescription>Pick up from your last active course</CardDescription>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="text-[#0f4c81]">
                            <Link href={{ pathname: "/learning-hub", query: { tab: "my-courses" } }}>
                                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {active.length === 0 ? (
                            <EmptyBrowse />
                        ) : (
                            active.slice(0, 3).map((e: any) => {
                                const p = courseProgressPct(e.course_id);
                                return (
                                    <Link
                                        key={e.id}
                                        href={`/courses/${e.course_id}`}
                                        className="block rounded-lg border p-4 transition-colors hover:border-[#0f4c81]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{e.course?.title ?? "Course"}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {e.course?.category ?? ""}
                                                    {e.instructor?.name ? ` · ${e.instructor.name}` : ""}
                                                </p>
                                            </div>
                                            <span className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium">
                                                Resume <ArrowRight className="h-3 w-3 ml-1" />
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center gap-3">
                                            <Progress value={p} className="flex-1" />
                                            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{p}%</span>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </CardContent>
                </Card>

                {/* Next class */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#0f4c81]" /> Next Class
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {nextClass ? (
                            <>
                                <Link
                                    href={`/courses/${nextClass.course_id}`}
                                    className="block rounded-md -m-1 p-1 transition-colors hover:bg-muted/50"
                                >
                                    <p className="text-sm font-medium">{nextClass.class?.title ?? nextClass.course?.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(nextClass.class!.starts_at!).toLocaleString()}
                                    </p>
                                    {nextClass.class?.venue && (
                                        <p className="text-xs text-muted-foreground">Venue: {nextClass.class.venue}</p>
                                    )}
                                </Link>
                                {nextClass.class?.meeting_link ? (
                                    <Button asChild size="sm" className="w-full bg-[#14b8a6] hover:bg-[#14b8a6]/90">
                                        <a href={nextClass.class.meeting_link} target="_blank" rel="noreferrer">Join Meeting</a>
                                    </Button>
                                ) : (
                                    <Button asChild size="sm" variant="outline" className="w-full">
                                        <Link href="/learning-hub">View class details</Link>
                                    </Button>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">No upcoming classes scheduled.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Active Courses widget + Upcoming Classes list */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-[#0f4c81]" /> Active Courses
                            </CardTitle>
                            <CardDescription>Your currently enrolled programmes</CardDescription>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="text-[#0f4c81]">
                            <Link href="/learning-hub">
                                Manage <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Link>
                        </Button>
                    </CardHeader>
                    {active.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
                            <Select value={courseCategory} onValueChange={setCourseCategory}>
                                <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All categories</SelectItem>
                                    {courseCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={courseLevel} onValueChange={setCourseLevel}>
                                <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="Level" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All levels</SelectItem>
                                    {courseLevels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={courseSort} onValueChange={(v) => setCourseSort(v as any)}>
                                <SelectTrigger className="h-8 w-[150px] text-xs ml-auto"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="recent">Recently enrolled</SelectItem>
                                    <SelectItem value="title">Title (A–Z)</SelectItem>
                                    <SelectItem value="duration">Longest first</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <CardContent className="space-y-2">
                        {active.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No active courses.</p>
                        ) : activeView.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No courses match the current filters.</p>
                        ) : (
                            activeView.slice(0, 5).map((e: any) => (
                                <Link
                                    key={e.id}
                                    href={`/courses/${e.course_id}`}
                                    className="flex items-center justify-between rounded-md border p-3 transition-colors hover:border-[#0f4c81]"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{e.course?.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {[e.course?.category, e.course?.level].filter(Boolean).join(" · ")}
                                        </p>
                                    </div>
                                    <Badge variant="outline">{e.course?.duration_weeks ? `${e.course.duration_weeks}w` : "—"}</Badge>
                                </Link>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-[#0f4c81]" /> Upcoming Classes
                            </CardTitle>
                            <CardDescription>Next scheduled sessions</CardDescription>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="text-[#0f4c81]">
                            <Link href="/learning-hub">
                                Calendar <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Link>
                        </Button>
                    </CardHeader>
                    {upcoming.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
                            <Select value={classMode} onValueChange={setClassMode}>
                                <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Mode" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All modes</SelectItem>
                                    {classModes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={classWindow} onValueChange={(v) => setClassWindow(v as any)}>
                                <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All upcoming</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="week">Next 7 days</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={classSort} onValueChange={(v) => setClassSort(v as any)}>
                                <SelectTrigger className="h-8 w-[140px] text-xs ml-auto"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="soonest">Soonest first</SelectItem>
                                    <SelectItem value="latest">Latest first</SelectItem>
                                    <SelectItem value="title">Title (A–Z)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <CardContent className="space-y-2">
                        {upcoming.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No upcoming classes.</p>
                        ) : upcomingView.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No classes match the current filters.</p>
                        ) : (
                            upcomingView.slice(0, 5).map((e: any) => (
                                <div key={e.id} className="flex items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:border-[#0f4c81]">
                                    <Link href={`/courses/${e.course_id}`} className="min-w-0 flex-1">
                                        <p className="text-sm font-medium truncate">{e.class?.title ?? e.course?.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(e.class.starts_at).toLocaleString([], {
                                                weekday: "short",
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                            {e.class?.delivery_mode ? ` · ${e.class.delivery_mode}` : ""}
                                        </p>
                                    </Link>
                                    {e.class?.meeting_link ? (
                                        <Button asChild size="sm" variant="outline">
                                            <a href={e.class.meeting_link} target="_blank" rel="noreferrer">Join</a>
                                        </Button>
                                    ) : (
                                        <Button asChild size="sm" variant="outline">
                                            <Link href="/learning-hub">Details</Link>
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Assignments / Assessments / Certificates */}
            <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard
                    title="Assignments"
                    icon={ClipboardList}
                    tint="bg-amber-50 text-amber-700"
                    primary="2"
                    secondary="Pending submissions"
                    ctaLabel="Open Assignments"
                    href="/learning-hub"
                    query={{ tab: "assignments" }}
                />
                <SummaryCard
                    title="Assessments"
                    icon={FileCheck2}
                    tint="bg-violet-50 text-violet-700"
                    primary={grades.length ? String(grades.length) : "0"}
                    secondary={avgScore ? `Avg. score ${avgScore}%` : "No results yet"}
                    ctaLabel="View Assessments"
                    href="/learning-hub"
                    query={{ tab: "assessments" }}
                />
                <SummaryCard
                    title="Certificates"
                    icon={Award}
                    tint="bg-emerald-50 text-emerald-700"
                    primary={String(completed.length)}
                    secondary={completed.length ? "Ready to download" : "Complete a course to earn one"}
                    ctaLabel="View Certificates"
                    href="/learning-hub"
                    query={{ tab: "certificates" }}
                />
            </div>

            {/* Reminders — next deadlines */}
            <RemindersWidget />

            {/* Learning Progress — drilldown */}
            <LearningProgressDrilldown enrollments={enrollments as any} />

            {/* Streak + Weekly + AI recs */}
            <div className="grid gap-4 lg:grid-cols-3">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Flame className="h-4 w-4 text-orange-500" /> Learning Streak
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold">5 days</p>
                        <p className="text-xs text-muted-foreground">Study today to extend your streak.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Weekly Study Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold">6.5 h</p>
                        <Progress value={65} className="mt-2" />
                        <p className="mt-1 text-xs text-muted-foreground">Target: 10 h / week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-[#0f4c81]" /> AI Recommendations
                        </CardTitle>
                        <CardDescription>Personalised to your interests</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <RecommendItem label="Continue: Python for Data Analysis" />
                        <RecommendItem label="Try: SEO & Digital Marketing" />
                        <RecommendItem label="Book: UX mentor (avg. 4.9★)" />
                    </CardContent>
                </Card>
            </div>

            {/* Quick actions */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline"><Link href="/learning-hub">Continue Learning</Link></Button>
                    <Button asChild size="sm" variant="outline"><Link href="/dashboard/student/courses">Browse Courses</Link></Button>
                    <Button asChild size="sm" variant="outline"><Link href="/dashboard/student/courses">Join Class</Link></Button>
                    <Button asChild size="sm" variant="outline"><Link href="/dashboard/student/courses">Search Instructor</Link></Button>
                    <Button asChild size="sm" variant="outline"><Link href="/dashboard/student/calendar">View Calendar</Link></Button>
                </CardContent>
            </Card>
        </div>
    );
}

// Deterministic mock progress percentage per course, used for the "Continue Learning" cards.
function courseProgressPct(courseId: string): number {
    let hash = 0;
    for (let i = 0; i < courseId.length; i++) hash = (hash * 31 + courseId.charCodeAt(i)) >>> 0;
    return 20 + (hash % 70); // 20–89%
}

function RemindersWidget() {
    const isLoading = false;
    const data = { items: MOCK_REMINDER_ITEMS };

    const [ack, setAck] = useState<Set<string>>(new Set());
    const [pendingAssignmentId, setPendingAssignmentId] = useState<string | null>(null);

    const allItems = data.items;
    const items = allItems.filter((it) => !ack.has(`${it.kind}:${it.id}`)).slice(0, 6);

    const fmtDue = (ms: number | null) => {
        if (ms === null) return "No due date";
        const diff = ms - Date.now();
        const abs = Math.abs(diff);
        const oneDay = 24 * 60 * 60 * 1000;
        const d = new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        if (diff < 0) return `Overdue · ${d}`;
        if (abs < oneDay) return `Due today · ${new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
        if (abs < 2 * oneDay) return `Due tomorrow · ${d}`;
        return `Due ${d}`;
    };

    const acknowledge = (key: string) => {
        setAck((prev) => new Set(prev).add(key));
    };

    const clearAcknowledged = () => {
        setAck(new Set());
    };

    const handleMarkAssignment = (id: string) => {
        setPendingAssignmentId(id);
        // Simulate a mutation round-trip; replace with a real API call when available.
        setTimeout(() => {
            acknowledge(`assignment:${id}`);
            setPendingAssignmentId(null);
        }, 500);
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Bell className="h-4 w-4 text-[#0f4c81]" /> Reminders
                        </CardTitle>
                        <CardDescription>Next deadlines for assignments and assessments</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {ack.size > 0 && (
                            <Button size="sm" variant="ghost" onClick={clearAcknowledged}>
                                Restore ({ack.size})
                            </Button>
                        )}
                        <Badge variant="secondary">{items.length}</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading reminders…</p>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        <p className="text-sm text-muted-foreground">You're all caught up. No pending deadlines.</p>
                    </div>
                ) : (
                    items.map((it) => {
                        const isAssign = it.kind === "assignment";
                        const key = `${it.kind}:${it.id}`;
                        const pending = isAssign && pendingAssignmentId === it.id;
                        return (
                            <div
                                key={key}
                                className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between"
                            >
                                <div className="flex items-start gap-3 min-w-0">
                                    <div
                                        className={`mt-0.5 rounded-md p-1.5 ${it.overdue
                                            ? "bg-red-50 text-red-700"
                                            : isAssign
                                                ? "bg-amber-50 text-amber-700"
                                                : "bg-violet-50 text-violet-700"
                                            }`}
                                    >
                                        {it.overdue ? (
                                            <AlertCircle className="h-4 w-4" />
                                        ) : isAssign ? (
                                            <ClipboardList className="h-4 w-4" />
                                        ) : (
                                            <FileCheck2 className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{it.title}</p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {it.course ?? "Course"} · {isAssign ? "Assignment" : "Assessment"}
                                        </p>
                                        <p className={`text-xs mt-0.5 ${it.overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                                            {isAssign ? fmtDue(it.dueMs) : it.duration ? `${it.duration} min · not started` : "Not started"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                                    {isAssign ? (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            disabled={pending}
                                            onClick={() => handleMarkAssignment(it.id)}
                                        >
                                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                            {pending ? "Saving…" : "Mark done"}
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="secondary" onClick={() => acknowledge(key)}>
                                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                            Acknowledge
                                        </Button>
                                    )}
                                    <Button asChild size="sm" variant={it.overdue ? "default" : "outline"}>
                                        <Link href={{ pathname: "/learning-hub", query: { tab: isAssign ? "assignments" : "assessments" } }}>
                                            Open
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}

function StatCard({ label, value, icon: Icon, tint, href, query }: { label: string; value: React.ReactNode; icon: any; tint: string; href?: string; query?: Record<string, string> }) {
    const body = (
        <Card className={href ? "cursor-pointer transition-colors hover:border-[#0f4c81]" : ""}>
            <CardContent className="flex items-center gap-3 ">
                <div className={`h-10 w-10 rounded-lg grid place-items-center ${tint}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xl font-semibold tabular-nums">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
    if (!href) return body;
    return <Link href={{ pathname: href, query }} className="block">{body}</Link>;
}

function EmptyBrowse() {
    return (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">You aren't enrolled in any courses yet.</p>
            <Button asChild><Link href="/dashboard/student/start-course">Browse courses</Link></Button>
        </div>
    );
}

function RecommendItem({ label }: { label: string }) {
    return (
        <div className="flex items-center justify-between rounded-md border p-2">
            <span className="truncate">{label}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
    );
}

function SummaryCard({
    title,
    icon: Icon,
    tint,
    primary,
    secondary,
    ctaLabel,
    href,
    query,
}: {
    title: string;
    icon: any;
    tint: string;
    primary: string;
    secondary: string;
    ctaLabel: string;
    href: string;
    query?: Record<string, string>;
}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{title}</CardTitle>
                    <div className={`h-8 w-8 rounded-md grid place-items-center ${tint}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div>
                    <p className="text-2xl font-semibold tabular-nums">{primary}</p>
                    <p className="text-xs text-muted-foreground">{secondary}</p>
                </div>
                <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={{ pathname: href, query }}>{ctaLabel}</Link>
                </Button>
            </CardContent>
        </Card>
    );
}
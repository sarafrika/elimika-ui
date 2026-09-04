'use client';

import { Progress } from '@radix-ui/react-progress';
import type { LucideIcon } from 'lucide-react';
import {
    AlertCircle,
    ArrowRight,
    Award,
    Bell,
    BookOpen,
    CalendarIcon,
    CheckCircle2,
    ClipboardList,
    Clock,
    FileCheck2,
    Flame,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type ComponentType, type ReactNode } from 'react';

import { useUserDomain } from '@/src/features/dashboard/context/user-domain-context';
import { roleScopedDashboardPath } from '@/src/features/dashboard/lib/active-domain-storage';
import {
    getDueSummary,
    getStudentAssignmentSubmissionState,
    useStudentAssignmentData,
    type StudentAssignmentRow,
} from '@/src/features/dashboard/student-assessment/useStudentAssignmentData';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import { LearningProgressDrilldown } from './LearningProgressDrilldown';
import { useLearningHubStudyMetrics } from './useLearningHubStudyMetrics';
import { LearningHubData } from './useStudentLearningHubData';

type LearningProgressDrilldownProps = Parameters<typeof LearningProgressDrilldown>[0];

type EnrolCourse = {
    id: string;
    status: string;
    course_id: string;
    created_at: string;
    course?: {
        id: string;
        title: string;
        category: string | null;
        level: string | null;
        duration_hours: number | null;
    } | null;
    class?: {
        id: string;
        title: string | null;
        starts_at: string | null;
        meeting_link: string | null;
        venue: string | null;
        delivery_mode: string | null;
    } | null;
    instructor?: { name: string } | null;
};

const day = 24 * 60 * 60 * 1000;

interface LearningHubDataProps {
    learningHubData: LearningHubData;
}

function isClassJoinable(item: {
    startTime: string | Date
}) {
    const startMs = new Date(item.startTime).getTime()

    if (Number.isNaN(startMs)) {
        return false
    }

    const joinTime = startMs - 15 * 60 * 1000

    return Date.now() >= joinTime
}

export function LessonHubDashboardTab({ learningHubData }: LearningHubDataProps) {
    const router = useRouter()
    const { assignmentRows, isLoading: assignmentsLoading } = useStudentAssignmentData();
    const { activeDomain } = useUserDomain();
    const { studyStreakDays, weeklyStudyMinutes } = useLearningHubStudyMetrics();

    const activeCourses = learningHubData.activeCourses;
    const upcomingClasses = learningHubData.upcomingClasses;
    const nextClass = learningHubData.nextClass;
    const continueLearning = learningHubData.continueLearning;

    const completedCourses = continueLearning.filter(item => item.progress === 100).length;
    const pendingAssignments = assignmentRows.filter(row => {
        const state = getStudentAssignmentSubmissionState(row);
        return state.key === 'pending' || state.key === 'returned';
    }).length;

    const [courseCategory, setCourseCategory] = useState<string>('all');
    const [courseLevel, setCourseLevel] = useState<string>('all');
    const [courseSort, setCourseSort] = useState<'recent' | 'title' | 'duration'>('recent');
    const courseCategories = Array.from(new Set(activeCourses.map(course => course.category).filter(Boolean)));
    const courseLevels = Array.from(new Set(activeCourses.map(course => course.level).filter(Boolean)));
    const active = useMemo<EnrolCourse[]>(
        () =>
            activeCourses.map((course, index) => ({
                id: course.id,
                status: 'active',
                course_id: course.id,
                created_at: new Date(Date.now() - index * day).toISOString(),
                course: {
                    id: course.id,
                    title: course.title,
                    category: course.category,
                    level: course.level,
                    duration_hours: null,
                },
                instructor: null,
                class: null,
            })),
        [activeCourses]
    );
    const activeView = [...active]
        .filter(
            enrollment =>
                courseCategory === 'all' || enrollment.course?.category === courseCategory
        )
        .filter(
            enrollment => courseLevel === 'all' || enrollment.course?.level === courseLevel
        )
        .sort((a, b) => {
            if (courseSort === 'title') {
                return (a.course?.title ?? '').localeCompare(b.course?.title ?? '');
            }
            if (courseSort === 'duration') {
                return 0;
            }
            return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
        });

    const [classMode, setClassMode] = useState<string>('all');
    const [classWindow, setClassWindow] = useState<'all' | 'today' | 'week'>('all');
    const [classSort, setClassSort] = useState<'soonest' | 'latest' | 'title'>('soonest');
    const classModes = Array.from(
        new Set(upcomingClasses.map(item => item.locationLabel).filter(Boolean))
    );
    const now = Date.now();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const endOfWeek = new Date(now + 7 * day);
    const upcomingView = upcomingClasses
        .filter(item => classMode === 'all' || item.locationLabel === classMode)
        .filter(item => {
            const t = item.startMs ?? Number.NaN;
            if (Number.isNaN(t)) return true;
            if (classWindow === 'today') return t <= endOfToday.getTime();
            if (classWindow === 'week') return t <= endOfWeek.getTime();
            return true;
        })
        .sort((a, b) => {
            const ta = a.startMs ?? 0;
            const tb = b.startMs ?? 0;
            if (classSort === 'title') return (a.title ?? '').localeCompare(b.title ?? '');
            if (classSort === 'latest') return tb - ta;
            return ta - tb;
        });


    const assignmentRowsSorted = useMemo(
        () =>
            [...assignmentRows]
                .sort((a, b) => {
                    const aDue = new Date(a.schedule?.due_at ?? a.assignment?.due_date ?? 0).getTime();
                    const bDue = new Date(b.schedule?.due_at ?? b.assignment?.due_date ?? 0).getTime();
                    return aDue - bDue;
                })
                .slice(0, 3),
        [assignmentRows]
    );

    const enrollmentForProgress = useMemo<EnrolCourse[]>(
        () =>
            activeCourses.map((course, index) => ({
                id: course.id,
                status: 'active',
                course_id: course.id,
                created_at: new Date(Date.now() - index * day).toISOString(),
                course: {
                    id: course.id,
                    title: course.title,
                    category: course.category,
                    level: course.level,
                    duration_hours: null,
                },
                class: nextClass
                    ? {
                        id: nextClass.id,
                        title: nextClass.title,
                        starts_at: nextClass.dateLabel,
                        meeting_link: null,
                        venue: nextClass.locationLabel,
                        delivery_mode: null,
                    }
                    : null,
            })),
        [activeCourses, nextClass]
    );

    if (learningHubData.loading || assignmentsLoading) {
        return <LessonHubDashboardSkeleton />;
    }

    return (
        <div className='space-y-6'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <StatCard
                    label='Active Courses'
                    value={active.length}
                    icon={BookOpen}
                    tint='bg-primary/5 text-primary'
                    href='/dashboard/student/learning-hub'
                    query={{ tab: 'my-courses' }}
                />
                <StatCard
                    label='Upcoming Classes'
                    value={upcomingView.length}
                    icon={CalendarIcon}
                    tint='bg-secondary text-secondary-foreground'
                    href='/dashboard/student/learning-hub'
                    query={{ tab: 'my-classes' }}
                />
                <StatCard
                    label='Assignments Due'
                    value={pendingAssignments}
                    icon={ClipboardList}
                    tint='bg-warning/5 text-warning'
                    href='/dashboard/student/learning-hub'
                    query={{ tab: 'assignments' }}
                />
                <StatCard
                    label='Completed Courses'
                    value={completedCourses}
                    icon={Award}
                    tint='bg-success/5 text-success'
                    href='/dashboard/student/learning-hub'
                    query={{ tab: 'certificates' }}
                />
            </div>

            <div className='grid gap-4 lg:grid-cols-3'>
                <Card className='lg:col-span-2'>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
                        <div>
                            <CardTitle className='text-base'>Continue Learning</CardTitle>
                            <CardDescription>Pick up from your last active course</CardDescription>
                        </div>
                        <Button asChild variant='ghost' size='sm' className='text-primary'>
                            <Link href={{ pathname: '/dashboard/student/learning-hub', query: { tab: 'my-courses' } }}>
                                View all <ArrowRight className='ml-1 h-3.5 w-3.5' />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        {active.length === 0 ? (
                            <EmptyBrowse activeDomain={activeDomain} />
                        ) : (
                            continueLearning.slice(0, 3).map(item => {
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className='block rounded-lg border p-4 transition-colors hover:border-primary'
                                    >
                                        <div className='flex items-start justify-between gap-3'>
                                            <div className='min-w-0'>
                                                <p className='truncate font-medium'>{item.title || 'Course'}</p>
                                                <p className='text-muted-foreground text-xs'>
                                                    {item.courseName}
                                                </p>
                                            </div>
                                            <span className='inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium'>
                                                Resume <ArrowRight className='ml-1 h-3 w-3' />
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center gap-3">
                                            <div className="h-2 flex-1 rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-muted-foreground"
                                                    style={{ width: `${item.progress}%` }}
                                                />
                                            </div>
                                            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{item.progress}%</span>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className=''>
                        <CardTitle className='flex items-center gap-2 text-base'>
                            <Clock className='text-primary h-4 w-4' /> Next Class
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        {nextClass ? (
                            <div
                                className={cn(
                                    'block rounded-md px-3 py-2 transition-colors',
                                    !isClassJoinable(nextClass)
                                        ? 'pointer-events-none cursor-not-allowed opacity-50'
                                        : 'hover:bg-muted/50'
                                )}
                                aria-disabled={!isClassJoinable(nextClass)}
                            >
                                <Link
                                    href={!isClassJoinable(nextClass) ? '#' : nextClass.href}
                                    className='space-y-1'
                                    tabIndex={!isClassJoinable(nextClass) ? -1 : 0}
                                >
                                    <p className='text-sm font-medium'>{nextClass.title}</p>
                                    <p className='text-muted-foreground text-xs'>
                                        {nextClass.courseName}
                                    </p>
                                    <p className='text-muted-foreground text-xs'>
                                        {nextClass.dateLabel} · {nextClass.timeLabel}
                                    </p>
                                </Link>

                                <Button
                                    asChild
                                    size='sm'
                                    variant='success'
                                    disabled={!isClassJoinable(nextClass)}
                                    className='mt-1 w-full rounded disabled:cursor-not-allowed'
                                >
                                    <p>Join Class</p>
                                </Button>
                            </div>
                        ) : (
                            <p className='text-sm text-muted-foreground'>
                                No upcoming classes scheduled.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className='grid gap-4 lg:grid-cols-2'>
                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
                        <div>
                            <CardTitle className='flex items-center gap-2 text-base'>
                                <BookOpen className='text-primary h-4 w-4' /> Active Courses
                            </CardTitle>
                            <CardDescription>Your currently enrolled programmes</CardDescription>
                        </div>

                        {/* // switch to tab my-courses */}
                        <Button asChild variant='ghost' size='sm' className='rounded-sm text-primary'>
                            <Link href='/dashboard/student/learning-hub?tab=my-courses'>
                                Manage <ArrowRight className='ml-1 h-3.5 w-3.5' />
                            </Link>
                        </Button>
                    </CardHeader>
                    {active.length > 0 && (
                        <div className='flex flex-wrap items-center gap-2 px-6 pb-3'>
                            <Select value={courseCategory} onValueChange={setCourseCategory}>
                                <SelectTrigger className='h-8 w-[140px] text-xs'>
                                    <SelectValue placeholder='Category' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='all'>All categories</SelectItem>
                                    {courseCategories.map(category => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={courseLevel} onValueChange={setCourseLevel}>
                                <SelectTrigger className='h-8 w-[120px] text-xs'>
                                    <SelectValue placeholder='Level' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='all'>All levels</SelectItem>
                                    {courseLevels.map(level => (
                                        <SelectItem key={level} value={level}>
                                            {level}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={courseSort} onValueChange={value => setCourseSort(value as typeof courseSort)}>
                                <SelectTrigger className='ml-auto h-8 w-[150px] text-xs'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='recent'>Recently enrolled</SelectItem>
                                    <SelectItem value='title'>Title (A–Z)</SelectItem>
                                    <SelectItem value='duration'>Longest first</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <CardContent className='space-y-2'>
                        {active.length === 0 ? (
                            <p className='text-sm text-muted-foreground'>No active courses.</p>
                        ) : activeView.length === 0 ? (
                            <p className='text-sm text-muted-foreground'>No courses match the current filters.</p>
                        ) : (
                            activeView.slice(0, 5).map(enrollment => (
                                <Link
                                    key={enrollment.id}
                                    href='/dashboard/student/learning-hub'
                                    className='flex items-center justify-between rounded-md border p-3 transition-colors hover:border-primary'
                                >
                                    <div className='min-w-0'>
                                        <p className='truncate text-sm font-medium'>{enrollment.course?.title}</p>
                                        <p className='text-muted-foreground truncate text-xs'>
                                            {[enrollment.course?.category, enrollment.course?.level]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>
                                    </div>
                                    <Badge variant='outline'>Active</Badge>
                                </Link>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
                        <div>
                            <CardTitle className='flex items-center gap-2 text-base'>
                                <CalendarIcon className='text-primary h-4 w-4' /> Upcoming Classes
                            </CardTitle>
                            <CardDescription>Next scheduled sessions</CardDescription>
                        </div>
                        <Button asChild variant='ghost' size='sm' className='rounded-sm text-primary'>
                            <Link href='/dashboard/student/calendar'>
                                Calendar <ArrowRight className='ml-1 h-3.5 w-3.5' />
                            </Link>
                        </Button>
                    </CardHeader>
                    {upcomingClasses.length > 0 && (
                        <div className='flex flex-wrap items-center gap-2 px-6 pb-3'>
                            <Select value={classMode} onValueChange={setClassMode}>
                                <SelectTrigger className='h-8 w-[130px] text-xs'>
                                    <SelectValue placeholder='Location' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='all'>All locations</SelectItem>
                                    {classModes.map(mode => (
                                        <SelectItem key={mode} value={mode}>
                                            {mode}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={classWindow} onValueChange={value => setClassWindow(value as typeof classWindow)}>
                                <SelectTrigger className='h-8 w-[130px] text-xs'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='all'>All upcoming</SelectItem>
                                    <SelectItem value='today'>Today</SelectItem>
                                    <SelectItem value='week'>Next 7 days</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={classSort} onValueChange={value => setClassSort(value as typeof classSort)}>
                                <SelectTrigger className='ml-auto h-8 w-[140px] text-xs'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='soonest'>Soonest first</SelectItem>
                                    <SelectItem value='latest'>Latest first</SelectItem>
                                    <SelectItem value='title'>Title (A–Z)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <CardContent className='space-y-2'>
                        {upcomingClasses.length === 0 ? (
                            <p className='text-sm text-muted-foreground'>No upcoming classes.</p>
                        ) : upcomingView.length === 0 ? (
                            <p className='text-sm text-muted-foreground'>
                                No classes match the current filters.
                            </p>
                        ) : (
                            upcomingView.slice(0, 5).map(item => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        'flex items-center justify-between gap-3 rounded-md border p-3 transition-colors',
                                        !isClassJoinable(item)
                                            ? 'pointer-events-none cursor-not-allowed opacity-50'
                                            : 'hover:border-primary'
                                    )}
                                    aria-disabled={!isClassJoinable(item)}
                                >
                                    <Link
                                        href={item.href}
                                        className='group min-w-0 flex-1 space-y-1'
                                    >
                                        <p className='text-foreground truncate text-sm font-semibold leading-tight group-hover:text-primary'>
                                            {item.title}
                                        </p>

                                        <p className='text-muted-foreground truncate text-xs leading-tight'>
                                            {item.courseName}
                                        </p>

                                        <p className='text-muted-foreground/80 text-xs leading-tight'>
                                            {item.dateLabel}
                                            <span className='mx-1'>·</span>
                                            {item.timeLabel}
                                        </p>
                                    </Link>

                                    <Button
                                        asChild
                                        size='sm'
                                        variant='outline'
                                        disabled={!isClassJoinable(item)}
                                    >
                                        <p>Join</p>
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className='grid gap-4 md:grid-cols-3'>
                <SummaryCard
                    title='Assignments'
                    icon={ClipboardList}
                    tint='bg-warning/5 text-warning'
                    primary={String(assignmentRowsSorted.length)}
                    secondary={
                        pendingAssignments > 0
                            ? `${pendingAssignments} pending submissions`
                            : 'No pending submissions'
                    }
                    ctaLabel='Open Assignments'
                    href='/dashboard/student/learning-hub'
                    query={{ tab: 'assignments' }}
                />
                <SummaryCard
                    title='Assessments'
                    icon={FileCheck2}
                    tint='bg-secondary text-secondary-foreground'
                    primary={learningHubData.stats.find(stat => stat.id === 'overall-progress')?.value ?? '0%'}
                    secondary='Overall progress'
                    ctaLabel='View Assessments'
                    href='/dashboard/student/learning-hub'
                    query={{ tab: 'assessments' }}
                />
                <SummaryCard
                    title='Certificates'
                    icon={Award}
                    tint='bg-success/5 text-success'
                    primary={String(completedCourses)}
                    secondary={completedCourses ? 'Ready to download' : 'Complete a course to earn one'}
                    ctaLabel='View Certificates'
                    href='/dashboard/student/learning-hub'
                    query={{ tab: 'certificates' }}
                />
            </div>

            <RemindersWidget
                assignmentRows={assignmentRows}
                nextClass={nextClass}
            />

            <LearningProgressDrilldown
                enrollments={enrollmentForProgress as LearningProgressDrilldownProps['enrollments']}
            />

            <div className='grid gap-4 lg:grid-cols-3'>
                <Card>
                    <CardHeader className='pb-3'>
                        <CardTitle className='flex items-center gap-2 text-base'>
                            <Flame className='text-warning h-4 w-4' /> Learning Streak
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className='text-3xl font-semibold'>
                            {studyStreakDays > 0 ? `${studyStreakDays} day${studyStreakDays === 1 ? '' : 's'}` : '0 days'}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                            {studyStreakDays > 0
                                ? 'Tracked from recent learning activity.'
                                : 'Study to start building your streak.'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className='pb-3'>
                        <CardTitle className='text-base'>Weekly Study Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className='text-3xl font-semibold'>
                            {`${Math.max(0, Math.round((weeklyStudyMinutes / 60) * 10) / 10)}h`}
                        </p>
                        <Progress value={Math.min(100, Math.round((weeklyStudyMinutes / (10 * 60)) * 100))} className='mt-2' />
                        <p className='mt-1 text-xs text-muted-foreground'>Target: 10 h / week</p>
                    </CardContent>
                </Card>
                <Card className='hidden'>
                    <CardHeader className='pb-3'>
                        <CardTitle className='flex items-center gap-2 text-base'>
                            <Sparkles className='text-primary h-4 w-4' /> AI Recommendations
                        </CardTitle>
                        <CardDescription>Personalised to your interests</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-2 text-sm'>
                        {learningHubData.recommendedCourses.slice(0, 3).map(course => (
                            <RecommendItem
                                key={course.id}
                                label={`Try: ${course.title} (${course.level})`}
                            />
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className='pb-3'>
                    <CardTitle className='text-base'>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className='flex flex-wrap gap-2'>
                    <Button asChild size='sm' variant='outline'>
                        <Link href='/dashboard/student/learning-hub'>Continue Learning</Link>
                    </Button>
                    <Button asChild size='sm' variant='outline'>
                        <Link href='/dashboard/student/courses'>Browse Courses</Link>
                    </Button>
                    <Button asChild size='sm' variant='outline'>
                        <Link href='/dashboard/student/courses'>Join Class</Link>
                    </Button>
                    <Button asChild size='sm' variant='outline'>
                        <Link href='/dashboard/student/courses'>Search Instructor</Link>
                    </Button>
                    <Button asChild size='sm' variant='outline'>
                        <Link href='/dashboard/student/calendar'>View Calendar</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

function RemindersWidget({
    assignmentRows,
    nextClass,
}: {
    assignmentRows: StudentAssignmentRow[];
    nextClass: LearningHubData['nextClass'];
}) {
    const isLoading = false;
    const [ack, setAck] = useState<Set<string>>(new Set());

    const items = useMemo(() => {
        const assignmentItems = assignmentRows
            .map(row => {
                const submissions = row.submissions ?? [];
                const latestSubmission = row.latestSubmission ?? null;
                const hasSubmitted = latestSubmission != null && submissions.length > 0;
                const isGraded = hasSubmitted && latestSubmission?.status?.toUpperCase() === 'GRADED';

                // Graded submissions don't need a reminder — the student already has the outcome.
                if (isGraded) return null;

                if (hasSubmitted) {
                    // Submitted but not yet graded (status: 'not_graded' | 'pending' | etc.)
                    return {
                        kind: 'assignment' as const,
                        status: 'awaiting_grading' as const,
                        id: row.assignment?.uuid,
                        title: row.assignment?.title ?? 'Untitled assignment',
                        course: row.classMeta.courseTitle,
                        dueText: latestSubmission?.submission_status_display ?? 'Submitted · Awaiting grading',
                        href: row.assignment?.uuid ? `/dashboard/student/assignment/${row.assignment.uuid}` : '/dashboard/student/assignment',
                        overdue: false,
                    };
                }

                // Not submitted yet — show the normal due-date reminder.
                const dueLabel = getDueSummary(row.schedule?.due_at ?? row.assignment?.due_date).label;
                return {
                    kind: 'assignment' as const,
                    status: (dueLabel === 'Overdue' ? 'overdue' : 'upcoming') as const,
                    id: row.assignment?.uuid,
                    title: row.assignment?.title ?? 'Untitled assignment',
                    course: row.classMeta.courseTitle,
                    dueText: dueLabel,
                    href: row.assignment?.uuid ? `/dashboard/student/assignment/${row.assignment.uuid}` : '/dashboard/student/assignment',
                    overdue: dueLabel === 'Overdue',
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)

        const classItem = nextClass
            ? [
                {
                    kind: 'class' as const,
                    status: 'class' as const,
                    id: nextClass.id,
                    title: nextClass.title,
                    course: nextClass.locationLabel,
                    dueText: `${nextClass.dateLabel} · ${nextClass.timeLabel}`,
                    href: nextClass.href,
                    overdue: false,
                },
            ]
            : [];

        return [...classItem, ...assignmentItems];
    }, [assignmentRows, nextClass]);

    const visibleItems = items.filter(item => !ack.has(`${item.kind}:${item.id}`));

    const acknowledge = (key: string) => {
        setAck(prev => new Set(prev).add(key));
    };

    const clearAcknowledged = () => {
        setAck(new Set());
    };

    // Semantic color tokens per reminder state, instead of hardcoded palette classes.
    const STATE_STYLES: Record<
        'overdue' | 'awaiting_grading' | 'upcoming' | 'class',
        { badge: string; icon: LucideIcon; openVariant: 'default' | 'outline' | 'destructive' }
    > = {
        overdue: { badge: 'bg-destructive/10 text-destructive', icon: AlertCircle, openVariant: 'destructive' },
        awaiting_grading: { badge: 'bg-warning/10 text-warning', icon: Clock, openVariant: 'outline' },
        upcoming: { badge: 'bg-secondary text-secondary-foreground', icon: ClipboardList, openVariant: 'outline' },
        class: { badge: 'bg-primary/10 text-primary', icon: CalendarIcon, openVariant: 'default' },
    };

    return (
        <Card>
            <CardHeader className='pb-3'>
                <div className='flex items-center justify-between gap-2'>
                    <div>
                        <CardTitle className='flex items-center gap-2 text-base'>
                            <Bell className='h-4 w-4 text-primary' /> Reminders
                        </CardTitle>
                        <CardDescription>Next deadlines for assignments and classes</CardDescription>
                    </div>
                    <div className='flex items-center gap-2'>
                        {ack.size > 0 && (
                            <Button size='sm' variant='ghost' onClick={clearAcknowledged}>
                                Restore ({ack.size})
                            </Button>
                        )}
                        <Badge variant='secondary'>{visibleItems.length}</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className='space-y-2'>
                {isLoading ? (
                    <p className='text-sm text-muted-foreground'>Loading reminders…</p>
                ) : visibleItems.length === 0 ? (
                    <div className='flex flex-col items-center gap-2 py-6 text-center'>
                        <CheckCircle2 className='h-6 w-6 text-success' />
                        <p className='text-sm text-muted-foreground'>You're all caught up. No pending deadlines.</p>
                    </div>
                ) : (
                    visibleItems.map(item => {
                        const state = STATE_STYLES[item.status];
                        const StateIcon = state.icon;
                        return (
                            <div
                                key={`${item.kind}:${item.id}`}
                                className='flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between'
                            >
                                <div className='flex min-w-0 items-start gap-3'>
                                    <div className={`mt-0.5 rounded-md p-1.5 ${state.badge}`}>
                                        <StateIcon className='h-4 w-4' />
                                    </div>
                                    <div className='min-w-0'>
                                        <p className='truncate text-sm font-medium'>{item.title}</p>
                                        <p className='truncate text-xs text-muted-foreground'>
                                            {item.course} · {item.kind === 'assignment' ? 'Assignment' : 'Class'}
                                        </p>
                                        <p className={`mt-0.5 text-xs ${item.overdue ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>
                                            {item.dueText}
                                        </p>
                                    </div>
                                </div>
                                <div className='flex shrink-0 flex-wrap items-center gap-2 sm:justify-end'>
                                    <Button
                                        size='sm'
                                        variant='secondary'
                                        onClick={() => acknowledge(`${item.kind}:${item.id}`)}
                                    >
                                        <CheckCircle2 className='mr-1 h-3.5 w-3.5' />
                                        Acknowledge
                                    </Button>

                                    <Button asChild size='sm' variant={state.openVariant}>
                                        <Link href={item.href}>Open</Link>
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

function StatCard({
    label,
    value,
    icon: Icon,
    tint,
    href,
    query,
}: {
    label: string;
    value: ReactNode;
    icon: ComponentType<{ className?: string }>;
    tint: string;
    href?: string;
    query?: Record<string, string>;
}) {
    const body = (
        <Card className={href ? 'cursor-pointer transition-colors hover:border-primary' : ''}>
            <CardContent className='flex items-center gap-3'>
                <div className={`grid h-10 w-10 place-items-center rounded-lg ${tint}`}>
                    <Icon className='h-5 w-5' />
                </div>
                <div>
                    <p className='text-muted-foreground text-xs'>{label}</p>
                    <p className='tabular-nums text-xl font-semibold'>{value}</p>
                </div>
            </CardContent>
        </Card>
    );

    if (!href) return body;

    return (
        <Link href={{ pathname: href, query }} className='block'>
            {body}
        </Link>
    );
}

function EmptyBrowse({ activeDomain }: { activeDomain: UserDomain | null }) {
    return (
        <div className='flex flex-col items-center gap-3 py-8 text-center'>
            <p className='text-sm text-muted-foreground'>You aren't enrolled in any courses yet.</p>
            <Button asChild>
                <Link href={roleScopedDashboardPath(activeDomain, '/dashboard/courses')}>Browse courses</Link>
            </Button>
        </div>
    );
}

function RecommendItem({ label }: { label: string }) {
    return (
        <div className='flex items-center justify-between rounded-md border p-2'>
            <span className='truncate'>{label}</span>
            <ArrowRight className='h-3.5 w-3.5 text-muted-foreground' />
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
    icon: LucideIcon;
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

                {/* // should switch to the tab or route indicated */}
                <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={{ pathname: href, query }}>{ctaLabel}</Link>
                </Button>
            </CardContent>
        </Card>
    );
}



import { useRouter } from 'next/navigation';
import { Skeleton } from '../../../../../components/ui/skeleton';
import { UserDomain } from '../../../../../lib/types';
import { cn } from '../../../../../lib/utils';

function LessonHubDashboardSkeleton() {
    return (
        <div className='space-y-6'>
            {/* Stat cards */}
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className='flex items-center gap-3'>
                            <Skeleton className='h-10 w-10 shrink-0 rounded-lg' />
                            <div className='min-w-0 flex-1 space-y-2'>
                                <Skeleton className='h-3 w-20' />
                                <Skeleton className='h-6 w-12' />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Continue Learning + Next Class */}
            <div className='grid gap-4 lg:grid-cols-3'>
                <Card className='lg:col-span-2'>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
                        <div className='space-y-2'>
                            <Skeleton className='h-4 w-36' />
                            <Skeleton className='h-3 w-56' />
                        </div>
                        <Skeleton className='h-4 w-16' />
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className='rounded-lg border p-4'>
                                <div className='flex items-start justify-between gap-3'>
                                    <div className='min-w-0 flex-1 space-y-2'>
                                        <Skeleton className='h-4 w-40' />
                                        <Skeleton className='h-3 w-28' />
                                    </div>
                                    <Skeleton className='h-6 w-16 shrink-0 rounded-md' />
                                </div>
                                <div className='mt-3 flex items-center gap-3'>
                                    <Skeleton className='h-2 flex-1 rounded-full' />
                                    <Skeleton className='h-3 w-8' />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <Skeleton className='h-4 w-24' />
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        <div className='space-y-2 rounded-md px-3 py-2'>
                            <Skeleton className='h-4 w-32' />
                            <Skeleton className='h-3 w-20' />
                            <Skeleton className='h-3 w-28' />
                        </div>
                        <Skeleton className='h-8 w-full rounded' />
                    </CardContent>
                </Card>
            </div>

            {/* Active Courses + Upcoming Classes */}
            <div className='grid gap-4 lg:grid-cols-2'>
                {Array.from({ length: 2 }).map((_, col) => (
                    <Card key={col}>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
                            <div className='space-y-2'>
                                <Skeleton className='h-4 w-32' />
                                <Skeleton className='h-3 w-44' />
                            </div>
                            <Skeleton className='h-4 w-16' />
                        </CardHeader>
                        <div className='flex flex-wrap items-center gap-2 px-6 pb-3'>
                            <Skeleton className='h-8 w-[130px]' />
                            <Skeleton className='h-8 w-[120px]' />
                            <Skeleton className='ml-auto h-8 w-[140px]' />
                        </div>
                        <CardContent className='space-y-2'>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className='flex items-center justify-between gap-3 rounded-md border p-3'>
                                    <div className='min-w-0 flex-1 space-y-2'>
                                        <Skeleton className='h-4 w-3/5' />
                                        <Skeleton className='h-3 w-2/5' />
                                    </div>
                                    <Skeleton className='h-6 w-14 shrink-0 rounded-md' />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Assignments / Assessments / Certificates summary cards */}
            <div className='grid gap-4 md:grid-cols-3'>
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className='pb-2'>
                            <div className='flex items-center justify-between'>
                                <Skeleton className='h-4 w-24' />
                                <Skeleton className='h-8 w-8 rounded-md' />
                            </div>
                        </CardHeader>
                        <CardContent className='space-y-3'>
                            <div className='space-y-1.5'>
                                <Skeleton className='h-7 w-14' />
                                <Skeleton className='h-3 w-32' />
                            </div>
                            <Skeleton className='h-8 w-full rounded' />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Reminders */}
            <Card>
                <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between gap-2'>
                        <div className='space-y-2'>
                            <Skeleton className='h-4 w-24' />
                            <Skeleton className='h-3 w-56' />
                        </div>
                        <Skeleton className='h-5 w-6 rounded-full' />
                    </div>
                </CardHeader>
                <CardContent className='space-y-2'>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className='flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between'>
                            <div className='flex min-w-0 items-start gap-3'>
                                <Skeleton className='h-7 w-7 shrink-0 rounded-md' />
                                <div className='min-w-0 space-y-2'>
                                    <Skeleton className='h-4 w-44' />
                                    <Skeleton className='h-3 w-28' />
                                    <Skeleton className='h-3 w-20' />
                                </div>
                            </div>
                            <div className='flex shrink-0 items-center gap-2'>
                                <Skeleton className='h-8 w-24 rounded-md' />
                                <Skeleton className='h-8 w-16 rounded-md' />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Learning Progress drilldown */}
            <Card>
                <CardHeader className='pb-3'>
                    <div className='flex items-start justify-between gap-3'>
                        <div className='space-y-2'>
                            <Skeleton className='h-4 w-32' />
                            <Skeleton className='h-3 w-52' />
                        </div>
                        <div className='space-y-1 text-right'>
                            <Skeleton className='ml-auto h-3 w-12' />
                            <Skeleton className='ml-auto h-5 w-10' />
                        </div>
                    </div>
                    <Skeleton className='mt-2 h-2 w-full rounded-full' />
                </CardHeader>
                <CardContent className='grid gap-4 md:grid-cols-[minmax(0,240px)_1fr]'>
                    <div className='space-y-1 md:border-r md:pr-3'>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className='space-y-1.5 rounded-md p-2'>
                                <Skeleton className='h-4 w-3/4' />
                                <div className='flex items-center gap-2'>
                                    <Skeleton className='h-1 flex-1 rounded-full' />
                                    <Skeleton className='h-3 w-6' />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className='space-y-4'>
                        <div className='flex flex-wrap items-center gap-2'>
                            <Skeleton className='h-4 w-40' />
                            <Skeleton className='h-4 w-14 rounded-full' />
                            <Skeleton className='h-4 w-16 rounded-full' />
                        </div>
                        <div className='space-y-1.5'>
                            <Skeleton className='h-3 w-16' />
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className='h-7 w-full rounded-md' />
                            ))}
                        </div>
                        <div className='space-y-1.5'>
                            <Skeleton className='h-3 w-40' />
                            {Array.from({ length: 2 }).map((_, i) => (
                                <Skeleton key={i} className='h-9 w-full rounded-md' />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Streak / Weekly hours / AI recommendations */}
            <div className='grid gap-4 lg:grid-cols-3'>
                <Card>
                    <CardHeader className='pb-3'>
                        <Skeleton className='h-4 w-32' />
                    </CardHeader>
                    <CardContent className='space-y-2'>
                        <Skeleton className='h-8 w-20' />
                        <Skeleton className='h-3 w-48' />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className='pb-3'>
                        <Skeleton className='h-4 w-36' />
                    </CardHeader>
                    <CardContent className='space-y-2'>
                        <Skeleton className='h-8 w-16' />
                        <Skeleton className='h-2 w-full rounded-full' />
                        <Skeleton className='h-3 w-28' />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className='pb-3'>
                        <Skeleton className='h-4 w-40' />
                        <Skeleton className='mt-2 h-3 w-44' />
                    </CardHeader>
                    <CardContent className='space-y-2'>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className='h-9 w-full rounded-md' />
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Quick actions */}
            <Card>
                <CardHeader className='pb-3'>
                    <Skeleton className='h-4 w-28' />
                </CardHeader>
                <CardContent className='flex flex-wrap gap-2'>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className='h-8 w-32 rounded-md' />
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

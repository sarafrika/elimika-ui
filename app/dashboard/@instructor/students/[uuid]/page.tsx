'use client';

import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock,
    GraduationCap,
    Mail,
    MoreVertical,
    Phone,
    Users,
    Wallet,
    XCircle
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import { useInstructorStudentsData } from '../data';

type EnrollmentStatus = 'ENROLLED' | 'ATTENDED' | 'ABSENT' | string;

type ClassEnrollmentEntry = {
    uuid: string;
    scheduled_instance_uuid: string;
    status: EnrollmentStatus;
    attendance_marked_at: string | null;
    did_attend: boolean;
    status_description?: string;
};

type StudentClass = {
    uuid: string;
    title: string;
    course_uuid: string;
    course: {
        uuid: string;
        name: string;
        thumbnail_url?: string;
        category_names?: string[];
        duration_hours?: number;
        duration_minutes?: number;
    };
    enrollment: ClassEnrollmentEntry[];
};

type CourseEnrollmentSummary = {
    enrollment_uuid: string;
    course_uuid: string;
    course_name: string;
    enrollment_status: string;
    progress_percentage: number;
    updated_date: string;
};

type ClassEnrollmentSummary = {
    class_definition_uuid: string;
    class_title: string;
    latest_enrollment_uuid: string;
    latest_enrollment_status: string;
    scheduled_instance_count: number;
    latest_scheduled_instance_start_time: string;
    latest_activity_date: string;
};

type StudentDetail = {
    student: {
        uuid: string;
        user_uuid: string;
        full_name: string;
        initials: string;
        avatarColor: string;
        email: string;
        joinedAt: string;
    };
    profile: {
        first_guardian_name?: string | null;
        first_guardian_mobile?: string | null;
        second_guardian_name?: string | null;
        second_guardian_mobile?: string | null;
        allGuardianContacts?: string[];
        bio?: string | null;
    };
    user: {
        dob?: string;
        phone_number?: string;
        gender?: string;
        active?: boolean;
        user_no?: string;
        profile_image_url?: string;
    };
    classes: StudentClass[];
    courses: Array<{ uuid: string; name: string; thumbnail_url?: string }>;
    courseEnrollments: CourseEnrollmentSummary[];
    classEnrollments: ClassEnrollmentSummary[];
    status: string;
    progress: number;
    walletBalance: number;
    levels: string[];
    latestActivityAt: string;
};

const STATUS_STYLES: Record<string, string> = {
    ENROLLED: 'bg-primary/10 text-primary border-primary/20',
    ATTENDED: 'bg-success/10 text-success border-success/20',
    ABSENT: 'bg-destructive/10 text-destructive border-destructive/20',
    ACTIVE: 'bg-primary/10 text-primary border-primary/20',
    GRADUATED: 'bg-success/10 text-success border-success/20',
    'ON HOLD': 'bg-warning/10 text-warning border-warning/20',
};

function StatusPill({ status }: { status: string }) {
    const key = status?.toUpperCase?.() ?? '';
    const style = STATUS_STYLES[key] ?? 'bg-muted text-muted-foreground border-border';
    return (
        <span
            className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium ${style}`}
        >
            {status}
        </span>
    );
}

function ProgressBar({ value }: { value: number }) {
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
                />
            </div>
            <span className="text-xs font-medium text-foreground">{value}%</span>
        </div>
    );
}

function formatDate(value?: string | null) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(value?: string | null) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const diffMs = Date.now() - d.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
}

function StatCard({
    icon: Icon,
    value,
    label,
    tint,
}: {
    icon: typeof Users;
    value: string | number;
    label: string;
    tint: 'primary' | 'success' | 'accent';
}) {
    const tints: Record<typeof tint, string> = {
        primary: 'bg-primary/10 text-primary',
        success: 'bg-success/10 text-success',
        accent: 'bg-accent/10 text-accent-foreground',
    };

    return (
        <div className="flex items-center gap-3 rounded-md border border-border bg-card p-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${tints[tint]}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xl font-bold leading-none text-foreground">{value}</p>
                <p className="text-muted-foreground mt-1 text-xs">{label}</p>
            </div>
        </div>
    );
}

const InstructorStudentsDetailPage = () => {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter()

    const userUuid = params?.uuid as string;
    const studentId = searchParams.get('sId');

    const { students, loading } = useInstructorStudentsData();

    const student = useMemo(() => {
        return (students as unknown as StudentDetail[])?.find(
            s => s.student.uuid === studentId || s.student.user_uuid === userUuid
        );
    }, [students, studentId, userUuid]);

    const enrollmentByClass = useMemo(() => {
        const map = new Map<string, unknown[]>();

        for (const cls of student?.classes ?? []) {
            map.set(
                cls.uuid,
                (cls.enrollment ?? []).filter(
                    e => e?.student_uuid === student?.student?.uuid
                )
            );
        }

        return map;
    }, [student?.classes, student?.student?.uuid]);

    const attendanceStats = useMemo(() => {
        let attended = 0;
        let absent = 0;

        const studentUuid = student?.student?.uuid;

        (student?.classes ?? []).forEach(cls => {
            const enrollments = cls.enrollment?.filter(
                e => e?.student_uuid === studentUuid
            );

            enrollments.forEach(e => {
                if (e.status === "ATTENDED") attended += 1;
                if (e.status === "ABSENT") absent += 1;
            });
        });

        const total = attended + absent;
        const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

        return { attended, absent, total, rate };
    }, [student]);

    const recentActivity = useMemo(() => {
        const items: { classTitle: string; attended: boolean; at: string }[] = [];

        (student?.classes ?? []).forEach(cls => {
            cls.enrollment.forEach(e => {
                if (e.attendance_marked_at) {
                    items.push({
                        classTitle: cls.title,
                        attended: e.status === 'ATTENDED',
                        at: e.attendance_marked_at,
                    });
                }
            });
        });

        return items
            .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
            .slice(0, 6);
    }, [student]);

    if (loading) {
        return (
            <div className="space-y-4 p-4 sm:p-6">
                <Skeleton className="h-28 w-full rounded-md" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-md" />
                    ))}
                </div>
                <Skeleton className="h-64 w-full rounded-md" />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-2 p-6 text-center">
                <Users className="text-muted-foreground/40 h-10 w-10" />
                <p className="text-sm font-medium text-foreground">Student not found</p>
                <p className="text-muted-foreground text-xs">
                    We couldn&apos;t locate a student matching this link.
                </p>
            </div>
        );
    }

    // ── Derived metrics ──────────────────────────────────────────────────
    const totalCourses = student.courseEnrollments?.length ?? 0;

    return (
        <div className="space-y-4 p-4 sm:p-6">
            <Button
                variant='ghost'
                size='sm'
                className='mb-2 -ml-2 rounded'
                onClick={() => router.push('/dashboard/students')}
            >
                <ArrowLeft className='mr-2 h-4 w-4' />
                All students
            </Button>

            {/* ── Header ── */}
            <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                <div className="flex items-start gap-4">
                    <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${student.student.avatarColor ?? 'bg-primary/10 text-primary'}`}
                    >
                        {student.user.profile_image_url ? (
                            <img
                                src={student.user.profile_image_url}
                                alt={student.student.full_name}
                                className="h-full w-full rounded-full object-cover"
                            />
                        ) : (
                            student.student.initials
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-lg font-semibold text-foreground">{student.student.full_name}</h1>
                            <StatusPill status={student.status} />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {student.user.user_no ? <span>ID: {student.user.user_no}</span> : null}
                            <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {student.student.email}
                            </span>
                            {student.user.phone_number ? (
                                <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {student.user.phone_number}
                                </span>
                            ) : null}
                            <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                Joined {formatDate(student.student.joinedAt)}
                            </span>
                        </div>

                        {student.levels?.length ? (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {student.levels.map(level => (
                                    <Badge key={level} variant="outline" className="text-[11px]">
                                        {level}
                                    </Badge>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>

                <Button variant="outline" size="icon" className="self-start sm:self-auto">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </div>

            {/* ── Overview stats ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard icon={GraduationCap} value={totalCourses} label="Courses Enrolled" tint="primary" />
                <StatCard icon={CheckCircle2} value={`${student.progress}%`} label="Overall Progress" tint="success" />
                <StatCard
                    icon={Wallet}
                    value={`KSh ${student.walletBalance.toLocaleString()}`}
                    label="Skills Wallet"
                    tint="accent"
                />
                <StatCard
                    icon={Clock}
                    value={`${attendanceStats.rate}%`}
                    label={`Attendance · ${attendanceStats.attended}/${attendanceStats.total}`}
                    tint="primary"
                />
            </div>

            <div className="flex flex-col gap-4 lg:flex-row">
                {/* ── Main column: courses & classes ── */}
                <div className="min-w-0 flex-1 space-y-4">
                    {/* Course progress */}
                    <div className="rounded-md border border-border bg-card">
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <h2 className="text-sm font-semibold text-foreground">Course Progress</h2>
                        </div>

                        <div className="hidden sm:block">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="text-xs">Course</TableHead>
                                        <TableHead className="text-xs">Status</TableHead>
                                        <TableHead className="text-xs">Progress</TableHead>
                                        <TableHead className="text-xs">Last Activity</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {student.courseEnrollments.map(enrollment => {
                                        const course = student.courses.find(c => c.uuid === enrollment.course_uuid);

                                        return (
                                            <TableRow key={enrollment.enrollment_uuid}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2.5">
                                                        {course?.thumbnail_url ? (
                                                            <img
                                                                src={course.thumbnail_url}
                                                                alt={enrollment.course_name}
                                                                className="h-8 w-8 shrink-0 rounded object-cover"
                                                            />
                                                        ) : (
                                                            <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded text-[10px] font-bold uppercase">
                                                                {enrollment.course_name.slice(0, 2)}
                                                            </div>
                                                        )}
                                                        <span className="text-sm font-medium text-foreground">
                                                            {enrollment.course_name}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusPill status={enrollment.enrollment_status} />
                                                </TableCell>
                                                <TableCell>
                                                    <ProgressBar value={enrollment.progress_percentage} />
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {formatDate(enrollment.updated_date)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile */}
                        <div className="divide-y sm:hidden">
                            {student.courseEnrollments.map(enrollment => (
                                <div key={enrollment.enrollment_uuid} className="space-y-2 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate text-sm font-medium text-foreground">
                                            {enrollment.course_name}
                                        </span>
                                        <StatusPill status={enrollment.enrollment_status} />
                                    </div>
                                    <ProgressBar value={enrollment.progress_percentage} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Class enrollments & attendance */}
                    <div className="rounded-md border border-border bg-card">
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <h2 className="text-sm font-semibold text-foreground">Classes &amp; Attendance</h2>
                        </div>

                        <div className="divide-y">
                            {student.classes.map(cls => {
                                const studentEnrollments = enrollmentByClass.get(cls.uuid) ?? [];

                                const attended = studentEnrollments.filter(e => e.status === "ATTENDED").length;
                                const absent = studentEnrollments.filter(e => e.status === "ABSENT").length;
                                const upcoming = studentEnrollments.filter(e => e.status === "ENROLLED").length;
                                const total = studentEnrollments.length;

                                const rate =
                                    total > 0
                                        ? Math.round((attended / (attended + absent || 1)) * 100)
                                        : 0;

                                return (
                                    <div key={cls.uuid} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-foreground">
                                                {cls.title}
                                            </p>
                                            <p className="text-muted-foreground truncate text-xs">
                                                {cls.course.name}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-xs">
                                            <span className="flex items-center gap-1 text-success">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                {attended} attended
                                            </span>

                                            {absent > 0 && (
                                                <span className="flex items-center gap-1 text-destructive">
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    {absent} absent
                                                </span>
                                            )}

                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {upcoming} upcoming
                                            </span>

                                            <span className="bg-muted rounded-sm px-2 py-0.5 font-medium text-foreground">
                                                {rate}% rate
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Sidebar ── */}
                <div className="w-full space-y-4 lg:w-80 lg:shrink-0">
                    {/* Guardian contacts */}
                    <div className="rounded-md border border-border bg-card p-4">
                        <h2 className="mb-3 text-sm font-semibold text-foreground">Guardian Contacts</h2>
                        <div className="space-y-3">
                            {student.profile.first_guardian_name ? (
                                <div>
                                    <p className="text-xs font-medium text-foreground">
                                        {student.profile.first_guardian_name}
                                    </p>
                                    <p className="text-muted-foreground flex items-center gap-1 text-xs">
                                        <Phone className="h-3 w-3" />
                                        {student.profile.first_guardian_mobile}
                                    </p>
                                </div>
                            ) : null}
                            {student.profile.second_guardian_name ? (
                                <div>
                                    <p className="text-xs font-medium text-foreground">
                                        {student.profile.second_guardian_name}
                                    </p>
                                    <p className="text-muted-foreground flex items-center gap-1 text-xs">
                                        <Phone className="h-3 w-3" />
                                        {student.profile.second_guardian_mobile}
                                    </p>
                                </div>
                            ) : null}
                            {!student.profile.first_guardian_name && !student.profile.second_guardian_name && (
                                <p className="text-muted-foreground text-xs">No guardian contacts on file.</p>
                            )}
                        </div>
                    </div>

                    {/* Personal info */}
                    <div className="rounded-md border border-border bg-card p-4">
                        <h2 className="mb-3 text-sm font-semibold text-foreground">Personal Information</h2>
                        <dl className="space-y-2.5 text-xs">
                            <div className="flex items-center justify-between">
                                <dt className="text-muted-foreground">Date of birth</dt>
                                <dd className="font-medium text-foreground">{formatDate(student.user.dob)}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-muted-foreground">Gender</dt>
                                <dd className="font-medium capitalize text-foreground">
                                    {student.user.gender?.toLowerCase() ?? '—'}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-muted-foreground">Account status</dt>
                                <dd>
                                    <Badge variant={student.user.active ? 'success' : 'outline'} className="text-[10px]">
                                        {student.user.active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Recent activity */}
                    <div className="rounded-md border border-border bg-card p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
                        </div>
                        <div className="space-y-3">
                            {recentActivity.length === 0 ? (
                                <p className="text-muted-foreground text-xs">No recent activity yet.</p>
                            ) : (
                                recentActivity.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5">
                                        <span
                                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.attended ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                                                }`}
                                        >
                                            {item.attended ? (
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                            ) : (
                                                <XCircle className="h-3.5 w-3.5" />
                                            )}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-xs text-foreground">
                                                <span className="font-medium">{item.attended ? 'Attended' : 'Missed'}</span>{' '}
                                                {item.classTitle}
                                            </p>
                                            <p className="text-muted-foreground text-[11px]">{timeAgo(item.at)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorStudentsDetailPage;

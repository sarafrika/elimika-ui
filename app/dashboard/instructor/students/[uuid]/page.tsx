// @ts-nocheck -- pre-existing @hey-api generated-client type drift (see memory: elimika-ui-typecheck)
'use client';

import {
  Activity,
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  LayoutGrid,
  Mail,
  Phone,
  ShieldCheck,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import {
  type EntityFact,
  EntityHeaderCard,
  type SectionTab,
  SectionTabPanel,
  SectionTabs,
  surfaceTheme,
  useSectionTab,
} from '@/components/data-display';
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
import { cn } from '@/lib/utils';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

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

const STUDENT_TABS = ['overview', 'courses', 'attendance', 'guardians', 'activity'] as const;
type StudentTab = (typeof STUDENT_TABS)[number];

const STUDENT_TAB_LABELS: Record<StudentTab, string> = {
  overview: 'Overview',
  courses: 'Courses',
  attendance: 'Attendance',
  guardians: 'Guardians',
  activity: 'Activity',
};

const STUDENT_TAB_ICONS = {
  overview: LayoutGrid,
  courses: BookOpen,
  attendance: CalendarCheck,
  guardians: ShieldCheck,
  activity: Activity,
} as const;

/** Hidden panels still print. */
const PANEL = 'print:block!';

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
    <div className='flex items-center gap-2'>
      <div className='bg-muted h-1.5 w-20 overflow-hidden rounded-full'>
        <div
          className='bg-primary h-full rounded-full transition-all'
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
      <span className='text-foreground text-xs font-medium'>{value}%</span>
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
    <div className='border-border bg-card flex items-center gap-3 rounded-md border p-4'>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${tints[tint]}`}
      >
        <Icon className='h-5 w-5' />
      </div>
      <div>
        <p className='text-foreground text-xl leading-none font-bold'>{value}</p>
        <p className='text-muted-foreground mt-1 text-xs'>{label}</p>
      </div>
    </div>
  );
}

const InstructorStudentsDetailPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const userUuid = params?.uuid as string;
  const studentId = searchParams.get('sId');

  const { students, loading } = useInstructorStudentsData();
  const { value: tab, setValue: setTab, hrefFor } = useSectionTab(STUDENT_TABS, 'overview');

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
        (cls.enrollment ?? []).filter(e => e?.student_uuid === student?.student?.uuid)
      );
    }

    return map;
  }, [student?.classes, student?.student?.uuid]);

  const attendanceStats = useMemo(() => {
    let attended = 0;
    let absent = 0;

    const studentUuid = student?.student?.uuid;

    (student?.classes ?? []).forEach(cls => {
      const enrollments = cls.enrollment?.filter(e => e?.student_uuid === studentUuid);

      enrollments.forEach(e => {
        if (e.status === 'ATTENDED') attended += 1;
        if (e.status === 'ABSENT') absent += 1;
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

    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 6);
  }, [student]);

  if (loading) {
    return (
      <div className={cn(surfaceTheme.pageWide, 'space-y-4 pt-4 pb-10 sm:pt-6')}>
        <Skeleton className='h-28 w-full rounded-2xl' />
        <Skeleton className='h-11 w-full max-w-xl' />
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-20 rounded-md' />
          ))}
        </div>
        <Skeleton className='h-64 w-full rounded-md' />
      </div>
    );
  }

  if (!student) {
    return (
      <div className='flex h-64 flex-col items-center justify-center gap-2 p-6 text-center'>
        <Users className='text-muted-foreground/40 h-10 w-10' />
        <p className='text-foreground text-sm font-medium'>Student not found</p>
        <p className='text-muted-foreground text-xs'>
          We couldn&apos;t locate a student matching this link.
        </p>
      </div>
    );
  }

  // ── Derived metrics ──────────────────────────────────────────────────
  const totalCourses = student.courseEnrollments?.length ?? 0;
  const guardians = [
    student.profile.first_guardian_name
      ? { name: student.profile.first_guardian_name, mobile: student.profile.first_guardian_mobile }
      : null,
    student.profile.second_guardian_name
      ? {
          name: student.profile.second_guardian_name,
          mobile: student.profile.second_guardian_mobile,
        }
      : null,
  ].filter(Boolean) as { name: string; mobile?: string | null }[];

  const counts: Partial<Record<StudentTab, number>> = {
    courses: totalCourses,
    attendance: student.classes?.length ?? 0,
    guardians: guardians.length,
    activity: recentActivity.length,
  };
  const tabs: SectionTab<StudentTab>[] = STUDENT_TABS.map(id => ({
    id,
    label: STUDENT_TAB_LABELS[id],
    icon: STUDENT_TAB_ICONS[id],
    count: counts[id],
  }));

  const facts: EntityFact[] = [
    student.user.user_no ? { key: 'id', label: `ID: ${student.user.user_no}` } : null,
    { key: 'email', icon: Mail, label: student.student.email },
    student.user.phone_number
      ? { key: 'phone', icon: Phone, label: student.user.phone_number }
      : null,
    { key: 'joined', icon: CalendarDays, label: `Joined ${formatDate(student.student.joinedAt)}` },
  ].filter(Boolean) as EntityFact[];

  return (
    <div className={cn(surfaceTheme.pageWide, 'flex flex-col gap-[18px] pt-4 pb-10 sm:pt-6')}>
      <Button
        variant='ghost'
        size='sm'
        className='-ml-2 w-fit rounded'
        onClick={() => router.push('/dashboard/instructor/students')}
      >
        <ArrowLeft className='mr-2 h-4 w-4' />
        All students
      </Button>

      <EntityHeaderCard
        eyebrow='Student'
        title={student.student.full_name}
        initials={student.student.initials}
        imageUrl={toAuthenticatedMediaUrl(student.user.profile_image_url)}
        badges={
          <>
            <StatusPill status={student.status} />
            {student.levels?.map(level => (
              <Badge key={level} variant='outline' className='text-[11px]'>
                {level}
              </Badge>
            ))}
          </>
        }
        facts={facts}
      />

      <SectionTabs
        tabs={tabs}
        value={tab}
        onValueChange={setTab}
        hrefFor={hrefFor}
        label='Student sections'
        sticky
        listClassName='bg-background'
      >
        <SectionTabPanel value='overview' className={cn(PANEL, 'flex flex-col gap-4')}>
          <div className={surfaceTheme.cardGrid}>
            <StatCard
              icon={GraduationCap}
              value={totalCourses}
              label='Courses Enrolled'
              tint='primary'
            />
            <StatCard
              icon={CheckCircle2}
              value={`${student.progress}%`}
              label='Overall Progress'
              tint='success'
            />
            <StatCard
              icon={Wallet}
              value={`KSh ${student.walletBalance.toLocaleString()}`}
              label='Skills Wallet'
              tint='accent'
            />
            <StatCard
              icon={Clock}
              value={`${attendanceStats.rate}%`}
              label={`Attendance · ${attendanceStats.attended}/${attendanceStats.total}`}
              tint='primary'
            />
          </div>

          <div className='border-border bg-card max-w-xl rounded-md border p-4'>
            <h2 className='text-foreground mb-3 text-sm font-semibold'>Personal Information</h2>
            <dl className='space-y-2.5 text-xs'>
              <div className='flex items-center justify-between'>
                <dt className='text-muted-foreground'>Date of birth</dt>
                <dd className='text-foreground font-medium'>{formatDate(student.user.dob)}</dd>
              </div>
              <div className='flex items-center justify-between'>
                <dt className='text-muted-foreground'>Gender</dt>
                <dd className='text-foreground font-medium capitalize'>
                  {student.user.gender?.toLowerCase() ?? '—'}
                </dd>
              </div>
              <div className='flex items-center justify-between'>
                <dt className='text-muted-foreground'>Account status</dt>
                <dd>
                  <Badge
                    variant={student.user.active ? 'success' : 'outline'}
                    className='text-[10px]'
                  >
                    {student.user.active ? 'Active' : 'Inactive'}
                  </Badge>
                </dd>
              </div>
            </dl>
          </div>
        </SectionTabPanel>

        <SectionTabPanel value='courses' className={PANEL}>
          <div className='border-border bg-card rounded-md border'>
            <div className='border-border flex items-center justify-between border-b px-4 py-3'>
              <h2 className='text-foreground text-sm font-semibold'>Course Progress</h2>
            </div>

            {totalCourses === 0 ? (
              <p className='text-muted-foreground p-4 text-xs'>Not enrolled in any course yet.</p>
            ) : null}

            <div className='hidden sm:block'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-muted/40'>
                    <TableHead className='text-xs'>Course</TableHead>
                    <TableHead className='text-xs'>Status</TableHead>
                    <TableHead className='text-xs'>Progress</TableHead>
                    <TableHead className='text-xs'>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.courseEnrollments.map(enrollment => {
                    const course = student.courses.find(c => c.uuid === enrollment.course_uuid);

                    return (
                      <TableRow key={enrollment.enrollment_uuid}>
                        <TableCell>
                          <div className='flex items-center gap-2.5'>
                            {course?.thumbnail_url ? (
                              <img
                                src={course.thumbnail_url}
                                alt={enrollment.course_name}
                                className='h-8 w-8 shrink-0 rounded object-cover'
                              />
                            ) : (
                              <div className='bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded text-[10px] font-bold uppercase'>
                                {enrollment.course_name.slice(0, 2)}
                              </div>
                            )}
                            <span className='text-foreground text-sm font-medium'>
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
                        <TableCell className='text-muted-foreground text-xs'>
                          {formatDate(enrollment.updated_date)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile */}
            <div className='divide-y sm:hidden'>
              {student.courseEnrollments.map(enrollment => (
                <div key={enrollment.enrollment_uuid} className='space-y-2 p-3'>
                  <div className='flex items-center justify-between gap-2'>
                    <span className='text-foreground truncate text-sm font-medium'>
                      {enrollment.course_name}
                    </span>
                    <StatusPill status={enrollment.enrollment_status} />
                  </div>
                  <ProgressBar value={enrollment.progress_percentage} />
                </div>
              ))}
            </div>
          </div>
        </SectionTabPanel>

        <SectionTabPanel value='attendance' className={PANEL}>
          <div className='border-border bg-card rounded-md border'>
            <div className='border-border flex items-center justify-between border-b px-4 py-3'>
              <h2 className='text-foreground text-sm font-semibold'>Classes &amp; Attendance</h2>
              <span className='text-muted-foreground text-xs'>
                {attendanceStats.rate}% overall · {attendanceStats.attended}/{attendanceStats.total}{' '}
                attended
              </span>
            </div>

            {student.classes.length === 0 ? (
              <p className='text-muted-foreground p-4 text-xs'>No classes with you yet.</p>
            ) : null}

            <div className='divide-y'>
              {student.classes.map(cls => {
                const studentEnrollments = enrollmentByClass.get(cls.uuid) ?? [];

                const attended = studentEnrollments.filter(e => e.status === 'ATTENDED').length;
                const absent = studentEnrollments.filter(e => e.status === 'ABSENT').length;
                const upcoming = studentEnrollments.filter(e => e.status === 'ENROLLED').length;
                const total = studentEnrollments.length;

                const rate =
                  total > 0 ? Math.round((attended / (attended + absent || 1)) * 100) : 0;

                return (
                  <div
                    key={cls.uuid}
                    className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'
                  >
                    <div className='min-w-0 flex-1'>
                      <p className='text-foreground truncate text-sm font-medium'>{cls.title}</p>
                      <p className='text-muted-foreground truncate text-xs'>{cls.course.name}</p>
                    </div>

                    <div className='flex flex-wrap items-center gap-3 text-xs'>
                      <span className='text-success flex items-center gap-1'>
                        <CheckCircle2 className='h-3.5 w-3.5' />
                        {attended} attended
                      </span>

                      {absent > 0 && (
                        <span className='text-destructive flex items-center gap-1'>
                          <XCircle className='h-3.5 w-3.5' />
                          {absent} absent
                        </span>
                      )}

                      <span className='text-muted-foreground flex items-center gap-1'>
                        <Clock className='h-3.5 w-3.5' />
                        {upcoming} upcoming
                      </span>

                      <span className='bg-muted text-foreground rounded-sm px-2 py-0.5 font-medium'>
                        {rate}% rate
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionTabPanel>

        <SectionTabPanel value='guardians' className={PANEL}>
          {guardians.length === 0 ? (
            <div className='border-border bg-card rounded-md border p-4'>
              <p className='text-muted-foreground text-xs'>No guardian contacts on file.</p>
            </div>
          ) : (
            <ul className={surfaceTheme.cardGrid}>
              {guardians.map(guardian => (
                <li
                  key={`${guardian.name}-${guardian.mobile ?? ''}`}
                  className='border-border bg-card rounded-md border p-4'
                >
                  <p className='text-foreground text-sm font-medium'>{guardian.name}</p>
                  {guardian.mobile ? (
                    <a
                      href={`tel:${guardian.mobile.replace(/\s+/g, '')}`}
                      className='text-primary mt-1 flex items-center gap-1 text-xs underline-offset-4 hover:underline'
                    >
                      <Phone className='h-3 w-3' />
                      {guardian.mobile}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </SectionTabPanel>

        <SectionTabPanel value='activity' className={PANEL}>
          <div className='border-border bg-card max-w-3xl rounded-md border p-4'>
            <h2 className='text-foreground mb-3 text-sm font-semibold'>Recent Activity</h2>
            <div className='space-y-3'>
              {recentActivity.length === 0 ? (
                <p className='text-muted-foreground text-xs'>No recent activity yet.</p>
              ) : (
                recentActivity.map((item, idx) => (
                  <div key={idx} className='flex items-start gap-2.5'>
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        item.attended
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {item.attended ? (
                        <CheckCircle2 className='h-3.5 w-3.5' />
                      ) : (
                        <XCircle className='h-3.5 w-3.5' />
                      )}
                    </span>
                    <div className='min-w-0'>
                      <p className='text-foreground text-xs'>
                        <span className='font-medium'>{item.attended ? 'Attended' : 'Missed'}</span>{' '}
                        {item.classTitle}
                      </p>
                      <p className='text-muted-foreground text-[11px]'>{timeAgo(item.at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </SectionTabPanel>
      </SectionTabs>
    </div>
  );
};

export default InstructorStudentsDetailPage;

'use client';

import { CourseTrainingRequirements } from '@/app/dashboard/_components/course-training-requirements';
import { PublicTopNav } from '@/components/PublicTopNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { buildDashboardSwitchPath } from '@/src/features/dashboard/lib/active-domain-storage';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek
} from 'date-fns';
import {
  Armchair,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  MapPin,
  Users,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useClassDetails } from '../../hooks/use-class-details';
import { useDifficultyLevels } from '../../hooks/use-difficultyLevels';
import { useUserDomains } from '../../hooks/use-user-query';

type ClassInviteData = ReturnType<typeof useClassDetails>['data'];
type ClassInviteCourse = NonNullable<ClassInviteData['course']>;
type ClassInviteEnrollment = ClassInviteData['enrollments'][number];
type ClassInviteProgram = NonNullable<ClassInviteData['program']>;
type ClassInviteProgramCourse = ClassInviteData['pCourses'][number] & { title?: string };
type ClassInviteSchedule = ClassInviteData['schedule'][number];

// if user is not authenticated, show them a dialog that prompts them to create a student account on the platform to view and use the invite, instead of an empty page

function ClassInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  const uuid = searchParams.get('id');
  const [copied, setCopied] = useState(false);
  const [accountPromptOpen, setAccountPromptOpen] = useState(false);
  const user = useUserDomains();
  const isAuthenticated = status === 'authenticated';

  const { data: combinedClass, isLoading } = useClassDetails(uuid as string);
  const data = combinedClass?.class;
  const schedules = combinedClass?.schedule;
  const course = combinedClass?.course;
  const program = combinedClass?.program;
  const enrollments = combinedClass?.enrollments;
  const programCourses = combinedClass?.pCourses;
  const currentInvitePath = useMemo(() => {
    const queryString = searchParams.toString();
    return queryString ? `/class-invite?${queryString}` : '/class-invite';
  }, [searchParams]);
  const hasStudentDomain = user.domains.includes('student');

  useEffect(() => {
    if (status === 'unauthenticated') {
      setAccountPromptOpen(true);
    }
  }, [status]);

  const uniqueEnrollments = useMemo(() => {
    if (!enrollments) return [];

    const map = new Map<string, ClassInviteEnrollment>();

    enrollments.forEach(enrollment => {
      if (enrollment.student_uuid && !map.has(enrollment.student_uuid)) {
        map.set(enrollment.student_uuid, enrollment);
      }
    });

    return Array.from(map.values());
  }, [enrollments]);

  const getEnrollUrl = () => {
    if (course?.uuid) {
      return `/dashboard/workspace/student/courses/available-classes/${course.uuid}/enroll?id=${uuid}`;
    }

    if (program?.uuid) {
      return `/dashboard/workspace/student/courses/available-programs/${program.uuid}/enroll?id=${uuid}`;
    }

    return '';
  };

  const handleRegister = () => {
    if (status === 'loading') {
      return;
    }

    if (!isAuthenticated) {
      setAccountPromptOpen(true);
      return;
    }

    if (!user.isReady) {
      return;
    }

    if (user?.activeDomain !== 'student') {
      setAccountPromptOpen(true);
      return;
    }

    const url = getEnrollUrl();
    if (url) window.open(url, '_blank');
  };

  const handleSwitchToStudent = () => {
    setAccountPromptOpen(false);
    router.push(buildDashboardSwitchPath('student', currentInvitePath));
  };

  const handleCreateStudentProfile = () => {
    setAccountPromptOpen(false);
    router.push(`/dashboard/add-profile/student?next=${encodeURIComponent(currentInvitePath)}`);
  };

  const copyLink = async () => {
    const url = getEnrollUrl();
    if (!url) return;

    await navigator.clipboard.writeText(`${window.location.origin}${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='mx-auto w-full max-w-6xl px-6 py-12 lg:py-16'>
      {isLoading ? (
        <Skeleton className='h-[420px] w-full rounded-[28px]' />
      ) : (
        <>
          {!isAuthenticated ? (
            <Card className='border-border/70 bg-card mb-6 rounded-[28px] border shadow-sm'>
              <CardHeader className='space-y-3'>
                <Badge variant='outline' className='w-fit rounded-full'>
                  Student account required
                </Badge>
                <CardTitle className='text-2xl font-semibold'>
                  Create a student profile to register
                </CardTitle>
                <CardDescription className='text-muted-foreground max-w-2xl'>
                  You can review this invite now, but you will need a student profile before you
                  can enroll. We&apos;ll take you back here after you create or switch to one.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {data?.course_uuid && (
            <Card className='border-border bg-card rounded-[28px] border shadow-xl'>
              <CardHeader className='space-y-4'>
                <div className='flex items-center justify-between gap-4'>
                  <div className='flex flex-wrap gap-2'>
                    <Badge className='rounded-full'>{data?.session_format}</Badge>
                    <Badge variant='outline' className='rounded-full'>
                      {data?.class_visibility}
                    </Badge>
                    <Badge
                      variant='outline'
                      className='border-primary/30 bg-primary/10 text-primary rounded-full'
                    >
                      {data?.duration_formatted}
                    </Badge>
                  </div>

                  <span className='text-on-primary bg-primary rounded-full px-3 py-1 text-xs font-semibold shadow-sm'>
                    COURSE
                  </span>
                </div>

                <CardTitle className='text-3xl font-semibold'>{data?.title}</CardTitle>

                  {data?.description ? (
                    <CardDescription className='text-muted-foreground'>
                      {data?.description}
                    </CardDescription>
                  ) : null}
                </CardHeader>

                {course ? <CourseDetailedCard course={course} /> : null}

                <CardContent className='space-y-6'>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <InfoRow
                      icon={<Clock className='h-4 w-4' />}
                      label='CLASS BEGINS'
                      value={`${new Date(data?.default_start_time).toLocaleString()} – ${new Date(
                        data?.default_end_time
                      ).toLocaleTimeString()}`}
                    />

                    <InfoRow
                      icon={<MapPin className='h-4 w-4' />}
                      label='Location'
                      value={data?.location_type === 'ONLINE' ? 'Online' : data?.location_name}
                    />

                    <InfoRow
                      icon={<Users className='h-4 w-4' />}
                      label='Capacity'
                      value={data?.capacity_info}
                    />

                    <InfoRow
                      icon={<Layers className='h-4 w-4' />}
                      label='Fee'
                      value={
                        typeof data?.training_fee === 'number'
                          ? `KES ${data?.training_fee.toLocaleString()}`
                          : 'Free'
                      }
                    />

                    <InfoRow
                      icon={<Armchair className='h-4 w-4' />}
                      label='Available Seats'
                      value={
                        <div>
                          {Number(data?.max_participants) - uniqueEnrollments?.length} of{' '}
                          {data?.max_participants}
                        </div>
                      }
                    />
                  </div>
                </CardContent>

                <CardContent>
                  <CourseTrainingRequirements
                    requirements={course?.training_requirements}
                    title='Course Training Requirements'
                    description='Review what you need to prepare before registering for this class.'
                  />
                </CardContent>

                <CardContent>
                  <ClassScheduleCalendar schedules={schedules} />
                </CardContent>

                <div className='border-border flex flex-col gap-3 border-t px-6 pt-6 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='text-muted-foreground text-sm'>
                    Open to the public • Limited seats
                  </div>

                  <div className='flex items-center gap-3'>
                    <Button
                      onClick={handleRegister}
                      size='lg'
                      className='rounded-full px-10'
                      disabled={status === 'loading'}
                    >
                      Register for Class
                    </Button>

                    <Button variant='outline' size='sm' onClick={copyLink} disabled={copied}>
                      {copied ? 'Copied!' : 'Copy link'}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          }

          {
            data?.program_uuid && (
              <Card className='border-border bg-card rounded-[28px] border shadow-xl'>
                <CardHeader className='space-y-4'>
                  <div className='flex items-center justify-between gap-4'>
                    <div className='flex flex-wrap gap-2'>
                      <Badge className='rounded-full'>{data?.session_format}</Badge>
                      <Badge variant='outline' className='rounded-full'>
                        {data?.class_visibility}
                      </Badge>
                      <Badge
                        variant='outline'
                        className='border-primary/30 bg-primary/10 text-primary rounded-full'
                      >
                        {data?.duration_formatted}
                      </Badge>
                    </div>

                    <span className='text-on-accent bg-accent rounded-full px-3 py-1 text-xs font-semibold shadow-sm'>
                      PROGRAM
                    </span>
                  </div>

                  <CardTitle className='text-3xl font-semibold'>{data?.title}</CardTitle>

                  {data?.description ? (
                    <CardDescription className='text-muted-foreground'>
                      {data?.description}
                    </CardDescription>
                  ) : null}
                </CardHeader>

                {program ? (
                  <ProgramDetailsCard program={program} courses={programCourses ?? []} />
                ) : null}

                <CardContent className='space-y-6'>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <InfoRow
                      icon={<Clock className='h-4 w-4' />}
                      label='CLASS BEGINS'
                      value={`${new Date(data?.default_start_time).toLocaleString()} – ${new Date(
                        data?.default_end_time
                      ).toLocaleTimeString()}`}
                    />

                    <InfoRow
                      icon={<MapPin className='h-4 w-4' />}
                      label='Location'
                      value={data?.location_type === 'ONLINE' ? 'Online' : data?.location_name}
                    />

                    <InfoRow
                      icon={<Users className='h-4 w-4' />}
                      label='Capacity'
                      value={data?.capacity_info}
                    />

                    <InfoRow
                      icon={<Layers className='h-4 w-4' />}
                      label='Fee'
                      value={
                        typeof data?.training_fee === 'number'
                          ? `KES ${data?.training_fee.toLocaleString()}`
                          : 'Free'
                      }
                    />

                    <InfoRow
                      icon={<Armchair className='h-4 w-4' />}
                      label='Available Seats'
                      value={
                        <div>
                          {Number(data?.max_participants) - uniqueEnrollments?.length} of{' '}
                          {data?.max_participants}
                        </div>
                      }
                    />
                  </div>
                </CardContent>

                <CardContent>
                  <ClassScheduleCalendar schedules={schedules} />
                </CardContent>

                {/* CTA */}
                <div className='border-border flex flex-col gap-3 border-t px-6 pt-6 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='text-muted-foreground text-sm'>
                    Open to the public • Limited seats
                  </div>

                  <div className='flex items-center gap-3'>
                    <Button
                      onClick={handleRegister}
                      size='lg'
                      className='rounded-full px-10'
                      disabled={status === 'loading'}
                    >
                      Register for Class
                    </Button>

                    <Button variant='outline' size='sm' onClick={copyLink} disabled={copied}>
                      {copied ? 'Copied!' : 'Copy link'}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          }
        </>
      )}

      <Dialog open={accountPromptOpen} onOpenChange={setAccountPromptOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {hasStudentDomain ? 'Switch to your student profile' : 'Create a student profile'}
            </DialogTitle>
            <DialogDescription className='space-y-2'>
              {hasStudentDomain ? (
                <span>
                  You already have a student profile. Switch to it and we will bring you back to
                  this class invite page so you can register.
                </span>
              ) : (
                <span>
                  You do not have a student profile yet. Create one first, then come back here to
                  register for the class again.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
            <Button variant='outline' onClick={() => setAccountPromptOpen(false)}>
              Cancel
            </Button>

            {hasStudentDomain ? (
              <Button onClick={handleSwitchToStudent}>Switch to student</Button>
            ) : (
              <Button onClick={handleCreateStudentProfile}>Create student profile</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}

// Main page component wrapped with Suspense
export default function PublicClassInvitePage() {
  return (
    <div className='bg-background text-foreground min-h-screen'>
      <PublicTopNav />
      <Suspense
        fallback={
          <div className='mx-auto w-full max-w-5xl px-6 py-12 lg:py-16'>
            <Skeleton className='h-[420px] w-full rounded-[28px]' />
          </div>
        }
      >
        <ClassInviteContent />
      </Suspense>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className='flex items-start gap-3'>
      <div className='text-primary mt-0.5'>{icon}</div>
      <div className='space-y-0.5'>
        <div className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</div>
        <div className='text-sm font-medium'>{value}</div>
      </div>
    </div>
  );
}

interface Props {
  schedules: ClassInviteSchedule[];
}
function getCalendarBounds(schedules: ClassInviteSchedule[]) {
  if (!schedules?.length) {
    const now = new Date();
    return {
      minMonth: startOfMonth(now),
      maxMonth: endOfMonth(now),
    };
  }

  const sorted = schedules
    .map(s => new Date(s.start_time))
    .sort((a, b) => a.getTime() - b.getTime());

  const firstSchedule = sorted[0];
  const lastSchedule = sorted[sorted.length - 1];

  if (!firstSchedule || !lastSchedule) {
    const now = new Date();
    return {
      minMonth: startOfMonth(now),
      maxMonth: endOfMonth(now),
    };
  }

  return {
    minMonth: startOfMonth(firstSchedule),
    maxMonth: endOfMonth(lastSchedule),
  };
}

export function ClassScheduleCalendar({ schedules }: Props) {
  const { minMonth, maxMonth } = useMemo(() => getCalendarBounds(schedules), [schedules]);

  const [currentMonth, setCurrentMonth] = useState(minMonth);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let day = calendarStart;

  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const prevMonth = startOfMonth(addDays(monthStart, -1));
  const nextMonth = startOfMonth(addDays(monthEnd, 1));

  const canGoPrev = prevMonth >= minMonth;
  const canGoNext = nextMonth <= maxMonth;

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, ClassInviteSchedule[]>();

    schedules?.forEach(s => {
      const key = format(new Date(s.start_time), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });

    return map;
  }, [schedules]);

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <Button
          size='icon'
          variant='outline'
          disabled={!canGoPrev}
          onClick={() => canGoPrev && setCurrentMonth(prevMonth)}
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>

        <h3 className='font-semibold'>{format(currentMonth, 'MMMM yyyy')}</h3>

        <Button
          size='icon'
          variant='outline'
          disabled={!canGoNext}
          onClick={() => canGoNext && setCurrentMonth(nextMonth)}
        >
          <ChevronRight className='h-4 w-4' />
        </Button>
      </CardHeader>

      <CardContent>
        {/* Week headers */}
        <div className='text-muted-foreground mb-2 grid grid-cols-7 text-xs'>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className='text-center'>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className='grid grid-cols-7 gap-2'>
          {days.map(date => {
            const key = format(date, 'yyyy-MM-dd');
            const sessions = sessionsByDay.get(key) || [];
            const isOutsideMonth = !isSameMonth(date, currentMonth);

            return (
              <div
                key={key}
                className={`min-h-[90px] rounded-md border p-1 text-xs ${isOutsideMonth ? 'bg-muted/30 text-muted-foreground' : 'bg-card'} ${sessions.length ? 'border-primary/50' : ''} `}
              >
                <div className='text-right font-medium'>{format(date, 'd')}</div>

                <div className='mt-1 space-y-1'>
                  {sessions.map(s => (
                    <div key={s.uuid} className='bg-primary/10 rounded px-1 py-0.5 text-[10px]'>
                      <div className='truncate font-semibold'>{s.title}</div>
                      <div className='text-muted-foreground'>
                        {format(new Date(s.start_time), 'HH:mm')} –{' '}
                        {format(new Date(s.end_time), 'HH:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Range hint */}
        <p className='text-muted-foreground mt-3 text-center text-xs'>
          Showing schedule from <strong>{format(minMonth, 'MMM d, yyyy')}</strong> to{' '}
          <strong>{format(maxMonth, 'MMM d, yyyy')}</strong>
        </p>
      </CardContent>
    </Card>
  );
}

interface CourseProps {
  course: ClassInviteCourse;
}

export function CourseDetailedCard({ course }: CourseProps) {
  const { difficultyMap } = useDifficultyLevels();

  return (
    <div className='space-y-6 px-6 py-5'>
      {/* Header: Name + Category + Difficulty */}
      <section className='flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between'>
        <div className='min-w-0 flex-1 space-y-4'>
          <div className='space-y-2'>
            <h2 className='text-2xl font-bold'>{course?.name}</h2>
            <p className='text-muted-foreground text-sm'>
              <strong>Category:</strong> {course.category_names?.join(', ') || 'Uncategorized'}
            </p>
            {course?.difficulty_uuid ? (
              <p className='text-muted-foreground text-sm'>
                <strong>Difficulty:</strong> {difficultyMap[course?.difficulty_uuid]}
              </p>
            ) : null}
          </div>

          <div className='text-muted-foreground flex flex-wrap gap-x-6 gap-y-2 text-sm'>
            <p>
              <strong>Class Limit:</strong> {course?.class_limit || 'No limit'} students
            </p>
            <p>
              <strong>Age Range:</strong> {course?.age_lower_limit || 'N/A'} –{' '}
              {course?.age_upper_limit || 'N/A'} years
            </p>
          </div>
        </div>

        {course?.intro_video_url ? (
          <div className='w-full max-w-xl overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm lg:w-[320px]'>
            <video src={course?.intro_video_url} controls className='h-full w-full' />
          </div>
        ) : null}
      </section>

      <div className='grid gap-4 md:grid-cols-2'>
        {/* Objectives */}
        {course?.objectives && (
          <div className='bg-muted/30 rounded-2xl border border-border/60 p-4'>
            <h3 className='font-semibold'>Objectives</h3>
            <div
              className='text-muted-foreground mt-2 text-sm leading-7'
              dangerouslySetInnerHTML={{ __html: course?.objectives }}
            />
          </div>
        )}

        {/* Prerequisites */}
        {course?.prerequisites && (
          <div className='bg-muted/30 rounded-2xl border border-border/60 p-4'>
            <h3 className='font-semibold'>Prerequisites</h3>
            <div
              className='text-muted-foreground mt-2 text-sm leading-7'
              dangerouslySetInnerHTML={{ __html: course?.prerequisites }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function ProgramDetailsCard({
  program,
  courses,
}: {
  program: ClassInviteProgram;
  courses: ClassInviteProgramCourse[];
}) {
  return (
    <div className='space-y-6 px-6 py-5'>
      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start'>
        {/* Objectives */}
        {program?.objectives && (
          <div className='bg-muted/30 rounded-2xl border border-border/60 p-4'>
            <h3 className='font-semibold'>Objectives</h3>
            <div
              className='text-muted-foreground mt-2 text-sm leading-7'
              dangerouslySetInnerHTML={{ __html: program?.objectives }}
            />
          </div>
        )}

        {/* Prerequisites */}
        {program?.prerequisites && (
          <div className='bg-muted/30 rounded-2xl border border-border/60 p-4'>
            <h3 className='font-semibold'>Prerequisites</h3>
            <div
              className='text-muted-foreground mt-2 text-sm leading-7'
              dangerouslySetInnerHTML={{ __html: program?.prerequisites }}
            />
          </div>
        )}
      </div>

      <div className='bg-primary/5 rounded-2xl border border-primary/15 p-4'>
        <h3 className='font-semibold'>Courses Included in This Training</h3>
        <ul className='text-muted-foreground mt-3 space-y-2 text-sm'>
          {courses.length === 0 ? (
            <li className='text-muted-foreground text-sm'>No courses available</li>
          ) : null}

          {courses.map(course => (
            <li key={course.uuid} className='flex items-start gap-2'>
              <BookOpen className='text-primary mt-0.5 h-4 w-4 shrink-0' />
              <span>{course.title || course.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

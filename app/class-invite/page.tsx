'use client';

import { CourseTrainingRequirements } from '@/app/dashboard/_components/course-training-requirements';
import { PublicTopNav } from '@/components/PublicTopNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  addDays,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
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
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useClassDetails } from '../../hooks/use-class-details';
import { useDifficultyLevels } from '../../hooks/use-difficultyLevels';
import { useUserDomains } from '../../hooks/use-user-query';

type ClassInviteData = ReturnType<typeof useClassDetails>['data'];
type ClassInviteCourse = NonNullable<ClassInviteData['course']>;
type ClassInviteEnrollment = ClassInviteData['enrollments'][number];
type ClassInviteProgram = NonNullable<ClassInviteData['program']>;
type ClassInviteProgramCourse = ClassInviteData['pCourses'][number] & { title?: string };
type ClassInviteSchedule = ClassInviteData['schedule'][number];

function ClassInviteContent() {
  const searchParams = useSearchParams();
  const uuid = searchParams.get('id');
  const [copied, setCopied] = useState(false);
  const user = useUserDomains();

  const { data: combinedClass, isLoading } = useClassDetails(uuid as string);
  const data = combinedClass?.class;
  const schedules = combinedClass?.schedule;
  const course = combinedClass?.course;
  const program = combinedClass?.program;
  const enrollments = combinedClass?.enrollments;
  const programCourses = combinedClass?.pCourses;

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
      return `/dashboard/all-courses/available-classes/${course.uuid}/enroll?id=${uuid}`;
    }

    if (program?.uuid) {
      return `/dashboard/all-courses/available-programs/${program.uuid}/enroll?id=${uuid}`;
    }

    return '';
  };

  const handleRegister = () => {
    if (user?.activeDomain !== 'student') {
      toast.message(
        'To enroll in a class, please switch to your student profile or create a student profile.'
      );
      return;
    }

    const url = getEnrollUrl();
    if (url) window.open(url, '_blank');
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
          {data?.course_uuid && (
            <Card className='border-border bg-card rounded-[28px] border shadow-xl'>
              <CardHeader className='space-y-4'>
                <div className='flxe-row flex items-center justify-between'>
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

              <div>{course && <CourseDetailedCard course={course} />}</div>

              <CardContent className='space-y-6'>
                {/* DETAILS */}
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
              </CardContent >

              <CardContent>
                <ClassScheduleCalendar schedules={schedules as any} />
                <ClassScheduleCalendar schedules={schedules} />
              </CardContent>

              {/* CTA */}
              <div className='border-border flex flex-col gap-3 border-t px-6 pt-6 sm:flex-row sm:items-center sm:justify-between'>
                <div className='text-muted-foreground text-sm'>
                  Open to the public • Limited seats
                </div>

                <div className='flex items-center gap-3'>
                  <Button onClick={handleRegister} size='lg' className='rounded-full px-10'>
                    Register for Class
                  </Button>

                  <Button variant='outline' size='sm' onClick={copyLink} disabled={copied}>
                    {copied ? 'Copied!' : 'Copy link'}
                  </Button>
                </div>
              </div>
            </Card >
          )
          }

          {
            data?.program_uuid && (
              <Card className='border-border bg-card rounded-[28px] border shadow-xl'>
                <CardHeader className='space-y-4'>
                  <div className='flxe-row flex items-center justify-between'>
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

                <div>{program && <ProgramDetailsCard program={program} />}</div>

                {/* Courses Card */}
                <CardContent className='bg-primary/5 mx-6 space-y-3 rounded-lg p-6'>
                  <h3 className='font-semibold'>Courses Included in This Training</h3>

                  <ul className='text-muted-foreground space-y-2 text-sm'>
                    {programCourses?.length === 0 && (
                      <li className='text-muted-foreground text-sm'>No courses available</li>
                    )}

                    {programCourses?.map((course: ClassInviteProgramCourse) => (
                      <li key={course.uuid} className='flex items-start gap-2'>
                        <BookOpen className='text-primary mt-0.5 h-4 w-4' />
                        <span>{course.title || course.name}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardContent className='space-y-6'>
                  {/* DETAILS */}
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
                    <Button onClick={handleRegister} size='lg' className='rounded-full px-10'>
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
    ?.map(s => new Date(s.start_time))
    ?.sort((a, b) => a.getTime() - b.getTime());

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
    minMonth: startOfMonth(addWeeks(firstSchedule, -2)),
    maxMonth: endOfMonth(addWeeks(lastSchedule, 2)),
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
    <CardContent className='space-y-6'>
      {/* Header: Name + Category + Difficulty */}
      <section className='flex flex-row items-center justify-between'>
        <div>
          <div className='space-y-1'>
            <h2 className='text-2xl font-bold'>{course?.name}</h2>
            <p className='text-muted-foreground text-sm'>
              <strong>Category:</strong> {course.category_names?.join(', ') || 'Uncategorized'}
            </p>
            {course?.difficulty_uuid && (
              <p className='text-muted-foreground text-sm'>
                <strong>Difficulty:</strong> {'  '}
                {difficultyMap[course?.difficulty_uuid as string]}
              </p>
            )}
          </div>

          {/* Duration, Class limit, Age range */}
          <div className='text-muted-foreground flex flex-wrap gap-4 text-sm'>
            <p>
              <strong>Class Limit:</strong> {course?.class_limit} students
            </p>
            <p>
              <strong>Age Range:</strong> {course?.age_lower_limit} – {course?.age_upper_limit}{' '}
              years
            </p>
          </div>
        </div>

        {/* Intro video player */}
        {course?.intro_video_url && (
          <div className='w-full max-w-2/5'>
            <video src={course?.intro_video_url} controls className='w-full rounded-md' />
          </div>
        )}
      </section>

      <div className='flex flex-row items-start justify-between gap-8'>
        {/* Objectives */}
        {course?.objectives && (
          <div>
            <h3 className='font-semibold'>Objectives</h3>
            <div
              className='text-muted-foreground text-sm'
              dangerouslySetInnerHTML={{ __html: course?.objectives }}
            />
          </div>
        )}

        {/* Prerequisites */}
        {course?.prerequisites && (
          <div>
            <h3 className='font-semibold'>Prerequisites</h3>
            <div
              className='text-muted-foreground text-sm'
              dangerouslySetInnerHTML={{ __html: course?.prerequisites }}
            />
          </div>
        )}
      </div>
    </CardContent>
  );
}

export function ProgramDetailsCard({ program }: { program: ClassInviteProgram }) {
  return (
    <CardContent className='space-y-6'>
      <div className='flex flex-row items-start justify-between gap-8'>
        {/* Objectives */}
        {program?.objectives && (
          <div>
            <h3 className='font-semibold'>Objectives</h3>
            <div
              className='text-muted-foreground text-sm'
              dangerouslySetInnerHTML={{ __html: program?.objectives }}
            />
          </div>
        )}

        {/* Prerequisites */}
        {program?.prerequisites && (
          <div>
            <h3 className='font-semibold'>Prerequisites</h3>
            <div
              className='text-muted-foreground text-sm'
              dangerouslySetInnerHTML={{ __html: program?.prerequisites }}
            />
          </div>
        )}
      </div>
    </CardContent>
  );
}

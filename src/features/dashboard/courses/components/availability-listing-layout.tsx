 'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@radix-ui/react-checkbox';
import { format } from 'date-fns';
import {
  Bookmark,
  BookOpen,
  Calendar,
  Clock,
  CoinsIcon,
  Eye,
  GraduationCap,
  Languages,
  Layers,
  MapPin,
  MessageSquareDot,
  PiggyBank,
  Play,
  Star,
  Timer,
  Users,
  Wallet
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useOrganisationsByIds } from '../../../../../hooks/use-batched-lookups';
import { useCourseLessonsWithContent } from '../../../../../hooks/use-courselessonwithcontent';
import { ClassSessionTemplate } from '../../../../../services/client';
import { toAuthenticatedMediaUrl } from '../../../../lib/media-url';
import { useUserProfile } from '../../../profile/context/profile-context';
import { ClassDetailSheet } from '../shared/_components/ClassDetailsSheet';
import { VideoPreviewModal } from '@/components/ui/video-preview-modal';
import { BundledClass } from '../types';

type Props = {
  cls: BundledClass;
  onEnroll: (cls: BundledClass) => void;
  onViewCourse: (cls: BundledClass) => void;
  onViewClass: (cls: BundledClass) => void;
};

// type SessionTemplate = {
//   start_time: string;
//   end_time: string;
//   recurrence: {
//     days_of_week: string;
//   };
// };

const DAY_ORDER = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

const DAY_LABELS: Record<(typeof DAY_ORDER)[number], string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

/**
 * Renders in the viewer's zone, like every other timestamp on the card. This used to be pinned to
 * UTC, so a class entered as 2pm EAT advertised itself as 11am on the same card that showed its
 * start time correctly as 2pm.
 */
function formatTime(date: Date | string) {
  return formatTimeInZone(date, { fallback: '' })
    .replace(':00', '')
    .replace(' ', '')
    .toLowerCase();
}


/**
 * `duration_minutes` is computed from the class's first session alone, so a class whose Wednesdays
 * run two hours and Fridays one advertised itself as "60 min / session". Reads the templates and
 * shows a range when they genuinely differ.
 */
function formatSessionLength(cls: { duration_minutes?: number; session_templates?: ClassSessionTemplate[] }) {
  const lengths = (cls.session_templates ?? [])
    .map(t =>
      t.start_time && t.end_time
        ? Math.round((new Date(t.end_time).getTime() - new Date(t.start_time).getTime()) / 60000)
        : Number.NaN
    )
    .filter(n => Number.isFinite(n) && n > 0);

  if (!lengths.length) {
    return cls.duration_minutes ? `${cls.duration_minutes} min / session` : 'Duration not set';
  }
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  return min === max ? `${min} min / session` : `${min}–${max} min / session`;
}

export function formatSessionSchedule(sessionTemplates: ClassSessionTemplate[]) {
  if (!sessionTemplates.length) {
    return 'Sessions not available';
  }

  const grouped = new Map<string, { day: string; order: number }[]>();

  for (const session of sessionTemplates) {
    const timeRange = `${formatTime(session?.start_time)}–${formatTime(session.end_time)}`;

    const day = session?.recurrence?.days_of_week;
    const order = DAY_ORDER.indexOf(day as (typeof DAY_ORDER)[number]);

    if (!grouped.has(timeRange)) {
      grouped.set(timeRange, []);
    }

    grouped.get(timeRange)!.push({
      day: DAY_LABELS[day as keyof typeof DAY_LABELS],
      order,
    });
  }

  return [...grouped.entries()]
    .map(([time, days]) => {
      const sortedDays = days
        .sort((a, b) => a.order - b.order)
        .map(d => d.day)
        .join('/');

      return `${sortedDays} ${time}`;
    })
    .join(' , ');
}

const formatScheduleDate = (date: Date | string) =>
  new Date(date).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export default function AvailabilityClassCard({ cls, onEnroll, onViewCourse, onViewClass }: Props) {
  const profile = useUserProfile();
  const student = profile?.student;

  const [detail, setDetail] = useState<BundledClass | null>(null);
  const [isPromoVideoOpen, setIsPromoVideoOpen] = useState(false);
  const [isRegistrationOngoing, setIsRegistrationOngoing] = useState(false);
  const [isRegistrationPeriodUndefined, setIsRegistrationPeriodUndefined] =
    useState(false);
  const [isClassEnded, setIsClassEnded] = useState(false);
  const [canEnrollClass, setCanEnrollClass] = useState(false);

  // ORGANISATION DETAILS
  const rating = Math.round(cls?.classRating?.average_rating ?? 0);

  const { organisationMap } = useOrganisationsByIds([cls?.organisation_uuid!]);
  const organisation =
    (cls?.organisation_uuid && organisationMap[cls.organisation_uuid]) || null;

  // CLASS LESSONS
  const { isLoading: lessonsLoading, lessons: lessonsWithContent } = useCourseLessonsWithContent({
    courseUuid: cls.course_uuid as string,
  });

  const courseLessons = useMemo(
    () => (lessonsWithContent ?? []).map(item => item.lesson).filter(Boolean),
    [lessonsWithContent]
  );

  const promotionalVideoUrl = toAuthenticatedMediaUrl(cls.promotional_video_url);

  // CLASS SCHEDULES
  const schedules = cls.schedule ?? [];
  const sortedSchedules = [...schedules].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const firstSchedule = sortedSchedules[0];
  const lastSchedule = sortedSchedules[sortedSchedules.length - 1];

  const startsAt = firstSchedule?.start_time;
  const endsAt = lastSchedule?.end_time;
  const registrationStart = cls?.registration_period_start_date;
  const registrationEnd = cls?.registration_period_end_date

  // CLASS ENROLLMENTS
  const enrollments = cls.enrollments ?? [];
  const uniqueStudentUuids = [
    ...new Set(enrollments.map(({ student_uuid }: { student_uuid: string }) => student_uuid)),
  ];
  const isStudentEnrolled = student ? uniqueStudentUuids.includes(student?.uuid) : false;

  // REGISTRATION PERIOD, CLASS ENDED BLOCK
  useEffect(() => {
    const now = new Date();

    const registrationStartDate = registrationStart
      ? new Date(registrationStart)
      : null;

    const registrationEndDate = registrationEnd
      ? new Date(registrationEnd)
      : null;

    const classEndDate = endsAt
      ? new Date(endsAt)
      : null;

    const noRegistrationPeriod =
      !registrationStartDate && !registrationEndDate;

    const registrationOngoing = noRegistrationPeriod
      ? false
      : (
        (!registrationStartDate || now >= registrationStartDate) &&
        (!registrationEndDate || now <= registrationEndDate)
      );

    const classEnded =
      classEndDate !== null &&
      now >= classEndDate;

    setIsRegistrationPeriodUndefined(noRegistrationPeriod);
    setIsRegistrationOngoing(registrationOngoing);
    setIsClassEnded(classEnded);

    setCanEnrollClass(
      !classEnded &&
      (registrationOngoing || noRegistrationPeriod)
    );
  }, [
    registrationStart,
    registrationEnd,
    endsAt,
  ]);

  useEffect(() => {
    const now = new Date();

    if (!cls?.registration_period_start_date) {
      setIsRegistrationOngoing(false);
      return;
    }

    const start = new Date(cls?.registration_period_start_date);
    const end = cls?.registration_period_end_date ? new Date(cls?.registration_period_end_date) : null;

    const isOngoing =
      now >= start &&
      (end === null || now <= end);

    setIsRegistrationOngoing(isOngoing);
  }, [cls?.registration_period_start_date, cls?.registration_period_end_date]);


  return (
    <div>
      <Card className='hover:border-primary/50 cursor-pointer transition hover:shadow-md'>
        <CardHeader className='flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex items-start gap-3'>
            {/* Add checkbox later if comparison is enabled */}
            <Checkbox
              aria-label={`Select ${cls.title} for comparison`}
              className='mt-1 border-black'
            />

            {cls.thumbnail_url ? (
              <img
                src={toAuthenticatedMediaUrl(cls.thumbnail_url) as string}
                alt={cls.name || cls.title}
                className='h-12 w-12 rounded-full object-cover'
              />
            ) : (
              <div className='bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full'>
                <BookOpen className='text-primary h-6 w-6' />
              </div>
            )}

            <div className='flex-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <CardTitle className='text-base'>{cls.title}</CardTitle>

                {cls.session_format && <Badge variant='secondary'>{cls.session_format}</Badge>}

                {cls.location_type && <Badge variant='outline'>{cls.location_type}</Badge>}

                {cls.skills_fund_eligible && (
                  <Badge className='bg-success/10 text-success'>Fund eligible</Badge>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground [&>span:not(:last-child)]:after:ml-2 [&>span:not(:last-child)]:after:text-sm [&>span:not(:last-child)]:after:font-bold [&>span:not(:last-child)]:after:text-foreground/70 [&>span:not(:last-child)]:after:content-['•']">
                {organisation && <span>{organisation.name}</span>}
                <span>{cls.instructor?.data?.full_name ?? ''}</span>
                <span>{cls.level_of_study ?? 'Certificate'}</span>
                <div className="flex flex-row items-center gap-1.5">
                  <span className="flex items-center text-warning">
                    {rating > 0 ? (
                      Array.from({ length: rating }).map((_, index) => (
                        <Star
                          key={index}
                          className="h-3.5 w-3.5 fill-current"
                        />
                      ))
                    ) : (
                      <Star className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </span>

                  <span className="h-3.5">{rating}</span>
                </div>
              </div>

            </div>
          </div>

          {promotionalVideoUrl ? (
            <div className='flex shrink-0 items-start'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='shrink-0 gap-2 whitespace-nowrap'
                onClick={() => setIsPromoVideoOpen(true)}
              >
                <Play className='h-4 w-4' />
                Watch promo video
              </Button>
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="px-6 -mt-4 text-sm">
          {isClassEnded ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-destructive">
              This class has ended. Enrollment is no longer available.
            </p>
          ) : isRegistrationPeriodUndefined ? (
            <p className="rounded-md bg-success/10 px-3 py-2 text-success">
              Registration period is not indicated. You can enroll for this class.
            </p>
          ) : isRegistrationOngoing ? (
            <p className="rounded-md bg-success/10 px-3 py-2 text-success">
              Registration is currently open for this class.
            </p>
          ) : (
            <p className="rounded-md bg-warning/10 px-3 py-2 text-warning">
              Registration is not currently open.
            </p>
          )}
        </CardContent>

        <CardContent>
          {/* Summary badges */}
          <div className='mb-2 flex flex-wrap gap-2'>
            <Badge variant='outline' className='bg-primary/5 text-primary gap-1'>
              <Calendar className='h-3 w-3' />
              {cls.schedule.length} sessions
            </Badge>

            <Badge variant='outline' className='bg-primary/5 text-primary gap-1'>
              <Timer className='h-3 w-3' />
              {formatSessionLength(cls)}
            </Badge>

            <Badge variant='outline' className='bg-primary/5 text-primary gap-1'>
              <BookOpen className='h-3 w-3' />
              {courseLessons.length} modules/units
            </Badge>

            <Badge variant='outline' className='bg-muted text-muted-foreground gap-1'>
              <Layers className='h-3 w-3' />1 classes in this course
            </Badge>
          </div>

          {/* Details */}
          <div className='text-muted-foreground grid gap-2 text-xs md:grid-cols-3'>
            <div className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {cls.academic_period_start_date && cls.academic_period_end_date
                ? `${format(
                  new Date(cls.academic_period_start_date),
                  'MMM d, yyyy'
                )} - ${format(
                  new Date(cls.academic_period_end_date),
                  'MMM d, yyyy'
                )}`
                : `${format(startsAt, 'MMM d, yyyy')} - ${format(
                  endsAt,
                  'MMM d, yyyy'
                )}`}
            </div>


            <div className='inline-flex items-center gap-1.5'>
              <Clock className='h-3.5 w-3.5' />
              {formatSessionSchedule(cls.session_templates ?? [])}
            </div>

            <div className='inline-flex items-center gap-1.5'>
              <Users className='h-3.5 w-3.5' />
              {uniqueStudentUuids.length ?? 0} / {cls.max_participants ?? 0} seats
            </div>

            <div className='inline-flex items-center gap-1.5'>
              <Calendar className='h-3.5 w-3.5' />
              Starts {startsAt ? formatScheduleDate(startsAt) : 'Not available'}
            </div>

            <div className='inline-flex items-center gap-1.5'>
              <Calendar className='h-3.5 w-3.5' />
              Ends {endsAt ? formatScheduleDate(endsAt) : 'Not available'}
            </div>

            <div className='inline-flex items-center gap-1.5'>
              <MapPin className='max-h-3.5 max-w-3.5 min-h-3.5 min-w-3.5' />
              {cls.venue ?? cls.location_name ?? cls?.meeting_link ?? 'Location not provided'}
            </div>

            <div className='inline-flex items-center gap-1.5'>
              <GraduationCap className='h-3.5 w-3.5' />
              Age {cls.course?.age_lower_limit ?? '0'} +
            </div>

            <div className='inline-flex items-center gap-1.5'>
              <Languages className='h-3.5 w-3.5' />
              English
            </div>

            <div className='text-foreground inline-flex items-center gap-1.5 font-semibold'>
              <CoinsIcon className='h-3.5 w-3.5' />
              KES {Number(cls.sale_price ?? 0).toLocaleString()}
            </div>
          </div>

          {/* Actions */}

          <div className='mt-4 flex flex-wrap gap-2'>
            {isStudentEnrolled ? (
              <Button className='bg-success hover:bg-success/90'>Enrolled</Button>
            ) : (
              <Button
                disabled={!canEnrollClass}
                onClick={() => onEnroll(cls)} className='bg-primary hover:bg-primary/90'>
                Join Class
              </Button>
            )}

            <Button variant='outline' onClick={() => onViewCourse(cls)}>
              <BookOpen className='mr-1 h-4 w-4' />
              Course Details
            </Button>

            <Button variant='outline' onClick={() => setDetail(cls)}>
              <Eye className='mr-1 h-4 w-4' />
              Class Info
            </Button>

            <Button disabled={true} variant='outline'>
              <Bookmark className='mr-1 h-4 w-4' />
              Save
            </Button>

            <Button disabled={true} variant='outline'>
              <Wallet className='mr-1 h-4 w-4' />
              Pay Using Wallet
            </Button>

            {cls.skills_fund_eligible && (
              <Button variant='outline'>
                <PiggyBank className='mr-1 h-4 w-4' />
                Apply for Skills Fund
              </Button>
            )}

            <Button disabled={true} variant='ghost'>
              <MessageSquareDot className='mr-1 h-4 w-4' />
              Contact Institution
            </Button>
          </div>
        </CardContent>
      </Card>

      <VideoPreviewModal
        open={isPromoVideoOpen}
        onOpenChange={setIsPromoVideoOpen}
        title={cls.title}
        description={`Preview ${cls.title} before you enroll.`}
        videoUrl={promotionalVideoUrl}
        emptyMessage='Promotional video is not available.'
      />

      <ClassDetailSheet
        open={!!detail}
        detail={detail}
        organisation={organisation}
        startsAt={startsAt}
        endsAt={endsAt}
        uniqueStudentUuids={uniqueStudentUuids as string[]}
        courseLessons={courseLessons}
        onClose={() => setDetail(null)}
        onEnroll={onEnroll}
        onViewCourse={onViewCourse}
        formatSessionSchedule={formatSessionSchedule}
        formatScheduleDate={formatScheduleDate}
      />
    </div>
  );
}

function formatTimeInZone(date: string, arg1: { fallback: string; }) {
  const { fallback } = arg1;
  if (!date) {
    return fallback;
  }

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return fallback;
  }

  return parsedDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

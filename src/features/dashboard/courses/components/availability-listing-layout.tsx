import {
  Bookmark,
  BookOpen,
  Calendar,
  Clock,
  Eye,
  GraduationCap,
  Languages,
  Layers,
  MapPin,
  MessageSquare,
  PiggyBank,
  Timer,
  Users,
  Wallet,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Props = {
  cls: BundledClass;
  onEnroll: (cls: BundledClass) => void;
  onViewCourse: (cls: BundledClass) => void;
  onViewClass: (cls: BundledClass) => void;
};

type SessionTemplate = {
  start_time: string;
  end_time: string;
  recurrence: {
    days_of_week: string;
  };
};

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

function formatTime(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC', // Change if you want local timezone
  })
    .format(new Date(date))
    .replace(':00', '')
    .replace(' ', '')
    .toLowerCase();
}

export function formatSessionSchedule(sessionTemplates: SessionTemplate[]) {
  if (!sessionTemplates.length) {
    return 'Sessions not available';
  }

  const grouped = new Map<string, { day: string; order: number }[]>();

  for (const session of sessionTemplates) {
    const timeRange = `${formatTime(session.start_time)}–${formatTime(session.end_time)}`;

    const day = session.recurrence.days_of_week;
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

  // CLASS LESSONS
  const { isLoading: lessonsLoading, lessons: lessonsWithContent } = useCourseLessonsWithContent({
    courseUuid: cls.course_uuid as string,
  });

  const courseLessons = useMemo(
    () => (lessonsWithContent ?? []).map(item => item.lesson).filter(Boolean),
    [lessonsWithContent]
  );

  // CLASS SCHEDULES
  const schedules = cls.schedule ?? [];
  const sortedSchedules = [...schedules].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const firstSchedule = sortedSchedules[0];
  const lastSchedule = sortedSchedules[sortedSchedules.length - 1];

  const startsAt = firstSchedule?.start_time;
  const endsAt = lastSchedule?.end_time;

  // CLASS ENROLLMENTS
  const enrollments = cls.enrollments ?? [];
  const uniqueStudentUuids = [
    ...new Set(enrollments.map(({ student_uuid }: { student_uuid: string }) => student_uuid)),
  ];
  const isStudentEnrolled = student ? uniqueStudentUuids.includes(student?.uuid) : false;

  // console.log(cls, "CLASS")

  return (
    <div>
      <Card className='hover:border-primary/50 cursor-pointer transition hover:shadow-md'>
        <CardHeader className='pb-3'>
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

              <div className='text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-xs'>
                <span>{cls.organization?.data?.name ?? 'Institution not available'}</span>

                <span>· {cls.instructor?.data?.full_name ?? ''}</span>

                <span>· {cls.level_of_study ?? 'Certificate'}</span>

                <span>· ⭐ {cls.classRating?.average_rating ?? '0'}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Summary badges */}
          <div className='mb-2 flex flex-wrap gap-2'>
            <Badge variant='outline' className='bg-primary/5 text-primary gap-1'>
              <Calendar className='h-3 w-3' />
              {cls.schedule.length} sessions
            </Badge>

            <Badge variant='outline' className='bg-primary/5 text-primary gap-1'>
              <Timer className='h-3 w-3' />
              {cls.duration_minutes} min / session
            </Badge>

            <Badge variant='outline' className='bg-primary/5 text-primary gap-1'>
              <BookOpen className='h-3 w-3' />
              {courseLessons.length} units
            </Badge>

            <Badge variant='outline' className='bg-muted text-muted-foreground gap-1'>
              <Layers className='h-3 w-3' />1 classes in this course
            </Badge>
          </div>

          {/* Details */}
          <div className='text-muted-foreground grid gap-2 text-xs md:grid-cols-3'>
            <div className='inline-flex items-center gap-1.5'>
              <Calendar className='h-3.5 w-3.5' />
              {cls.academic_period ?? 'Academic period not provided'}
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
              <MapPin className='h-3.5 w-3.5' />
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
              KES {Number(cls.training_fee ?? 0).toLocaleString()}
            </div>
          </div>

          {/* Actions */}

          <div className='mt-4 flex flex-wrap gap-2'>
            {isStudentEnrolled ? (
              <Button className='bg-success hover:bg-success/90'>Enrolled</Button>
            ) : (
              <Button onClick={() => onEnroll(cls)} className='bg-primary hover:bg-primary/90'>
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

            <Button variant='outline'>
              <Bookmark className='mr-1 h-4 w-4' />
              Save
            </Button>

            <Button variant='outline'>
              <Wallet className='mr-1 h-4 w-4' />
              Pay Using Wallet
            </Button>

            {cls.skills_fund_eligible && (
              <Button variant='outline'>
                <PiggyBank className='mr-1 h-4 w-4' />
                Apply for Skills Fund
              </Button>
            )}

            <Button variant='ghost'>
              <MessageSquare className='mr-1 h-4 w-4' />
              Contact Institution
            </Button>
          </div>
        </CardContent>
      </Card>

      <ClassDetailSheet
        open={!!detail}
        detail={detail}
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

export const mockRecommendedClasses = [
  {
    id: 'mock-1',
    title: 'Digital Marketing Fundamentals',
    institution_name: 'Nairobi Skills Academy',
    instructor_name: 'Jane Wanjiku',
    language: 'English',
    level_of_study: 'Certificate',
    tuition_fee_kes: 45000,
    skills_fund_eligible: true,
    match: 94,
    why: 'Matches your preferred language, budget and career goals.',
    breakdown: [
      {
        label: 'Career fit',
        score: 20,
        max: 20,
      },
      {
        label: 'Budget',
        score: 15,
        max: 15,
      },
      {
        label: 'Schedule',
        score: 12,
        max: 15,
      },
      {
        label: 'Location',
        score: 15,
        max: 15,
      },
    ],
  },
  {
    id: 'mock-2',
    title: 'Data Analysis with Excel',
    institution_name: 'TechBridge Institute',
    instructor_name: 'Peter Mwangi',
    language: 'English',
    level_of_study: 'Diploma',
    tuition_fee_kes: 60000,
    skills_fund_eligible: false,
    match: 87,
    why: 'Strong match based on your skill interests and availability.',
    breakdown: [
      {
        label: 'Career fit',
        score: 18,
        max: 20,
      },
      {
        label: 'Budget',
        score: 12,
        max: 15,
      },
      {
        label: 'Schedule',
        score: 15,
        max: 15,
      },
    ],
  },
];

import { Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Checkbox } from '../../../../../components/ui/checkbox';
import { useCourseLessonsWithContent } from '../../../../../hooks/use-courselessonwithcontent';
import { toAuthenticatedMediaUrl } from '../../../../lib/media-url';
import { useUserProfile } from '../../../profile/context/profile-context';
import { ClassDetailSheet } from '../shared/_components/ClassDetailsSheet';
import { BundledClass } from '../types';

type RecommendedClassCardProps = {
  item: BundledClass;
};

export function RecommendedClassCard({ item }: RecommendedClassCardProps) {
  return (
    <button className='border-primary/30 from-primary/5 hover:border-primary rounded-xl border bg-gradient-to-br to-transparent p-4 text-left transition'>
      <div className='flex flex-wrap gap-2'>
        <Badge className='bg-primary text-primary-foreground'>{item.match}% match</Badge>

        {item.skills_fund_eligible && (
          <Badge className='bg-success/10 text-success'>Fund eligible</Badge>
        )}
      </div>

      <div className='mt-3'>
        <h3 className='text-foreground font-semibold'>{item.title}</h3>

        <p className='text-muted-foreground text-xs'>{item.institution_name}</p>
      </div>

      <div className='text-muted-foreground mt-3 flex flex-wrap gap-2 text-xs'>
        <span>{item.language}</span>
        <span>• {item.level_of_study}</span>
      </div>

      <p className='text-primary mt-2 font-semibold'>KES {item.tuition_fee_kes.toLocaleString()}</p>

      <div className='bg-primary/5 mt-3 rounded-md p-3'>
        <div className='text-primary flex items-center gap-1 text-xs font-semibold'>
          <Sparkles className='h-3 w-3' />
          Why recommended
        </div>

        <p className='text-muted-foreground mt-1 text-xs'>{item.why}</p>
      </div>

      <div className='mt-3 space-y-2'>
        {item.breakdown.map((b: unknown) => {
          const percent = Math.round((b.score / b.max) * 100);

          return (
            <div key={b.label} className='flex items-center gap-2 text-xs'>
              <span className='text-muted-foreground w-20'>{b.label}</span>

              <div className='bg-muted h-1.5 flex-1 overflow-hidden rounded'>
                <div
                  className='bg-primary h-full'
                  style={{
                    width: `${percent}%`,
                  }}
                />
              </div>

              <span>
                {b.score}/{b.max}
              </span>
            </div>
          );
        })}
      </div>
    </button>
  );
}

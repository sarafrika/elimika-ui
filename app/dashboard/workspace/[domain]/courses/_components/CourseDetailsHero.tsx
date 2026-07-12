import {
  Award,
  BadgeCheck,
  BarChart,
  BookOpen,
  Clock,
  FileCheck,
  Globe,
  MonitorPlay,
  Play,
  User,
  Users,
} from 'lucide-react';
import type { Course } from '@/services/client';
import { ImageWithFallback } from '../../../../../../components/data/image-with-fallback';
import HTMLTextPreview from '../../../../../../components/editors/html-text-preview';
import { ClassDetailsScheduleItem, CombinedClassDetailsData } from '../../../../../../hooks/use-class-details';
import { toAuthenticatedMediaUrl } from '../../../../../../src/lib/media-url';
import StarRating from './StarRating';

type Props = {
  course: Course;
  classData: CombinedClassDetailsData;
  creatorName: string;
  creatorHeadline: string;
  difficultyName: string | null;
  reviewCount: number;
  averageRating: string | null;
  lessonCount: number;
  assignmentCount: number;
  quizCount: number;
  durationLabel: string;
  type?: string | undefined;
};

export default function CourseDetailsHero({
  course,
  classData,
  creatorName,
  creatorHeadline,
  difficultyName,
  reviewCount,
  averageRating,
  lessonCount,
  assignmentCount,
  quizCount,
  durationLabel,
  type,
}: Props) {
  const totalAssessments = assignmentCount + quizCount;
  const displayRating = averageRating ? Number(averageRating) : 0;

  const totalMinutes = classData?.schedule.reduce(
    (sum, item) => sum + Number(item.duration_minutes),
    0
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const totalDuration = `${hours}h${minutes ? ` ${minutes}m` : ""}`;

  function getNumberOfWeeks(schedule: ClassDetailsScheduleItem[]) {
    if (!schedule?.length) return 0;

    const timestamps = schedule.map(item =>
      new Date(item.start_time).getTime()
    );

    const earliest = Math.min(...timestamps);
    const latest = Math.max(...timestamps);

    const diffDays = Math.floor(
      (latest - earliest) / (1000 * 60 * 60 * 24)
    );

    return Math.floor(diffDays / 7) + 1;
  }

  const no_of_weeks = getNumberOfWeeks(classData?.schedule);

  const uniqueEnrollments = Array.from(
    new Map(
      (classData?.enrollments || []).map(enrollment => [
        enrollment.student_uuid,
        enrollment,
      ])
    ).values()
  );

  const isCourse = type === "course";

  const videoUrl = isCourse
    ? toAuthenticatedMediaUrl(course?.intro_video_url)
    : toAuthenticatedMediaUrl(classData?.class?.promotional_video_url ?? "");

  const imageUrl = isCourse
    ? toAuthenticatedMediaUrl(course?.thumbnail_url)
    : toAuthenticatedMediaUrl(classData?.class?.thumbnail_url ?? "");

  const hasVideo = isCourse
    ? !!course?.intro_video_url
    : !!classData?.class?.promotional_video_url;

  const title = isCourse ? course?.name : classData?.class?.title;
  const category = isCourse
    ? course?.category_names?.[0]?.toUpperCase()
    : '';

  return (
    <div className='flex flex-col gap-4 sm:gap-6'>
      <div className="bg-primary text-primary-foreground group relative aspect-video overflow-hidden rounded-xl shadow-lg">
        {hasVideo ? (
          <video
            src={videoUrl as string}
            controls
            className="h-full w-full object-cover"
            poster={imageUrl as string}
          />
        ) : (
          <>
            {/* Show thumbnail as background if available; degrade silently to the
                icon/title overlay below when the media is missing (404). */}
            <ImageWithFallback
              src={imageUrl as string | undefined}
              alt={title ?? "Preview"}
              fill
              unoptimized
              className="absolute inset-0 h-full w-full object-cover"
              fallback={null}
            />

            {/* Optional dark overlay */}
            <div className="absolute inset-0 bg-black/40" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mb-3 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 drop-shadow-lg sm:h-20 sm:w-20 lg:h-24 lg:w-24" />
                </div>

                <p className="text-lg font-black tracking-tight drop-shadow sm:text-xl lg:text-2xl">
                  {category || (isCourse ? "COURSE" : "CLASS")}
                </p>

                <p className="text-base font-bold sm:text-lg lg:text-xl">
                  {title}
                </p>

                <p className="text-primary-foreground/80 text-xs sm:text-sm">
                  {difficultyName || "Live details"}
                </p>
              </div>
            </div>

            <div className="bg-background/20 text-primary-foreground absolute right-3 top-3 flex items-center gap-1 rounded-md px-2 py-1 text-xs backdrop-blur-sm">
              <Play className="h-3 w-3 fill-current" />
              Preview
            </div>

            <div className="bg-background/20 absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <div className="bg-background flex h-14 w-14 items-center justify-center rounded-full shadow-2xl sm:h-16 sm:w-16">
                <Play className="text-primary ml-0.5 h-6 w-6 sm:h-8 sm:w-8" />
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-0">
              <div className="bg-background/20 flex h-12 w-12 items-center justify-center rounded-full border border-current/30 backdrop-blur-sm sm:h-14 sm:w-14">
                <Play className="text-primary-foreground ml-0.5 h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className='flex flex-col gap-3 sm:gap-4'>
        {isCourse ?
          <h1 className='text-foreground text-xl font-black leading-tight sm:text-2xl lg:text-3xl'>
            {course.name}
          </h1>
          :
          <div>
            <h1 className='text-foreground text-xl font-black leading-tight sm:text-2xl lg:text-3xl'>
              {classData?.class?.title}
            </h1>
            <p className="text-base font-bold sm:text-lg lg:text-xl">
              {course.name}
            </p>
          </div>}

        <div className='flex flex-wrap items-center gap-2'>
          <span className='bg-success/5 text-success border-border flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold sm:text-sm'>
            <Award className='h-3.5 w-3.5' />
            {course.status === 'published'
              ? 'Published Course'
              : 'Certificate Course'}
          </span>

          <span className='bg-secondary text-secondary-foreground border-border flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold sm:text-sm'>
            <BadgeCheck className='h-3.5 w-3.5' />
            {difficultyName || 'General'}
          </span>
        </div>

        <StarRating
          rating={displayRating || 0}
          reviewCount={reviewCount}
          size='md'
        />

        <div className='text-muted-foreground text-sm leading-relaxed sm:text-base'>
          <HTMLTextPreview htmlContent={course.description || ''} />
        </div>

        {isCourse ?
          (<div className='flex flex-wrap items-center gap-12 w-full text-sm'>
            <div className='flex items-start gap-2'>
              <div className='bg-muted flex h-8 w-8 items-center justify-center rounded-full'>
                <User className='text-muted-foreground h-4 w-4' />
              </div>
              <div>
                <p className='text-muted-foreground text-xs'>
                  Course Creator
                </p>
                <p className='text-foreground text-xs font-semibold sm:text-sm'>
                  {creatorName}
                </p>

              </div>
            </div>

            <div className='flex flex-col items-start gap-1.5'>
              <div className='flex gap-2'>
                <Clock className='text-muted-foreground h-4 w-4 shrink-0' />
                <p className='text-muted-foreground text-xs'>
                  Instructors
                </p>
              </div>

              <p className='text-foreground text-xs font-semibold sm:text-sm'>
                {"0 | 5"} active
              </p>
            </div>

            <div className='flex flex-col items-start gap-1.5'>
              <div className='flex gap-2'>
                <Users className='text-muted-foreground h-4 w-4 shrink-0' />
                <p className='text-muted-foreground text-xs'>
                  Students
                </p>
              </div>

              <p className='text-foreground text-xs font-semibold sm:text-sm'>
                {course.class_limit ?? 0} Enrolled
              </p>
            </div>
          </div>)
          :
          (<div className='flex flex-wrap items-center gap-12 w-full text-sm'>
            <div className='flex flex-col items-start gap-1.5'>
              <div className='flex gap-2'>
                <Clock className='text-muted-foreground h-4 w-4 shrink-0' />
                <p className='text-muted-foreground text-xs'>
                  Schedule
                </p>
              </div>

              <p className='text-foreground text-xs font-semibold sm:text-sm'>
                {totalDuration} / {classData?.schedule?.length} classes
              </p>
            </div>

            <div className='flex flex-col items-start gap-1.5'>
              <div className='flex gap-2'>
                <BarChart className='text-muted-foreground h-4 w-4 shrink-0' />
                <p className='text-muted-foreground text-xs'>
                  Duration
                </p>
              </div>

              <p className='text-foreground text-xs font-semibold sm:text-sm'>
                {no_of_weeks || 0} weeks
              </p>
            </div>

            <div className='flex flex-col items-start gap-1.5'>
              <div className='flex gap-2'>
                <Users className='text-muted-foreground h-4 w-4 shrink-0' />
                <p className='text-muted-foreground text-xs'>
                  Students
                </p>
              </div>

              <p className='text-foreground text-xs font-semibold sm:text-sm'>
                {uniqueEnrollments?.length ?? 0} Enrolled / {0} waiting list
              </p>
            </div>
          </div>)
        }
      </div>

      <div className="border-border flex flex-wrap gap-6 border-y py-3 sm:gap-12 sm:py-4">
        {[
          {
            icon: <BookOpen className="h-4 w-4 text-primary" />,
            label: `${lessonCount}`,
            sub: 'Lessons',
            bg: 'bg-primary/5',
          },
          {
            icon: <FileCheck className="h-4 w-4 text-success" />,
            label: `${totalAssessments}`,
            sub: 'Assessments',
            bg: 'bg-success/5',
          },
          {
            icon: <MonitorPlay className="h-4 w-4 text-warning" />,
            label: 'Hands-on',
            sub: 'Projects',
            bg: 'bg-warning/5',
          },
          {
            icon: <Award className="h-4 w-4 text-balance" />,
            label: 'Certificate',
            sub: 'of Completion',
            bg: 'bg-muted/50',
          },
          {
            icon: <Globe className="h-4 w-4 text-accent" />,
            label: 'English',
            sub: 'Language',
            bg: 'bg-accent/5',
          },
        ].map((item, i) => (
          <div key={i} className="flex flex-row min-w-fit items-center gap-2">
            <div className={`${item.bg} p-2 rounded-full`}>
              {item.icon}
            </div>

            <div className="flex flex-col">
              <span className="text-foreground text-xs font-bold sm:text-sm">
                {item.label}
              </span>
              <span className="text-muted-foreground text-xs -mt-1">
                {item.sub}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
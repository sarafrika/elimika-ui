import type { Course } from '@/services/client';
import {
  Award,
  BadgeCheck,
  BookOpen,
  Clock,
  FileCheck,
  Globe,
  MonitorPlay,
  Play,
  User,
  Users,
} from 'lucide-react';
import HTMLTextPreview from '../../../../../../components/editors/html-text-preview';
import StarRating from './StarRating';

type Props = {
  course: Course;
  creatorName: string;
  creatorHeadline: string;
  difficultyName: string | null;
  reviewCount: number;
  averageRating: string | null;
  lessonCount: number;
  assignmentCount: number;
  quizCount: number;
  durationLabel: string;
};

export default function CourseDetailsHero({
  course,
  creatorName,
  creatorHeadline,
  difficultyName,
  reviewCount,
  averageRating,
  lessonCount,
  assignmentCount,
  quizCount,
  durationLabel,
}: Props) {
  const totalAssessments = assignmentCount + quizCount;
  const displayRating = averageRating ? Number(averageRating) : 0;

  return (
    <div className='flex flex-col gap-4 sm:gap-6'>
      <div className="bg-primary text-primary-foreground group relative aspect-video overflow-hidden rounded-xl shadow-lg">
        {course?.intro_video_url ? (
          <video
            src={course.intro_video_url}
            controls
            className="h-full w-full object-cover"
            poster={course?.thumbnail_url}
          />
        ) : (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mb-3 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 drop-shadow-lg sm:h-20 sm:w-20 lg:h-24 lg:w-24" />
                </div>

                <p className="text-lg font-black tracking-tight drop-shadow sm:text-xl lg:text-2xl">
                  {course.category_names?.[0]?.toUpperCase() || "COURSE"}
                </p>

                <p className="text-base font-bold sm:text-lg lg:text-xl">
                  {course.name}
                </p>

                <p className="text-primary-foreground/80 text-xs sm:text-sm">
                  {difficultyName || "Live course details"}
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
        <h1 className='text-foreground text-xl font-black leading-tight sm:text-2xl lg:text-3xl'>
          {course.name}
        </h1>

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

        <div className='flex flex-wrap items-center gap-12 w-full text-sm'>
          <div className='flex items-center gap-2'>
            <div className='bg-muted flex h-8 w-8 items-center justify-center rounded-full'>
              <User className='text-muted-foreground h-4 w-4' />
            </div>

            <div>
              <p className='text-muted-foreground text-xs'>
                Instructor
              </p>

              <p className='text-foreground text-xs font-semibold sm:text-sm'>
                {creatorName}
              </p>

              <p className='text-muted-foreground text-xs'>
                {creatorHeadline}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-1.5'>
            <Clock className='text-muted-foreground h-4 w-4 shrink-0' />

            <div>
              <p className='text-muted-foreground text-xs'>
                Duration
              </p>

              <p className='text-foreground text-xs font-semibold sm:text-sm'>
                {durationLabel}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-1.5'>
            <Users className='text-muted-foreground h-4 w-4 shrink-0' />

            <div>
              <p className='text-muted-foreground text-xs'>
                Students
              </p>

              <p className='text-foreground text-xs font-semibold sm:text-sm'>
                {course.class_limit ?? 0} Max
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='border-border flex flex-wrap gap-6 border-y py-3 sm:gap-12 sm:py-4'>
        {[
          {
            icon: <BookOpen className='text-primary h-4 w-4' />,
            label: `${lessonCount}`,
            sub: 'Lessons',
          },
          {
            icon: <FileCheck className='text-primary h-4 w-4' />,
            label: `${totalAssessments}`,
            sub: 'Assessments',
          },
          {
            icon: <MonitorPlay className='text-primary h-4 w-4' />,
            label: 'Live',
            sub: 'Course Data',
          },
          {
            icon: <Award className='text-primary h-4 w-4' />,
            label: 'API',
            sub: 'Driven',
          },
          {
            icon: <Globe className='text-primary h-4 w-4' />,
            label: 'English',
            sub: 'Language',
          },
        ].map((item, i) => (
          <div
            key={i}
            className='flex min-w-fit items-center gap-2'
          >
            {item.icon}

            <div>
              <span className='text-foreground text-xs font-bold sm:text-sm'>
                {item.label}
              </span>

              <span className='text-muted-foreground ml-0.5 text-xs'>
                {item.sub}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
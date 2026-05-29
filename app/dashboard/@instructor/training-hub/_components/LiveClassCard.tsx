'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import {
  isAuthenticatedMediaUrl,
  toAuthenticatedMediaUrl,
} from '@/src/lib/media-url';
import {
  BookOpen,
  CalendarDays,
  EllipsisVertical,
  Eye,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { useDifficultyLevels } from '../../../../../hooks/use-difficultyLevels';
import { RichTextPreview } from '../../classes/class-training/[id]/_components/ClassTrainingPage';
import type { TrainingHubLiveClass } from './training-hub-data';

type LiveClassCardProps = {
  liveClass: TrainingHubLiveClass;
};

export function LiveClassCard({
  liveClass,
}: LiveClassCardProps) {
  const imageUrl = toAuthenticatedMediaUrl(liveClass.imageUrl);

  const handleDeleteClass = () => {
    toast.message('Implement delete class');
  };

  const statusConfig =
    liveClass.status === 'published'
      ? {
        label: 'Published',
        className:
          'border-success/20 bg-success/10 text-success',
      }
      : liveClass.status === 'draft'
        ? {
          label: 'Draft',
          className:
            'border-warning/20 bg-warning/10 text-warning',
        }
        : {
          label: 'On-going',
          className:
            'border-primary/20 bg-primary/10 text-primary',
        };


  const { difficultyMap } = useDifficultyLevels();

  const progress = liveClass?.class?.class_progress_percentage;
  const sessionsRemaining =
    Number(liveClass?.sessions) - Number(liveClass?.class?.completed_session_count);

  const formattedDate = liveClass?.class?.default_start_time
    ? new Date(liveClass.class.default_start_time).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    : 'Not set';

  const bundledCourses = liveClass.programCourses ?? [];
  const topDifficultyLabels = Array.from(
    new Set(
      [
        liveClass?.class?.course?.difficulty_uuid
          ? difficultyMap[liveClass.class.course.difficulty_uuid] ?? 'General'
          : null,
        ...bundledCourses.map(course =>
          course.difficulty_uuid ? difficultyMap[course.difficulty_uuid] ?? 'General' : 'General'
        ),
      ].filter((value): value is string => Boolean(value))
    )
  );

  const totalMinutes = liveClass?.class?.schedule?.reduce(
    (sum, item) => sum + Number(item?.duration_minutes || 0),
    0
  );

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeHrsMinutes = `${hours} hrs ${minutes} mins`

  return (
    <Card className='overflow-hidden p-0 rounded-md border border-border/60 bg-card shadow-sm'>
      <CardContent className='p-0'>
        <div className='flex flex-col'>
          {/* TOP SECTION */}
          <div className='flex flex-col gap-4 p-4 lg:flex-row lg:items-start'>
            <div>
              {/* IMAGE */}
              <div className='hidden lg:flex relative h-[120px] w-full overflow-hidden rounded-md bg-muted lg:w-[180px] lg:min-w-[180px]'>
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={liveClass.title}
                    fill
                    className='object-cover'
                    unoptimized={isAuthenticatedMediaUrl(
                      imageUrl
                    )}
                  />
                ) : (
                  <div className='bg-primary/10 text-primary flex h-full w-full items-center justify-center'>
                    <BookOpen className='size-10' />
                  </div>
                )}
              </div>

              <Button variant={"ghost"} className='border mt-2'>
                <UserPlus />
                <p>Invite student</p>
              </Button>
            </div>

            {/* CONTENT */}
            <div className='min-w-0 flex-1'>
              {/* HEADER */}
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0 flex-1'>
                  <h3 className='text-foreground mt-2 line-clamp-1 text-xl font-semibold tracking-[-0.02em]'>
                    {liveClass.title}
                  </h3>

                  <div className='text-muted-foreground mt-1 line-clamp-2 text-sm'>
                    <RichTextPreview html={liveClass?.class?.course?.description as string} />
                  </div>
                </div>

                {/* DROPDOWN */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      aria-label='More options'
                      variant='ghost'
                      size='icon'
                      className='h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    >
                      <EllipsisVertical className='size-4' />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align='end'
                    className='w-52'
                  >
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/dashboard/classes/new?id=${liveClass?.classUuid}`}
                        className='flex items-center gap-2'
                      >
                        <Plus className='size-4' />
                        Add class
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link
                        href={`/dashboard/training-hub/classes/${liveClass?.classUuid}`}
                        className='flex items-center gap-2'
                      >
                        <Eye className='size-4' />
                        View class
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link
                        href={`/dashboard/classes/new?id=${liveClass?.classUuid}`}
                        className='flex items-center gap-2'
                      >
                        <Pencil className='size-4' />
                        Edit class
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className='text-destructive focus:text-destructive'
                      onClick={
                        handleDeleteClass
                      }
                    >
                      <Trash2 className='mr-2 size-4' />
                      Delete class
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className='flex flex-wrap items-center gap-2 mt-2'>
                <span className='inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground'>
                  {liveClass.provider}
                </span>

                <span className='inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground'>
                  {timeHrsMinutes}
                </span>

                <span className='inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground'>
                  {liveClass.fee} /hr/student
                </span>

                <div className='flex flex-wrap items-center gap-2'>
                  {topDifficultyLabels.map(difficulty => (
                    <span
                      key={difficulty}
                      className='inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground'
                    >
                      {difficulty}
                    </span>
                  ))}
                </div>
              </div>

              {bundledCourses.length > 0 && (
                <div className='mt-3 flex flex-wrap items-center gap-2'>
                  <span className='text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground'>
                    Program courses:
                  </span>

                  {bundledCourses.map((course, index) => (
                    <div
                      key={course.uuid ?? `${course.name}-${index}`}
                      className='inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted'
                    >
                      {course.name}
                    </div>
                  ))}
                </div>
              )}

              {/* STATS */}
              <div className='mt-5 flex flex-wrap items-center justify-evenly gap-3 border-t border-border/60 pt-4'>
                <StatItem
                  icon={<BookOpen className='size-4' />}
                  value={liveClass.classes}
                  label='Sessions'
                />

                <StatItem
                  icon={<Users className='size-4' />}
                  value={liveClass.students}
                  label='Students'
                />

                <StatItem
                  icon={<CalendarDays className='size-4' />}
                  value={formattedDate}
                  label='Start Date'
                />

                <div>
                  <p className='rounded-md px-0.5 py-1.5 text-sm font-semibold'>
                    {liveClass?.class?.location_type}
                  </p>

                  <p className='text-xs opacity-80'>
                    {liveClass?.class?.class_visibility}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION */}
          <div className='border-t border-border/60 bg-muted/20 px-4 py-4'>
            <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
              {/* PROGRESS */}
              <div className='min-w-0 flex-1'>
                <div className='mb-2 flex items-center justify-between gap-3'>
                  <p className='text-sm font-medium text-foreground'>
                    Overall Progress
                  </p>

                  <p className='text-sm font-semibold text-primary'>
                    {sessionsRemaining} Sessions Remaining
                  </p>
                </div>

                <Progress
                  value={progress}
                  className='bg-muted h-2'
                  indicatorClassName='bg-primary'
                />

                <p className='text-muted-foreground mt-2 text-sm'>
                  {progress}% completed
                </p>
              </div>

              {/* ACTIONS */}
              <div className='flex items-center gap-2'>
                <Link
                  href={(() => {
                    const params =
                      new URLSearchParams();

                    if (
                      liveClass?.classUuid
                    ) {
                      params.set(
                        'classUuid',
                        liveClass.classUuid
                      );
                    }

                    const queryString =
                      params.toString();

                    return `/dashboard/classes/class-training/${liveClass?.classUuid}${queryString
                      ? `?${queryString}`
                      : ''
                      }`;
                  })()}
                  className='inline-flex h-9 min-w-[120px] items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90'
                >
                  Start Class
                </Link>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className='flex items-start gap-2 border-border/50 md:border-r md:pr-3 last:border-r-0'>
      <div className='text-muted-foreground mt-0.5 shrink-0'>
        {icon}
      </div>

      <div className='min-w-0'>
        <p className='text-foreground truncate text-sm font-semibold'>
          {value}
        </p>

        <p className='text-muted-foreground text-xs'>
          {label}
        </p>
      </div>
    </div>
  );
}

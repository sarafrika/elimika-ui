import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { RosterEntry } from '@/hooks/use-class-roster';
import type { InstructorClassWithSchedule } from '@/hooks/use-instructor-classes-with-schedules';
import { cn } from '@/lib/utils';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  Award,
  BarChart3,
  BookOpen,
  Building2,
  Check,
  Clock3,
  Layers3,
  MonitorPlay,
  Pen,
  Play,
  Plus,
  UserRound,
  Video
} from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useMemo, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../../components/ui/tooltip';
import { useUserDomain } from '../../../../../context/user-domain-context';
import { useDifficultyLevels } from '../../../../../hooks/use-difficultyLevels';
import { RevenueSaleLineItemDto } from '../../../../../services/client';
import { getEnrollmentsForInstanceOptions, listSalesOptions } from '../../../../../services/client/@tanstack/react-query.gen';
import { ClassSessionLedgerSection } from './class-session-ledger-section';
import {
  buildClassSessionLedgerRows,
  type ClassSessionLedgerRow,
} from './class-session-ledger-table.utils';
import type { LessonContentItem, LessonModule } from './new-class-page.utils';
import {
  formatDateOnly,
  formatTimeRange,
  getContentTypeLabel,
  isUpcoming,
} from './new-class-page.utils';

function getContentTypeIcon(contentTypeMap: Record<string, string>, uuid?: string) {
  const typeName = uuid ? contentTypeMap[uuid] : '';

  switch (typeName) {
    case 'video':
      return <Play className='h-3.5 w-3.5' />;
    case 'quiz':
    case 'assignment':
      return <Check className='h-3.5 w-3.5' />;
    default:
      return <BookOpen className='h-3.5 w-3.5' />;
  }
}

function getLessonProgress(moduleIndex: number, contentIndex: number) {
  const value = 100 - moduleIndex * 20 - contentIndex * 20;
  return Math.max(45, Math.min(100, value));
}

function getContentDuration(content: LessonContentItem) {
  return 'duration' in content && typeof content.duration === 'string' ? content.duration : '9 min';
}

function getPlainTextFromHtml(value?: string | null) {
  if (!value) return '';

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getInitials(value?: string | null) {
  return (
    value
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'ST'
  );
}

export function CourseArtwork({ imageUrl, courseName }: { imageUrl?: string | null; courseName: string }) {
  const resolvedImageUrl = toAuthenticatedMediaUrl(imageUrl) || imageUrl;

  if (resolvedImageUrl) {
    return (
      <div className='border-border/70 bg-muted relative aspect-[16/9] w-full overflow-hidden rounded-sm border sm:max-w-[180px] sm:shrink-0'>
        <img
          src={resolvedImageUrl}
          alt={`${courseName} course thumbnail`}
          className='h-full w-full object-cover'
        />
      </div>
    );
  }

  return (
    <div className='border-border/70 bg-warning/10 relative aspect-[16/9] w-full overflow-hidden rounded-sm border p-4 sm:max-w-[220px] sm:shrink-0'>
      <div className='bg-primary/80 text-primary-foreground absolute top-6 right-5 flex h-14 w-14 items-center justify-center rounded-full shadow-sm'>
        <MonitorPlay className='h-7 w-7' />
      </div>
      <div className='border-border/70 bg-background/80 absolute bottom-5 left-5 h-14 w-24 rounded-sm border shadow-sm'>
        <div className='bg-primary/20 mx-auto mt-3 h-6 w-12 rounded-sm' />
        <div className='bg-primary/60 mt-3 h-1.5 w-full' />
      </div>
      <div className='absolute right-7 bottom-5 flex items-end gap-1.5'>
        <span className='bg-warning/70 h-5 w-2 rounded-sm' />
        <span className='bg-primary/50 h-9 w-2 rounded-sm' />
        <span className='bg-success/60 h-12 w-2 rounded-sm' />
        <span className='bg-accent/60 h-7 w-2 rounded-sm' />
      </div>
      <div className='border-border/70 bg-background/90 absolute top-8 left-8 rounded-sm border px-3 py-2 shadow-sm'>
        <span className='bg-primary/30 block h-1.5 w-12 rounded' />
        <span className='bg-muted-foreground/30 mt-1.5 block h-1.5 w-8 rounded' />
      </div>
    </div>
  );
}

export function ClassHero({
  selectedClass,
  difficultyMap,
  instructorName,
  roleLabel = 'Instructor view',
  sessionProgress,
  remainingSessions,
  startLessonHref,
  selectedClassUuid,
  onAddClasses,
}: {
  selectedClass: InstructorClassWithSchedule;
  difficultyMap: Record<string, string>;
  instructorName?: string | null;
  roleLabel?: string;
  sessionProgress: number;
  remainingSessions: number;
  startLessonHref: string;
  selectedClassUuid: string | null;
  onAddClasses: () => void;
}) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const difficulty = selectedClass.course?.difficulty_uuid
    ? difficultyMap[selectedClass.course.difficulty_uuid]
    : 'Beginner';
  const courseName = selectedClass.course?.name || selectedClass.title || 'Select a class';
  const courseDescription =
    selectedClass.course?.description ||
    selectedClass.description ||
    'An introduction to the basic concepts of this course.';
  const plainCourseDescription = getPlainTextFromHtml(courseDescription);
  const courseImageUrl = selectedClass.course?.thumbnail_url || selectedClass.course?.banner_url;

  return (
    <section className='border-border/70 bg-card/90 overflow-hidden rounded-lg border shadow-sm backdrop-blur'>
      <div className='flex flex-wrap items-center justify-end gap-2 p-3'>
        {selectedClass?.meeting_link && (
          <a
            href={selectedClass.meeting_link}
            target='_blank'
            rel='noopener noreferrer'
            className='border-border/60 bg-background text-foreground hover:bg-muted/50 focus-visible:ring-primary/20 inline-flex h-9 items-center justify-center gap-2 rounded-md border px-4 text-xs font-medium transition focus-visible:ring-2 focus-visible:outline-none'
          >
            <Video className='h-4 w-4' />
            Join via link
          </a>
        )}

        {/* // edit class button here */}
        {roleLabel === 'Instructor view' && (
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={onAddClasses}
            className='inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-xs font-medium'
          >
            <Pen className='h-4 w-4' />
            Edit class
          </Button>
        )}

        {roleLabel === 'Instructor view' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type='button'
                  variant='default'
                  size='sm'
                  onClick={onAddClasses}
                  className='inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-xs font-medium'
                >
                  <Plus className='h-4 w-4' />
                  Add classes
                </Button>
              </TooltipTrigger>

              <TooltipContent side='top' className='max-w-[220px] text-xs leading-snug'>
                You can add more class schedule instances by extending the class end date.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className='border-border/70 grid gap-5 border-b p-4 md:grid-cols-[180px_minmax(0,1fr)] md:p-5'>
        <CourseArtwork imageUrl={courseImageUrl} courseName={courseName} />

        <div className='min-w-0'>
          <div className='min-w-0 space-y-3'>
            <div>
              <h1 className='text-foreground text-2xl leading-tight font-semibold'>
                {selectedClass?.title}
              </h1>
            </div>

            <div>
              <h2 className='text-muted-foreground text-lg font-medium'>{courseName}</h2>
            </div>

            <div title={plainCourseDescription || courseDescription}>
              <HTMLTextPreview
                className={cn(
                  'text-muted-foreground max-w-3xl overflow-hidden text-sm leading-6 [&_p]:mb-0',
                  isDescriptionExpanded ? '' : 'line-clamp-3 max-h-[4.5rem]'
                )}
                htmlContent={courseDescription}
              />

              {plainCourseDescription.length > 140 && (
                <button
                  type='button'
                  onClick={() => setIsDescriptionExpanded(v => !v)}
                  aria-expanded={isDescriptionExpanded}
                  className='text-primary hover:text-accent focus-visible:ring-ring mt-1 inline-flex rounded-sm text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none'
                >
                  {isDescriptionExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          </div>

          <div className='text-muted-foreground mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm'>
            <span className='inline-flex items-center gap-1.5'>
              <Clock3 className='h-4 w-4' />
              {selectedClass.schedule?.length ?? 0} Sessions
            </span>
            <span className='bg-border hidden h-4 w-px sm:block' />
            <span className='inline-flex items-center gap-1.5'>
              <BarChart3 className='h-4 w-4' />
              {difficulty || 'Beginner'}
            </span>
            <span className='bg-border hidden h-4 w-px sm:block' />
            <span className='inline-flex items-center gap-1.5'>
              <UserRound className='h-4 w-4' />
              {instructorName || roleLabel}
            </span>
          </div>

          {roleLabel === 'Instructor View' && (
            <div className='text-muted-foreground mt-5 grid gap-3 text-[12px] sm:grid-cols-2'>
              <p>{selectedClass.max_participants ?? 0} students</p>
              <p>
                {selectedClass.training_fee
                  ? `$${selectedClass.training_fee}`
                  : 'Class fee not set'}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className='p-4 md:p-5'>
        <div className='grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]'>
          <Progress
            value={sessionProgress}
            className='bg-muted h-1.5'
            indicatorClassName='bg-success'
          />

          <p className='text-primary text-sm font-semibold whitespace-nowrap'>
            {remainingSessions} Sessions Remaining
          </p>

          <Button className='gap-2 rounded-[6px] whitespace-nowrap'>
            <Award className='h-4 w-4' />
            View Certificate
          </Button>
        </div>

        <p className='text-foreground mt-1 text-sm'>
          {sessionProgress}% completed
        </p>

        {selectedClassUuid ? (
          <Link href={startLessonHref} className='sr-only'>
            Open selected lesson
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function CourseProgram({
  lessonModules,
  selectedLesson,
  contentTypeMap,
  setSelectedLessonUuid,
  getStartLessonHref,
  onStartLesson,
  selectedLessonActionLabel,
}: {
  lessonModules: LessonModule[];
  selectedLesson: LessonContentItem | null;
  contentTypeMap: Record<string, string>;
  setSelectedLessonUuid: (value: string | null) => void;
  getStartLessonHref: (lessonUuid?: string | null, contentUuid?: string | null) => string;
  onStartLesson: (lessonUuid?: string | null, contentUuid?: string | null) => void;
  selectedLessonActionLabel: string;
}) {
  return (
    <section className='border-border/70 bg-card/90 rounded-lg border p-4 shadow-sm backdrop-blur'>
      {lessonModules.length === 0 ? (
        <div className='border-border/70 rounded-lg border border-dashed p-6 text-center'>
          <p className='text-foreground font-medium'>No lesson content yet</p>
          <p className='text-muted-foreground mt-1 text-sm'>
            Course lessons will appear here once the program is configured.
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {lessonModules.map((module, moduleIndex) => {
            const moduleTitle = module.lesson.title || 'Untitled lesson';
            const courseLabel = module.course?.name || null;
            const contentCount = module.content?.data?.length ?? 0;

            const { activeDomain } = useUserDomain();
            const isStudent = activeDomain === 'student';

            return (
              <div
                key={module.lesson.uuid ?? `module-${moduleIndex}`}
                className='border-border/70 bg-background/70 overflow-hidden rounded-md border'
              >
                <div className='border-border/70 flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='min-w-0 flex-1'>
                    {courseLabel ? (
                      <p className='text-muted-foreground text-[10px] tracking-[0.18em] uppercase sm:text-[11px]'>
                        {courseLabel}
                      </p>
                    ) : null}

                    <p className='text-foreground break-words text-base font-semibold sm:truncate sm:text-lg'>
                      Module {moduleIndex + 1}: {moduleTitle}
                    </p>
                  </div>

                  <span className='text-muted-foreground shrink-0 text-xs font-medium'>
                    {contentCount} contents
                  </span>
                </div>

                {isStudent ? (
                  <div className='divide-border/70 divide-y'>
                    {module.content?.data?.map((content, contentIndex) => {
                      const isSelected = selectedLesson?.uuid === content.uuid;
                      // const lessonProgress = getLessonProgress(moduleIndex, contentIndex);
                      const lessonProgress = 0;
                      const typeLabel = getContentTypeLabel(
                        contentTypeMap,
                        content.content_type_uuid
                      );
                      const isWarmTrack = lessonProgress < 100;
                      const lessonHref = getStartLessonHref(module.lesson.uuid, content.uuid);

                      return (
                        <Link href={lessonHref} onClick={event => event.stopPropagation()}>
                          <div
                            key={content.uuid ?? `${module.lesson.uuid}-${contentIndex}`}
                            role='button'
                            tabIndex={0}
                            onClick={() => {
                              if (content.uuid) setSelectedLessonUuid(content.uuid);
                            }}
                            onKeyDown={event => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                if (content.uuid) setSelectedLessonUuid(content.uuid);
                              }
                            }}
                            className={cn(
                              'hover:bg-muted/60 focus-visible:ring-ring block w-full rounded-md px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none sm:px-4 sm:py-3'
                            )}
                          >
                            {/* Top section */}
                            <div className='flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'>
                              {/* Lesson info */}
                              <div className='flex min-w-0 items-start gap-2 sm:items-center sm:gap-3'>
                                <span
                                  className={cn(
                                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full sm:h-5 sm:w-5',
                                    isWarmTrack
                                      ? 'bg-warning text-warning-foreground'
                                      : 'bg-success text-success-foreground'
                                  )}
                                >
                                  {getContentTypeIcon(contentTypeMap, content.content_type_uuid)}
                                </span>

                                <div className='min-w-0'>
                                  <p className='text-foreground truncate text-sm font-semibold sm:text-base'>
                                    Lesson {moduleIndex + 1}.{contentIndex + 1}
                                  </p>

                                  <p className='text-muted-foreground truncate text-xs font-medium sm:hidden'>
                                    {typeLabel}
                                  </p>

                                  <span className='text-muted-foreground hidden text-sm font-medium sm:inline'>
                                    {typeLabel}
                                  </span>
                                </div>
                              </div>

                              {/* CTA */}
                              <Link
                                href={lessonHref}
                                onClick={event => event.stopPropagation()}
                                className='text-muted-foreground hover:text-foreground hover:bg-primary/10 focus-visible:ring-ring inline-flex h-8 items-center justify-center self-start rounded-md px-3 text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none sm:h-9 sm:self-center sm:px-4 sm:text-xs'
                              >
                                Open lesson
                              </Link>
                            </div>

                            {/* Bottom section */}
                            <div className='mt-3 flex flex-col gap-2 pl-6 sm:grid sm:grid-cols-[72px_minmax(0,1fr)_56px] sm:items-center sm:gap-3 sm:pl-8'>
                              <div className='flex items-center justify-between sm:block'>
                                <p className='text-muted-foreground text-xs sm:text-sm'>
                                  {getContentDuration(content)}
                                </p>

                                <p className='text-foreground text-xs font-semibold sm:hidden'>
                                  {lessonProgress}%
                                </p>
                              </div>

                              <Progress
                                value={lessonProgress}
                                className='bg-muted h-1.5'
                                indicatorClassName={isWarmTrack ? 'bg-warning' : 'bg-success'}
                              />

                              <p className='text-foreground hidden text-right text-sm font-semibold sm:block'>
                                {lessonProgress}%
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className='divide-border/70 divide-y'>
                    {module.content?.data?.map((content, contentIndex) => {
                      const isSelected = selectedLesson?.uuid === content.uuid;
                      // const lessonProgress = getLessonProgress(moduleIndex, contentIndex);
                      const lessonProgress = 0;
                      const typeLabel = getContentTypeLabel(
                        contentTypeMap,
                        content.content_type_uuid
                      );
                      const isWarmTrack = lessonProgress < 100;
                      const lessonHref = getStartLessonHref(module.lesson.uuid, content.uuid);

                      return (
                        <div
                          key={content.uuid ?? `${module.lesson.uuid}-${contentIndex}`}
                          role='button'
                          tabIndex={0}
                          onClick={() => {
                            if (content.uuid) setSelectedLessonUuid(content.uuid);
                          }}
                          onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              if (content.uuid) setSelectedLessonUuid(content.uuid);
                            }
                          }}
                          className={cn(
                            'hover:bg-muted/60 focus-visible:ring-ring block w-full rounded-md px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none sm:px-4 sm:py-3',
                            isSelected ? 'bg-primary/5' : ''
                          )}
                        >
                          {/* Top section */}
                          <div className='flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'>
                            {/* Lesson info */}
                            <div className='flex min-w-0 items-start gap-2 sm:items-center sm:gap-3'>
                              <span
                                className={cn(
                                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full sm:h-5 sm:w-5',
                                  isWarmTrack
                                    ? 'bg-warning text-warning-foreground'
                                    : 'bg-success text-success-foreground'
                                )}
                              >
                                {getContentTypeIcon(contentTypeMap, content.content_type_uuid)}
                              </span>

                              <div className='min-w-0'>
                                <p className='text-foreground truncate text-sm font-semibold sm:text-base'>
                                  Lesson {moduleIndex + 1}.{contentIndex + 1}
                                </p>

                                {/* Mobile */}
                                <p className='text-muted-foreground truncate text-xs font-medium sm:hidden'>
                                  {typeLabel}
                                </p>

                                {/* Desktop */}
                                <span className='text-muted-foreground hidden text-sm font-medium sm:inline'>
                                  {typeLabel}
                                </span>
                              </div>
                            </div>

                            {/* CTA */}
                            {isSelected ? (
                              <Button
                                type='button'
                                onClick={event => {
                                  event.stopPropagation();
                                  if (content.uuid) {
                                    onStartLesson(module.lesson.uuid, content.uuid);
                                  }
                                }}
                                className='bg-primary text-primary-foreground hover:bg-accent focus-visible:ring-ring inline-flex h-8 items-center justify-center self-start rounded-md px-3 text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none sm:h-9 sm:self-center sm:px-4 sm:text-xs'
                              >
                                {selectedLessonActionLabel}
                              </Button>
                            ) : (
                              <Link
                                href={lessonHref}
                                onClick={event => event.stopPropagation()}
                                className='text-muted-foreground hover:text-foreground hover:bg-primary/10 focus-visible:ring-ring inline-flex h-8 items-center justify-center self-start rounded-md px-3 text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none sm:h-9 sm:self-center sm:px-4 sm:text-xs'
                              >
                                Open lesson
                              </Link>
                            )}
                          </div>

                          {/* Bottom section */}
                          <div className='mt-3 flex flex-col gap-2 pl-6 sm:grid sm:grid-cols-[72px_minmax(0,1fr)_56px] sm:items-center sm:gap-3 sm:pl-8'>
                            <div className='flex items-center justify-between sm:block'>
                              <p className='text-muted-foreground text-xs sm:text-sm'>
                                {getContentDuration(content)}
                              </p>

                              <p className='text-foreground text-xs font-semibold sm:hidden'>
                                {lessonProgress}%
                              </p>
                            </div>

                            <Progress
                              value={lessonProgress}
                              className='bg-muted h-1.5'
                              indicatorClassName={isWarmTrack ? 'bg-warning' : 'bg-success'}
                            />

                            <p className='text-foreground hidden text-right text-sm font-semibold sm:block'>
                              {lessonProgress}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function UpcomingClassesPanel({
  selectedClass,
  contentTypeMap,
  rosterEntries,
}: {
  selectedClass: InstructorClassWithSchedule;
  contentTypeMap: Record<string, string>;
  rosterEntries: RosterEntry[];
}) {
  const upcoming = (selectedClass.schedule ?? [])
    .filter(session => isUpcoming(session.start_time))
    .sort(
      (left, right) =>
        new Date(left.start_time ?? 0).getTime() - new Date(right.start_time ?? 0).getTime()
    )
    .slice(0, 3);
  const visibleStudents = rosterEntries.slice(0, 3);
  const remainingStudentCount = Math.max(rosterEntries.length - visibleStudents.length, 0);

  return (
    <aside className='border-border/70 bg-card/90 rounded-lg border p-4 shadow-sm backdrop-blur'>
      <div className='mb-3 flex items-center justify-between gap-4'>
        <h2 className='text-foreground text-xl font-semibold'>Upcoming Classes</h2>
        {/* <Button
          type='button'
          className='text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none'
        >
          View All
          <ChevronDown className='h-4 w-4 -rotate-90' />
        </Button> */}
      </div>

      <div className='space-y-2'>
        {upcoming.length ? (
          upcoming.map((session, index) => (
            <div
              key={session.uuid ?? `${session.start_time}-${index}`}
              className='border-border/70 bg-background/70 rounded-md border p-3'
            >
              <div className='grid grid-cols-[minmax(0,1fr)_auto] gap-3'>
                <div className='flex min-w-0 gap-3'>
                  <span className='bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded'>
                    {index === 0 ? (
                      <Layers3 className='h-4 w-4' />
                    ) : (
                      <BookOpen className='h-4 w-4' />
                    )}
                  </span>
                  <p className='text-foreground truncate font-semibold'>
                    {selectedClass.course?.name || selectedClass.title}
                  </p>
                </div>
                <p className='text-foreground font-semibold whitespace-nowrap'>
                  {selectedClass.training_fee ? `$${selectedClass.training_fee}` : ''}
                </p>
                <p className='text-muted-foreground col-span-2 text-sm'>
                  {formatDateOnly(session.start_time)} |{' '}
                  {formatTimeRange(session.start_time, session.end_time)}
                </p>
              </div>

              <div className='mt-3 flex items-center justify-between gap-3'>
                <p className='text-muted-foreground flex min-w-0 items-center gap-1.5 truncate text-xs'>
                  <Building2 className='h-3.5 w-3.5 shrink-0' />
                  {session.location_name ||
                    selectedClass.location_name ||
                    session?.location_type ||
                    'Academy'}
                </p>
                {visibleStudents.length ? (
                  <div className='flex -space-x-2' aria-label='Enrolled students'>
                    {visibleStudents.map(entry => {
                      const fullName =
                        entry.user?.full_name ?? entry.enrollment.student_uuid ?? 'Student';

                      return (
                        <Avatar
                          key={entry.enrollment.uuid ?? entry.enrollment.student_uuid ?? fullName}
                          className='border-card bg-muted size-7 border-2'
                          title={fullName}
                        >
                          <AvatarImage
                            src={entry.user?.profile_image_url ?? undefined}
                            alt={fullName}
                          />
                          <AvatarFallback className='text-[10px]'>
                            {getInitials(fullName)}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })}
                    {remainingStudentCount ? (
                      <span className='border-card bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full border-2 text-[10px] font-semibold'>
                        +{remainingStudentCount}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className='border-border/70 rounded-lg border border-dashed p-5 text-center'>
            <p className='text-muted-foreground text-sm'>No upcoming sessions found.</p>
          </div>
        )}
      </div>

      {/* <div className='border-border/70 bg-background/70 mt-4 overflow-hidden rounded-md border'>
        <div className='grid h-20 grid-cols-3 gap-1 p-2'>
          {selectedModuleResources.slice(0, 3).map(resource => (
            <div
              key={resource.uuid}
              className='bg-muted text-muted-foreground flex items-center justify-center rounded-sm'
              title={getContentTypeLabel(contentTypeMap, resource.content_type_uuid)}
            >
              {getContentTypeIcon(contentTypeMap, resource.content_type_uuid)}
            </div>
          ))}
          {selectedModuleResources.length === 0 ? (
            <div className='bg-muted text-muted-foreground col-span-3 flex items-center justify-center rounded-sm'>
              <ImageIcon className='h-6 w-6' />
            </div>
          ) : null}
        </div>
        <button
          type='button'
          className='bg-primary text-primary-foreground hover:bg-accent focus-visible:ring-ring mx-auto mb-3 flex h-9 w-36 items-center justify-center gap-3 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none'
        >
          View All
          <ChevronDown className='h-4 w-4 -rotate-90' />
        </button>
      </div> */}
    </aside>
  );
}

export function ClassLessonTab({
  isLoadingClasses,
  isLoadingLessons,
  selectedClass,
  selectedClassUuid,
  lessonModules,
  selectedLesson,
  contentTypeMap,
  difficultyMap,
  instructorName,
  roleLabel = 'Instructor view',
  rosterEntries = [],
  sessionProgress,
  remainingSessions,
  setSelectedLessonUuid,
  startLessonHref,
  getStartLessonHref,
  onStartLesson,
  selectedLessonActionLabel,
  onAddClasses,
}: {
  isLoadingClasses: boolean;
  isLoadingLessons: boolean;
  selectedClass: InstructorClassWithSchedule | null;
  selectedClassUuid: string | null;
  lessonModules: LessonModule[];
  selectedLesson: LessonContentItem | null;
  contentTypeMap: Record<string, string>;
  difficultyMap: Record<string, string>;
  instructorName?: string | null;
  roleLabel?: string;
  rosterEntries?: RosterEntry[];
  sessionProgress: number;
  remainingSessions: number;
  setSelectedLessonUuid: (value: string | null) => void;
  startLessonHref: string;
  getStartLessonHref: (lessonUuid?: string | null, contentUuid?: string | null) => string;
  onStartLesson: (lessonUuid?: string | null, contentUuid?: string | null) => void;
  selectedLessonActionLabel: string;
  onAddClasses: () => void;
}) {
  if (isLoadingClasses || !selectedClass || isLoadingLessons) {
    return (
      <div className='space-y-3'>
        <Skeleton className='h-56 rounded-lg' />
        <div className='grid gap-3 2xl:grid-cols-[minmax(0,1fr)_320px]'>
          <Skeleton className='h-80 rounded-lg' />
          <Skeleton className='h-80 rounded-lg' />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <div className='grid gap-3 2xl:grid-cols-[minmax(0,1fr)_320px]'>
        <CourseProgram
          lessonModules={lessonModules}
          selectedLesson={selectedLesson}
          contentTypeMap={contentTypeMap}
          setSelectedLessonUuid={setSelectedLessonUuid}
          getStartLessonHref={getStartLessonHref}
          onStartLesson={onStartLesson}
          selectedLessonActionLabel={selectedLessonActionLabel}
        />
        <UpcomingClassesPanel
          selectedClass={selectedClass}
          contentTypeMap={contentTypeMap}
          rosterEntries={rosterEntries}
        />
      </div>
    </div>
  );
}

type ClassOverviewTabProps = {
  isLoadingClasses: boolean;
  isLoadingLessons: boolean;
  selectedClass: InstructorClassWithSchedule | null;
  selectedClassUuid: string | null;
  lessonModules?: unknown[];
  selectedLesson?: unknown;
  contentTypeMap?: Record<string, string>;
  difficultyMap?: Record<string, string>;
  instructorName?: string | null;
  roleLabel?: string;
  rosterEntries?: unknown[];
  sessionProgress: number;
  remainingSessions: number;
  setSelectedLessonUuid?: (value: string | null) => void;
  startLessonHref?: string;
  getStartLessonHref?: (lessonUuid?: string | null, contentUuid?: string | null) => string;
  onStartLesson?: (lessonUuid?: string | null, contentUuid?: string | null) => void;
  selectedLessonActionLabel?: string;
  onAddClasses?: () => void;
};

function OverviewSkeleton() {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-56 rounded-[14px]' />
      <Skeleton className='h-[640px] rounded-[14px]' />
    </div>
  );
}

function OverviewMetaCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className='rounded-[12px] border border-border/70 bg-background/80 px-4 py-3'>
      <p className='text-muted-foreground flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]'>
        {icon}
        {label}
      </p>
      <p className='text-foreground mt-2 text-sm font-semibold sm:text-base'>{value}</p>
    </div>
  );
}

export function ClassOverviewTab(props: ClassOverviewTabProps) {
  const {
    isLoadingClasses,
    isLoadingLessons,
    selectedClass,
    selectedClassUuid,
    roleLabel = 'Instructor view',
    rosterEntries = [],
    sessionProgress,
    remainingSessions,
    difficultyMap = {},
  } = props;

  const { difficultyMap: fallbackDifficultyMap } = useDifficultyLevels();
  const mergedDifficultyMap = { ...fallbackDifficultyMap, ...difficultyMap };
  const showFinancialColumns = roleLabel !== 'Student view';

  const { data: salesResp } = useQuery({
    ...listSalesOptions({
      query: {
        domain: 'instructor',
        class_definition_uuid: selectedClass?.uuid ?? '',
        pageable: { page: 0, size: 100 },
      },
    }),
    enabled: showFinancialColumns && Boolean(selectedClass?.uuid),
  });

  const scheduleInstances = selectedClass?.schedule ?? [];

  const enrollmentQueries = useQueries({
    queries: scheduleInstances.map(instance => ({
      ...getEnrollmentsForInstanceOptions({
        path: {
          instanceUuid: instance.uuid as string,
        },
      }),
      enabled: Boolean(instance.uuid),
    })),
  });

  const enrichedInstances = useMemo(() => {
    return scheduleInstances.map((instance, index) => {
      const enrollments =
        enrollmentQueries[index]?.data?.data ?? [];

      return {
        ...instance,
        enrollments,
      };
    });
  }, [scheduleInstances, enrollmentQueries]);

  const salesItems: RevenueSaleLineItemDto[] = salesResp?.data?.content ?? [];

  const rows = useMemo<ClassSessionLedgerRow[]>(() => {
    if (!selectedClass) return [];

    return buildClassSessionLedgerRows({
      selectedClass,
      visibleInstances: enrichedInstances,
      salesItems,
      showFinancialColumns,
    });
  }, [
    enrichedInstances,
    salesItems,
    selectedClass,
    showFinancialColumns,
  ]);

  if (isLoadingClasses || !selectedClass || isLoadingLessons) {
    return <OverviewSkeleton />;
  }

  const difficultyLabel = selectedClass.course?.difficulty_uuid
    ? mergedDifficultyMap[selectedClass.course.difficulty_uuid] ?? 'General'
    : 'General';

  return (
    <div className='space-y-3'>
      <section className='overflow-hidden rounded-[14px] border border-border/70 bg-card shadow-sm'>
        <CardContent className='px-4 py-4 sm:px-5 sm:py-5'>
          <ClassSessionLedgerSection
            selectedClass={selectedClass}
            roleLabel={roleLabel}
            difficultyLabel={difficultyLabel}
            rows={rows}
            sessionProgress={sessionProgress}
            remainingSessions={remainingSessions}
            rosterCount={rosterEntries.length}
            showFinancialColumns={showFinancialColumns}
            tableTitle='Session ledger'
            tableDescription='All scheduled sessions are listed below with attendance and settlement details.'
          />
        </CardContent>
      </section>
    </div>
  );
}

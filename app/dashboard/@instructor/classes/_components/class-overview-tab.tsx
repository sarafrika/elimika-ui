import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { RosterEntry } from '@/hooks/use-class-roster';
import type { InstructorClassWithSchedule } from '@/hooks/use-instructor-classes-with-schedules';
import { cn } from '@/lib/utils';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import {
  BarChart3,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  Clock3,
  Layers3,
  MonitorPlay,
  Play,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
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

function CourseArtwork({ imageUrl, courseName }: { imageUrl?: string | null; courseName: string }) {
  const resolvedImageUrl = toAuthenticatedMediaUrl(imageUrl) || imageUrl;

  if (resolvedImageUrl) {
    return (
      <div className='border-border/70 bg-muted relative aspect-[16/9] w-full overflow-hidden rounded-sm border sm:max-w-[220px] sm:shrink-0'>
        <img
          src={resolvedImageUrl}
          alt={`${courseName} course thumbnail`}
          className='h-full w-full object-cover'
        />
      </div>
    );
  }

  return (
    <div className='border-border/70 relative aspect-[16/9] w-full overflow-hidden rounded-sm border bg-[color-mix(in_oklch,var(--warning)_18%,var(--card))] p-4 sm:max-w-[220px] sm:shrink-0'>
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

function ClassHero({
  selectedClass,
  difficultyMap,
  instructorName,
  sessionProgress,
  remainingSessions,
  startLessonHref,
  selectedClassUuid,
  onAddClasses,
}: {
  selectedClass: InstructorClassWithSchedule;
  difficultyMap: Record<string, string>;
  instructorName?: string | null;
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
      <div className='m-3 flex justify-start sm:justify-end'>
        <Button
          type='button'
          variant='outline'
          onClick={onAddClasses}
          className='border-border/80 bg-background/70 hover:bg-muted h-10 rounded-md px-8 font-semibold'
        >
          Add Classes
        </Button>
      </div>

      <div className='border-border/70 grid gap-5 border-b p-4 md:grid-cols-[220px_minmax(0,1fr)] md:p-5'>
        <CourseArtwork imageUrl={courseImageUrl} courseName={courseName} />

        <div className='min-w-0'>
          <div className='min-w-0 space-y-2'>
            <h1 className='text-foreground text-2xl leading-tight font-semibold md:text-3xl'>
              {courseName}
            </h1>
            <div title={plainCourseDescription || courseDescription}>
              <HTMLTextPreview
                className={cn(
                  'text-muted-foreground max-w-3xl overflow-hidden text-sm leading-6 md:text-base [&_p]:mb-0',
                  isDescriptionExpanded ? '' : 'line-clamp-3 max-h-[4.5rem]'
                )}
                htmlContent={courseDescription}
              />
            </div>
            {plainCourseDescription.length > 140 ? (
              <button
                type='button'
                onClick={() => setIsDescriptionExpanded(value => !value)}
                aria-expanded={isDescriptionExpanded}
                className='text-primary hover:text-accent focus-visible:ring-ring inline-flex rounded-sm text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none'
              >
                {isDescriptionExpanded ? 'Show less' : 'Read more'}
              </button>
            ) : null}
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
              {instructorName || 'Instructor view'}
            </span>
          </div>

          <div className='text-muted-foreground mt-5 grid gap-3 text-[12px] sm:grid-cols-2'>
            <p>{selectedClass.max_participants ?? 0} students</p>
            <p>
              {selectedClass.training_fee ? `$${selectedClass.training_fee}` : 'Class fee not set'}
            </p>
          </div>
        </div>
      </div>

      <div className='p-4 md:p-5'>
        <div className='grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto]'>
          <Progress
            value={sessionProgress}
            className='bg-muted h-3'
            indicatorClassName='bg-success'
          />
          <p className='text-primary text-base font-semibold md:text-lg'>
            {remainingSessions} Sessions Remaining
          </p>
        </div>
        <p className='text-foreground mt-3 text-lg'>{sessionProgress}% completed</p>
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
  expandedModuleId,
  selectedLesson,
  contentTypeMap,
  setExpandedModuleId,
  setSelectedLessonUuid,
  getStartLessonHref,
  selectedClassUuid,
}: {
  lessonModules: LessonModule[];
  expandedModuleId: string | null;
  selectedLesson: LessonContentItem | null;
  contentTypeMap: Record<string, string>;
  setExpandedModuleId: (value: string | null) => void;
  setSelectedLessonUuid: (value: string | null) => void;
  getStartLessonHref: (lessonUuid?: string | null, contentUuid?: string | null) => string;
  selectedClassUuid: string | null;
}) {
  return (
    <section className='border-border/70 bg-card/90 rounded-lg border p-4 shadow-sm backdrop-blur'>
      <div className='mb-3 flex items-center justify-between gap-4'>
        <h2 className='text-foreground text-xl font-semibold'>Course Program</h2>
        <button
          type='button'
          className='text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none'
        >
          See All
          <ChevronDown className='h-4 w-4 -rotate-90' />
        </button>
      </div>

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
            const isOpen = expandedModuleId === module.lesson.uuid;

            return (
              <Collapsible
                key={module.lesson.uuid ?? `module-${moduleIndex}`}
                open={isOpen}
                onOpenChange={() =>
                  setExpandedModuleId(isOpen ? null : (module.lesson.uuid ?? null))
                }
              >
                <div className='border-border/70 bg-background/70 overflow-hidden rounded-md border'>
                  <CollapsibleTrigger asChild>
                    <button
                      type='button'
                      className='hover:bg-muted/60 focus-visible:ring-ring flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none'
                    >
                      <p className='text-foreground truncate text-lg font-semibold'>
                        Module {moduleIndex + 1}: {module.lesson.title || 'Untitled lesson'}
                      </p>
                      <ChevronDown
                        className={cn(
                          'text-muted-foreground h-4 w-4 shrink-0 transition-transform',
                          isOpen ? 'rotate-180' : ''
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className='divide-border/70 border-border/70 divide-y border-t'>
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
                              'hover:bg-muted/60 focus-visible:ring-ring block w-full cursor-pointer px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
                              isSelected ? 'bg-primary/5' : ''
                            )}
                          >
                            <div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center'>
                              <div className='flex min-w-0 items-center gap-3'>
                                <span
                                  className={cn(
                                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                                    isWarmTrack
                                      ? 'bg-warning text-warning-foreground'
                                      : 'bg-success text-success-foreground'
                                  )}
                                >
                                  {getContentTypeIcon(contentTypeMap, content.content_type_uuid)}
                                </span>
                                <p className='text-foreground min-w-0 truncate text-base font-semibold'>
                                  Lesson {moduleIndex + 1}.{contentIndex + 1}{' '}
                                  <span className='text-muted-foreground font-medium'>
                                    {typeLabel}
                                  </span>
                                </p>
                              </div>

                              <Link
                                href={selectedClassUuid ? lessonHref : '#'}
                                onClick={event => event.stopPropagation()}
                                className='bg-primary text-primary-foreground hover:bg-accent focus-visible:ring-ring inline-flex h-9 items-center justify-center rounded-md px-4 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none'
                              >
                                Start Lesson
                              </Link>
                            </div>

                            <div className='mt-2 grid gap-3 pl-8 md:grid-cols-[72px_minmax(0,1fr)_56px] md:items-center'>
                              <p className='text-muted-foreground text-sm'>
                                {getContentDuration(content)}
                              </p>
                              <Progress
                                value={lessonProgress}
                                className='bg-muted h-2.5'
                                indicatorClassName={isWarmTrack ? 'bg-warning' : 'bg-success'}
                              />
                              <p className='text-foreground text-left text-sm font-semibold md:text-right md:text-sm'>
                                {lessonProgress}%
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}
    </section>
  );
}

function UpcomingClassesPanel({
  selectedClass,
  selectedModuleResources,
  contentTypeMap,
  rosterEntries,
}: {
  selectedClass: InstructorClassWithSchedule;
  selectedModuleResources: LessonContentItem[];
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
        <button
          type='button'
          className='text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none'
        >
          View All
          <ChevronDown className='h-4 w-4 -rotate-90' />
        </button>
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

export function ClassOverviewTab({
  isLoadingClasses,
  isLoadingLessons,
  selectedClass,
  selectedClassUuid,
  lessonModules,
  expandedModuleId,
  selectedLesson,
  selectedModuleResources,
  contentTypeMap,
  difficultyMap,
  instructorName,
  rosterEntries = [],
  sessionProgress,
  remainingSessions,
  setExpandedModuleId,
  setSelectedLessonUuid,
  startLessonHref,
  getStartLessonHref,
  onAddClasses,
}: {
  isLoadingClasses: boolean;
  isLoadingLessons: boolean;
  selectedClass: InstructorClassWithSchedule | null;
  selectedClassUuid: string | null;
  lessonModules: LessonModule[];
  expandedModuleId: string | null;
  selectedLesson: LessonContentItem | null;
  selectedModule: LessonModule | null;
  selectedModuleResources: LessonContentItem[];
  contentTypeMap: Record<string, string>;
  difficultyMap: Record<string, string>;
  instructorName?: string | null;
  rosterEntries?: RosterEntry[];
  sessionProgress: number;
  remainingSessions: number;
  setExpandedModuleId: (value: string | null) => void;
  setSelectedLessonUuid: (value: string | null) => void;
  startLessonHref: string;
  getStartLessonHref: (lessonUuid?: string | null, contentUuid?: string | null) => string;
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
      <ClassHero
        selectedClass={selectedClass}
        difficultyMap={difficultyMap}
        instructorName={instructorName}
        sessionProgress={sessionProgress}
        remainingSessions={remainingSessions}
        startLessonHref={startLessonHref}
        selectedClassUuid={selectedClassUuid}
        onAddClasses={onAddClasses}
      />

      <div className='grid gap-3 2xl:grid-cols-[minmax(0,1fr)_320px]'>
        <CourseProgram
          lessonModules={lessonModules}
          expandedModuleId={expandedModuleId}
          selectedLesson={selectedLesson}
          contentTypeMap={contentTypeMap}
          setExpandedModuleId={setExpandedModuleId}
          setSelectedLessonUuid={setSelectedLessonUuid}
          getStartLessonHref={getStartLessonHref}
          selectedClassUuid={selectedClassUuid}
        />
        <UpcomingClassesPanel
          selectedClass={selectedClass}
          selectedModuleResources={selectedModuleResources}
          contentTypeMap={contentTypeMap}
          rosterEntries={rosterEntries}
        />
      </div>
    </div>
  );
}

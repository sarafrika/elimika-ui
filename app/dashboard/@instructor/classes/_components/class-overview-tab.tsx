import HTMLTextPreview from '@/components/editors/html-text-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  CircleDot,
  GraduationCap,
  Play,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import type { InstructorClassWithSchedule } from '@/hooks/use-instructor-classes-with-schedules';
import type {
  LessonContentItem,
  LessonModule,
} from './new-class-page.utils';
import { getContentTypeLabel } from './new-class-page.utils';

function getContentTypeIcon(contentTypeMap: Record<string, string>, uuid?: string) {
  const typeName = uuid ? contentTypeMap[uuid] : '';

  switch (typeName) {
    case 'video':
      return <Play className='text-primary h-4 w-4' />;
    case 'pdf':
    case 'text':
      return <BookOpen className='text-primary h-4 w-4' />;
    default:
      return <BookOpen className='text-primary h-4 w-4' />;
  }
}

export function ClassOverviewTab({
  isLoadingClasses,
  isLoadingLessons,
  selectedClass,
  selectedClassUuid,
  lessonModules,
  expandedModuleId,
  selectedLesson,
  selectedModule,
  selectedModuleResources,
  contentTypeMap,
  difficultyMap,
  instructorName,
  sessionProgress,
  remainingSessions,
  setExpandedModuleId,
  setSelectedLessonUuid,
  startLessonHref,
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
  sessionProgress: number;
  remainingSessions: number;
  setExpandedModuleId: (value: string | null) => void;
  setSelectedLessonUuid: (value: string | null) => void;
  startLessonHref: string;
  onAddClasses: () => void;
}) {
  return (
    <Card className='border-border/70 bg-card shadow-sm'>
      <CardContent className='space-y-6 p-4 sm:p-6'>
        {isLoadingClasses || !selectedClass || isLoadingLessons ? (
          <div className='space-y-4'>
            <Skeleton className='h-44 rounded-[28px]' />
            <Skeleton className='h-72 rounded-[28px]' />
          </div>
        ) : (
          <>
            <div className='rounded-[28px] border border-border/70 bg-background/80'>
              <div className='border-border/70 flex flex-col gap-5 border-b p-5 lg:flex-row lg:items-start lg:justify-between'>
                <div className='flex min-w-0 gap-4'>
                  <div className='bg-muted hidden h-24 w-24 shrink-0 rounded-[24px] border border-border/60 sm:flex sm:items-center sm:justify-center'>
                    <BookOpen className='text-muted-foreground h-8 w-8' />
                  </div>
                  <div className='min-w-0 space-y-4'>
                    <div className='space-y-2'>
                      <h2 className='text-foreground text-2xl font-semibold'>
                        {selectedClass.course?.name || selectedClass.title || 'Select a class'}
                      </h2>
                      <HTMLTextPreview
                        className='text-muted-foreground text-sm leading-6'
                        htmlContent={
                          selectedClass.course?.description ||
                          selectedClass.description ||
                          'Open the class to review the course details and lesson flow.'
                        }
                      />
                    </div>

                    <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-sm'>
                      <span className='inline-flex items-center gap-1.5'>
                        <CircleDot className='h-4 w-4' />
                        {selectedClass.schedule?.length ?? 0} sessions
                      </span>
                      <span className='inline-flex items-center gap-1.5'>
                        <GraduationCap className='h-4 w-4' />
                        {selectedClass.course?.difficulty_uuid
                          ? difficultyMap[selectedClass.course.difficulty_uuid]
                          : 'General'}
                      </span>
                      <span className='inline-flex items-center gap-1.5'>
                        <Users className='h-4 w-4' />
                        {instructorName || 'Instructor view'}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  type='button'
                  onClick={onAddClasses}
                  className='rounded-md border border-border/70 bg-primary hover:bg-accent'
                >
                  Add classes
                </Button>
              </div>

              <div className='space-y-3 p-5'>
                <Progress value={sessionProgress} className='h-2.5 bg-primary/15' />
                <div className='flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between'>
                  <p className='text-foreground font-semibold'>{sessionProgress}% completed</p>
                  <p className='text-muted-foreground'>
                    {remainingSessions} session{remainingSessions === 1 ? '' : 's'} remaining
                  </p>
                </div>
              </div>
            </div>

            <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_220px]'>
              <div className='rounded-[28px] border border-border/70 bg-background/80 p-4'>
                <div className='mb-4'>
                  <h3 className='text-foreground text-lg font-semibold'>Course program</h3>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    Lessons and content currently mapped to this class course.
                  </p>
                </div>

                <div className='space-y-3'>
                  {lessonModules.length === 0 ? (
                    <div className='border-border/70 rounded-[24px] border border-dashed p-6 text-center'>
                      <p className='text-foreground font-medium'>No lesson content yet</p>
                      <p className='text-muted-foreground mt-1 text-sm'>
                        Course lessons will appear here once the program is configured.
                      </p>
                    </div>
                  ) : (
                    lessonModules.map((module, moduleIndex) => {
                      const isOpen = expandedModuleId === module.lesson.uuid;

                      return (
                        <Collapsible
                          key={module.lesson.uuid ?? `module-${moduleIndex}`}
                          open={isOpen}
                          onOpenChange={() =>
                            setExpandedModuleId(isOpen ? null : (module.lesson.uuid ?? null))
                          }
                        >
                          <div className='rounded-[24px] border border-border/70 bg-card'>
                            <CollapsibleTrigger asChild>
                              <button
                                type='button'
                                className='flex w-full items-center justify-between gap-3 p-4 text-left'
                              >
                                <div className='min-w-0'>
                                  <p className='text-foreground font-semibold'>
                                    Module {moduleIndex + 1}: {module.lesson.title || 'Untitled lesson'}
                                  </p>
                                  <p className='text-muted-foreground mt-1 text-sm'>
                                    {module.content?.data?.length ?? 0} content item
                                    {(module.content?.data?.length ?? 0) === 1 ? '' : 's'}
                                  </p>
                                </div>
                                {isOpen ? (
                                  <ChevronUp className='text-muted-foreground h-4 w-4 shrink-0' />
                                ) : (
                                  <ChevronDown className='text-muted-foreground h-4 w-4 shrink-0' />
                                )}
                              </button>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className='space-y-2 border-t border-border/70 p-4 pt-3'>
                                {module.content?.data?.map((content, contentIndex) => {
                                  const isSelected = selectedLesson?.uuid === content.uuid;

                                  return (
                                    <button
                                      key={content.uuid}
                                      type='button'
                                      onClick={() => setSelectedLessonUuid(content.uuid)}
                                      className={`flex w-full items-center justify-between rounded-[18px] border p-3 text-left transition-colors ${
                                        isSelected
                                          ? 'border-primary bg-primary/10'
                                          : 'border-border/60 bg-background/70 hover:bg-accent'
                                      }`}
                                    >
                                      <div className='flex min-w-0 items-center gap-3'>
                                        {getContentTypeIcon(contentTypeMap, content.content_type_uuid)}
                                        <div className='min-w-0'>
                                          <p className='text-foreground truncate text-sm font-medium'>
                                            Lesson {moduleIndex + 1}.{contentIndex + 1} {content.title}
                                          </p>
                                          <p className='text-muted-foreground mt-1 text-xs'>
                                            {getContentTypeLabel(contentTypeMap, content.content_type_uuid)}
                                            {content.duration ? ` • ${content.duration}` : ''}
                                          </p>
                                        </div>
                                      </div>
                                      {isSelected ? (
                                        <CircleDot className='text-primary h-4 w-4 shrink-0' />
                                      ) : null}
                                    </button>
                                  );
                                })}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })
                  )}
                </div>
              </div>

              <div className='space-y-6'>
                <div className='rounded-[28px] border border-border/70 bg-background/80 p-4'>
                  <div className='mb-4'>
                    <h3 className='text-foreground text-lg font-semibold'>
                      {selectedLesson
                        ? `${selectedModule && lessonModules.length
                            ? `Lesson ${
                                lessonModules.findIndex(
                                  module => module.lesson.uuid === selectedModule.lesson.uuid
                                ) + 1
                              }.${
                                (selectedModule.content?.data?.findIndex(
                                  item => item.uuid === selectedLesson.uuid
                                ) ?? 0) + 1
                              }`
                            : 'Lesson'}`
                        : 'Lesson details'}
                    </h3>
                  </div>

                  {selectedLesson ? (
                    <div className='space-y-4'>
                      <div className='flex items-center gap-3'>
                        <div className='bg-primary/10 rounded-full p-2.5'>
                          {getContentTypeIcon(contentTypeMap, selectedLesson.content_type_uuid)}
                        </div>
                        <div>
                          <p className='text-foreground font-medium'>
                            {getContentTypeLabel(contentTypeMap, selectedLesson.content_type_uuid)}
                          </p>
                          <p className='text-muted-foreground text-sm'>
                            {selectedLesson.duration || 'Duration not set'}
                          </p>
                        </div>
                      </div>

                      <Link href={selectedClassUuid ? startLessonHref : '#'}>
                        <Button className='w-full rounded-full' disabled={!selectedClassUuid}>
                          {contentTypeMap[selectedLesson.content_type_uuid] === 'video' ? (
                            <Play className='mr-2 h-4 w-4' />
                          ) : null}
                          Start lesson
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <p className='text-muted-foreground text-sm'>
                      Select a lesson from the course program to view details.
                    </p>
                  )}
                </div>

                <div className='rounded-[28px] border border-border/70 bg-background/80 p-4'>
                  <div className='mb-4'>
                    <h3 className='text-foreground text-lg font-semibold'>Resources</h3>
                  </div>

                  {selectedModuleResources.length ? (
                    <div className='space-y-3'>
                      {selectedModuleResources.map(resource => (
                        <div
                          key={resource.uuid}
                          className='flex items-start gap-3 rounded-[20px] border border-border/70 bg-card p-3'
                        >
                          {getContentTypeIcon(contentTypeMap, resource.content_type_uuid)}
                          <div className='min-w-0'>
                            <p className='text-foreground text-sm font-medium'>{resource.title}</p>
                            <p className='text-muted-foreground mt-1 text-xs'>
                              {getContentTypeLabel(contentTypeMap, resource.content_type_uuid)}
                              {resource.duration ? ` • ${resource.duration}` : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-muted-foreground text-sm'>
                      Resources for the selected lesson will appear here.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

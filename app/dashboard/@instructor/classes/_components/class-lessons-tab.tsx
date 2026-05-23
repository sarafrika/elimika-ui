'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Play } from 'lucide-react';
import type { LessonModule } from './new-class-page.utils';

type ClassLessonsTabProps = {
  isLoading: boolean;
  classTitle?: string | null;
  lessonModules: LessonModule[];
};

export function ClassLessonsTab({
  isLoading,
  classTitle,
  lessonModules,
}: ClassLessonsTabProps) {
  if (isLoading) {
    return (
      <Card className='border-border/70 bg-card shadow-sm'>
        <CardContent className='space-y-3 p-4 md:p-5'>
          <Skeleton className='h-20 rounded-lg' />
          <Skeleton className='h-20 rounded-lg' />
          <Skeleton className='h-20 rounded-lg' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-border/70 bg-card shadow-sm'>
      <CardContent className='space-y-4 p-4 md:p-5'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='space-y-1'>
            <h3 className='text-foreground text-xl font-semibold'>Lessons</h3>
            <p className='text-muted-foreground text-sm'>
              Lesson modules attached to {classTitle ?? 'this class'}.
            </p>
          </div>
          <Badge variant='outline' className='shrink-0'>
            {lessonModules.length} modules
          </Badge>
        </div>

        {lessonModules.length > 0 ? (
          <div className='space-y-3'>
            {lessonModules.map((module, moduleIndex) => {
              const contentCount = module.content?.data?.length ?? 0;
              const courseName = module.course?.name || classTitle || 'This class';

              return (
                <div
                  key={module.lesson.uuid ?? `${moduleIndex}`}
                  className='rounded-lg border border-border/70 bg-background/70 p-4'
                >
                  <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='min-w-0'>
                      <p className='text-muted-foreground text-[11px] uppercase tracking-[0.16em]'>
                        {courseName}
                      </p>
                      <h4 className='text-foreground mt-1 text-base font-semibold'>
                        Module {moduleIndex + 1}: {module.lesson.title || 'Untitled lesson'}
                      </h4>
                    </div>

                    <Badge variant='secondary' className='shrink-0'>
                      {contentCount} contents
                    </Badge>
                  </div>

                  {contentCount > 0 ? (
                    <div className='mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
                      {module.content?.data?.map((content, contentIndex) => (
                        <div
                          key={content.uuid ?? `${moduleIndex}-${contentIndex}`}
                          className='flex items-center justify-between rounded-md border border-border/60 bg-card px-3 py-2'
                        >
                          <div className='min-w-0'>
                            <p className='truncate text-sm font-medium text-foreground'>
                              {content.title || 'Lesson content'}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              {content.content_type_uuid ? 'Attached content' : 'Lesson content'}
                            </p>
                          </div>
                          <Button variant='ghost' size='sm' className='shrink-0 gap-1.5' disabled>
                            <Play className='size-4' />
                            Open
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='mt-4 rounded-md border border-dashed border-border/70 px-4 py-5 text-center'>
                      <BookOpen className='text-muted-foreground mx-auto mb-2 size-5' />
                      <p className='text-sm font-medium text-foreground'>
                        No lesson content attached yet
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className='rounded-md border border-dashed border-border/70 px-4 py-10 text-center'>
            <BookOpen className='text-muted-foreground mx-auto mb-3 size-6' />
            <p className='text-foreground text-sm font-semibold'>No lessons found</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              Add lesson modules to this class and they will appear here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

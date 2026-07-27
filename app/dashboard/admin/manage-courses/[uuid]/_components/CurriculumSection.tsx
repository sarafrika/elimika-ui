'use client';

import { BookOpen, Eye } from 'lucide-react';
import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  LessonContentViewerDialog,
  type LessonContentPreviewItem,
} from '@/components/content-preview/LessonContentPreview';
import RichTextRenderer from '@/components/editors/richTextRenders';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseLessonsWithContent } from '@/hooks/use-courselessonwithcontent';
import { getResourceIcon } from '@/lib/resources-icon';
import { SectionCard } from '../../../_components/ui/SectionCard';

export function CurriculumSection({ courseUuid }: { courseUuid: string }) {
  const { isLoading, lessons, contentTypeMap, contentTypeDetailsMap } = useCourseLessonsWithContent({
    courseUuid,
  });

  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<LessonContentPreviewItem | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string>('');

  const openContent = (content: LessonContentPreviewItem, contentType: string) => {
    setSelectedContent(content);
    setSelectedContentType(contentType);
    setViewerOpen(true);
  };

  const lessonCount = lessons.length;

  return (
    <SectionCard
      title='Curriculum'
      description={
        lessonCount
          ? `${lessonCount} lesson${lessonCount === 1 ? '' : 's'} — expand each to inspect its content.`
          : 'Lessons and content included in this course.'
      }
    >
      {isLoading ? (
        <div className='space-y-2'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className='h-12 w-full rounded-md' />
          ))}
        </div>
      ) : lessonCount === 0 ? (
        <div className='flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border/70 p-8 text-center'>
          <BookOpen className='size-8 text-muted-foreground' />
          <p className='text-sm font-medium text-foreground'>No lessons yet</p>
          <p className='text-xs text-muted-foreground'>
            This course has no lessons — it is not ready for approval.
          </p>
        </div>
      ) : (
        <Accordion type='multiple' className='space-y-2'>
          {lessons.map((entry, index) => {
            const lesson = entry.lesson;
            const contentItems = entry.content?.data ?? [];
            return (
              <AccordionItem
                key={lesson.uuid ?? index}
                value={lesson.uuid ?? String(index)}
                className='rounded-md border border-border/60 bg-muted/20 px-0 last:border-b'
              >
                <AccordionTrigger className='px-4 py-3 hover:no-underline'>
                  <div className='flex min-w-0 items-center gap-3 text-left'>
                    <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary'>
                      {index + 1}
                    </span>
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-semibold text-foreground'>{lesson.title}</p>
                      <p className='text-xs text-muted-foreground'>
                        {contentItems.length} item{contentItems.length === 1 ? '' : 's'}
                        {lesson.status ? ` · ${String(lesson.status).toLowerCase().replace(/_/g, ' ')}` : ''}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className='px-4 pb-3'>
                  {lesson.description ? (
                    <div className='mb-2 rounded-md border border-border/60 bg-background px-3 py-2 text-sm text-muted-foreground'>
                      <RichTextRenderer htmlString={lesson.description} />
                    </div>
                  ) : null}
                  {contentItems.length ? (
                    <div className='divide-y divide-border/60 rounded-md border border-border/60 bg-background'>
                      {contentItems.map((content, contentIndex) => {
                        const typeName =
                          (content.content_type_uuid && contentTypeMap[content.content_type_uuid]) || 'file';
                        return (
                          <div
                            key={content.uuid ?? contentIndex}
                            className='flex items-center justify-between gap-3 px-3 py-2.5'
                          >
                            <div className='flex min-w-0 items-center gap-3'>
                              <span className='flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground'>
                                {getResourceIcon(typeName)}
                              </span>
                              <div className='min-w-0'>
                                <p className='truncate text-sm font-medium text-foreground'>
                                  {contentIndex + 1}. {content.title}
                                </p>
                                <p className='text-xs capitalize text-muted-foreground'>{typeName}</p>
                              </div>
                            </div>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='gap-1.5 text-xs'
                              onClick={() => openContent(content as LessonContentPreviewItem, typeName)}
                            >
                              <Eye className='size-3.5' />
                              Review
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className='px-1 py-2 text-xs text-muted-foreground'>
                      No content items in this lesson.
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      <LessonContentViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        content={selectedContent}
        contentType={selectedContentType}
        contentTypeDetailsMap={contentTypeDetailsMap}
      />
    </SectionCard>
  );
}

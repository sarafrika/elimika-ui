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
  const { isLoading, lessons, contentTypeMap, contentTypeDetailsMap } = useCourseLessonsWithContent(
    {
      courseUuid,
    }
  );

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
        <div className='border-border/70 flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-center'>
          <BookOpen className='text-muted-foreground size-8' />
          <p className='text-foreground text-sm font-medium'>No lessons yet</p>
          <p className='text-muted-foreground text-xs'>
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
                className='border-border/60 bg-muted/20 rounded-md border px-0 last:border-b'
              >
                <AccordionTrigger className='px-4 py-3 hover:no-underline'>
                  <div className='flex min-w-0 items-center gap-3 text-left'>
                    <span className='bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold'>
                      {index + 1}
                    </span>
                    <div className='min-w-0'>
                      <p className='text-foreground truncate text-sm font-semibold'>
                        {lesson.title}
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        {contentItems.length} item{contentItems.length === 1 ? '' : 's'}
                        {lesson.status
                          ? ` · ${String(lesson.status).toLowerCase().replace(/_/g, ' ')}`
                          : ''}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className='px-4 pb-3'>
                  {lesson.description ? (
                    <div className='border-border/60 bg-background text-muted-foreground mb-2 rounded-md border px-3 py-2 text-sm'>
                      <RichTextRenderer htmlString={lesson.description} />
                    </div>
                  ) : null}
                  {contentItems.length ? (
                    <div className='divide-border/60 border-border/60 bg-background divide-y rounded-md border'>
                      {contentItems.map((content, contentIndex) => {
                        const typeName =
                          (content.content_type_uuid &&
                            contentTypeMap[content.content_type_uuid]) ||
                          'file';
                        return (
                          <div
                            key={content.uuid ?? contentIndex}
                            className='flex items-center justify-between gap-3 px-3 py-2.5'
                          >
                            <div className='flex min-w-0 items-center gap-3'>
                              <span className='bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md'>
                                {getResourceIcon(typeName)}
                              </span>
                              <div className='min-w-0'>
                                <p className='text-foreground truncate text-sm font-medium'>
                                  {contentIndex + 1}. {content.title}
                                </p>
                                <p className='text-muted-foreground text-xs capitalize'>
                                  {typeName}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='gap-1.5 text-xs'
                              onClick={() =>
                                openContent(content as LessonContentPreviewItem, typeName)
                              }
                            >
                              <Eye className='size-3.5' />
                              Review
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className='text-muted-foreground px-1 py-2 text-xs'>
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

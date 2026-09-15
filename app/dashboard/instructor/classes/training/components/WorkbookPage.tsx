import type { ContentType, LessonContent as Content } from '@/services/client/types.gen';
import { Badge } from '@/components/ui/badge';
import { LessonContent } from './LessonContent';

export function WorkbookPage({
  content,
  contentTypes,
}: {
  content: Content;
  contentTypes: Record<string, ContentType>;
}) {
  return (
    <article className='min-w-0 space-y-5'>
      <header className='space-y-2'>
        <h2 className='text-2xl font-bold'>{content.title}</h2>
        {content.description && (
          <p className='text-muted-foreground text-sm'>{content.description}</p>
        )}
        <div className='flex gap-2'>
          <Badge variant='outline'>
            {contentTypes[content.content_type_uuid]?.name ?? content.mime_type ?? 'Content'}
          </Badge>
          {content.is_required && <Badge variant='secondary'>Required</Badge>}
        </div>
      </header>
      <LessonContent content={content} contentTypes={contentTypes} />
    </article>
  );
}

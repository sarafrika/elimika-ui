'use client';

import dynamic from 'next/dynamic';
import type { ContentType, LessonContent as Content } from '@/services/client/types.gen';
import { WorkbookLoading } from '@/components/lesson/WorkbookLoading';

const ContentPreview = dynamic(
  () =>
    import('@/components/content-preview/LessonContentPreview').then(
      module => module.LessonContentPreview
    ),
  { loading: () => <WorkbookLoading /> }
);

export function LessonContent({
  content,
  contentTypes,
}: {
  content: Content;
  contentTypes: Record<string, ContentType>;
}) {
  return (
    <ContentPreview
      content={content}
      contentType={
        content.content_text && !content.file_url && !contentTypes[content.content_type_uuid]
          ? 'text'
          : undefined
      }
      contentTypeDetailsMap={contentTypes}
    />
  );
}

'use client';

import PDFViewer from '@/app/dashboard/@student/_components/pdf-viewer';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { resolveLessonContentSource, type PreviewableLessonContent } from '@/lib/lesson-content-preview';

type ContentTypeDetailsMap = Record<
  string,
  { name: string; mime_types: string[]; upload_category?: string; is_media_type?: boolean }
>;

export type LessonContentPreviewItem = PreviewableLessonContent & {
  title?: string | null;
  description?: string | null;
  mime_type?: string | null;
  content_category?: string | null;
  content_type_uuid?: string | null;
  duration?: string | null;
};

function looksLikeHtml(str: string) {
  return /<\/?[a-z][\s\S]*>/i.test(str);
}

function decodeHtmlEntities(value: string) {
  if (typeof document === 'undefined') return value;

  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
}

function normalizeLessonTextContent(value?: string | null) {
  const rawContent = value?.trim() ?? '';
  if (!rawContent) {
    return { renderedContent: '', isHtml: false };
  }

  if (looksLikeHtml(rawContent)) {
    return { renderedContent: rawContent, isHtml: true };
  }

  const decodedContent = decodeHtmlEntities(rawContent).trim();
  if (decodedContent && looksLikeHtml(decodedContent)) {
    return { renderedContent: decodedContent, isHtml: true };
  }

  return { renderedContent: rawContent, isHtml: false };
}

function getContentTypeName(
  content: LessonContentPreviewItem | null | undefined,
  contentTypeDetailsMap?: ContentTypeDetailsMap
) {
  const itemMimeType = content?.mime_type?.toLowerCase() ?? '';
  const itemCategory = content?.content_category?.toLowerCase() ?? '';

  if (itemMimeType === 'application/pdf') return 'pdf';
  if (itemMimeType.includes('video/')) return 'video';
  if (itemMimeType.includes('audio/')) return 'audio';
  if (itemMimeType.includes('image/')) return 'image';
  if (itemMimeType.includes('text/')) return 'text';

  if (itemCategory.includes('video')) return 'video';
  if (itemCategory.includes('audio')) return 'audio';
  if (itemCategory.includes('image')) return 'image';
  if (itemCategory.includes('pdf')) return 'pdf';
  if (itemCategory.includes('text')) return 'text';

  const contentType = content?.content_type_uuid
    ? contentTypeDetailsMap?.[content.content_type_uuid]
    : undefined;

  const normalizedName = contentType?.name?.trim().toUpperCase() ?? '';
  const mimeTypes = contentType?.mime_types ?? [];
  const mimeList = mimeTypes.join(' ').toLowerCase();

  if (normalizedName === 'TEXT') return 'text';
  if (normalizedName === 'PDF') return 'pdf';
  if (normalizedName === 'LINK') return 'link';
  if (normalizedName === 'YOUTUBE') return 'video';

  if (mimeTypes.some(type => type === 'application/pdf')) return 'pdf';
  if (mimeList.includes('video/')) return 'video';
  if (mimeList.includes('audio/')) return 'audio';
  if (mimeList.includes('image/')) return 'image';
  if (mimeList.includes('text/')) return 'text';

  if (normalizedName.includes('VIDEO')) return 'video';
  if (normalizedName.includes('AUDIO')) return 'audio';
  if (normalizedName.includes('IMAGE')) return 'image';

  return normalizedName ? normalizedName.toLowerCase() : 'file';
}

function getYouTubeEmbedUrl(source: string) {
  try {
    const url = new URL(source);

    if (url.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    }

    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.includes('/embed/')) return source;
      if (url.pathname.includes('/shorts/')) {
        const videoId = url.pathname.split('/shorts/')[1]?.split('/')[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
      }
      const videoId = url.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    }
  } catch { }

  return '';
}

function getVimeoEmbedUrl(source: string) {
  try {
    const url = new URL(source);
    if (!url.hostname.includes('vimeo.com')) return '';
    const videoId = url.pathname.split('/').filter(Boolean)[0];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : '';
  } catch {
    return '';
  }
}

export function RichTextPreview({ html }: { html: string }) {
  return (
    <div
      className='
        text-foreground mx-auto w-full text-[15px] leading-7
        [&_*]:max-w-full
        [&_h1]:mt-12 [&_h1]:mb-5 [&_h1]:text-[1.7rem] [&_h1]:font-bold [&_h1]:leading-tight
        [&_h1:first-child]:mt-0
        [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-[1.35rem] [&_h2]:font-bold [&_h2]:leading-snug
        [&_h2:first-child]:mt-0
        [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-[1.15rem] [&_h3]:font-semibold
        [&_h4]:mt-8 [&_h4]:mb-3 [&_h4]:text-base [&_h4]:font-semibold
        [&_p]:text-foreground/80 [&_p]:leading-7
        [&_p:not(:first-child)]:mt-5
        [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:pl-6
        [&_ul]:my-6 [&_ul]:list-disc [&_ul]:pl-6
        [&_li]:text-foreground/80 [&_li]:leading-7
        [&_li:not(:first-child)]:mt-1.5
        [&_li_p]:mt-0
        [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
        [&_blockquote]:my-6
        [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4
        [&_hr]:bg-border [&_hr]:my-10 [&_hr]:h-px [&_hr]:border-0
        [&_pre]:bg-muted/60 [&_pre]:border-border/70 [&_pre]:my-8 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:p-5
        [&_pre]:text-[0.95rem] [&_pre]:leading-7
        [&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0
        [&_code]:bg-muted [&_code]:rounded-md [&_code]:border [&_code]:border-border/60 [&_code]:px-1.5 [&_code]:py-0.5
        [&_code]:font-mono [&_code]:text-[0.9em]
        [&_img]:my-8 [&_img]:rounded-2xl [&_img]:border [&_img]:border-border/60
        [&_img]:shadow-sm
        [&_figure]:my-8
        [&_table]:my-8 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden
        [&_th]:bg-muted [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold
        [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2
      '
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function LessonContentPreview({
  content,
  contentType,
  contentTypeDetailsMap,
}: {
  content: LessonContentPreviewItem | null;
  contentType?: string | null;
  contentTypeDetailsMap?: ContentTypeDetailsMap;
}) {
  if (!content) {
    return (
      <div className='text-muted-foreground flex min-h-[360px] items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        No lesson content available.
      </div>
    );
  }

  const resolvedType = contentType?.toLowerCase() || getContentTypeName(content, contentTypeDetailsMap);
  const resolvedSource = resolveLessonContentSource(content, resolvedType);
  const normalizedTextContent = normalizeLessonTextContent(content.content_text);

  if (resolvedType === 'text') {
    return (
      <div className='bg-background p-6'>
        {normalizedTextContent.renderedContent ? (
          <RichTextPreview html={normalizedTextContent.renderedContent} />
        ) : (
          <p className='text-muted-foreground text-sm'>No text content was provided for this item.</p>
        )}
      </div>
    );
  }

  if (resolvedType === 'pdf') {
    return resolvedSource ? (
      <div className='bg-background p-4 mb-20'>
        <PDFViewer file={resolvedSource} />
      </div>
    ) : (
      <div className='text-muted-foreground flex min-h-[360px] items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        This PDF is not available yet.
      </div>
    );
  }

  if (resolvedType === 'video') {
    const youtubeUrl = getYouTubeEmbedUrl(resolvedSource);
    const vimeoUrl = getVimeoEmbedUrl(resolvedSource);
    const embedUrl = youtubeUrl || vimeoUrl;

    if (embedUrl) {
      return (
        <div className='bg-background overflow-hidden'>
          <iframe
            src={embedUrl}
            title={content.title || 'Lesson video'}
            className='aspect-video w-full'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
          />
        </div>
      );
    }

    return resolvedSource ? (
      <div className='border-border/60 bg-background overflow-hidden border p-4'>
        <video controls className='aspect-video w-full rounded-2xl' src={resolvedSource} />
      </div>
    ) : (
      <div className='text-muted-foreground flex min-h-[360px] items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        This video source is not available yet.
      </div>
    );
  }

  if (resolvedType === 'audio') {
    return resolvedSource ? (
      <div className='bg-background p-6'>
        <audio controls className='w-full' src={resolvedSource} />
      </div>
    ) : (
      <div className='text-muted-foreground flex min-h-[220px] items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        This audio source is not available yet.
      </div>
    );
  }

  if (resolvedType === 'image') {
    return resolvedSource ? (
      <div className='bg-background overflow-hidden p-4 mb-20'>
        <img
          src={resolvedSource}
          alt={content.title || 'Lesson image'}
          className='max-h-[680px] w-full rounded-2xl object-contain'
        />
      </div>
    ) : (
      <div className='text-muted-foreground flex min-h-[360px] items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        This image source is not available yet.
      </div>
    );
  }

  return (
    <div className='border-border/60 bg-background rounded-[28px] border p-6'>
      <div className='space-y-3'>
        <p className='text-sm font-semibold'>File content</p>
        <p className='text-muted-foreground text-sm'>
          This material opens best in a new tab for teaching or sharing.
        </p>
        {resolvedSource ? (
          <Button asChild>
            <a href={resolvedSource} target='_blank' rel='noreferrer'>
              Open lesson file
            </a>
          </Button>
        ) : (
          <p className='text-muted-foreground text-sm'>No file source is available yet.</p>
        )}
      </div>
    </div>
  );
}

export function LessonContentViewerDialog({
  open,
  onOpenChange,
  content,
  contentType,
  contentTypeDetailsMap,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: LessonContentPreviewItem | null;
  contentType?: string | null;
  contentTypeDetailsMap?: ContentTypeDetailsMap;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='flex h-full w-full max-w-4xl flex-col overflow-hidden p-0 sm:max-w-4xl'>
        <SheetHeader className='border-border/70 border-b px-6 py-4 text-left'>
          <SheetTitle>{content?.title || 'Lesson content'}</SheetTitle>
          {content?.description ? (
            <SheetDescription>{content.description}</SheetDescription>
          ) : null}
        </SheetHeader>
        <div className='min-h-0 flex-1 overflow-auto p-4 md:p-6'>
          <LessonContentPreview
            content={content}
            contentType={contentType}
            contentTypeDetailsMap={contentTypeDetailsMap}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

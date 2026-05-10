'use client';

import PDFViewer from '@/app/dashboard/@student/_components/pdf-viewer';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { resolveLessonContentSource, type PreviewableLessonContent } from '@/lib/lesson-content-preview';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '../ui/badge';

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

export type LessonContentViewerType =
  | 'text'
  | 'pdf'
  | 'video'
  | 'audio'
  | 'image'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'file'
  | 'link'
  | 'office';

function getFileExtension(source?: string | null) {
  const value = source?.trim() ?? '';
  if (!value) return '';

  const cleanValue = value.split('?')[0]?.split('#')[0] ?? value;
  const match = cleanValue.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? '';
}

export function inferLessonContentType(
  content: LessonContentPreviewItem | null | undefined,
  contentTypeDetailsMap?: ContentTypeDetailsMap
): LessonContentViewerType {
  const itemMimeType = content?.mime_type?.toLowerCase() ?? '';
  const itemCategory = content?.content_category?.toLowerCase() ?? '';
  const itemUrl = content?.file_url ?? content?.value ?? '';
  const fileExtension = getFileExtension(itemUrl || content?.title || '');
  const contentType = content?.content_type_uuid
    ? contentTypeDetailsMap?.[content.content_type_uuid]
    : undefined;
  const normalizedName = contentType?.name?.trim().toUpperCase() ?? '';
  const mimeTypes = contentType?.mime_types ?? [];
  const mimeList = mimeTypes.join(' ').toLowerCase();
  const officeExtensions = [
    'doc',
    'docx',
    'docm',
    'ppt',
    'pptx',
    'pptm',
    'xls',
    'xlsx',
    'xlsm',
    'odt',
    'ods',
    'odp',
  ];

  if (itemMimeType === 'application/pdf' || itemCategory.includes('pdf') || normalizedName === 'PDF') {
    return 'pdf';
  }

  if (itemMimeType.includes('video/') || itemCategory.includes('video') || normalizedName.includes('VIDEO')) {
    return 'video';
  }

  if (itemMimeType.includes('audio/') || itemCategory.includes('audio') || normalizedName.includes('AUDIO')) {
    return 'audio';
  }

  if (itemMimeType.includes('image/') || itemCategory.includes('image') || normalizedName.includes('IMAGE')) {
    return 'image';
  }

  if (itemMimeType.includes('text/') || itemCategory.includes('text') || normalizedName === 'TEXT') {
    return 'text';
  }

  if (normalizedName === 'LINK') {
    return 'link';
  }

  if (normalizedName === 'YOUTUBE') {
    return 'video';
  }

  if (mimeTypes.some(type => type === 'application/pdf') || mimeList.includes('application/pdf')) {
    return 'pdf';
  }

  if (officeExtensions.includes(fileExtension)) {
    if (['doc', 'docx', 'odt'].includes(fileExtension)) return 'document';
    if (['xls', 'xlsx', 'ods'].includes(fileExtension)) return 'spreadsheet';
    if (['ppt', 'pptx', 'odp'].includes(fileExtension)) return 'presentation';
    return 'office';
  }

  if (
    mimeList.includes('application/vnd.openxmlformats-officedocument') ||
    mimeList.includes('application/msword') ||
    mimeList.includes('application/vnd.ms-excel') ||
    mimeList.includes('application/vnd.ms-powerpoint')
  ) {
    if (mimeList.includes('presentation') || fileExtension.startsWith('ppt')) return 'presentation';
    if (mimeList.includes('spreadsheet') || fileExtension.startsWith('xls')) return 'spreadsheet';
    return 'document';
  }

  if (normalizedName.includes('DOCUMENT') || normalizedName.includes('WORD')) return 'document';
  if (normalizedName.includes('SPREADSHEET') || normalizedName.includes('EXCEL')) return 'spreadsheet';
  if (normalizedName.includes('PRESENTATION') || normalizedName.includes('POWERPOINT')) return 'presentation';

  return 'file';
}

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
  return inferLessonContentType(content, contentTypeDetailsMap);
}

function OfficeDocumentPreview({
  source,
  title,
  type,
}: {
  source: string;
  title: string;
  type: Extract<LessonContentViewerType, 'document' | 'spreadsheet' | 'presentation' | 'office'>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileExtension = getFileExtension(source);
  const resolvedOfficeType =
    type === 'office'
      ? ['ppt', 'pptx', 'pptm', 'odp'].includes(fileExtension)
        ? 'presentation'
        : ['xls', 'xlsx', 'xlsm', 'ods'].includes(fileExtension)
          ? 'spreadsheet'
          : 'document'
      : type;

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    container.innerHTML = '';
    setIsLoading(true);
    setErrorMessage(null);

    const renderOfficeFile = async () => {
      try {
        const response = await fetch(source);
        if (!response.ok) {
          throw new Error(`Unable to load file (${response.status})`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (cancelled || !containerRef.current) {
          return;
        }

        if (resolvedOfficeType === 'document') {
          const { renderAsync } = await import('docx-preview');
          await renderAsync(arrayBuffer, containerRef.current, containerRef.current, {
            breakPages: true,
            ignoreFonts: false,
            ignoreHeight: false,
            ignoreWidth: false,
            useBase64URL: true,
          });
        } else if (resolvedOfficeType === 'spreadsheet') {
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];

          if (!firstSheetName) {
            throw new Error('No worksheets were found in this spreadsheet.');
          }

          const worksheet = workbook.Sheets[firstSheetName];
          const html = XLSX.utils.sheet_to_html(worksheet);

          if (cancelled || !containerRef.current) {
            return;
          }

          containerRef.current.innerHTML = `
            <div class="overflow-auto rounded-2xl border border-border/60">
              ${html}
            </div>
          `;

          const table = containerRef.current.querySelector('table');
          if (table) {
            table.className = 'min-w-full border-collapse text-sm';
          }
        } else {
          const { init } = await import('pptx-preview');
          const previewer = init(containerRef.current, {
            width: containerRef.current.clientWidth || 960,
            height: Math.max(containerRef.current.clientHeight || 0, 540),
          });
          await previewer.preview(arrayBuffer);
        }

        if (!cancelled) {
          setIsLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to preview this file.');
          setIsLoading(false);
        }
      }
    };

    void renderOfficeFile();

    return () => {
      cancelled = true;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [source, resolvedOfficeType]);

  if (errorMessage) {
    return (
      <div className='text-muted-foreground flex min-h-[360px] w-full max-w-full min-w-0 items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        {errorMessage}
      </div>
    );
  }

  return (
    <div className='bg-background mb-20 w-full max-w-full min-w-0 overflow-hidden rounded-[28px] border border-border/60 p-4'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <div>
          <p className='text-sm font-semibold'>Office document</p>
          <p className='text-muted-foreground text-sm'>
            Viewing is embedded directly in the platform.
          </p>
        </div>
        <Badge variant='secondary' className='rounded-full'>
          {resolvedOfficeType.toUpperCase()}
        </Badge>
      </div>
      {isLoading ? (
        <div className='text-muted-foreground flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed text-sm'>
          Loading {title || 'document'}...
        </div>
      ) : null}
      <div
        ref={containerRef}
        className='lesson-content-office-preview min-h-[72vh] w-full overflow-auto rounded-2xl'
      />
    </div>
  );
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
        text-foreground mx-auto block w-full max-w-full min-w-0 overflow-hidden

        text-[13.5px] leading-6
        sm:text-sm sm:leading-7
        md:text-[15px]

        [overflow-wrap:anywhere]
        break-words

        [&_*]:max-w-full
        [&_*]:min-w-0

        /* Headings */
        [&_h1]:mt-8
        [&_h1]:mb-4
        [&_h1]:text-[1.5rem]
        [&_h1]:font-bold
        [&_h1]:leading-tight
        sm:[&_h1]:text-2xl
        md:[&_h1]:text-[1.7rem]
        sm:[&_h1]:mt-10
        md:[&_h1]:mt-12
        [&_h1:first-child]:mt-0

        [&_h2]:mt-7
        [&_h2]:mb-3
        [&_h2]:text-[1.2rem]
        [&_h2]:font-bold
        [&_h2]:leading-snug
        sm:[&_h2]:text-xl
        md:[&_h2]:text-[1.35rem]
        sm:[&_h2]:mt-8
        md:[&_h2]:mt-10
        [&_h2:first-child]:mt-0

        [&_h3]:mt-6
        [&_h3]:mb-2
        [&_h3]:text-base
        [&_h3]:font-semibold
        sm:[&_h3]:text-lg
        md:[&_h3]:text-[1.15rem]

        [&_h4]:mt-6
        [&_h4]:mb-2
        [&_h4]:text-sm
        [&_h4]:font-semibold
        sm:[&_h4]:text-base

        /* Paragraphs */
        [&_p]:text-foreground/80
        [&_p]:leading-6
        sm:[&_p]:leading-7
        [&_p:not(:first-child)]:mt-3
        sm:[&_p:not(:first-child)]:mt-4
        md:[&_p:not(:first-child)]:mt-5

        /* Lists */
        [&_ol]:my-4
        [&_ol]:list-decimal
        [&_ol]:pl-4
        sm:[&_ol]:pl-5

        [&_ul]:my-4
        [&_ul]:list-disc
        [&_ul]:pl-4
        sm:[&_ul]:pl-5

        [&_li]:text-foreground/80
        [&_li]:leading-6
        sm:[&_li]:leading-7
        [&_li:not(:first-child)]:mt-1

        [&_li_p]:mt-0

        /* Blockquotes */
        [&_blockquote]:my-5
        [&_blockquote]:border-l-4
        [&_blockquote]:border-border
        [&_blockquote]:pl-3
        sm:[&_blockquote]:pl-4
        [&_blockquote]:italic
        [&_blockquote]:text-muted-foreground

        /* Links */
        [&_a]:text-primary
        [&_a]:underline
        [&_a]:underline-offset-4
        [&_a]:break-all

        /* Divider */
        [&_hr]:bg-border
        [&_hr]:my-6
        sm:[&_hr]:my-8
        md:[&_hr]:my-10
        [&_hr]:h-px
        [&_hr]:border-0

        /* Code blocks */
        [&_pre]:bg-muted/60
        [&_pre]:border-border/70
        [&_pre]:my-5
        sm:[&_pre]:my-6
        md:[&_pre]:my-8

        [&_pre]:w-full
        [&_pre]:max-w-full
        [&_pre]:overflow-x-auto

        [&_pre]:rounded-xl
        sm:[&_pre]:rounded-2xl

        [&_pre]:border

        [&_pre]:p-3
        sm:[&_pre]:p-4
        md:[&_pre]:p-5

        [&_pre]:text-[12px]
        sm:[&_pre]:text-sm
        md:[&_pre]:text-[0.95rem]

        [&_pre]:leading-6
        sm:[&_pre]:leading-7

        [&_pre_code]:bg-transparent
        [&_pre_code]:border-0
        [&_pre_code]:p-0

        /* Inline code */
        [&_code]:bg-muted
        [&_code]:rounded-md
        [&_code]:border
        [&_code]:border-border/60
        [&_code]:px-1
        sm:[&_code]:px-1.5
        [&_code]:py-0.5
        [&_code]:font-mono
        [&_code]:text-[0.82em]
        [&_code]:break-all

        /* Images */
        [&_img]:block
        [&_img]:my-5
        sm:[&_img]:my-6
        md:[&_img]:my-8

        [&_img]:h-auto
        [&_img]:w-full
        [&_img]:max-w-full

        [&_img]:rounded-xl
        sm:[&_img]:rounded-2xl

        [&_img]:border
        [&_img]:border-border/60

        [&_img]:object-contain
        [&_img]:shadow-sm

        /* Figures */
        [&_figure]:my-5
        sm:[&_figure]:my-6
        md:[&_figure]:my-8

        /* Tables */
        [&_table]:my-5
        sm:[&_table]:my-6
        md:[&_table]:my-8

        [&_table]:block
        sm:[&_table]:table

        [&_table]:w-full
        [&_table]:overflow-x-auto
        [&_table]:border-collapse

        [&_table]:text-[12px]
        sm:[&_table]:text-sm

        [&_th]:bg-muted
        [&_th]:border
        [&_th]:border-border
        [&_th]:px-2
        sm:[&_th]:px-3
        [&_th]:py-2
        [&_th]:text-left
        [&_th]:font-semibold
        [&_th]:break-words

        [&_td]:border
        [&_td]:border-border
        [&_td]:px-2
        sm:[&_td]:px-3
        [&_td]:py-2
        [&_td]:break-words

        /* Embeds */
        [&_iframe]:block
        [&_iframe]:w-full
        [&_iframe]:max-w-full

        [&_video]:block
        [&_video]:w-full
        [&_video]:max-w-full
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
      <div className='text-muted-foreground flex min-h-[360px] w-full max-w-full min-w-0 items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        No lesson content available.
      </div>
    );
  }

  const explicitType = contentType?.toLowerCase() || '';
  const resolvedType =
    explicitType && explicitType !== 'file'
      ? explicitType
      : getContentTypeName(content, contentTypeDetailsMap);
  const resolvedSource = resolveLessonContentSource(content, resolvedType);
  const normalizedTextContent = normalizeLessonTextContent(content.content_text);

  if (resolvedType === 'text') {
    return (
      <div className='bg-background mb-10 w-full max-w-full min-w-0 overflow-hidden p-6'>
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
      <div className='bg-background mb-20 w-full max-w-full min-w-0 overflow-hidden p-4'>
        <PDFViewer file={resolvedSource} />
      </div>
    ) : (
      <div className='text-muted-foreground flex min-h-[360px] w-full max-w-full min-w-0 items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        This PDF is not available yet.
      </div>
    );
  }

  if (resolvedType === 'document' || resolvedType === 'spreadsheet' || resolvedType === 'presentation' || resolvedType === 'office') {
    return resolvedSource ? (
      <OfficeDocumentPreview
        source={resolvedSource}
        title={content.title || 'Office document'}
        type={resolvedType}
      />
    ) : (
      <div className='text-muted-foreground flex min-h-[360px] w-full max-w-full min-w-0 items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        This document is not available yet.
      </div>
    );
  }

  if (resolvedType === 'video') {
    const youtubeUrl = getYouTubeEmbedUrl(resolvedSource);
    const vimeoUrl = getVimeoEmbedUrl(resolvedSource);
    const embedUrl = youtubeUrl || vimeoUrl;

    if (embedUrl) {
      return (
        <div className='bg-background mb-20 w-full max-w-full min-w-0 overflow-hidden'>
          <iframe
            src={embedUrl}
            title={content.title || 'Lesson video'}
            className='aspect-video block w-full max-w-full'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
          />
        </div>
      );
    }

    return resolvedSource ? (
      <div className='border-border/60 bg-background mb-20 w-full max-w-full min-w-0 overflow-hidden border p-4'>
        <video controls className='aspect-video block w-full max-w-full rounded-2xl' src={resolvedSource} />
      </div>
    ) : (
      <div className='text-muted-foreground flex min-h-[360px] w-full max-w-full min-w-0 items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        This video source is not available yet.
      </div>
    );
  }

  if (resolvedType === 'audio') {
    return resolvedSource ? (
      <div className='bg-background mb-20 w-full max-w-full min-w-0 p-6'>
        <audio controls className='w-full' src={resolvedSource} />
      </div>
    ) : (
      <div className='text-muted-foreground flex min-h-[220px] w-full max-w-full min-w-0 items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        This audio source is not available yet.
      </div>
    );
  }

  if (resolvedType === 'image') {
    return resolvedSource ? (
      <div className='bg-background mb-20 w-full max-w-full min-w-0 overflow-hidden p-4'>
        <img
          src={resolvedSource}
          alt={content.title || 'Lesson image'}
          className='block h-auto max-h-[680px] w-full max-w-full rounded-2xl object-contain'
        />
      </div>
    ) : (
      <div className='text-muted-foreground flex min-h-[360px] w-full max-w-full min-w-0 items-center justify-center rounded-[28px] border border-dashed p-8 text-center text-sm'>
        This image source is not available yet.
      </div>
    );
  }

  return (
    <div className='border-border/60 bg-background mb-20 flex min-h-[360px] w-full max-w-full min-w-0 items-center justify-center overflow-hidden rounded-[28px] border p-6 text-center'>
      <div className='max-w-lg space-y-3'>
        <div className='flex items-center justify-center gap-2'>
          <p className='text-sm font-semibold'>Preview unavailable</p>
          <Badge variant='secondary' className='rounded-full'>
            {resolvedType.toUpperCase()}
          </Badge>
        </div>
        <p className='text-muted-foreground text-sm'>
          This file type cannot be rendered inline yet. If this is a Word, Excel, or PowerPoint
          file, please make sure its extension and MIME type are recognized by the preview
          pipeline.
        </p>
        {resolvedSource ? (
          <p className='text-muted-foreground text-xs'>
            File source was detected, but no inline preview could be generated.
          </p>
        ) : (
          <p className='text-muted-foreground text-xs'>No file source is available yet.</p>
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

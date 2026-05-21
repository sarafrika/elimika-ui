'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useMemo, useState } from 'react';
import { LessonContentViewerDialog } from '../content-preview/LessonContentPreview';

type AttachmentItem = {
  uuid?: string;
  original_filename?: string;
  file_url?: string;
  mime_type?: string;
  file_size_bytes?: number;
};

type PreviewableAttachment = AttachmentItem & {
  content_text?: string | null;
  value?: string | null;
};

function formatFileSize(bytes?: number | bigint) {
  if (!bytes || bytes <= 0) return null;

  let value = typeof bytes === 'bigint' ? Number(bytes) : bytes;

  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 || unitIndex === 0 ? Math.round(value) : value.toFixed(1)} ${units[unitIndex]}`;
}

function inferAttachmentContentType(attachment: AttachmentItem) {
  const mime = String(attachment.mime_type || '').toLowerCase();
  const fileName = String(attachment.original_filename || '').toLowerCase();
  const extension = fileName.split('.').pop() || '';
  const officeExtensions = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods', 'odp'];

  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(fileName)) return 'image';
  if (mime.startsWith('video/') || /\.(mp4|webm|mov|m4v|mkv)$/.test(fileName)) return 'video';
  if (mime.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac)$/.test(fileName)) return 'audio';
  if (mime.includes('pdf') || fileName.endsWith('.pdf')) return 'pdf';
  if (mime.startsWith('text/') || /\.(txt|md|csv|html?|xml|json|rtf)$/.test(fileName)) return 'text';
  if (officeExtensions.includes(extension)) {
    if (['doc', 'docx', 'odt'].includes(extension)) return 'document';
    if (['xls', 'xlsx', 'ods'].includes(extension)) return 'spreadsheet';
    if (['ppt', 'pptx', 'odp'].includes(extension)) return 'presentation';
    return 'office';
  }

  return 'file';
}

export function AttachmentResourceList({
  attachments,
  emptyMessage,
  previewLabel = 'Preview',
}: {
  attachments: AttachmentItem[];
  emptyMessage: string;
  previewLabel?: string;
}) {
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentItem | null>(null);

  const preparedAttachments = useMemo(
    () =>
      attachments.filter(
        attachment =>
          attachment && (attachment.file_url || attachment.original_filename || attachment.uuid)
      ),
    [attachments]
  );

  if (preparedAttachments.length === 0) {
    return <p className='text-muted-foreground text-sm'>{emptyMessage}</p>;
  }

  const previewContent: PreviewableAttachment | null = previewAttachment
    ? {
      ...previewAttachment,
      title: previewAttachment.original_filename ?? 'Attachment',
      content_text: null,
      value: previewAttachment.file_url || null,
    }
    : null;

  return (
    <>
      <div className='space-y-2'>
        {preparedAttachments.map(attachment => {
          const fileSize = formatFileSize(attachment.file_size_bytes);

          return (
            <div
              key={attachment.uuid ?? attachment.file_url ?? attachment.original_filename}
              className='border-border/60 bg-background/70 flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between'
            >
              <div className='min-w-0 space-y-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <p className='text-foreground truncate text-sm font-medium'>
                    {attachment.original_filename || 'Attachment'}
                  </p>
                  {attachment.mime_type ? (
                    <Badge variant='secondary' className='max-w-full truncate'>
                      {attachment.mime_type}
                    </Badge>
                  ) : null}
                  {fileSize ? <Badge variant='outline'>{fileSize}</Badge> : null}
                </div>
                <p className='text-muted-foreground text-xs'>
                  Open the attachment in the platform viewer.
                </p>
              </div>

              <div className='flex flex-wrap gap-2'>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  className='gap-2'
                  onClick={() => setPreviewAttachment(attachment)}
                  disabled={!attachment.file_url}
                >
                  <Eye className='h-4 w-4' />
                  {previewLabel}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <LessonContentViewerDialog
        open={!!previewAttachment}
        onOpenChange={open => {
          if (!open) setPreviewAttachment(null);
        }}
        content={previewContent}
        contentType={previewAttachment ? inferAttachmentContentType(previewAttachment) : undefined}
      />
    </>
  );
}

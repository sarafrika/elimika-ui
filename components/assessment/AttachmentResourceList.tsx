'use client';

import { ReadingMode } from '@/app/dashboard/@student/schedule/classes/[id]/ReadingMode';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';

type AttachmentItem = {
  uuid?: string;
  original_filename?: string;
  file_url?: string;
  mime_type?: string;
  file_size_bytes?: number;
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

function isPdfAttachment(attachment: AttachmentItem) {
  const mime = String(attachment.mime_type || '').toLowerCase();
  const fileName = String(attachment.original_filename || '').toLowerCase();

  return mime.includes('pdf') || fileName.endsWith('.pdf');
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

  return (
    <>
      <div className='space-y-2'>
        {preparedAttachments.map(attachment => {
          const isPdf = isPdfAttachment(attachment);
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
                  {isPdf
                    ? 'Open in reading mode or download the file.'
                    : 'Open or download this attachment.'}
                </p>
              </div>

              <div className='flex flex-wrap gap-2'>
                {isPdf ? (
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    className='gap-2'
                    onClick={() => setPreviewAttachment(attachment)}
                  >
                    <Eye className='h-4 w-4' />
                    {previewLabel}
                  </Button>
                ) : null}

                <Button asChild size='sm' variant='outline' className='gap-2'>
                  <a href={attachment.file_url} rel='noreferrer' target='_blank'>
                    <FileText className='h-4 w-4' />
                    Open
                  </a>
                </Button>

                <Button asChild size='sm' variant='outline' className='gap-2'>
                  <a href={attachment.file_url} download={attachment.original_filename}>
                    <Download className='h-4 w-4' />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <ReadingMode
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        title={previewAttachment?.original_filename || 'Attachment preview'}
        description={previewAttachment?.mime_type || 'Assignment resource'}
        content={previewAttachment?.file_url || ''}
        contentType='pdf'
      />
    </>
  );
}

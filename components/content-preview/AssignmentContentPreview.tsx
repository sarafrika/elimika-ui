'use client';

import { FileAudio, FileImage, FileSpreadsheet, FileText, FileVideo } from 'lucide-react';
import dynamic from 'next/dynamic';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import type { AssignmentAttachment as ApiAssignmentAttachment } from '@/services/client';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

const DocumentPreview = dynamic(
  () => import('./LessonContentPreview').then(module => module.LessonContentPreview),
  { ssr: false, loading: () => <Skeleton className='h-96 w-full' /> }
);

type AssignmentAttachment = Pick<
  ApiAssignmentAttachment,
  'uuid' | 'original_filename' | 'mime_type' | 'file_url' | 'stored_filename'
> & {
  file_size_bytes?: bigint | number;
};

function formatFileSize(bytes?: bigint | number) {
  if (bytes == null) return null;

  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return null;

  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(file: AssignmentAttachment) {
  const mimeType = file.mime_type?.toLowerCase() ?? '';
  const extension = (file.original_filename || file.file_url || file.stored_filename || '')
    .split(/[?#]/)[0]
    .split('.')
    .pop()
    ?.toLowerCase();

  if (mimeType.includes('pdf') || extension === 'pdf') return 'pdf';
  if (
    mimeType.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension ?? '')
  )
    return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';

  // "officedocument" also appears in spreadsheet MIME types.
  if (
    mimeType.includes('sheet') ||
    mimeType.includes('excel') ||
    ['xls', 'xlsx', 'xlsm', 'ods'].includes(extension ?? '')
  ) {
    return 'spreadsheet';
  }
  if (mimeType.includes('wordprocessingml') || extension === 'docx') return 'document';

  return 'file';
}

function getFileIcon(type: string) {
  switch (type) {
    case 'document':
      return <FileText className='size-4' />;

    case 'spreadsheet':
      return <FileSpreadsheet className='size-4' />;

    case 'image':
      return <FileImage className='size-4' />;

    case 'audio':
      return <FileAudio className='size-4' />;

    case 'video':
      return <FileVideo className='size-4' />;

    default:
      return <FileText className='size-4' />;
  }
}

export function AssignmentContentPreview({ attachments }: { attachments: AssignmentAttachment[] }) {
  if (!attachments?.length) {
    return <EmptyState variant='compact' title='No attachments available for this assignment.' />;
  }

  return (
    <div className='space-y-6'>
      {attachments.map(file => {
        const fileType = getFileType(file);
        const source = toAuthenticatedMediaUrl(file.file_url?.trim());
        const filename =
          file.original_filename || file.stored_filename?.split('/').pop() || 'Attachment';
        const fileSize = formatFileSize(file.file_size_bytes);

        return (
          <Card key={file.uuid || file.file_url || filename} className='min-w-0 rounded-2xl p-4'>
            {/* Header */}
            <div className='mb-4 flex items-start justify-between gap-3'>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  {getFileIcon(fileType)}

                  <p className='text-sm font-medium break-words'>{filename}</p>
                </div>

                <div className='text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs'>
                  {file.mime_type && (
                    <Badge variant='outline' className='max-w-full break-all whitespace-normal'>
                      {file.mime_type}
                    </Badge>
                  )}

                  {fileSize !== null && <Badge variant='outline'>{fileSize}</Badge>}
                </div>
              </div>
            </div>

            {/* Preview */}
            {source && (fileType === 'pdf' || fileType === 'document') && (
              <DocumentPreview
                key={source}
                content={{ file_url: source, title: filename, mime_type: file.mime_type }}
                contentType={fileType}
              />
            )}

            {source && fileType === 'image' && (
              <img
                src={source}
                alt={filename}
                className='max-h-[700px] w-full rounded-xl object-contain'
              />
            )}

            {source && fileType === 'audio' && (
              <audio controls preload='metadata' className='w-full' src={source} />
            )}

            {source && fileType === 'video' && (
              <video controls preload='metadata' className='w-full rounded-xl' src={source} />
            )}

            {(!source || fileType === 'file' || fileType === 'spreadsheet') && (
              <EmptyState
                variant='compact'
                title={
                  source
                    ? 'Preview unavailable for this file type.'
                    : 'This attachment is not available yet.'
                }
              />
            )}
          </Card>
        );
      })}
    </div>
  );
}

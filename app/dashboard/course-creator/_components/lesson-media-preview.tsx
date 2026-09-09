'use client';

import { FileText } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

const PDFViewer = dynamic(() => import('@/app/dashboard/student/_components/pdf-viewer'), {
  ssr: false,
  loading: () => <Skeleton className='h-72 w-full' />,
});

export function LessonMediaPreview({
  url,
  title,
  contentType,
}: {
  url: string;
  title: string;
  contentType: string;
}) {
  const source = toAuthenticatedMediaUrl(url);

  return (
    <div className='border-border overflow-hidden rounded-md border'>
      {contentType === 'IMAGE' ? (
        <img src={source} alt={title} className='h-56 w-full object-contain' />
      ) : contentType === 'VIDEO' ? (
        <video
          key={source}
          src={source}
          controls
          preload='metadata'
          aria-label={title}
          className='bg-muted h-56 w-full object-contain'
        />
      ) : contentType === 'AUDIO' ? (
        <div className='bg-background p-4'>
          <audio
            key={source}
            src={source}
            controls
            preload='metadata'
            aria-label={title}
            className='w-full'
          />
        </div>
      ) : contentType === 'PDF' ? (
        <div className='max-h-96 overflow-auto' role='region' aria-label={title}>
          <PDFViewer key={source} file={source} />
        </div>
      ) : (
        <div className='bg-background flex h-56 flex-col items-center justify-center gap-2 p-4'>
          <FileText className='text-muted-foreground h-8 w-8' />
          <p className='text-sm font-medium'>Preview unavailable</p>
        </div>
      )}
    </div>
  );
}

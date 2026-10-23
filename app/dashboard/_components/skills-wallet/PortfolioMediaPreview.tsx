'use client';

import { FileText } from 'lucide-react';
import { useState } from 'react';
import { DocumentPreview } from '@/components/data-display/document-preview';
import { cn } from '@/lib/utils';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { portfolioMediaType } from './portfolio';

export type PortfolioMedia = { url: string; title: string; name?: string; mime?: string };

export function PortfolioMediaPreview({
  url,
  title,
  name,
  mime,
  compact = false,
}: PortfolioMedia & { compact?: boolean }) {
  const source = toAuthenticatedMediaUrl(url) || url;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const type = portfolioMediaType(url, name, mime);
  const unavailable = failedSource === source || type === 'other';
  const height = compact ? 'h-40' : 'max-h-96';

  if (unavailable)
    return (
      <div
        className={cn(
          'bg-muted text-muted-foreground flex flex-col items-center justify-center gap-2 p-6 text-center text-sm',
          compact ? 'h-40' : 'min-h-40'
        )}
      >
        <FileText className='size-8' />
        <span>
          {type === 'other'
            ? compact
              ? 'Open project to view this attachment or link.'
              : 'An inline preview is unavailable for this file type.'
            : 'Media preview unavailable.'}
        </span>
      </div>
    );
  if (type === 'image')
    return (
      // Protected media must load in the browser, where the session cookie is available.
      <img
        src={source}
        alt={title}
        width={800}
        height={450}
        loading='lazy'
        onError={() => setFailedSource(source)}
        className={cn('bg-muted w-full object-contain', height)}
      />
    );
  if (type === 'video')
    return (
      <video
        key={source}
        src={source}
        controls
        preload={compact ? 'none' : 'metadata'}
        aria-label={title}
        onError={() => setFailedSource(source)}
        className={cn('bg-muted w-full', height)}
      />
    );
  if (type === 'audio')
    return (
      <div className={cn('bg-muted flex items-center p-3', compact && 'h-40')}>
        <audio
          key={source}
          src={source}
          controls
          preload='none'
          aria-label={title}
          onError={() => setFailedSource(source)}
          className='w-full min-w-0'
        />
      </div>
    );
  return (
    <DocumentPreview
      key={source}
      documentUrl={source}
      documentTitle={title}
      height={compact ? 160 : 360}
    />
  );
}

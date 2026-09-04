'use client';

import { AlertCircle, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';

type VideoSource = 'youtube' | 'vimeo' | 'direct' | 'unsupported';

type VideoPreviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  videoUrl?: string | null;
  emptyMessage?: string;
};

function getYouTubeEmbedUrl(source: string) {
  const url = new URL(source);
  let videoId = '';

  if (url.hostname.includes('youtu.be')) {
    videoId = url.pathname.slice(1).split('/')[0] ?? '';
  } else if (url.pathname.includes('/shorts/')) {
    videoId = url.pathname.split('/shorts/')[1]?.split('/')[0] ?? '';
  } else if (url.pathname.includes('/embed/')) {
    videoId = url.pathname.split('/embed/')[1]?.split('/')[0] ?? '';
  } else {
    videoId = url.searchParams.get('v') || '';
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0` : '';
}

function getVimeoEmbedUrl(source: string) {
  const url = new URL(source);
  const videoId = url.pathname.split('/').filter(Boolean)[0] ?? '';

  return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : '';
}

function getVideoSource(videoUrl?: string | null) {
  const resolvedUrl = toAuthenticatedMediaUrl(videoUrl ?? '') ?? '';

  if (!resolvedUrl) {
    return { source: 'unsupported' as const, url: '', error: 'No video URL provided.' };
  }

  try {
    const parsedUrl = new URL(resolvedUrl, window.location.origin);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      const embedUrl = getYouTubeEmbedUrl(parsedUrl.toString());
      if (embedUrl) return { source: 'youtube' as const, url: embedUrl, error: null };
    }

    if (hostname.includes('vimeo.com')) {
      const embedUrl = getVimeoEmbedUrl(parsedUrl.toString());
      if (embedUrl) return { source: 'vimeo' as const, url: embedUrl, error: null };
    }

    return { source: 'direct' as const, url: resolvedUrl, error: null };
  } catch {
    return {
      source: 'unsupported' as const,
      url: '',
      error: 'The video preview link could not be loaded.',
    };
  }
}

export function VideoPreviewModal({
  open,
  onOpenChange,
  title,
  description,
  videoUrl,
  emptyMessage = 'This item does not have a video preview attached.',
}: VideoPreviewModalProps) {
  const [videoSource, setVideoSource] = useState<VideoSource>('unsupported');
  const [embedUrl, setEmbedUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const result = getVideoSource(videoUrl);
    setVideoSource(result.source);
    setEmbedUrl(result.url);
    setError(result.error);
  }, [open, videoUrl]);

  const handleVideoError = () => {
    setVideoSource('unsupported');
    setError('This video could not be played. The format or source may not be supported.');
  };

  const hasError = Boolean(error) || videoSource === 'unsupported';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='border-border bg-card overflow-hidden p-0 sm:max-w-5xl'>
        <DialogHeader className='border-border border-b px-6 py-4 text-left'>
          <DialogTitle className='text-foreground text-lg'>
            {title ? `Preview: ${title}` : 'Video Preview'}
          </DialogTitle>
          <DialogDescription>
            {description || 'Watch this video without leaving the current page.'}
          </DialogDescription>
        </DialogHeader>

        <div className='bg-muted/20'>
          {hasError ? (
            <div className='flex min-h-[260px] flex-col items-center justify-center gap-3 px-6 py-12 text-center'>
              <div className='bg-destructive/10 text-destructive inline-flex size-14 items-center justify-center rounded-full'>
                <AlertCircle className='size-7' />
              </div>
              <div className='space-y-1'>
                <p className='text-foreground text-base font-semibold'>No playable preview</p>
                <p className='text-muted-foreground max-w-md text-sm'>
                  {error || emptyMessage}
                </p>
              </div>
              {videoUrl ? (
                <div className='border-border bg-background/70 text-muted-foreground max-w-2xl rounded-md border px-3 py-2 text-left text-xs break-all'>
                  {videoUrl}
                </div>
              ) : null}
            </div>
          ) : videoSource === 'direct' ? (
            <video
              key={embedUrl}
              className='bg-background aspect-video h-auto w-full object-contain'
              controls
              autoPlay
              playsInline
              preload='metadata'
              src={embedUrl}
              onError={handleVideoError}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <iframe
              className='bg-background aspect-video h-auto w-full'
              src={embedUrl}
              title={title || 'Video preview'}
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
              allowFullScreen
            />
          )}
        </div>

        <div className='border-border border-t px-6 py-4'>
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            <Play className='text-primary size-4' />
            <span>Preview mode opens the video in a lightweight player.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

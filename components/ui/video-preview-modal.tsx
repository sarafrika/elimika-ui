'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertCircle, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';

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

/** The player itself: an embed, a native video, or the "no playable preview" notice. */
export function VideoPreviewPlayer({
  active,
  title,
  videoUrl,
  emptyMessage = 'This item does not have a video preview attached.',
}: {
  /** Resolve the source only while the surrounding overlay is open. */
  active: boolean;
  title?: string;
  videoUrl?: string | null;
  emptyMessage?: string;
}) {
  const [videoSource, setVideoSource] = useState<VideoSource>('unsupported');
  const [embedUrl, setEmbedUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;

    const result = getVideoSource(videoUrl);
    setVideoSource(result.source);
    setEmbedUrl(result.url);
    setError(result.error);
  }, [active, videoUrl]);

  const handleVideoError = () => {
    setVideoSource('unsupported');
    setError('This video could not be played. The format or source may not be supported.');
  };

  const hasError = Boolean(error) || videoSource === 'unsupported';

  if (hasError) {
    return (
      <div className='flex aspect-video w-full flex-col items-center justify-center gap-3 px-6 text-center'>
        <div className='inline-flex size-14 items-center justify-center rounded-full bg-white/10 text-white/80'>
          <AlertCircle className='size-7' />
        </div>
        <div className='space-y-1'>
          <p className='text-base font-semibold text-white/95'>No playable preview</p>
          <p className='max-w-md text-sm text-white/65'>{error || emptyMessage}</p>
        </div>
      </div>
    );
  }

  if (videoSource === 'direct') {
    return (
      <video
        key={embedUrl}
        className='aspect-video h-auto w-full bg-black/90 object-contain'
        controls
        autoPlay
        playsInline
        preload='metadata'
        src={embedUrl}
        onError={handleVideoError}
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  return (
    <iframe
      className='aspect-video h-auto w-full bg-black/90'
      src={embedUrl}
      title={title || 'Video preview'}
      allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
      allowFullScreen
    />
  );
}

/**
 * A pop-up video player: the video centred over a dimmed page, like a lightbox. The page
 * stays where it was; Esc, the close button or a click on the backdrop closes it.
 */
export function VideoPreviewModal({
  open,
  onOpenChange,
  title,
  description,
  videoUrl,
  emptyMessage,
}: VideoPreviewModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/85 backdrop-blur-sm' />
        <DialogPrimitive.Content className='data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 flex w-[min(92vw,calc(82vh*16/9),1600px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 outline-none'>
          <div className='flex items-center gap-3'>
            <DialogPrimitive.Title className='min-w-0 flex-1 truncate text-base font-semibold text-white/95'>
              {title || 'Video'}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label='Close video'
              className='inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none'
            >
              <XIcon className='size-5' />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className='sr-only'>
            {description || 'Video player.'}
          </DialogPrimitive.Description>
          <div className='overflow-hidden rounded-2xl bg-black/60 shadow-2xl ring-1 ring-white/10'>
            <VideoPreviewPlayer
              active={open}
              title={title}
              videoUrl={videoUrl}
              emptyMessage={emptyMessage}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

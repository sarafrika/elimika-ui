'use client';

import * as React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type LoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface AvatarWithSkeletonProps {
  src: string;
  alt?: string;
  fallback?: string;
  name?: string;
  className?: string;
}

function initials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2);
}

function AvatarWithSkeleton({ src, alt, fallback, name, className }: AvatarWithSkeletonProps) {
  const [status, setStatus] = React.useState<LoadingStatus>('loading');

  const altText = alt ?? name ?? 'User avatar';
  const fallbackText = fallback ?? (name ? initials(name) : altText.slice(0, 2));

  return (
    <Avatar className={cn('relative shrink-0', className)}>
      {status === 'loading' && (
        <Skeleton className='absolute inset-0 z-10 rounded-full' aria-hidden='true' />
      )}
      <AvatarImage
        src={src}
        alt={altText}
        onLoadingStatusChange={setStatus}
        className={cn(
          'aspect-square h-full w-full transition-opacity duration-300',
          status === 'loaded' ? 'opacity-100' : 'opacity-0'
        )}
      />
      <AvatarFallback
        className='bg-primary/10 text-primary text-xs font-semibold'
        aria-label={`Avatar for ${altText}`}
      >
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  );
}

export { AvatarWithSkeleton };

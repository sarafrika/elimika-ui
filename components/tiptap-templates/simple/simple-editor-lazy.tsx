'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { SimpleEditorProps } from './simple-editor';

/**
 * Lazy-loaded SimpleEditor. Import this instead of `./simple-editor` so the
 * tiptap packages stay out of the route's first-load bundle and only download
 * when an editor actually mounts.
 */
export const SimpleEditor = dynamic<SimpleEditorProps>(
  () => import('./simple-editor').then(m => ({ default: m.SimpleEditor })),
  {
    ssr: false,
    loading: () => <Skeleton className='h-40 w-full rounded-md' />,
  }
);

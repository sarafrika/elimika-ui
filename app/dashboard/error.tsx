'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // biome-ignore lint/suspicious/noConsole: surface dev-only stack from the error boundary
      console.error('[dashboard] error boundary caught:', error);
    }
  }, [error]);

  return (
    <div className='bg-background flex min-h-[60vh] w-full items-center justify-center p-6'>
      <EmptyState
        icon={AlertTriangle}
        title='Something went wrong loading your dashboard'
        description='This is usually transient. Try again, or head back to the homepage if the issue persists.'
        action={
          <div className='flex flex-wrap items-center justify-center gap-2'>
            <Button onClick={reset} variant='default'>
              <RotateCcw className='h-4 w-4' />
              Try again
            </Button>
            <Button asChild variant='outline'>
              <a href='/'>Go home</a>
            </Button>
          </div>
        }
      />
    </div>
  );
}

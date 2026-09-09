'use client';

import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

/**
 * Catches throws from segment layouts, which a segment's own error.tsx does not.
 * Without this a failure in the dashboard layout escaped to a bare 500 with no
 * markup — the browser's own error page rather than ours.
 */
export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  return (
    <main className='flex min-h-screen items-center justify-center p-6'>
      <div className='bg-card border-border w-full max-w-md rounded-lg border p-8 text-center'>
        <div className='bg-destructive/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full'>
          <AlertTriangle className='text-destructive h-5 w-5' aria-hidden />
        </div>
        <h1 className='text-foreground mt-5 text-lg font-semibold'>Something went wrong</h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          {error.message || 'This page could not be loaded.'}
        </p>
        <div className='mt-6 flex justify-center gap-2'>
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant='outline' onClick={() => router.push('/')}>
            Go home
          </Button>
        </div>
      </div>
    </main>
  );
}

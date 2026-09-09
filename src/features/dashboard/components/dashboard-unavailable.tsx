'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

/**
 * Shown when the dashboard could not read who you are.
 *
 * The state exists so a slow or failing `/me` stops presenting itself as a
 * logout. You are still signed in; only this render lacked an answer.
 */
export function DashboardUnavailable() {
  const router = useRouter();

  return (
    <main className='flex min-h-screen items-center justify-center p-6'>
      <div className='bg-card border-border w-full max-w-md rounded-lg border p-8 text-center'>
        <div className='bg-muted mx-auto flex h-12 w-12 items-center justify-center rounded-full'>
          <RefreshCw className='text-muted-foreground h-5 w-5' aria-hidden />
        </div>
        <h1 className='text-foreground mt-5 text-lg font-semibold'>
          We couldn&apos;t load your workspace
        </h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          Your session is still valid — we just couldn&apos;t reach your profile. Try again in a
          moment.
        </p>
        <Button className='mt-6' onClick={() => router.refresh()}>
          Try again
        </Button>
      </div>
    </main>
  );
}

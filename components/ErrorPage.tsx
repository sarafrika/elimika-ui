'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

interface ErrorPageProps {
  message: string;
  details?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function ErrorPage({
  message,
  details,
  actionLabel = 'Go Home',
  onAction,
}: ErrorPageProps) {
  const router = useRouter();
  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      router.push('/');
    }
  };

  return (
    <main
      className='flex h-full w-full flex-1 items-center justify-center bg-secondary/60 dark:bg-background'
      role='main'
      aria-label='Error page'
    >
      <section className='flex w-full max-w-md flex-col items-center rounded-xl bg-card p-8 shadow-lg shadow-primary/10 dark:bg-card/90'>
        <div className='mb-4 animate-bounce text-5xl' aria-hidden='true'>
          <span role='img' aria-label='Error'>
            ❌
          </span>
        </div>
        <h2 className='mb-2 text-2xl font-extrabold text-foreground'>
          An Error Occurred
        </h2>
        <p className='mb-2 text-center text-muted-foreground'>{message}</p>
        {details && (
          <pre
            className='mb-2 w-full overflow-x-auto rounded bg-destructive/10 p-2 text-xs text-destructive dark:bg-background'
            aria-label='Error details'
          >
            {details}
          </pre>
        )}
        <button
          onClick={handleAction}
          className='mt-4 rounded-lg bg-destructive px-6 py-2 font-semibold text-destructive-foreground shadow transition-colors hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive/40'
          autoFocus
        >
          {actionLabel}
        </button>
      </section>
    </main>
  );
}

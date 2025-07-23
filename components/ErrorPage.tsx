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
      className='flex h-full w-full flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900'
      role='main'
      aria-label='Error page'
    >
      <section className='flex w-full max-w-md flex-col items-center rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800'>
        <div className='mb-4 animate-bounce text-5xl' aria-hidden='true'>
          <span role='img' aria-label='Error'>
            ❌
          </span>
        </div>
        <h2 className='mb-2 text-2xl font-extrabold text-gray-800 dark:text-gray-100'>
          An Error Occurred
        </h2>
        <p className='mb-2 text-center text-gray-600 dark:text-gray-300'>{message}</p>
        {details && (
          <pre
            className='mb-2 w-full overflow-x-auto rounded bg-red-50 p-2 text-xs text-red-400 dark:bg-gray-900'
            aria-label='Error details'
          >
            {details}
          </pre>
        )}
        <button
          onClick={handleAction}
          className='mt-4 rounded-lg bg-red-500 px-6 py-2 font-semibold text-white shadow transition-colors hover:bg-red-600 focus:ring-2 focus:ring-red-400 focus:outline-none'
          autoFocus
        >
          {actionLabel}
        </button>
      </section>
    </main>
  );
}

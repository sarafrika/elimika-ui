'use client';
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <div className='flex h-screen w-screen items-center justify-center bg-background'>
          <div className='flex flex-col items-center rounded bg-card p-8 shadow-md shadow-primary/10'>
            <div className='mb-4 text-4xl text-destructive'>❌</div>
            <h1 className='mb-2 text-2xl font-bold text-foreground'>
              An Error Occurred
            </h1>
            <p className='text-muted-foreground'>{error.message}</p>
            <button
              onClick={() => reset()}
              className='mt-4 rounded bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90'
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

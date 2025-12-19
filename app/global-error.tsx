'use client';
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <div className='bg-background flex h-screen w-screen items-center justify-center'>
          <div className='bg-card shadow-primary/10 flex flex-col items-center rounded p-8 shadow-md'>
            <div className='text-destructive mb-4 text-4xl'>❌</div>
            <h1 className='text-foreground mb-2 text-2xl font-bold'>An Error Occurred</h1>
            <p className='text-muted-foreground'>{error.message}</p>
            <button
              onClick={() => reset()}
              className='bg-primary text-primary-foreground hover:bg-primary/90 mt-4 rounded px-4 py-2 transition-colors'
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

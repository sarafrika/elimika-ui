'use client';
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <div className='flex h-screen w-screen items-center justify-center'>
          <div className='flex flex-col items-center rounded bg-white p-8 shadow-md dark:bg-gray-800'>
            <div className='mb-4 text-4xl text-red-500'>❌</div>
            <h1 className='mb-2 text-2xl font-bold text-gray-800 dark:text-gray-100'>
              An Error Occurred
            </h1>
            <p className='text-gray-600 dark:text-gray-300'>{error.message}</p>
            <button
              onClick={() => reset()}
              className='mt-4 rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600'
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

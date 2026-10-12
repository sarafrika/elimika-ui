import { Skeleton } from '@/components/ui/skeleton';

/** Shaped like Add Profile: intro card, role cards, manage actions. */
export default function AddProfileLoading() {
  return (
    <div
      className='bg-background flex min-h-screen items-center justify-center p-4'
      role='status'
      aria-label='Loading profiles'
    >
      <span className='sr-only'>Loading profiles…</span>
      <div className='w-full max-w-6xl space-y-8'>
        <div className='border-border/60 bg-card/90 flex flex-col items-center gap-2 rounded-3xl border px-6 py-5'>
          <Skeleton className='h-8 w-56' />
          <Skeleton className='h-4 w-80 max-w-full' />
        </div>
        <div className='mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className='border-border bg-card space-y-4 rounded-3xl border p-6'>
              <Skeleton className='mx-auto size-16 rounded-full' />
              <Skeleton className='mx-auto h-6 w-40' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-5/6' />
              <Skeleton className='h-10 w-full rounded-full' />
            </div>
          ))}
        </div>
        <Skeleton className='mx-auto h-4 w-72 max-w-full' />
      </div>
    </div>
  );
}

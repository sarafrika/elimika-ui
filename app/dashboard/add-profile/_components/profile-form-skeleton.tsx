import { Skeleton } from '@/components/ui/skeleton';

/** Shaped like the add-profile forms: back link, heading, then a card of fields. */
export function ProfileFormSkeleton({ label }: { label: string }) {
  return (
    <div className='bg-background min-h-screen py-8' role='status' aria-label={label}>
      <span className='sr-only'>{label}</span>
      <div className='mx-auto max-w-2xl space-y-6 p-6'>
        <Skeleton className='h-8 w-24' />
        <div className='flex flex-col items-center gap-3'>
          <Skeleton className='size-16 rounded-full' />
          <Skeleton className='h-8 w-64 max-w-full' />
          <Skeleton className='h-4 w-80 max-w-full' />
        </div>
        <div className='border-border/60 bg-card/70 space-y-5 rounded-3xl border p-6 shadow-sm'>
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className='space-y-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-10 w-full' />
            </div>
          ))}
          <Skeleton className='h-10 w-full rounded-full' />
        </div>
      </div>
    </div>
  );
}

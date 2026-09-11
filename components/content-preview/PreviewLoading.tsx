import { Skeleton } from '@/components/ui/skeleton';
import Spinner from '@/components/ui/spinner';

export function PreviewLoading({ title = 'file' }: { title?: string }) {
  return (
    <div
      role='status'
      aria-live='polite'
      className='bg-background flex min-h-[360px] w-full flex-col items-center justify-center gap-6 rounded-2xl border border-dashed p-6'
    >
      <div aria-hidden='true' className='w-full max-w-sm space-y-3'>
        <Skeleton className='h-5 w-2/3' />
        <Skeleton className='h-32 w-full' />
        <Skeleton className='h-3 w-full' />
        <Skeleton className='h-3 w-4/5' />
      </div>
      <div className='text-muted-foreground flex items-center gap-2 text-sm'>
        <Spinner aria-hidden='true' className='shrink-0' />
        <span className='break-words'>Loading {title} preview…</span>
      </div>
    </div>
  );
}

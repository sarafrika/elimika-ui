import { Skeleton } from '@/components/ui/skeleton';

export default function RubricsLoading() {
  return (
    <div className='space-y-4' aria-label='Loading rubrics'>
      <Skeleton className='h-24 w-full' />
      <Skeleton className='h-12 w-full' />
      <Skeleton className='h-80 w-full' />
    </div>
  );
}

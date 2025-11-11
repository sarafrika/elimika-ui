import { Skeleton } from '@/components/ui/skeleton';

const PageLoader = () => {
  return (
    <div className='col-span-full w-full space-y-4 py-6'>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className='space-y-2'>
          <Skeleton className='h-4 w-1/3' />
          <Skeleton className='h-6 w-full' />
        </div>
      ))}
    </div>
  );
};

export default PageLoader;

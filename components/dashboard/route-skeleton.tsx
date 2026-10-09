import { Skeleton } from '@/components/ui/skeleton';

export type RouteSkeletonVariant = 'overview' | 'list' | 'detail' | 'form' | 'calendar';

type RouteSkeletonProps = {
  variant?: RouteSkeletonVariant;
  label?: string;
};

function HeaderSkeleton() {
  return (
    <div className='space-y-2'>
      <Skeleton className='h-8 w-56 max-w-full' />
      <Skeleton className='h-4 w-80 max-w-full' />
    </div>
  );
}

function OverviewBody() {
  return (
    <>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='h-28 rounded-xl' />
        ))}
      </div>
      <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]'>
        <Skeleton className='h-72 rounded-xl' />
        <Skeleton className='h-72 rounded-xl' />
      </div>
    </>
  );
}

function ListBody() {
  return (
    <>
      <Skeleton className='h-12 w-full rounded-xl' />
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className='h-48 rounded-xl' />
        ))}
      </div>
    </>
  );
}

function DetailBody() {
  return (
    <>
      <Skeleton className='h-48 w-full rounded-xl' />
      <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]'>
        <div className='space-y-4'>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className='h-32 w-full rounded-xl' />
          ))}
        </div>
        <Skeleton className='h-80 w-full rounded-xl' />
      </div>
    </>
  );
}

function FormBody() {
  return (
    <div className='bg-card max-w-3xl space-y-5 rounded-xl border p-5'>
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className='space-y-2'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-10 w-full rounded-lg' />
        </div>
      ))}
      <Skeleton className='h-10 w-32 rounded-lg' />
    </div>
  );
}

function CalendarBody() {
  return (
    <>
      <Skeleton className='h-12 w-full rounded-xl' />
      <div className='grid grid-cols-7 gap-2'>
        {Array.from({ length: 35 }, (_, index) => (
          <Skeleton key={index} className='h-20 rounded-lg' />
        ))}
      </div>
    </>
  );
}

const BODIES: Record<RouteSkeletonVariant, () => React.JSX.Element> = {
  overview: OverviewBody,
  list: ListBody,
  detail: DetailBody,
  form: FormBody,
  calendar: CalendarBody,
};

/** Route-level loading shell so navigation paints instantly while the page streams in. */
export function RouteSkeleton({ variant = 'list', label = 'Loading page' }: RouteSkeletonProps) {
  const Body = BODIES[variant];
  return (
    <div className='space-y-6 px-4 py-6 sm:px-5 lg:px-6' aria-busy='true' aria-label={label}>
      <HeaderSkeleton />
      <Body />
    </div>
  );
}

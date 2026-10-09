import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

/** Shaped like the cart: heading, item list, sticky order summary. */
export default function CartLoading() {
  return (
    <div className='bg-background text-foreground h-auto' role='status' aria-label='Loading cart'>
      <span className='sr-only'>Loading cart…</span>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:py-16'>
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <Skeleton className='h-9 w-56' />
            <Skeleton className='h-4 w-72 max-w-full' />
          </div>
          <Skeleton className='hidden h-4 w-36 sm:block' />
        </div>
        <div className='grid gap-6 lg:grid-cols-3'>
          <div className='space-y-4 lg:col-span-2'>
            <Card className='border-border bg-card rounded-[28px] border shadow-lg'>
              <CardHeader>
                <Skeleton className='h-6 w-40' />
              </CardHeader>
              <CardContent className='space-y-6'>
                {[0, 1, 2].map(item => (
                  <div key={item} className='flex gap-4'>
                    <Skeleton className='h-24 w-32 shrink-0 rounded-2xl' />
                    <div className='flex-1 space-y-3'>
                      <Skeleton className='h-5 w-3/4' />
                      <div className='flex items-center justify-between'>
                        <Skeleton className='h-4 w-16' />
                        <Skeleton className='h-6 w-24' />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className='lg:col-span-1'>
            <Card className='border-border bg-card rounded-[28px] border shadow-xl'>
              <CardHeader>
                <Skeleton className='h-6 w-36' />
              </CardHeader>
              <CardContent className='space-y-4'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-2/3' />
                <Separator className='bg-border' />
                <Skeleton className='h-8 w-full' />
                <Skeleton className='h-11 w-full rounded-full' />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ParentDashboardSkeleton() {
  return (
    <div className='space-y-4'>
      <Card className='border-border/70'>
        <CardHeader className='space-y-4'>
          <Skeleton className='h-6 w-1/2' />
          <Skeleton className='h-4 w-2/3' />
          <Skeleton className='h-10 w-full rounded-xl' />
        </CardHeader>
      </Card>
      <div className='grid gap-4 lg:grid-cols-[2fr,1fr]'>
        <Card className='border-border/70'>
          <CardContent className='space-y-4 pt-6'>
            <Skeleton className='h-5 w-1/3' />
            <div className='grid gap-4 md:grid-cols-2'>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className='h-32 rounded-2xl' />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className='border-border/70'>
          <CardContent className='space-y-4 pt-6'>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className='h-16 rounded-2xl' />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

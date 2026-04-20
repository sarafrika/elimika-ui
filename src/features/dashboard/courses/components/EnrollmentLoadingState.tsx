'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function EnrollmentLoadingState({
  title = 'Getting class details ready',
  description = 'We are pulling together the schedule, pricing, and enrollment details for you.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className='flex min-h-[420px] items-center justify-center px-4 py-10'>
      <Card className='w-full max-w-xl border-dashed shadow-sm'>
        <CardContent className='flex flex-col items-center gap-4 px-6 py-10 text-center sm:px-10'>
          <div className='bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full'>
            <Loader2 className='h-8 w-8 animate-spin' />
          </div>

          <div className='space-y-2'>
            <h2 className='text-xl font-semibold'>{title}</h2>
            <p className='text-muted-foreground text-sm leading-6'>{description}</p>
          </div>

          <div className='bg-muted flex items-center gap-2 rounded-full px-4 py-2 text-sm'>
            <span className='bg-primary h-2.5 w-2.5 animate-pulse rounded-full' />
            <span className='text-muted-foreground'>Loading enrollment workspace...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

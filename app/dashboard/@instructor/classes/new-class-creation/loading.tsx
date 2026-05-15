'use client';

import { Card } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className='bg-background min-h-screen px-3 py-4 sm:px-4 sm:py-6 lg:px-6'>
      <div className='mx-auto max-w-[1560px] animate-pulse space-y-6'>
        <div className='flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='space-y-2'>
            <div className='bg-muted h-9 w-64 rounded-md' />
            <div className='bg-muted h-4 w-48 rounded-md' />
          </div>
          <div className='flex gap-3'>
            <div className='bg-muted h-11 w-32 rounded-md' />
            <div className='bg-muted h-11 w-32 rounded-md' />
          </div>
        </div>
        <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]'>
          <div className='space-y-4'>
            <Card className='bg-muted h-[28rem] rounded-md' />
            <Card className='bg-muted h-[22rem] rounded-md' />
            <Card className='bg-muted h-28 rounded-md' />
          </div>
          <div className='space-y-4'>
            <Card className='bg-muted h-[32rem] rounded-md' />
            <Card className='bg-muted h-32 rounded-md' />
            <Card className='bg-muted h-32 rounded-md' />
          </div>
        </div>
      </div>
    </div>
  );
}

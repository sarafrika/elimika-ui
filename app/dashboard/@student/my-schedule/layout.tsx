'use client';

import { Separator } from '@/components/ui/separator';

interface ScheduleLayoutProps {
  children: React.ReactNode;
}

export default function ScheduleLayout({ children }: ScheduleLayoutProps) {
  return (
    <div className='space-y-8 p-4 pb-16 md:p-10'>
      <div className='flex w-full items-center justify-between lg:max-w-[75%]'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>My Schedule</h2>
          <p className='mt-1 text-muted-foreground'>
            View your upcoming classes, sessions, and important dates. Stay on top of your learning
            schedule and never miss a session.
          </p>
        </div>
      </div>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='flex-1 lg:max-w-5xl'>{children}</div>
      </div>
    </div>
  );
}

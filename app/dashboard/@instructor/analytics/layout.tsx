'use client';

import { Separator } from '@/components/ui/separator';

interface AnalyticsLayoutProps {
  children: React.ReactNode;
}

export default function AnalyticsLayout({ children }: AnalyticsLayoutProps) {
  return (
    <div className='space-y-6 p-4 pb-16 md:p-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Analytics</h2>
          <p className='text-muted-foreground'>
            Monitor your teaching performance, track student engagement, and gain insights to grow
            your impact.
          </p>
        </div>
      </div>
      <Separator />
      <div className='flex w-full flex-col items-center justify-center space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='flex-1 lg:max-w-6xl'>{children}</div>
      </div>
    </div>
  );
}

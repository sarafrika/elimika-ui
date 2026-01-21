'use client';

import { Separator } from '@/components/ui/separator';

interface OpportunitiesLayoutProps {
  children: React.ReactNode;
}

export default function OpportunitiesLayout({ children }: OpportunitiesLayoutProps) {
  return (
    <div className='space-y-6 p-4 pb-16 md:p-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Opportunities</h2>
          <p className='text-muted-foreground'>
            Discover and apply for jobs, apprenticeships, and attachments to grow your career and
            gain real-world experience.
          </p>
        </div>
      </div>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='flex-1 w-full'>{children}</div>
      </div>
    </div>
  );
}

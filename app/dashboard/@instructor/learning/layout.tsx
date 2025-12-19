'use client';

import { Separator } from '@/components/ui/separator';

interface LearningLayoutProps {
  children: React.ReactNode;
}

export default function LearningLayout({ children }: LearningLayoutProps) {
  return (
    <div className='space-y-6 p-4 pb-16 md:p-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Manage Your Learnings</h2>
          <p className='text-muted-foreground'>
            Explore and enroll in additional courses to grow your skills and advance your
            qualifications.
          </p>
        </div>
      </div>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='mx-auto max-w-7xl flex-1'>{children}</div>
      </div>
    </div>
  );
}

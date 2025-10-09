'use client';

import { Separator } from '@/components/ui/separator';

interface ApplyToTrainLayoutProps {
  children: React.ReactNode;
}

export default function ApplyToTrainLayout({ children }: ApplyToTrainLayoutProps) {
  return (
    <div className='space-y-6 p-4 pb-16 md:p-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Apply to Train a Course
          </h2>
          <p className='text-muted-foreground'>
            Submit your application to become a course trainer.
          </p>
        </div>
      </div>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='flex-1 lg:max-w-6xl'>{children}</div>
      </div>
    </div>
  );
}

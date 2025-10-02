'use client';

import { Separator } from '@/components/ui/separator';

interface TrainingLayoutProps {
  children: React.ReactNode;
}

export default function TrainingLayout({ children }: TrainingLayoutProps) {
  return (
    <div className='space-y-8 p-4 pb-16 md:p-10'>
      <div className='flex w-full items-center justify-between lg:max-w-[75%]'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Manage Classes</h2>
          <p className='text-muted-foreground'>
            Create and organize classes quickly with customizable details. Track student enrollment,
            attendance, and schedules all in one place. Easily update class information and manage
            materials to keep everything running smoothly and efficiently.
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

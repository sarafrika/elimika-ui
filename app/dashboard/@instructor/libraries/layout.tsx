'use client';

import { Separator } from '@/components/ui/separator';

interface LibrariesLayoutProps {
  children: React.ReactNode;
}

export default function LibrariesLayout({ children }: LibrariesLayoutProps) {
  return (
    <div className='space-y-6 p-4 pb-16 md:p-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Libraries</h2>
          <p className='text-muted-foreground'>
            Access and manage your teaching materials, resources, and content all in one place.
          </p>
        </div>
      </div>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='flex-1 lg:max-w-4xl'>{children}</div>
      </div>
    </div>
  );
}

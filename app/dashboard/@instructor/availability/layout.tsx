'use client';

import { Separator } from '@/components/ui/separator';

interface AvailabilityLayoutProps {
  children: React.ReactNode;
}

export default function AvailabilityLayout({ children }: AvailabilityLayoutProps) {
  return (
    <div className='space-y-6 p-4 pb-16 md:p-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Availability</h2>
          <p className="text-muted-foreground">
            Set your availability to take on more classes. Create, edit, and manage your schedule so students and admins know when you&apos;re open to teach.
          </p>
        </div>
      </div>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='flex-1 lg:max-w-7xl'>{children}</div>
      </div>
    </div>
  );
}

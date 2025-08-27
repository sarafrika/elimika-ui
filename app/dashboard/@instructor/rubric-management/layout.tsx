'use client';

import { Separator } from '@/components/ui/separator';

interface RubricManagementLayoutProps {
  children: React.ReactNode;
}

export default function RubricManagementLayout({ children }: RubricManagementLayoutProps) {
  return (
    <div className='space-y-6 p-4 pb-16 md:p-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Manage Rubrics</h2>
          <p className='text-muted-foreground'>
            Define clear assessment criteria, provide consistent and objective grading, and deliver
            actionable feedback to students — all in one place.
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

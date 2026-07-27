'use client';

import { Separator } from '@/components/ui/separator';

interface RubricManagementLayoutProps {
  children: React.ReactNode;
}

export default function RubricManagementLayout({ children }: RubricManagementLayoutProps) {
  return (
    <div className='space-y-6 px-4 py-10'>
      <header className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Manage Rubrics</h1>
          <p className='text-muted-foreground mt-2 max-w-2xl text-sm'>
            Define clear assessment criteria, provide consistent and objective grading, and deliver
            actionable feedback to students — all in one place.
          </p>
        </div>
      </header>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='mx-auto flex-1 lg:max-w-6xl'>{children}</div>
      </div>
    </div>
  );
}

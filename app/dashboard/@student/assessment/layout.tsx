'use client';

import { Separator } from '@/components/ui/separator';

interface AssessmentLayoutProps {
  children: React.ReactNode;
}

export default function AssessmentLayout({ children }: AssessmentLayoutProps) {
  return (
    <div className='space-y-6 p-4 pb-16 md:p-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-foreground text-2xl font-bold'>Assessment Grades</h1>
          <p className='text-muted-foreground text-sm'>
            Review assessment results, track performance, and gain insights into scores and progress
            across evaluations.
          </p>
        </div>
      </div>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='w-full flex-1'>{children}</div>
      </div>
    </div>
  );
}

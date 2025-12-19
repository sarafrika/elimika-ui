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
          <h2 className='text-2xl font-bold tracking-tight'>Manage Assessments</h2>
          <p className='text-muted-foreground'>
            Oversee all student assessments including assignments, quizzes, and exams.
          </p>
        </div>
      </div>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <div className='mx-auto flex-1 lg:max-w-7xl'>{children}</div>
      </div>
    </div>
  );
}

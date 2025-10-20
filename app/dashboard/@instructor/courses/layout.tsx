'use client';

import { Separator } from '@/components/ui/separator';

interface CourseManagementLayoutProps {
  children: React.ReactNode;
}



export default function CourseManagementLayout({ children }: CourseManagementLayoutProps) {
  return (
    <div className='space-y-6 p-4 pb-16 md:py-10'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Assigned Courses</h2>
          <p className='text-muted-foreground'>Review the courses you have been authorised to deliver.</p>
        </div>
      </div>
      <Separator />
      <div className='flex flex-col space-y-8 lg:flex-col lg:space-y-0 lg:space-x-6'>
        <div className='flex-1 lg:max-w-6xl'>{children}</div>
      </div>
    </div>
  );
}

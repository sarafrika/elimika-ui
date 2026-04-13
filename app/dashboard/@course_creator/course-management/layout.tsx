'use client';

import { BookOpen, GraduationCap } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CourseManagementLayoutProps {
  children: React.ReactNode;
}

export default function CourseManagementLayout({ children }: CourseManagementLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Get current type (courses or programs) from URL
  const currentType = searchParams.get('type') || 'courses';

  // Handle type change (courses/programs)
  const handleTypeChange = (type: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('type', type);
    router.push(`/dashboard/course-management/all?${params.toString()}`);
  };

  return (
    <div className='space-y-6 p-4 pb-16 md:py-10'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          {currentType === 'courses' ? (
            <h2 className='text-[22px] font-bold tracking-tight'>Course Management</h2>
          ) : (
            <h2 className='text-[22px] font-bold tracking-tight'>Training Programs</h2>
          )}

          {currentType === 'courses' ? (
            <p className='text-muted-foreground text-[14px]'>
              Manage your course drafts and published content.
            </p>
          ) : (
            <p className='text-muted-foreground text-[14px]'>
              Bundle courses together to create certificate, diploma or degree training programs
            </p>
          )}
        </div>

        {/* Courses/Programs Toggle */}
        <Tabs value={currentType} onValueChange={handleTypeChange} className='w-fit'>
          <TabsList className='bg-muted grid w-full grid-cols-2'>
            <TabsTrigger
              value='courses'
              className='data-[state=active]:bg-background flex items-center gap-2'
            >
              <BookOpen className='h-4 w-4' />
              <span>Courses</span>
            </TabsTrigger>

            <TabsTrigger
              value='programs'
              className='data-[state=active]:bg-background flex items-center gap-2'
            >
              <GraduationCap className='h-4 w-4' />
              <span>Programs</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator />

      <div className='w-full'>{children}</div>
    </div>
  );
}

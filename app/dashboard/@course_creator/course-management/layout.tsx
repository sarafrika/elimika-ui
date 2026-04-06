'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { BookOpen, GraduationCap } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface CourseManagementLayoutProps {
  children: React.ReactNode;
}

const statusFilters = [
  { label: 'All', value: 'all' },
  { label: 'Drafts', value: 'drafts' },
  { label: 'Published', value: 'published' },
];

export default function CourseManagementLayout({ children }: CourseManagementLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current type (courses or programs) from URL
  const currentType = searchParams.get('type') || 'courses';

  // Get current status filter from pathname
  const getStatusFromPath = () => {
    if (pathname.includes('/drafts')) return 'drafts';
    if (pathname.includes('/published')) return 'published';
    return 'all';
  };
  const currentStatus = getStatusFromPath();

  const hideNav = pathname.startsWith('/dashboard/course-management/create-new-course');

  // Handle type change (courses/programs)
  const handleTypeChange = (type: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('type', type);

    // Preserve the current status filter in the URL
    const basePath = pathname.split('/').slice(0, -1).join('/');
    const statusPath = currentStatus === 'all' ? '/all' : `/${currentStatus}`;
    router.push(`${basePath}${statusPath}?${params.toString()}`);
  };

  // Handle status filter change
  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (currentType) {
      params.set('type', currentType);
    }

    const basePath = '/dashboard/course-management';
    const statusPath = status === 'all' ? '/all' : `/${status}`;
    router.push(`${basePath}${statusPath}?${params.toString()}`);
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

      {/* Status Filters */}
      <div className='flex flex-col space-y-8 lg:flex-col lg:space-y-0 lg:space-x-6'>
        <div className='lg:auto w-full flex-1'>
          {currentType === 'courses' && (
            <div className='mx-auto max-w-6xl'>
              {!hideNav && (
                <div className='bg-muted/50 mb-6 flex w-full max-w-2xl flex-wrap gap-2 rounded-xl p-2 sm:gap-3'>
                  {statusFilters.map(filter => {
                    const isActive = currentStatus === filter.value;

                    return (
                      <Button
                        key={filter.value}
                        onClick={() => handleStatusChange(filter.value)}
                        variant='ghost'
                        className={cn(
                          'flex-1 rounded-lg transition-colors sm:min-w-[120px] sm:flex-none',
                          'hover:bg-muted bg-transparent',
                          'text-muted-foreground px-4 py-2 text-sm sm:px-5',
                          isActive &&
                            'bg-primary text-primary-foreground hover:bg-primary shadow-sm'
                        )}
                      >
                        {filter.label}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}

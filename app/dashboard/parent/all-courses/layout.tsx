'use client';

import { surfaceTheme } from '@/components/data-display/page-shell';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface CoursesLayoutProps {
  children: React.ReactNode;
}

export default function CoursesLayout({ children }: CoursesLayoutProps) {
  return (
    <div className={cn(surfaceTheme.pageWide, 'space-y-8 py-6 pb-16 md:py-10')}>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Browse Courses and Programs</h2>
        <p className='text-muted-foreground mt-1 max-w-prose'>
          Discover and Enroll to courses and programs across various categories.
        </p>
      </div>
      <Separator />
      <div className='min-w-0'>{children}</div>
    </div>
  );
}

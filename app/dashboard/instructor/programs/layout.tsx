'use client';

import { surfaceTheme } from '@/components/data-display/page-shell';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ProgramManagementLayoutProps {
  children: React.ReactNode;
}

export default function ProgramManagementLayout({ children }: ProgramManagementLayoutProps) {
  return (
    <div className={cn(surfaceTheme.pageWide, 'space-y-6 py-4 pb-16 md:py-10')}>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Manage Programs</h2>
          <p className='text-muted-foreground'>
            Create, edit, schedule, track, and communicate with students to effectively manage all
            aspects of your programs.
          </p>
        </div>
      </div>
      <Separator />
      <div className='min-w-0'>{children}</div>
    </div>
  );
}

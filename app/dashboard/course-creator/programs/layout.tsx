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
          <h2 className='text-[22px] font-bold tracking-tight'>Training Programs</h2>
          <p className='text-muted-foreground text-[14px]'>
            Bundle courses together to create certificate, diploma or degree training programs
          </p>
        </div>
      </div>
      <Separator />
      <div className='mb-10 flex min-w-0 flex-col'>{children}</div>
    </div>
  );
}

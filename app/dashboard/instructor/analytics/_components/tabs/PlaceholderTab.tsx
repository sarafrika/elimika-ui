'use client';

import { BarChart2 } from 'lucide-react';

interface PlaceholderTabProps {
  tabName: string;
}

export function PlaceholderTab({ tabName }: PlaceholderTabProps) {
  return (
    <div className='bg-card border-border flex min-h-[300px] flex-col items-center justify-center rounded-xl border p-8 text-center shadow-sm sm:p-12'>
      <div className='bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
        <BarChart2 className='text-primary h-6 w-6' />
      </div>

      <h2 className='text-foreground mb-2 text-base font-semibold sm:text-lg'>{tabName}</h2>

      <p className='text-muted-foreground max-w-xs text-sm'>
        This report section is under construction. Check back soon for detailed analytics.
      </p>
    </div>
  );
}

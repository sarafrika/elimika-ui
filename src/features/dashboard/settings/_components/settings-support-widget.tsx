'use client';

import { cn } from '@/lib/utils';
import { Headset } from 'lucide-react';
import Link from 'next/link';

type SettingsSupportWidgetProps = {
  href: string;
  className?: string;
};

export function SettingsSupportWidget({
  href,
  className,
}: SettingsSupportWidgetProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        'block rounded-[10px] border border-sidebar-border/70 p-2 shadow-sm transition-colors',
        'group-data-[collapsible=icon]:hidden bg-muted/60 hover:bg-muted',
        className
      )}
    >
      <div className='flex items-start gap-2'>
        <div className='flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted'>
          <Headset className='size-5' />
        </div>

        <div className='min-w-0 flex-1'>
          <p className='text-sm font-semibold leading-tight'>Need Help?</p>

          <p className='mt-0.5 text-xs leading-5 text-muted-foreground'>
            Visit our help center.
          </p>
        </div>
      </div>
    </Link>
  );
}
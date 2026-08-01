'use client';

import { cn } from '@/lib/utils';
import { Headset } from 'lucide-react';
import Link from 'next/link';

type SettingsSupportWidgetProps = {
  href: string;
  className?: string;
};

export function SettingsSupportWidget({ href, className }: SettingsSupportWidgetProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        'hover:bg-sidebar-accent block transition-colors group-data-[collapsible=icon]:hidden',
        className
      )}
    >
      <div className='border-sidebar-border flex items-center gap-3 border-t px-3 py-3'>
        <div className='bg-sidebar-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full'>
          <span className='text-sidebar-primary-foreground text-xs font-semibold'>
            <Headset />
          </span>
        </div>

        <div className='flex min-w-0 flex-col'>
          <span className='text-sidebar-foreground truncate text-[13px] font-medium'>
            Need Help?
          </span>
          <span className='text-sidebar-foreground/70 truncate text-[11px]'>Contact Support</span>
        </div>
      </div>
    </Link>
  );
}

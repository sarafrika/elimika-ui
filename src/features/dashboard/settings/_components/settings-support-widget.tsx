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
    <div
      className={cn(
        'group-data-[collapsible=icon]:hidden overflow-hidden rounded-[12px] border border-sidebar-border/70 bg-muted/60 shadow-sm',
        className
      )}
    >
      {/* Clickable Support Section */}
      <Link
        href={href}
        prefetch={false}
        className='block p-3 transition-colors hover:bg-muted'
      >
        <div className='flex items-start gap-3'>
          <div className='flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background'>
            <Headset className='size-5' />
          </div>

          <div className='min-w-0 flex-1'>
            <p className='text-sm font-semibold leading-tight'>
              Need Help?
            </p>

            <p className='mt-0.5 text-xs leading-5 text-muted-foreground'>
              Visit our help center.
            </p>
          </div>
        </div>
      </Link>

      {/* Non-clickable Footer */}
      <div className='flex items-center justify-between border-t border-border/70 bg-background/70 px-3 py-2 text-[11px] text-muted-foreground'>
        <p>© 2026 Elimika</p>
        <p>v1.0.0</p>
      </div>
    </div>
  );
}
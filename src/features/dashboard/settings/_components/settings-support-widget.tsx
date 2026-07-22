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
        'group-data-[collapsible=icon]:hidden block rounded-md transition-colors hover:bg-sidebar-accent',
        className
      )}
    >
      <div className="flex items-center gap-3 border-t border-sidebar-border p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20">
          <span className="text-xs font-semibold text-sidebar-primary-foreground">
            <Headset />
          </span>
        </div>

        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] font-medium text-sidebar-foreground">
            Need Help?
          </span>
          <span className="truncate text-[11px] text-sidebar-foreground/70">
            Contact Support
          </span>
        </div>
      </div>
    </Link>
  );
}
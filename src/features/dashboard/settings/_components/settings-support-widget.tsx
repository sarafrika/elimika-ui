'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Headphones, MessageCircleDashed } from 'lucide-react';
import Link from 'next/link';

type SettingsSupportWidgetProps = {
  href: string;
  className?: string;
};

export function SettingsSupportWidget({ href, className }: SettingsSupportWidgetProps) {
  return (
    <div
      className={cn(
        'rounded-[12px] border border-sidebar-border/70 p-3 shadow-sm',
        'group-data-[collapsible=icon]:hidden bg-muted',
        className
      )}
    >
      <div className='flex items-start gap-3'>
        <div className='flex size-11 shrink-0 items-center justify-center rounded-full bg-muted border border-border'>
          <Headphones className='size-5' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-semibold leading-tight'>Need Help?</p>
          <p className='mt-0.5 text-xs leading-5'>
            Contact support.
          </p>
        </div>
      </div>

      <Button
        asChild
        size="sm"
        className="mt-4 h-9 w-full rounded-md border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <Link href={href} prefetch={false}>
          <MessageCircleDashed className="size-4" />
          Get Support
        </Link>
      </Button>
    </div>
  );
}

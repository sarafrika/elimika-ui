'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface UnderlineTab {
  id: string;
  label: string;
  /** Shown as a count chip, e.g. items waiting on that tab. */
  count?: number;
  href: string;
}

/**
 * The tab strip on a 360 page. Tabs are links, so the open tab lives in the URL and a
 * reload or a shared link reopens the same one.
 */
export function UnderlineTabs({
  tabs,
  active,
  className,
}: {
  tabs: UnderlineTab[];
  active: string;
  className?: string;
}) {
  return (
    <div className={cn('border-border/70 flex gap-6 overflow-x-auto border-b', className)}>
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            scroll={false}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              '-mb-px flex h-11 shrink-0 items-center gap-2 border-b-2 text-sm whitespace-nowrap transition-colors',
              isActive
                ? 'border-primary text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground border-transparent font-medium'
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' && tab.count > 0 ? (
              <span
                className={cn(
                  'flex h-5 min-w-5 items-center justify-center rounded-sm px-1.5 font-mono text-[11px]',
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

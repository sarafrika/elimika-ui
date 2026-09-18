'use client';

import { type ReactNode, useId } from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { FilterGroup } from '../data';

type MarketplaceSidebarProps = {
  heading: string;
  count: ReactNode;
  groups: FilterGroup[];
  /** Links under the filters, e.g. the instructor's applications. */
  footer?: ReactNode;
};

/** Radio-style filter groups; each option is a pressed/unpressed button. */
export function MarketplaceSidebar({ heading, count, groups, footer }: MarketplaceSidebarProps) {
  const idPrefix = useId();
  return (
    <aside className='border-border/70 bg-card space-y-4 rounded-md border px-4 py-4 shadow-sm'>
      <div className='border-border/60 border-b pb-4'>
        <h2 className='text-foreground text-base font-semibold'>{heading}</h2>
        <p className='text-muted-foreground mt-1 text-sm'>{count}</p>
      </div>

      {groups.map(group => {
        const GroupIcon = group.icon;
        const titleId = `${idPrefix}-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

        return (
          <section
            key={group.title}
            aria-labelledby={titleId}
            className='border-border/60 space-y-2 border-b pb-4 last:border-b-0 last:pb-0'
          >
            <h3
              id={titleId}
              className='text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase'
            >
              <GroupIcon aria-hidden className='text-primary size-4' />
              {group.title}
            </h3>

            <div className='space-y-1'>
              {group.items.map(item => (
                <button
                  key={item.label}
                  type='button'
                  onClick={item.onSelect}
                  aria-pressed={item.active}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left transition-colors',
                    item.active ? 'bg-primary/10' : 'hover:bg-muted/40'
                  )}
                >
                  <span className='flex items-center gap-2.5'>
                    <span
                      aria-hidden
                      className={cn(
                        'size-3.5 rounded-full border-2',
                        item.active ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm',
                        item.active ? 'text-foreground font-medium' : 'text-muted-foreground'
                      )}
                    >
                      {item.label}
                    </span>
                  </span>
                  {item.count !== undefined ? (
                    <Badge
                      variant='outline'
                      className='border-border/70 bg-muted/40 text-muted-foreground rounded-md px-2 py-0.5 text-xs tabular-nums'
                    >
                      {item.count}
                    </Badge>
                  ) : null}
                </button>
              ))}
            </div>
          </section>
        );
      })}

      {footer ? <div className='space-y-2'>{footer}</div> : null}
    </aside>
  );
}

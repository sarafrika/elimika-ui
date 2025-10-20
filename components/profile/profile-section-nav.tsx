'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export type ProfileSectionNavItem = {
  label: string;
  href: string;
  exact?: boolean;
};

type ProfileSectionNavProps = HTMLAttributes<HTMLDivElement> & {
  items: ProfileSectionNavItem[];
};

export function ProfileSectionNav({ items, className, ...props }: ProfileSectionNavProps) {
  const pathname = usePathname();

  return (
    <div className={cn('mx-auto w-full max-w-5xl px-0 sm:px-6 lg:px-8', className)} {...props}>
      <div className='relative overflow-hidden rounded-full border border-border/60 bg-background/80 shadow-sm ring-1 ring-black/5 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='no-scrollbar flex items-center gap-2 overflow-x-auto px-4 py-2 sm:px-5'>
          {items.map(item => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                prefetch
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

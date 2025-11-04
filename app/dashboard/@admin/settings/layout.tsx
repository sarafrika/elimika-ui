'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { ScrollArea } from '@ui/scroll-area';

const sections = [
  { href: '/dashboard/@admin/settings', label: 'General' },
  { href: '/dashboard/@admin/settings/notifications', label: 'Notifications' },
  { href: '/dashboard/@admin/settings/security', label: 'Security' },
  { href: '/dashboard/@admin/settings/advanced', label: 'Advanced' },
];

type SettingsLayoutProps = {
  children: React.ReactNode;
};

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className='grid h-full gap-6 lg:grid-cols-[240px_1fr] xl:grid-cols-[280px_1fr]'>
      <aside className='rounded-lg border border-border bg-card shadow-sm'>
        <div className='border-b border-border px-4 py-3'>
          <h2 className='text-base font-semibold text-card-foreground'>Admin settings</h2>
          <p className='text-sm text-muted-foreground'>Configure global policies and automation.</p>
        </div>
        <ScrollArea className='h-[calc(100%-4.5rem)] px-2 py-3'>
          <nav className='flex flex-col gap-1'>
            {sections.map(section => {
              const isActive = pathname === section.href;

              const isSectionParent =
                section.href !== '/dashboard/@admin/settings' && pathname?.startsWith(section.href);

              const active = isActive || isSectionParent;

              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary-foreground/90 hover:bg-primary/15'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {section.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>
      <main className='space-y-6'>{children}</main>
    </div>
  );
}

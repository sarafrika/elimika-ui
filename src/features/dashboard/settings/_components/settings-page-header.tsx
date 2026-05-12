'use client';

import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type SettingsPageHeaderProps = {
  title: string;
  subtitle: string;
  profileName: string;
  profileImage?: string;
  initials: string;
  className?: string;
};

export function SettingsPageHeader({
  title,
  subtitle,
  profileName,
  profileImage,
  initials,
  className,
}: SettingsPageHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        'flex flex-col gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className='flex min-w-0 items-start gap-3 sm:gap-4'>
        <div className='min-w-0 space-y-1'>
          <h1 className='text-foreground text-[1.55rem] leading-tight font-semibold tracking-tight sm:text-3xl'>
            {title}
          </h1>
          <p className='text-muted-foreground text-sm leading-6 sm:text-md'>
            {subtitle}
          </p>
        </div>
      </div>
    </header>
  );
}

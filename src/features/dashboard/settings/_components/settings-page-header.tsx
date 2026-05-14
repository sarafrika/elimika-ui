'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

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
          <p className='text-muted-foreground text-sm leading-6 sm:text-md'>{subtitle}</p>
        </div>
      </div>

      <div className='flex min-w-0 items-center gap-3 rounded-[18px] border border-border/70 bg-card px-3 py-2 shadow-sm'>
        <Avatar className='size-11 border border-border/70'>
          <AvatarImage src={profileImage} alt={profileName} />
          <AvatarFallback className='bg-primary/10 text-primary text-sm font-semibold'>
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className='min-w-0'>
          <p className='text-muted-foreground text-[10px] font-medium uppercase tracking-[0.18em]'>
            Current profile
          </p>
          <p className='truncate text-sm font-semibold text-foreground'>{profileName}</p>
          <p className='text-muted-foreground truncate text-xs'>
            Personal settings snapshot
          </p>
        </div>
      </div>
    </header>
  );
}

'use client';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type SettingsToggleRowProps = {
  title: string;
  description: string;
  enabled: boolean;
  badgeLabel?: string;
  onToggle: (next: boolean) => void;
  className?: string;
};

export function SettingsToggleRow({
  title,
  description,
  enabled,
  badgeLabel,
  onToggle,
  className,
}: SettingsToggleRowProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 rounded-xl border border-border/70 p-4',
        className
      )}
    >
      <div className='min-w-0 space-y-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <h3 className='text-sm font-semibold text-foreground'>{title}</h3>
          {badgeLabel ? (
            <Badge
              variant='outline'
              className='rounded-full px-2 py-0 text-[10px] uppercase tracking-wide'
            >
              {badgeLabel}
            </Badge>
          ) : null}
        </div>
        <p className='text-muted-foreground text-xs leading-5 sm:text-sm'>{description}</p>
      </div>

      <Switch checked={enabled} onCheckedChange={onToggle} aria-label={title} />
    </div>
  );
}

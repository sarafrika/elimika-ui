import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function InitialsGroup({ initials }: { initials: string[] }) {
  return (
    <div className='flex items-center'>
      {initials.map((value, index) => (
        <Avatar
          key={`${value}-${index + 1}`}
          className='-ml-2 size-7 border-2 border-background first:ml-0'
        >
          <AvatarFallback className='bg-muted text-[0.63rem] font-semibold text-foreground'>
            {value}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}

export function ActionButton({
  label,
  href,
  tone = 'primary',
}: {
  label: string;
  href: string;
  tone?: 'primary' | 'success' | 'danger' | 'muted';
}) {
  return (
    <Link href={href}>
      <Button
        className={cn(
          'h-8 rounded-[6px] px-4 text-[0.82rem] font-medium',
          tone === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
          tone === 'success' && 'bg-success text-success-foreground hover:bg-success/90',
          tone === 'danger' && 'bg-destructive text-white hover:bg-destructive/90',
          tone === 'muted' && 'bg-muted text-foreground hover:bg-muted/80'
        )}
      >
        {label}
      </Button>
    </Link>
  );
}

export function PersonAvatar({
  name,
  sizeClass = 'size-10',
}: {
  name: string;
  sizeClass?: string;
}) {
  const initials = name
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Avatar className={cn(sizeClass, 'border border-border')}>
      <AvatarFallback className='bg-muted text-xs font-semibold text-foreground'>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

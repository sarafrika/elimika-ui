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
          className='-ml-2 size-7 border-2 border-white first:ml-0'
        >
          <AvatarFallback className='bg-slate-200 text-[0.63rem] font-semibold text-slate-700'>
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
          tone === 'primary' && 'bg-cyan-600 text-white hover:bg-cyan-700',
          tone === 'success' && 'bg-emerald-500 text-white hover:bg-emerald-600',
          tone === 'danger' && 'bg-cyan-600 text-white hover:bg-cyan-700',
          tone === 'muted' && 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
    <Avatar className={cn(sizeClass, 'border border-[#d8dbf6]')}>
      <AvatarFallback className='bg-[#eef1ff] text-xs font-semibold text-slate-700'>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

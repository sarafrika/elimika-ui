'use client';

import { cn } from '@/lib/utils';

type TrainingHubAvatarGroupProps = {
  names: string[];
  size?: 'sm' | 'md';
};

const avatarTones = [
  'bg-[color-mix(in_srgb,var(--primary)_20%,white)] text-primary',
  'bg-[color-mix(in_srgb,var(--success)_20%,white)] text-[color-mix(in_srgb,var(--success)_85%,black)]',
  'bg-[color-mix(in_srgb,var(--warning)_28%,white)] text-[color-mix(in_srgb,var(--warning)_85%,black)]',
];

export function TrainingHubAvatarGroup({
  names,
  size = 'sm',
}: TrainingHubAvatarGroupProps) {
  return (
    <div className='flex items-center'>
      {names.map((name, index) => (
        <span
          key={`${name}-${index}`}
          aria-hidden='true'
          className={cn(
            'inline-flex items-center justify-center rounded-full border-2 border-white font-semibold',
            size === 'sm' ? 'size-6 text-[0.62rem]' : 'size-7 text-[0.68rem]',
            avatarTones[index % avatarTones.length],
            index > 0 ? '-ml-2' : '',
          )}
        >
          {name
            .split(' ')
            .map(part => part[0])
            .join('')
            .slice(0, 2)}
        </span>
      ))}
    </div>
  );
}

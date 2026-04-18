'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type TrainingHubSectionHeaderProps = {
  title: string;
  href?: string;
  actionLabel?: string;
};

export function TrainingHubSectionHeader({
  title,
  href,
  actionLabel,
}: TrainingHubSectionHeaderProps) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <h2 className='text-[1.08rem] font-semibold tracking-[-0.02em] text-foreground sm:text-[1.14rem]'>
        {title}
      </h2>

      {href && actionLabel ? (
        <Link
          href={href}
          className='inline-flex items-center gap-1 text-[0.84rem] font-medium text-primary transition hover:text-primary/80'
        >
          {actionLabel}
          <ChevronRight className='size-4' />
        </Link>
      ) : null}
    </div>
  );
}

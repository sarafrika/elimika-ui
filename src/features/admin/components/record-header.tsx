'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { StatusBadge } from '@/components/data-display';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface RecordBadge {
  status?: string | null;
  label?: string;
  tone?: 'success' | 'warning' | 'destructive' | 'info' | 'neutral';
}

interface RecordHeaderProps {
  /** Initials or a monogram for the record. */
  initials: string;
  imageUrl?: string | null;
  title: string;
  /** Email, slug, licence number — the facts that identify the record. */
  facts?: ReactNode[];
  badges?: RecordBadge[];
  /** Where the record sits, e.g. an organisation link. */
  context?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** The identity strip at the top of every 360 page. Server-safe. */
export function RecordHeader({
  initials,
  imageUrl,
  title,
  facts = [],
  badges = [],
  context,
  actions,
  className,
}: RecordHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start gap-4', className)}>
      <Avatar className='size-14'>
        {imageUrl ? <AvatarImage src={imageUrl} alt='' /> : null}
        <AvatarFallback className='bg-primary/10 text-primary text-base font-semibold'>
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className='min-w-0 flex-1 space-y-1.5'>
        <div className='flex flex-wrap items-center gap-2'>
          <h1 className='text-foreground text-2xl font-semibold tracking-tight'>{title}</h1>
          {badges.map((badge, index) => (
            <StatusBadge
              key={`${badge.label ?? badge.status ?? index}`}
              status={badge.status}
              label={badge.label}
              tone={badge.tone}
            />
          ))}
        </div>
        {facts.length ? (
          <div className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm'>
            {facts.map((fact, index) => (
              <span key={index}>{fact}</span>
            ))}
          </div>
        ) : null}
        {context ? <div className='text-sm'>{context}</div> : null}
      </div>

      {actions ? <div className='flex flex-wrap items-center gap-2'>{actions}</div> : null}
    </div>
  );
}

/** A link rendered inside the facts row, e.g. to the record's organisation. */
export function RecordLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className='text-primary font-medium hover:underline'>
      {children}
    </Link>
  );
}

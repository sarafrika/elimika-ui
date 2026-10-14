'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trackApplicationHref } from '../links';
import type { ApplyItem } from '../types';

const STAGES = ['Submitted', 'Under review', 'Approved to train'] as const;

/** Shown once the application is sent: where it is now, and what to do next. */
export function SentPanel({
  item,
  creator,
  edited,
  onAnother,
}: {
  item: ApplyItem;
  creator: string;
  edited: boolean;
  onAnother: () => void;
}) {
  return (
    <section className='bg-card flex flex-col items-center gap-5 rounded-2xl border px-6 py-10 text-center shadow-sm'>
      <span className='bg-success/15 text-success flex size-16 items-center justify-center rounded-full'>
        <Check aria-hidden className='size-8' />
      </span>
      <div>
        <h2 className='text-foreground text-2xl font-bold'>
          {edited ? 'Application updated' : 'Application sent'}
        </h2>
        <p className='text-muted-foreground mt-2 text-sm'>
          {creator} will review your application for{' '}
          <strong className='text-foreground'>{item.title}</strong>. You’ll get a notification
          when they decide.
        </p>
      </div>
      <ol className='flex w-full max-w-xl flex-wrap justify-center'>
        {STAGES.map((stage, index) => (
          <li
            key={stage}
            className={cn(
              'flex flex-[1_1_150px] flex-col items-center gap-1.5 text-sm',
              index > 0 && 'text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'flex size-7 items-center justify-center rounded-full border text-xs font-bold',
                index === 0 && 'border-primary bg-primary text-primary-foreground'
              )}
            >
              {index + 1}
            </span>
            {stage}
          </li>
        ))}
      </ol>
      <div className='flex flex-wrap justify-center gap-2.5'>
        <Button asChild className='h-11'>
          <Link href={trackApplicationHref(item.kind, item.uuid)}>Track application</Link>
        </Button>
        <Button type='button' variant='outline' className='h-11' onClick={onAnother}>
          Apply to another course
        </Button>
      </div>
    </section>
  );
}

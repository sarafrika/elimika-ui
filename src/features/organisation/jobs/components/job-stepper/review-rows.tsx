'use client';

import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';

export type ReviewRow = { title: string; value: string; onEdit: () => void };

export function ReviewRows({ rows }: { rows: ReviewRow[] }) {
  return (
    <dl className='flex flex-col gap-2.5'>
      {rows.map(row => (
        <div
          key={row.title}
          className='border-border/60 bg-muted/20 flex items-start gap-3 rounded-md border px-3 py-2.5'
        >
          <div className='min-w-0 flex-1'>
            <dt className='text-muted-foreground text-xs tracking-wide uppercase'>{row.title}</dt>
            <dd className='text-foreground mt-1 text-sm font-medium break-words'>{row.value}</dd>
          </div>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={row.onEdit}
            aria-label={`Edit ${row.title.toLowerCase()}`}
          >
            <Pencil aria-hidden />
            Edit
          </Button>
        </div>
      ))}
    </dl>
  );
}

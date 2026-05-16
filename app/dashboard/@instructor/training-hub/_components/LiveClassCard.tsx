'use client';

import { EllipsisVertical, Eye, Pencil, Play } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../../components/ui/dropdown-menu';
import type { TrainingHubLiveClass } from './training-hub-data';

type LiveClassCardProps = {
  liveClass: TrainingHubLiveClass;
};

export function LiveClassCard({ liveClass }: LiveClassCardProps) {
  const toneClass =
    liveClass.day === 'Today'
      ? 'bg-[color-mix(in_srgb,var(--warning)_22%,white)] text-[color-mix(in_srgb,var(--warning)_92%,black)]'
      : liveClass.day === 'Tomorrow'
        ? 'bg-[color-mix(in_srgb,var(--success)_18%,white)] text-[color-mix(in_srgb,var(--success)_85%,black)]'
        : 'bg-[color-mix(in_srgb,var(--primary)_10%,white)] text-primary';

  return (
    <article className='rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-colors'>
      <div className='flex flex-col gap-4'>
        {/* Top row */}
        <div className='flex items-start justify-between gap-3'>
          {/* Left content */}
          <div className='min-w-0 flex-1'>
            {/* Pills */}
            <div className='flex flex-wrap items-center gap-2'>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${toneClass}`}
              >
                {liveClass?.instance_status}
              </span>

              <span className='inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground'>
                {liveClass.day}
              </span>

              <span className='text-[11px] font-medium text-muted-foreground'>
                {liveClass.time}
              </span>
            </div>

            {/* Title */}
            <h3 className='mt-3 line-clamp-2 text-[1rem] font-semibold leading-snug tracking-[-0.02em] text-foreground sm:text-[1.05rem]'>
              {liveClass.title}
            </h3>

            {/* Meta */}
            <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground'>
              <span className='font-medium text-primary'>
                {liveClass.provider}
              </span>

              <span>{liveClass.students} enrolled</span>

              <span className='hidden sm:inline'>•</span>

              <span>{liveClass.waitlistedStudents} waiting</span>
            </div>
          </div>

          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label='More options'
                variant='ghost'
                size='icon'
                className='h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/20'
              >
                <EllipsisVertical className='size-4' />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end' className='w-44'>
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/classes/overview/${liveClass.classUuid}`}
                  className='flex items-center gap-2'
                >
                  <Eye className='size-4' />
                  View info
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/class-instance/${liveClass.instanceUuid}`}
                  className='flex items-center gap-2'
                >
                  <Play className='size-4' />
                  Open class
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/classes/new?id=${liveClass.classUuid}`}
                  className='flex items-center gap-2'
                >
                  <Pencil className='size-4' />
                  Edit class
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats section */}
        <div className='grid grid-cols-2 gap-3 rounded-md border border-border/50 bg-muted/30 px-3 py-2 sm:grid-cols-2'>
          <div className='min-w-0 flex flex-row items-center gap-2'>
            <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
              Fee
            </p>

            <p className='truncate text-sm font-semibold text-foreground sm:text-[0.95rem]'>
              {liveClass.fee}
            </p>
          </div>

          <div className='min-w-0 flex flex-row items-center gap-2'>
            <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
              Sessions
            </p>

            <p className='text-sm font-semibold text-foreground sm:text-[0.95rem]'>
              {liveClass.sessions}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className='flex flex-row gap-2 pt-1 sm:flex-row sm:justify-end'>
          <Link
            href={`/dashboard/classes/overview/${liveClass.classUuid}`}
            className='inline-flex h-10 w-full items-center justify-center rounded-lg border border-border/60 px-4 text-sm font-medium text-muted-foreground transition hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 sm:w-auto'
          >
            View info
          </Link>

          <Link
            href={`/dashboard/class-instance/${liveClass.instanceUuid}`}
            className='inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:w-auto'
          >
            Open class
          </Link>
        </div>
      </div>
    </article>
  );
}
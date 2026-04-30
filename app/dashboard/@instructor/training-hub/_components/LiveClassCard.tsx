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
    <article className='rounded-[12px] border border-border/60 bg-card p-3 shadow-sm'>
      <div className='flex flex-col gap-3 min-[560px]:flex-row min-[560px]:items-start min-[560px]:justify-between'>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2 text-[0.78rem] text-muted-foreground'>
            <span className={`rounded-full px-2 py-0.5 font-medium ${toneClass}`}>{liveClass.day}</span>
            <span>{liveClass.time}</span>
          </div>

          <h3 className='mt-2 text-[1rem] font-semibold tracking-[-0.02em] text-foreground sm:text-[1.04rem]'>
            {liveClass.title}
          </h3>

          <div className='mt-3 flex flex-wrap items-center gap-2 text-[0.78rem] text-muted-foreground'>
            <span className='font-medium text-primary'>{liveClass.provider}</span>
            <span>{liveClass.students} enrolled</span>
            <span>•</span>
            <span>{liveClass.waitlistedStudents} waiting</span>
          </div>
        </div>

        <div className='flex items-start gap-4 min-[560px]:shrink-0'>
          <dl className='grid grid-cols-2 gap-x-4 gap-y-1 text-[0.78rem]'>
            <div>
              <dt className='text-muted-foreground'>Fee</dt>
              <dd className='text-[0.95rem] font-semibold text-foreground'>{liveClass.fee}</dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>Sessions</dt>
              <dd className='text-[0.95rem] font-semibold text-foreground'>{liveClass.sessions}</dd>
            </div>
          </dl>


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label='More options'
                variant='ghost'
                size='icon'
                className='rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/20'
              >
                <EllipsisVertical className='size-4' />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end' className='w-44'>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/classes/overview/${liveClass.classUuid}`} className='flex items-center gap-2'>
                  <Eye className='size-4' />
                  View info
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href={`/dashboard/class-instance/${liveClass.instanceUuid}`} className='flex items-center gap-2'>
                  <Play className='size-4' />
                  Open class
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href={`/dashboard/classes/create-new?id=${liveClass.classUuid}`} className='flex items-center gap-2'>
                  <Pencil className='size-4' />
                  Edit class
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className='mt-3 flex flex-row justify-end gap-2'>
        <Link
          href={`/dashboard/classes/overview/${liveClass.classUuid}`}
          className='inline-flex h-9 items-center justify-center rounded-md border border-border/60 px-3 text-[0.8rem] font-medium text-muted-foreground transition hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'
        >
          View info
        </Link>

        <Link
          href={`/dashboard/class-instance/${liveClass.instanceUuid}`}
          className='inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-[0.82rem] font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30'
        >
          Open class
        </Link>
      </div>
    </article>
  );
}
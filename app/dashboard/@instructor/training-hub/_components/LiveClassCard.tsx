'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { EllipsisVertical, Eye, PenLine, Play } from 'lucide-react';
import Link from 'next/link';
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
  const imageUrl = toAuthenticatedMediaUrl(liveClass.imageUrl);

  const statusTone =
    liveClass.status === 'published'
      ? 'bg-[color-mix(in_srgb,var(--success)_18%,white)] text-[color-mix(in_srgb,var(--success)_88%,black)]'
      : liveClass.status === 'draft'
        ? 'bg-[color-mix(in_srgb,var(--warning)_18%,white)] text-[color-mix(in_srgb,var(--warning)_88%,black)]'
        : 'bg-[color-mix(in_srgb,var(--primary)_10%,white)] text-primary';


  return (
    <Card className='overflow-hidden border-border/60 shadow-sm'>
      <CardContent className='p-2 sm:p-3 py-0 -my-4'>
        <div className='flex flex-col gap-4 lg:flex-row'>
          {/* <div className='relative aspect-[16/10] w-full overflow-hidden rounded-[18px] border border-border/60 bg-muted lg:max-w-[220px]'>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={liveClass.title}
                fill
                className='object-cover'
                unoptimized={isAuthenticatedMediaUrl(imageUrl)}
              />
            ) : (
              <div className='bg-primary/10 text-primary flex h-full w-full items-center justify-center'>
                <Users className='size-10' />
              </div>
            )}
          </div> */}

          <div className='min-w-0 flex-1 space-y-3'>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0 space-y-2'>
                <div className='flex flex-wrap items-center gap-2'>
                  {/* <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusTone}`}
                  >
                    {liveClass.status}
                  </span> */}
                  <span className='inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground'>
                    {liveClass.provider}
                  </span>
                  <span className='inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground'>
                    {(() => {
                      const mins = Number(liveClass.duration_minutes);

                      const hours = Math.floor(mins / 60);
                      const minutes = mins % 60;

                      if (hours && minutes) {
                        return `${hours} hours ${minutes} minutes`;
                      }

                      if (hours) {
                        return `${hours} hour${hours > 1 ? 's' : ''}`;
                      }

                      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
                    })()}
                  </span>
                </div>

                <div>
                  <h3 className='text-foreground line-clamp-2 text-xl font-semibold tracking-[-0.02em]'>
                    {liveClass.title}
                  </h3>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    aria-label='More options'
                    variant='ghost'
                    size='icon'
                    className='h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  >
                    <EllipsisVertical className='size-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-48'>
                  <DropdownMenuItem asChild>
                    <Link
                      href={liveClass.href}
                      className='flex items-center gap-2'
                    >
                      <Eye className='size-4' />
                      View info
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href={liveClass.manageHref}
                      className='flex items-center gap-2'
                    >
                      <PenLine className='size-4' />
                      Manage class
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href={(() => {
                        const params = new URLSearchParams();

                        if (liveClass?.classUuid) {
                          params.set('classUuid', liveClass.classUuid);
                        }

                        const queryString = params.toString();

                        return `/dashboard/classes/class-training/${liveClass?.classUuid}${queryString ? `?${queryString}` : ''
                          }`;
                      })()}
                      className='flex items-center gap-2'
                    >
                      <Play className='size-4' />
                      Start class
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className='grid gap-3 sm:grid-cols-3'>
              <InfoPill label='Students' value={liveClass.students} />
              <InfoPill label='Classes' value={liveClass.classes} />
              <InfoPill label='Fee' value={liveClass.fee} />
            </div>

            <div className='flex flex-col gap-2 sm:flex-row justify-end'>
              <div className='flex flex-col gap-2 sm:flex-row'>
                <Link
                  href={liveClass.manageHref}
                  className='inline-flex h-10 items-center justify-center rounded-lg border border-border/60 px-4 text-sm font-medium text-foreground transition hover:bg-muted/60'
                >
                  Manage class
                </Link>

                <Link
                  href={(() => {
                    const params = new URLSearchParams();

                    if (liveClass?.classUuid) {
                      params.set('classUuid', liveClass.classUuid);
                    }

                    const queryString = params.toString();

                    return `/dashboard/classes/class-training/${liveClass?.classUuid}${queryString ? `?${queryString}` : ''
                      }`;
                  })()}
                  className='inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90'
                >
                  Start Class
                </Link>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { BookOpen, Users } from 'lucide-react';

function InfoPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const iconMap = {
    Students: Users,
    Classes: BookOpen,
  };

  const Icon =
    iconMap[label as keyof typeof iconMap];

  return (
    <div className='inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px]'>
      {Icon ? (
        <Icon className='text-muted-foreground size-3 shrink-0' />
      ) : null}

      <span className='text-foreground font-semibold'>
        {value}
      </span>
    </div>
  );
}

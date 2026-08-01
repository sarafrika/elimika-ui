'use client';

import { ChevronRight, Share2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { useState } from 'react';
import { PdfPreview } from '../../../app/dashboard/admin/_components/ui/PdfPreview';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../ui/sheet';
import type { GrowthItem } from '../data';

type GrowthTimelineCardProps = {
  item: GrowthItem;
  ownerName: string;
};

const accentStyles = {
  green:
    'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--success)_18%,white),white)] text-success',
  amber:
    'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--el-accent-amber)_28%,white),white)] text-[color-mix(in_srgb,var(--el-accent-amber)_92%,var(--foreground))]',
  blue: 'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_18%,white),white)] text-primary',
} as const;

export function GrowthTimelineCard({ item, ownerName }: GrowthTimelineCardProps) {
  const Icon = item.icon;
  const recordKindLabel = item.recordKind
    ? item.recordKind.charAt(0).toUpperCase() + item.recordKind.slice(1)
    : null;

  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <Card className='bg-card/95 gap-4 rounded-[16px] border-white/60 px-4 py-4 shadow-sm'>
      <div className='flex items-start gap-3'>
        <span
          className={cn(
            'grid size-14 shrink-0 place-items-center rounded-lg border border-white/70 shadow-sm',
            accentStyles[item.accent]
          )}
        >
          <Icon className='size-6' />
        </span>

        <div className='min-w-0 flex-1'>
          <div className='flex flex-row items-center gap-1'>
            {recordKindLabel ? (
              <Badge
                variant='outline'
                className='bg-background/90 text-muted-foreground rounded-lg border-white/70 py-1.5 text-sm'
              >
                {recordKindLabel}
              </Badge>
            ) : null}
            <p className='text-foreground text-base font-semibold tracking-tight'>{item.title}</p>
          </div>
          {item.recordSummary ? (
            <p className='text-foreground/80 mt-2 line-clamp-2 text-sm leading-5'>
              {item.recordSummary}
            </p>
          ) : null}
        </div>

        <Badge
          variant='secondary'
          className='text-primary rounded-lg bg-[color-mix(in_srgb,var(--primary)_8%,white)] px-3 py-1'
        >
          {item.badge}
        </Badge>
      </div>

      <div className='flex flex-wrap gap-2'>
        {item.documentName ? (
          <Badge
            variant='outline'
            className='bg-background/80 text-muted-foreground rounded-lg border-white/70 px-3 py-1.5 text-sm'
          >
            {item.documentName}
          </Badge>
        ) : null}
        <Button variant='outline' size='sm' className='bg-background/80 rounded-lg border-white/70'>
          <Share2 className='size-4' />
          Share
        </Button>
      </div>

      <div className='flex-end flex flex-wrap justify-between gap-2 border-t pt-3'>
        {item.documentUrl ? (
          <Button
            type='button'
            variant='outline'
            className='bg-background/80 min-h-8 rounded-md border-white/70 px-3 text-xs'
            onClick={() => setViewerOpen(true)}
            disabled={!item.documentUrl}
          >
            {item.actionLabel}
            <ChevronRight className='size-3.5' />
          </Button>
        ) : (
          <Button
            variant='outline'
            className='bg-background/80 min-h-8 rounded-md border-white/70 px-3 text-xs'
          >
            {item.actionLabel}
            <ChevronRight className='size-3.5' />
          </Button>
        )}
      </div>

      {/* Viewer */}
      <Sheet open={viewerOpen} onOpenChange={setViewerOpen}>
        <SheetContent
          side='right'
          className='flex w-full flex-col overflow-y-auto p-0 sm:max-w-[680px]'
        >
          <SheetHeader className='border-border/70 border-b px-5 py-4 text-left'>
            <SheetTitle className='text-lg'>{item.documentName as string}</SheetTitle>
            <SheetDescription className='space-y-0.5 text-xs'>
              <p className='text-foreground font-medium'>{ownerName}</p>

              {item.recordSummary && (
                <p className='text-muted-foreground leading-snug'>{item.recordSummary}</p>
              )}
            </SheetDescription>
          </SheetHeader>

          {item.documentUrl ? (
            <div className='flex-1 space-y-4 overflow-y-auto px-5 py-4'>
              <div className='bg-card overflow-hidden rounded-[14px] border shadow-sm'>
                <PdfPreview
                  documentUrl={item.documentUrl}
                  documentLabel={item.documentName as string}
                  documentTitle={item.documentName as string}
                  fullHeight
                />
              </div>
            </div>
          ) : (
            <div className='text-muted-foreground flex flex-1 items-center justify-center p-5 text-center text-xs'>
              No document URL available for this credential.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}

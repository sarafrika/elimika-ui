'use client';

import { BookOpen, GraduationCap, type LucideIcon, Play, Star } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { ImageWithFallback } from '@/components/data/image-with-fallback';
import { IntentLink, type PrefetchQuery } from '@/components/data/intent-link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { CourseVideoPreviewModal } from './CourseVideoPreviewModal';
import type { CoursesCatalogCardData } from './courses-data';
import { StarRatingSummary } from './StarRating';

/**
 * What the card shell reads. `CoursesCatalogCardData` satisfies it, and so does the public
 * catalogue's item card, which shares this shell rather than restyling it.
 */
export type CourseCatalogCardView = Pick<
  CoursesCatalogCardData,
  'contentKind' | 'title' | 'provider' | 'icon' | 'imageTone' | 'imageUrl' | 'videoUrl'
> & {
  description?: string;
  secondaryMeta?: string;
  rating?: number;
  reviewCount?: number;
  /** Where the card opens. Without it the card has no whole-card link; its buttons act. */
  detailsHref?: string;
  /** The destination's main query, warmed with the route on hover or focus. */
  detailsPrefetchQuery?: PrefetchQuery;
};

type CourseCatalogCardLayoutProps = {
  card: CourseCatalogCardView;
  /** Replaces the plain title text, e.g. a search highlight. */
  titleContent?: ReactNode;
  /** The round badge's icon; defaults to a book, or a cap for a programme. */
  badgeIcon?: LucideIcon;
  badges?: ReactNode;
  stats: ReactNode;
  children: ReactNode;
};

const imageToneClasses = {
  primary: 'bg-gradient-to-br from-primary/20 via-primary/10 to-background',
  success: 'bg-gradient-to-br from-success/20 via-success/10 to-background',
  warning: 'bg-gradient-to-br from-warning/20 via-warning/10 to-background',
} as const;

export function CourseCatalogCardLayout({
  card,
  titleContent,
  badgeIcon,
  badges,
  stats,
  children,
}: CourseCatalogCardLayoutProps) {
  const imageUrl = toAuthenticatedMediaUrl(card.imageUrl);
  const videoUrl = toAuthenticatedMediaUrl(card.videoUrl);
  const [videoPreviewOpen, setVideoPreviewOpen] = useState(false);
  const title = card.title || 'Untitled Course';
  const CourseIcon = badgeIcon ?? (card.contentKind === 'program' ? GraduationCap : BookOpen);

  return (
    <Card className='group border-border relative h-full min-w-0 gap-0 overflow-hidden rounded-2xl py-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md'>
      {/* Keep the card keyboard accessible while allowing the controls above it to act independently. */}
      {card.detailsHref ? (
        <IntentLink
          href={card.detailsHref}
          prefetchQuery={card.detailsPrefetchQuery}
          className='focus-visible:ring-ring absolute inset-0 z-[1] rounded-[inherit] focus-visible:ring-2 focus-visible:outline-none'
        >
          <span className='sr-only'>Open {title}</span>
        </IntentLink>
      ) : null}

      <div className='relative shrink-0'>
        <div className='bg-muted relative aspect-[16/10] w-full overflow-hidden'>
          <ImageWithFallback
            src={imageUrl}
            alt={title}
            fill
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw'
            className='object-cover transition-transform duration-500 group-hover:scale-105'
            fallback={
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center',
                  imageToneClasses[card.imageTone]
                )}
              >
                <card.icon className='text-primary/60 h-8 w-8' />
              </div>
            }
          />
          {videoUrl && (
            <Button
              type='button'
              size='icon'
              variant='secondary'
              aria-label={`Preview ${title}`}
              className='bg-card text-foreground hover:bg-card/90 absolute top-3 right-3 z-10 h-8 w-8 rounded-full shadow-sm'
              onClick={() => setVideoPreviewOpen(true)}
            >
              <Play className='h-4 w-4' />
            </Button>
          )}
        </div>
        <div className='ring-card bg-primary text-primary-foreground absolute -bottom-5 left-4 flex h-11 w-11 items-center justify-center rounded-full shadow-md ring-4'>
          <CourseIcon className='h-5 w-5' />
        </div>
      </div>

      <CardContent className='flex flex-1 flex-col gap-3 p-3.5 pt-7 sm:p-4 sm:pt-7'>
        <div className='min-w-0'>
          <div className='flex items-start justify-between gap-2'>
            <h3 className='min-w-0 text-base leading-snug font-semibold'>
              {card.detailsHref ? (
                <IntentLink
                  href={card.detailsHref}
                  prefetchQuery={card.detailsPrefetchQuery}
                  className='text-foreground hover:text-primary relative z-10 line-clamp-2 hover:underline'
                  title={title}
                >
                  {titleContent ?? title}
                </IntentLink>
              ) : (
                <span className='text-foreground line-clamp-2' title={title}>
                  {titleContent ?? title}
                </span>
              )}
            </h3>
            {card.contentKind === 'program' && (
              <span className='bg-primary/10 text-primary shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase'>
                Programme
              </span>
            )}
          </div>
          <p className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
            {card.description || 'No description available.'}
          </p>
        </div>

        {badges}

        <div className='flex min-w-0 items-center gap-2'>
          {card.provider ? (
            <>
              <Avatar className='h-6 w-6 shrink-0'>
                <AvatarFallback className='bg-primary/10 text-primary text-[10px]'>
                  {card.provider.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span
                className='text-foreground min-w-0 truncate text-xs font-medium'
                title={card.provider}
              >
                {card.provider}
              </span>
            </>
          ) : (
            <>
              <Skeleton className='h-6 w-6 shrink-0 rounded-full' />
              <Skeleton className='h-3 w-20' />
            </>
          )}
          {card.secondaryMeta && (
            <span className='text-muted-foreground ml-auto flex shrink-0 items-center gap-1 text-xs'>
              <Star className='fill-warning text-warning h-3 w-3' />
              {card.secondaryMeta}
            </span>
          )}
        </div>

        {!card.reviewCount ? (
          <span className='text-muted-foreground text-xs'>No reviews yet</span>
        ) : (
          <StarRatingSummary
            rating={card.rating ?? 0}
            reviewCount={card.reviewCount}
            size='sm'
            showCount
          />
        )}

        <div className='border-border/60 text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs'>
          {stats}
        </div>

        <div className='relative z-10 mt-auto grid gap-2 pt-1'>{children}</div>
      </CardContent>

      <CourseVideoPreviewModal
        open={videoPreviewOpen}
        onOpenChange={setVideoPreviewOpen}
        title={title}
        videoUrl={videoUrl}
      />
    </Card>
  );
}

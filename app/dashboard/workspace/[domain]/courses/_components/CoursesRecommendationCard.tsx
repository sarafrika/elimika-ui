import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isAuthenticatedMediaUrl, toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { Clock3, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { CoursesRecommendationCardData } from './courses-data';

const imageToneClasses = {
  primary: 'bg-gradient-to-br from-primary/20 via-primary/10 to-background',
  success: 'bg-gradient-to-br from-success/20 via-success/10 to-background',
  warning: 'bg-gradient-to-br from-warning/20 via-warning/10 to-background',
} as const;

type CoursesRecommendationCardProps = {
  card: CoursesRecommendationCardData;
};

export function CoursesRecommendationCard({ card }: CoursesRecommendationCardProps) {
  const imageUrl = toAuthenticatedMediaUrl(card.imageUrl);

  return (
    <article className='border-border bg-card overflow-hidden rounded-lg border min-w-[248px] max-w-[248px] sm:min-w-[270px] sm:max-w-[270px]'>
      <Link href={card.detailsHref} className='block'>
        <div
          className={cn(
            'border-border relative flex h-32 items-center justify-center overflow-hidden border-b',
            imageToneClasses[card.imageTone]
          )}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={card.title}
              fill
              className='object-cover'
              unoptimized={isAuthenticatedMediaUrl(imageUrl)}
            />
          ) : (
            <>
              <div className='absolute right-4 top-4 size-8 rounded-full bg-background/70' />
              <div className='absolute left-5 top-5 h-4 w-16 rounded-full bg-background/70' />
              <span className='inline-flex size-14 items-center justify-center rounded-full bg-background/90 shadow-sm'>
                <card.icon className='text-foreground size-7' />
              </span>
            </>
          )}
        </div>
      </Link>

      <div className='space-y-3 px-3.5 py-3.5'>
        <div>
          <Link href={card.detailsHref} className='block'>
            <h3 className='text-foreground text-[clamp(0.95rem,1vw,1.05rem)] font-semibold leading-tight'>
              {card.title}
            </h3>
          </Link>
          <p className='text-muted-foreground mt-1 text-xs sm:text-[0.8rem]'>{card.provider}</p>
        </div>

        <div className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-[0.8rem]'>
          <span className='inline-flex items-center gap-1 text-warning'>
            <Star className='size-3.5 fill-current' />
            <span className='text-muted-foreground'>{card.rating}</span>
          </span>
          <span>{card.secondaryMeta}</span>
        </div>

        <div className='flex items-center justify-between gap-3 border-t border-border pt-3'>
          {card.weeks ? (
            <span className='text-muted-foreground inline-flex items-center gap-1.5 text-xs sm:text-[0.8rem]'>
              <Clock3 className='size-3.5' />
              {card.weeks}
            </span>
          ) : (
            <span />
          )}
          <Button asChild variant='outline' className='h-8 rounded-xl px-4 text-sm shadow-none'>
            <Link href={card.enrollHref}>Enroll</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

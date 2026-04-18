import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isAuthenticatedMediaUrl, toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { BookOpen, Clock3, Tag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { CoursesCatalogCardData } from './courses-data';

const imageToneClasses = {
  primary: 'bg-gradient-to-br from-primary/20 via-primary/10 to-background',
  success: 'bg-gradient-to-br from-success/20 via-success/10 to-background',
  warning: 'bg-gradient-to-br from-warning/20 via-warning/10 to-background',
} as const;

type CoursesCatalogCardProps = {
  card: CoursesCatalogCardData;
};

export function CoursesCatalogCard({ card }: CoursesCatalogCardProps) {
  const imageUrl = toAuthenticatedMediaUrl(card.imageUrl);

  return (
    <article className='border-border bg-card overflow-hidden rounded-lg border'>
      <Link href={card.href} className='block'>
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
              <div className='absolute inset-x-4 top-4 h-4 rounded-full bg-background/70' />
              <div className='absolute bottom-4 left-4 h-5 w-12 rounded-full bg-background/70' />
              <span className='inline-flex size-14 items-center justify-center rounded-full bg-background/90 shadow-sm'>
                <card.icon className='text-foreground size-7' />
              </span>
            </>
          )}
        </div>
      </Link>

      <div className='space-y-3 px-4 py-3.5'>
        <div>
          <Link href={card.href} className='block'>
            <h3 className='text-foreground text-[clamp(0.95rem,1vw,1.05rem)] font-semibold leading-tight'>
              {card.title}
            </h3>
          </Link>
          <p className='text-muted-foreground mt-1 text-xs sm:text-[0.8rem]'>{card.provider}</p>
        </div>

        <div className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-[0.8rem]'>
          {card.duration ? (
            <span className='inline-flex items-center gap-1.5'>
              <Clock3 className='size-3.5' />
              {card.duration}
            </span>
          ) : null}
          <span className='inline-flex items-center gap-1.5'>
            <Tag className='size-3.5' />
            {card.secondaryMeta}
          </span>
        </div>

        <Button asChild className='h-9 w-full rounded-xl text-sm shadow-none'>
          <Link href={card.href}>
            <BookOpen className='size-4' />
            {card.ctaLabel}
          </Link>
        </Button>
      </div>
    </article>
  );
}

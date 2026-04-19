import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isAuthenticatedMediaUrl, toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { BookOpen, Clock3, Tag, UserRoundSearch } from 'lucide-react';
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
  onPrimaryAction?: (card: CoursesCatalogCardData) => void;
};

const ctaToneClasses: Record<NonNullable<CoursesCatalogCardData['ctaTone']>, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  pending:
    'border border-[color:var(--warning)] bg-[color:var(--warning)] text-[color:var(--warning-foreground)] hover:brightness-95 disabled:opacity-100',
  approved:
    'border border-[color:var(--success)] bg-[color:var(--success)] text-[color:var(--success-foreground)] hover:brightness-95 disabled:opacity-100',
  revoked:
    'border border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-100',
};

export function CoursesCatalogCard({ card, onPrimaryAction }: CoursesCatalogCardProps) {
  const imageUrl = toAuthenticatedMediaUrl(card.imageUrl);

  return (
    <article className='border-border bg-card overflow-hidden rounded-lg border'>
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
          <Link href={card.detailsHref} className='block'>
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

        <div className={cn('grid gap-2', card.showInstructorCta !== false && 'sm:grid-cols-2')}>
          {card.showInstructorCta !== false ? (
            <Button asChild variant='outline' className='h-9 rounded-xl text-sm shadow-none'>
              <Link href={card.instructorHref}>
                <UserRoundSearch className='size-4' />
                Instructors
              </Link>
            </Button>
          ) : null}
          {card.ctaKind === 'apply-course' || card.ctaKind === 'apply-program' ? (
            <Button
              type='button'
              className={cn(
                'h-9 rounded-xl text-sm shadow-none',
                ctaToneClasses[card.ctaTone ?? 'default']
              )}
              disabled={card.ctaDisabled}
              onClick={() => onPrimaryAction?.(card)}
            >
              <BookOpen className='size-4' />
              {card.ctaLabel}
            </Button>
          ) : (
            <Button asChild className='h-9 rounded-xl text-sm shadow-none' disabled={card.ctaDisabled}>
              <Link href={card.enrollHref}>
                <BookOpen className='size-4' />
                {card.ctaLabel}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

import { ImageWithFallback } from '@/components/data/image-with-fallback';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CoursesCatalogCardData } from '@/src/features/dashboard/courses/shared/_components/courses-data';
import { StarRatingSummary } from '@/src/features/dashboard/courses/shared/_components/StarRating';
import { isAuthenticatedMediaUrl, toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import { Award, BookOpen, Calendar, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { CourseDetailsSheet } from './CourseDetailsSheet';

const imageToneClasses = {
  primary: 'bg-gradient-to-br from-primary/20 via-primary/10 to-background',
  success: 'bg-gradient-to-br from-success/20 via-success/10 to-background',
  warning: 'bg-gradient-to-br from-warning/20 via-warning/10 to-background',
} as const;

type CoursesCatalogCardProps = {
  card: CoursesCatalogCardData;
  type: string;
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

const levelStyles: Record<string, string> = {
  prep: 'bg-success/5 text-success border-success/20 border',
  beginner: 'bg-success/5 text-success border-success/20 border',
  intermediate: 'bg-warning/5 text-warning border-warning/20 border',
  advanced: 'bg-primary/5 text-primary border-primary/20 border',
};

export function CoursesCatalogCard({ card, type, onPrimaryAction }: CoursesCatalogCardProps) {
  const imageUrl = toAuthenticatedMediaUrl(card.imageUrl);
  const level = card.secondaryMeta.toLowerCase();

  const isLoading = !card.provider;
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <article
      className='border-border bg-card group cursor-pointer overflow-hidden rounded-sm border transition hover:border-primary/40 hover:shadow-md'
      onClick={() => {
        setSelectedId(card.id);
        setOpen(!open);
      }}
    >
      <div className='block'>
        <div
          className={cn(
            'border-border relative flex h-40 items-center justify-center overflow-hidden border-b',
            imageToneClasses[card.imageTone]
          )}
        >
          <div className='absolute inset-x-0 top-3 z-10 flex items-center justify-between'>
            {/* <span className="inline-flex items-center gap-1 rounded-r-sm bg-warning px-2.5 py-1 text-[11px] font-semibold text-warning-foreground shadow-md">
              <Flame className="size-3" />
              Best Seller
            </span> */}

            {/* <button
              type="button"
              className="mr-3 inline-flex size-8 items-center justify-center rounded-full bg-background/30 text-foreground backdrop-blur-md ring-1 ring-border/30 transition-transform hover:scale-110 hover:bg-background/40"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Heart
                className="size-4 text-foreground drop-shadow-sm"
                strokeWidth={2.2}
              />
            </button> */}
          </div>

          <ImageWithFallback
            src={imageUrl}
            alt={card.title}
            sizes=''
            fill
            loading='eager'
            className='object-cover transition-transform duration-500 group-hover:scale-105'
            unoptimized={isAuthenticatedMediaUrl(imageUrl)}
            fallback={
              <>
                <div className='bg-background/70 absolute inset-x-4 top-4 h-4 rounded-full' />
                <div className='bg-background/70 absolute bottom-4 left-4 h-5 w-12 rounded-full' />

                <span className='bg-background/90 inline-flex size-14 items-center justify-center rounded-full shadow-sm'>
                  <card.icon className='text-foreground size-7' />
                </span>
              </>
            }
          />
          <div className='from-overlay/20 absolute inset-0 bg-gradient-to-t via-transparent to-transparent' />
        </div>
      </div>

      <div className='space-y-3 px-4 py-3.5'>
        <div>
          <h3
            className='text-foreground line-clamp-2 h-[2.5rem] text-[clamp(0.95rem,1vw,1.05rem)] leading-tight font-semibold'
            title={card.title}
          >
            {card.title}
          </h3>

          <div className='mt-2 flex flex-row items-center justify-between'>
            {isLoading ? (
              <>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-8 w-8 rounded-md' />
                  <Skeleton className='h-6 w-24' />
                </div>

                <Skeleton className='h-6 w-20' />
              </>
            ) : (
              <>
                <div className='flex flex-row items-center gap-2'>
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src='' alt={card.provider} />
                    <AvatarFallback className='text-[12px] leading-none font-medium'>
                      {card.provider?.slice(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>

                  <p className='text-muted-foreground text-[14px]'>{card.provider}</p>
                </div>

                <StarRatingSummary
                  rating={card.rating ?? 0}
                  reviewCount={card.reviewCount}
                  showCount
                />
              </>
            )}
          </div>
        </div>

        <div className='flex flex-col gap-x-4 gap-y-2 text-xs sm:text-[0.8rem]'>
          <span>
            {card.enrollmentCount} {type === 'general' ? 'students' : 'classes'}
          </span>
          <span
            className={cn(
              'inline-flex max-w-fit items-center gap-1.5 rounded px-2 py-1 font-medium',
              levelStyles[card.secondaryMeta.toLowerCase()] ?? 'bg-muted text-muted-foreground'
            )}
          >
            {card.secondaryMeta}
          </span>
        </div>

        <div
          className={cn('grid gap-2', card.showInstructorCta !== false && 'sm:grid-cols-2')}
          onClick={e => e.stopPropagation()}
        >
          {/* Instructor CTA */}
          {card.showInstructorCta !== false && (
            <Button asChild variant='outline' className='h-9 rounded-sm text-sm shadow-none'>
              <Link href={card.instructorHref}>
                <Search className='size-4' />
                Search Instructor
              </Link>
            </Button>
          )}

          {/* Primary CTA */}
          {card.ctaKind === 'apply-course' || card.ctaKind === 'apply-program' ? (
            <Button
              type='button'
              className={cn(
                'h-9 rounded-sm text-sm shadow-none',
                ctaToneClasses[card.ctaTone ?? 'default']
              )}
              disabled={card.ctaDisabled}
              onClick={() => onPrimaryAction?.(card)}
            >
              <BookOpen className='size-4' />
              {card.ctaLabel}
            </Button>
          ) : card.ctaLabel === 'View Certificate' ? (
            <Button
              asChild
              className='h-9 rounded-sm text-sm shadow-none'
              disabled={card.ctaDisabled}
            >
              <Link href={card.certificateHref}>
                <Award className='size-4' />
                {card.ctaLabel}
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              className='h-9 rounded-sm text-sm shadow-none'
              disabled={card.ctaDisabled}
            >
              <Link href={card.enrollHref}>
                <Calendar className='size-4' />
                {card.ctaLabel}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <CourseDetailsSheet
        key={selectedId}
        itemId={selectedId}
        type={card.contentKind}
        open={open}
        onOpenChange={value => {
          setOpen(!value);

          if (!value) {
            setTimeout(() => setSelectedId(null), 200);
          }
        }}
      />
    </article>
  );
}

'use client';

import { BookOpen, CalendarDays, Layers, LogIn } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Highlight } from '@/components/search/highlight';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  type CatalogueItem,
  itemLinks,
  itemStats,
  levelLabel,
} from '@/src/features/catalogue/catalogue-search';
import {
  type CourseCatalogCardView,
  CourseCatalogCardLayout,
} from '@/src/features/dashboard/courses/shared/_components/CourseCatalogCardLayout';

const TONES = ['primary', 'warning', 'success'] as const;

const toneFor = (uuid: string) => {
  let hash = 0;
  for (const char of uuid) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length] ?? 'primary';
};

type ItemAction = ReturnType<typeof itemLinks>['primary'];

function ActionButton({
  action,
  variant,
  icon: Icon,
  title,
}: {
  action: ItemAction;
  variant: 'default' | 'outline';
  icon: typeof BookOpen;
  title: string;
}) {
  const className = 'h-9 w-full rounded-lg text-sm shadow-none';
  if (action.signIn) {
    return (
      <Button
        type='button'
        variant={variant}
        className={className}
        aria-label={`${action.label}: sign in to open ${title}`}
        onClick={() =>
          void signIn('keycloak', { redirectTo: `${window.location.origin}${action.href}` })
        }
      >
        <LogIn className='size-4' aria-hidden />
        {action.label}
      </Button>
    );
  }
  return (
    <Button asChild variant={variant} className={className}>
      <Link href={action.href} aria-label={`${action.label}: ${title}`}>
        <Icon className='size-4' aria-hidden />
        {action.label}
      </Link>
    </Button>
  );
}

/**
 * One catalogue result, course or programme, on the learner catalogue's card shell. A
 * programme gets the Programme pill, a layers badge and "N courses · N lessons".
 */
export function CatalogueItemCard({ item, signedIn }: { item: CatalogueItem; signedIn: boolean }) {
  const isProgramme = item.type === 'programme';
  const links = itemLinks(item, signedIn);
  const reviewCount = item.review_count ?? 0;
  const card: CourseCatalogCardView = {
    contentKind: isProgramme ? 'program' : 'course',
    title: item.title,
    description: item.description ?? undefined,
    provider: item.creator_name || 'Course creator',
    secondaryMeta: levelLabel(item.level),
    rating: item.rating_avg ?? undefined,
    reviewCount,
    icon: isProgramme ? Layers : BookOpen,
    imageTone: isProgramme ? 'primary' : toneFor(item.uuid),
    imageUrl: item.thumbnail_url ?? undefined,
    detailsHref: links.primary.signIn ? undefined : links.primary.href,
  };
  const categories = (item.category_names ?? []).slice(0, 2);
  const stats = itemStats(item);

  return (
    <CourseCatalogCardLayout
      card={card}
      badgeIcon={isProgramme ? Layers : BookOpen}
      titleContent={<Highlight value={item.highlight} fallback={item.title} />}
      badges={
        categories.length > 0 ? (
          <ul className='flex flex-wrap gap-1.5' aria-label='Categories'>
            {categories.map(name => (
              <li
                key={name}
                className='bg-muted text-foreground rounded-md px-2 py-0.5 text-xs font-medium'
              >
                {name}
              </li>
            ))}
          </ul>
        ) : null
      }
      stats={
        stats.length > 0 ? (
          <span className='flex flex-wrap gap-x-1.5'>
            {stats.map((stat, index) => (
              <span key={stat} className={cn(index > 0 && "before:mr-1.5 before:content-['·']")}>
                {stat}
              </span>
            ))}
          </span>
        ) : (
          <span>{isProgramme ? 'Programme' : 'Course'}</span>
        )
      }
    >
      <ActionButton action={links.primary} variant='default' icon={BookOpen} title={item.title} />
      <ActionButton
        action={links.secondary}
        variant='outline'
        icon={isProgramme ? Layers : CalendarDays}
        title={item.title}
      />
    </CourseCatalogCardLayout>
  );
}

/** The card's shape while the list loads. */
export function CatalogueItemCardSkeleton() {
  return (
    <div className='border-border bg-card flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm'>
      <Skeleton className='aspect-[16/10] w-full rounded-none' />
      <div className='flex flex-col gap-3 p-4 pt-7'>
        <Skeleton className='h-4 w-4/5' />
        <Skeleton className='h-3 w-full' />
        <Skeleton className='h-3 w-3/5' />
        <div className='flex items-center gap-2'>
          <Skeleton className='size-6 rounded-full' />
          <Skeleton className='h-3 w-24' />
        </div>
        <Skeleton className='mt-2 h-9 w-full rounded-lg' />
        <Skeleton className='h-9 w-full rounded-lg' />
      </div>
    </div>
  );
}

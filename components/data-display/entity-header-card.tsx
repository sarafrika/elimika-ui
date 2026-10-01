import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface EntityFact {
  key: string;
  icon?: LucideIcon;
  /** The figure, bolded: "9". Omit for a fact that is a phrase. */
  value?: ReactNode;
  /** "lessons", or a whole phrase such as "Certificate on completion". */
  label: ReactNode;
}

export interface EntityHeaderCardProps {
  title: string;
  /** Small caps line above the badges, behind the brand accent bar: "Course". */
  eyebrow?: ReactNode;
  /** Chips beside the eyebrow: category, level, status. */
  badges?: ReactNode;
  /** One plain-text paragraph. Kept to prose width. */
  description?: ReactNode;
  /** Who stands behind the record: the creator, the organisation. */
  context?: ReactNode;
  /** The key-fact strip along the bottom of the identity block. Pass only facts that exist. */
  facts?: readonly EntityFact[];
  /** Left slot: a thumbnail or banner. Without it, `initials`/`imageUrl` make an avatar. */
  media?: ReactNode;
  initials?: string;
  imageUrl?: string | null;
  /** Right slot: a price card or the primary action. */
  aside?: ReactNode;
  /** e.g. `hidden md:flex` when a page pins the same action elsewhere on phones. */
  asideClassName?: string;
  /** Inline actions under the identity block. */
  actions?: ReactNode;
  className?: string;
}

/**
 * The header card of a record page: media, identity (eyebrow, badges, title, summary,
 * context, key facts) and an aside for a price or primary action. Generalises the admin
 * `RecordHeader` for public and dashboard detail pages. Server-safe.
 *
 * Columns: stacked on phones; media + identity from `md`, the aside on its own row; all
 * three from `lg`.
 */
export function EntityHeaderCard({
  title,
  eyebrow,
  badges,
  description,
  context,
  facts = [],
  media,
  initials,
  imageUrl,
  aside,
  asideClassName,
  actions,
  className,
}: EntityHeaderCardProps) {
  const avatar =
    !media && initials ? (
      <Avatar className='size-14'>
        {imageUrl ? <AvatarImage src={imageUrl} alt='' /> : null}
        <AvatarFallback className='bg-primary/10 text-primary text-base font-semibold'>
          {initials}
        </AvatarFallback>
      </Avatar>
    ) : null;
  const left = media ?? avatar;

  return (
    <section
      aria-label={title}
      className={cn(
        'bg-card grid gap-5 overflow-hidden rounded-2xl border p-4 sm:p-5 lg:gap-6',
        left &&
          (media ? 'md:grid-cols-[240px_minmax(0,1fr)]' : 'md:grid-cols-[auto_minmax(0,1fr)]'),
        left && aside
          ? media
            ? 'lg:grid-cols-[300px_minmax(0,1fr)_340px]'
            : 'lg:grid-cols-[auto_minmax(0,1fr)_340px]'
          : aside && 'lg:grid-cols-[minmax(0,1fr)_340px]',
        className
      )}
    >
      {left ? <div className='min-w-0'>{left}</div> : null}

      <div className='relative flex min-w-0 flex-col gap-2.5 md:pl-1'>
        <span
          aria-hidden
          className='from-primary to-primary/50 absolute top-0.5 -left-3 hidden h-[30px] w-1 rounded-full bg-gradient-to-b md:block'
        />
        {eyebrow || badges ? (
          <div className='flex flex-wrap items-center gap-1.5'>
            {eyebrow ? (
              <span className='text-primary mr-1 text-xs font-semibold tracking-[0.08em] uppercase'>
                {eyebrow}
              </span>
            ) : null}
            {badges}
          </div>
        ) : null}
        <h1 className='text-foreground text-2xl leading-tight font-bold tracking-tight break-words sm:text-[30px] sm:leading-9'>
          {title}
        </h1>
        {description ? (
          <div className='text-muted-foreground max-w-prose text-[15px] leading-6'>
            {description}
          </div>
        ) : null}
        {context ? <div className='text-sm'>{context}</div> : null}
        {actions ? <div className='flex flex-wrap items-center gap-2'>{actions}</div> : null}
        {facts.length > 0 ? (
          <>
            <div className='grow' />
            <ul
              aria-label='Key facts'
              className='text-muted-foreground flex flex-wrap gap-x-7 gap-y-2 border-t pt-3 text-sm'
            >
              {facts.map(fact => {
                const Icon = fact.icon;
                return (
                  <li key={fact.key} className='flex items-center gap-2'>
                    {Icon ? <Icon aria-hidden className='text-primary size-4 shrink-0' /> : null}
                    <span>
                      {fact.value !== undefined ? (
                        <b className='text-foreground font-semibold'>{fact.value}</b>
                      ) : null}
                      {fact.value !== undefined ? ' ' : null}
                      {fact.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </div>

      {aside ? (
        <div className={cn('min-w-0', left && 'md:col-span-2 lg:col-span-1', asideClassName)}>
          {aside}
        </div>
      ) : null}
    </section>
  );
}

'use client';

import { ReactNode } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type ProfileSummaryMeta = {
  icon?: ReactNode;
  label: ReactNode;
  href?: string;
};

export type ProfileSummaryBadge = {
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'secondary' | 'outline';
};

export type ProfileSummarySectionItem = {
  label: string;
  value?: ReactNode;
  icon?: ReactNode;
  emptyText?: string;
  valueClassName?: string;
};

export type ProfileSummarySection = {
  title: string;
  description?: ReactNode;
  items?: ProfileSummarySectionItem[];
  content?: ReactNode;
  emptyText?: string;
};

export type ProfileSummaryViewProps = {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  headline?: ReactNode;
  avatar?: {
    src?: string | null;
    fallback?: string;
    alt?: string;
  };
  badges?: ProfileSummaryBadge[];
  meta?: ProfileSummaryMeta[];
  actions?: ReactNode;
  sections: ProfileSummarySection[];
  className?: string;
};

export function ProfileSummaryView({
  eyebrow,
  title,
  subtitle,
  headline,
  avatar,
  badges,
  meta,
  actions,
  sections,
  className,
}: ProfileSummaryViewProps) {
  return (
    <div className={cn('mx-auto w-full max-w-4xl space-y-6 px-4 py-10', className)}>
      <header className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-start gap-4'>
          {avatar && (
            <Avatar className='h-16 w-16'>
              {avatar.src ? <AvatarImage src={avatar.src} alt={avatar.alt ?? title} /> : null}
              <AvatarFallback>{avatar.fallback ?? title.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
          <div>
            {eyebrow ? (
              <p className='text-xs uppercase tracking-widest text-primary/80'>{eyebrow}</p>
            ) : null}
            <h1 className='mt-1 text-3xl font-semibold tracking-tight'>{title}</h1>
            {headline ? <p className='text-muted-foreground mt-1 text-sm'>{headline}</p> : null}
            {subtitle ? <div className='text-muted-foreground mt-3 text-sm'>{subtitle}</div> : null}
            {badges && badges.length > 0 ? (
              <div className='mt-3 flex flex-wrap gap-2'>
                {badges.map((badge, index) => (
                  <Badge key={`${badge.label}-${index}`} variant={badge.variant ?? 'outline'}>
                    <span className='inline-flex items-center gap-1'>
                      {badge.icon}
                      {badge.label}
                    </span>
                  </Badge>
                ))}
              </div>
            ) : null}
            {meta && meta.length > 0 ? (
              <dl className='text-muted-foreground mt-3 flex flex-wrap gap-4 text-xs uppercase tracking-wide'>
                {meta.map((item, index) => (
                  <div key={index} className='flex items-center gap-1'>
                    {item.icon}
                    {item.href ? (
                      <a
                        href={item.href}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='hover:text-foreground/90'
                      >
                        {item.label}
                      </a>
                    ) : (
                      item.label
                    )}
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </div>
        {actions ? <div className='flex flex-wrap gap-2'>{actions}</div> : null}
      </header>

      {sections.map(section => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className='text-base font-semibold'>{section.title}</CardTitle>
            {section.description ? (
              <CardDescription>{section.description}</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className='space-y-4 text-sm'>
            {section.content}
            {section.items && section.items.length > 0 ? (
              <dl className='grid gap-4 sm:grid-cols-2'>
                {section.items.map((item, index) => (
                  <div key={`${item.label}-${index}`} className='space-y-1'>
                    <dt className='text-xs uppercase tracking-wide text-muted-foreground'>
                      <span className='inline-flex items-center gap-1'>
                        {item.icon}
                        {item.label}
                      </span>
                    </dt>
                    <dd className={item.valueClassName}>
                      {item.value ?? <span className='text-muted-foreground'>{item.emptyText}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {!section.content && (!section.items || section.items.length === 0) && section.emptyText ? (
              <p className='text-muted-foreground'>{section.emptyText}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

'use client';

import { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ProfileFormShellProps = {
  title: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  badges?: ReactNode[];
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function ProfileFormShell({
  title,
  description,
  eyebrow,
  actions,
  badges,
  children,
  className,
  contentClassName,
}: ProfileFormShellProps) {
  return (
    <div className={cn('mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8', className)}>
      <header className='flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between'>
        <div className='max-w-2xl space-y-2'>
          {eyebrow ? (
            <p className='text-primary/80 text-xs font-medium tracking-[0.2em] uppercase'>
              {eyebrow}
            </p>
          ) : null}
          <h1 className='text-foreground text-3xl font-semibold tracking-tight sm:text-4xl'>
            {title}
          </h1>
          {description ? (
            <p className='text-muted-foreground text-sm sm:text-base'>{description}</p>
          ) : null}
          {badges && badges.length > 0 ? (
            <div className='flex flex-wrap gap-2 pt-1'>
              {badges.map((badge, index) =>
                typeof badge === 'string' ? (
                  <Badge
                    key={badge}
                    variant='outline'
                    className='bg-primary/5 text-xs font-medium capitalize'
                  >
                    {badge}
                  </Badge>
                ) : (
                  <Badge
                    key={index}
                    variant='outline'
                    className='bg-primary/5 text-xs font-medium capitalize'
                  >
                    {badge}
                  </Badge>
                )
              )}
            </div>
          ) : null}
        </div>
        {actions ? <div className='flex flex-wrap gap-3'>{actions}</div> : null}
      </header>
      <div className={cn('space-y-6', contentClassName)}>{children}</div>
    </div>
  );
}

type ProfileFormSectionProps = {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function ProfileFormSection({
  title,
  description,
  icon,
  children,
  footer,
  className,
  contentClassName,
}: ProfileFormSectionProps) {
  return (
    <Card
      className={cn(
        'border-border/60 supports-[backdrop-filter]:bg-background/60 shadow-sm backdrop-blur',
        className
      )}
    >
      <CardHeader className='border-border/60 bg-muted/40/60 border-b'>
        <div className='flex items-center gap-3'>
          {icon}
          <div>
            <CardTitle className='text-foreground text-base font-semibold sm:text-lg'>
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className='text-sm'>{description}</CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn('space-y-6 p-6 sm:p-8', contentClassName)}>{children}</CardContent>
      {footer ? (
        <CardFooter className='border-border/60 bg-muted/10 flex flex-col items-stretch gap-3 border-t p-6 sm:flex-row sm:justify-end'>
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}

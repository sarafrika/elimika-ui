'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { SystemRule } from '@/services/admin/system-config';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface SystemRulesSummaryProps {
  rules: SystemRule[];
  isLoading: boolean;
}

const CATEGORY_CONFIG: { key: string; label: string; description: string }[] = [
  {
    key: 'PLATFORM_FEE',
    label: 'Platform fee',
    description: 'Tuition and marketplace fee overrides',
  },
  {
    key: 'AGE_GATE',
    label: 'Age gate',
    description: 'Enrollment safety bounds',
  },
  {
    key: 'NOTIFICATIONS',
    label: 'Notifications',
    description: 'Delivery routing and throttles',
  },
];

export function SystemRulesSummary({ rules, isLoading }: SystemRulesSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuration overview</CardTitle>
          <CardDescription>Loading rule categories…</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className='space-y-3 rounded-2xl border border-border/50 p-4'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-6 w-12' />
              <Skeleton className='h-3 w-28' />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const summary = CATEGORY_CONFIG.map(category => {
    const activeCount = rules.filter(
      rule => rule.category === category.key && rule.status === 'ACTIVE'
    ).length;

    const totalCount = rules.filter(rule => rule.category === category.key).length;

    return {
      ...category,
      activeCount,
      totalCount,
    };
  });

  const getTime = (value: string) => {
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
  };

  const lastChanged = rules
    .map(rule => rule.updated_at ?? rule.created_at)
    .filter((timestamp): timestamp is string => Boolean(timestamp))
    .sort((a, b) => getTime(b) - getTime(a))[0];

  return (
    <Card>
      <CardHeader className='flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <CardTitle className='text-base font-semibold'>Configuration overview</CardTitle>
          <CardDescription>
            Live status of platform rules grouped by operational category.
          </CardDescription>
        </div>
        {lastChanged && (
          <Badge variant='outline' className='w-fit'>
            Updated {formatDistanceToNow(new Date(lastChanged), { addSuffix: true })}
          </Badge>
        )}
      </CardHeader>
      <CardContent className='grid gap-4 md:grid-cols-3'>
        {summary.map(item => (
          <div key={item.key} className='rounded-2xl border border-border/50 p-4'>
            <p className='text-sm font-semibold'>{item.label}</p>
            <p className='text-muted-foreground text-xs'>{item.description}</p>
            <div className='mt-3 flex items-end gap-2'>
              <span className='text-3xl font-bold'>{item.activeCount}</span>
              <span className='text-muted-foreground text-xs'>active of {item.totalCount} rules</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

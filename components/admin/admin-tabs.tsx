'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

export function AdminTabs(props: ComponentProps<typeof Tabs>) {
  const { className, ...rest } = props;
  return <Tabs className={cn('space-y-4', className)} {...rest} />;
}

export function AdminTabsList(props: ComponentProps<typeof TabsList>) {
  const { className, ...rest } = props;
  return <TabsList className={cn('grid w-full gap-2 sm:grid-cols-3', className)} {...rest} />;
}

export function AdminTabsTrigger(props: ComponentProps<typeof TabsTrigger>) {
  const { className, ...rest } = props;
  return (
    <TabsTrigger
      className={cn(
        'data-[state=active]:bg-primary/10 data-[state=active]:text-primary',
        'data-[state=active]:shadow-sm text-sm font-medium transition-colors',
        className
      )}
      {...rest}
    />
  );
}

export const AdminTabsContent = TabsContent;

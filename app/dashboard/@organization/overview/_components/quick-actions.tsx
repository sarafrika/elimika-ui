'use client';

import { BookOpen, Building2, GitBranch, Handshake, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { type StatusTone, statusToneClass } from '../../_components/ui';

const actions: Array<{
  title: string;
  description: string;
  icon: typeof BookOpen;
  href: string;
  tone: StatusTone;
}> = [
  {
    title: 'Manage people',
    description: 'Invite and organise members',
    icon: GitBranch,
    href: '/dashboard/people',
    tone: 'info',
  },
  {
    title: 'Post a class job',
    description: 'Publish an instructor assignment',
    icon: Handshake,
    href: '/dashboard/opportunities',
    tone: 'success',
  },
  {
    title: 'Manage courses',
    description: 'Draft, publish and organise courses',
    icon: BookOpen,
    href: '/dashboard/course-management',
    tone: 'neutral',
  },
  {
    title: 'Browse catalogue',
    description: 'Explore available courses',
    icon: ShoppingBag,
    href: '/dashboard/catalogue',
    tone: 'warning',
  },
  {
    title: 'Organisation profile',
    description: 'Update details and preferences',
    icon: Building2,
    href: '/dashboard/account/training-center',
    tone: 'neutral',
  },
];

export function QuickActions() {
  return (
    <div className='grid gap-3 sm:grid-cols-2'>
      {actions.map(action => {
        const Icon = action.icon;
        return (
          <Link
            key={action.title}
            href={action.href}
            className='flex h-full items-start gap-3 rounded-md border border-border/70 bg-card p-4 shadow-sm transition-colors hover:border-border hover:bg-muted/30'
          >
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-md border',
                statusToneClass[action.tone]
              )}
            >
              <Icon className='size-4' />
            </span>
            <span className='min-w-0'>
              <span className='block text-sm font-semibold text-foreground'>{action.title}</span>
              <span className='block text-xs text-muted-foreground'>{action.description}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

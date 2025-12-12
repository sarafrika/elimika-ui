'use client';

import { elimikaDesignSystem } from '@/lib/design-system';
import { GitBranch, BookOpen, Settings, FileText } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  const actions = [
    {
      title: 'Create Branch',
      description: 'Set up a new training location',
      icon: GitBranch,
      href: '/dashboard/branches',
      color: 'green' as const,
    },
    {
      title: 'Manage Courses',
      description: 'View and organize your course catalog',
      icon: BookOpen,
      href: '/dashboard/course-management',
      color: 'purple' as const,
    },
    {
      title: 'Organization Settings',
      description: 'Update organization profile and preferences',
      icon: Settings,
      href: '/dashboard/account/training-center',
      color: 'slate' as const,
    },
    {
      title: 'Browse Catalogue',
      description: 'Explore available courses and programs',
      icon: FileText,
      href: '/dashboard/catalogue',
      color: 'pink' as const,
    },
  ];

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {actions.map((action) => {
        const Icon = action.icon;
        const colorStyles = getActionColorStyles(action.color);

        return (
          <Link key={action.title} href={action.href}>
            <div
              className={`${elimikaDesignSystem.components.listCard.base} h-full`}
            >
              <div className={`${colorStyles.bg} mb-4 inline-flex rounded-xl p-3`}>
                <Icon className={`h-5 w-5 ${colorStyles.icon}`} />
              </div>
              <h3 className='mb-2 text-base font-semibold text-foreground'>
                {action.title}
              </h3>
              <p className='text-sm text-muted-foreground'>
                {action.description}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function getActionColorStyles(color: 'blue' | 'green' | 'purple' | 'orange' | 'slate' | 'pink') {
  const styles = {
    blue: {
      icon: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    green: {
      icon: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    purple: {
      icon: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    orange: {
      icon: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
    },
    slate: {
      icon: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-900/30',
    },
    pink: {
      icon: 'text-pink-600 dark:text-pink-400',
      bg: 'bg-pink-100 dark:bg-pink-900/30',
    },
  };

  return styles[color];
}

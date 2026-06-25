'use client';

import { elimikaDesignSystem } from '@/lib/design-system';
import { BriefcaseBusiness, GitBranch, BookOpen, Settings, FileText } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  const actions = [
    {
      title: 'Create Branch',
      description: 'Set up a new training location',
      icon: GitBranch,
      href: '/dashboard/branches',
      tone: 'success' as const,
    },
    {
      title: 'Create Class Job',
      description: 'Publish an instructor assignment posting',
      icon: BriefcaseBusiness,
      href: '/dashboard/opportunities',
      tone: 'primary' as const,
    },
    {
      title: 'Manage Courses',
      description: 'View and organize your course catalog',
      icon: BookOpen,
      href: '/dashboard/course-management',
      tone: 'accent' as const,
    },
    {
      title: 'Organization Settings',
      description: 'Update organization profile and preferences',
      icon: Settings,
      href: '/dashboard/account/training-center',
      tone: 'muted' as const,
    },
    {
      title: 'Browse Catalogue',
      description: 'Explore available courses and programs',
      icon: FileText,
      href: '/dashboard/catalogue',
      tone: 'warning' as const,
    },
  ];

  return (
    <div className='grid gap-4 sm:grid-cols-2 2xl:grid-cols-3'>
      {actions.map(action => {
        const Icon = action.icon;
        const colorStyles = getActionColorStyles(action.tone);

        return (
          <Link key={action.title} href={action.href}>
            <div className={`${elimikaDesignSystem.components.listCard.base} h-full`}>
              <div className={`${colorStyles.bg} mb-4 inline-flex rounded-xl p-3`}>
                <Icon className={`h-5 w-5 ${colorStyles.icon}`} />
              </div>
              <h3 className='text-foreground mb-2 text-base font-semibold'>{action.title}</h3>
              <p className='text-muted-foreground text-sm'>{action.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function getActionColorStyles(tone: 'primary' | 'success' | 'accent' | 'warning' | 'muted') {
  const styles = {
    primary: { icon: 'text-primary', bg: 'bg-primary/15' },
    success: { icon: 'text-success', bg: 'bg-success/15' },
    accent: { icon: 'text-accent-foreground', bg: 'bg-accent' },
    warning: { icon: 'text-warning', bg: 'bg-warning/15' },
    muted: { icon: 'text-muted-foreground', bg: 'bg-muted' },
  };

  return styles[tone];
}

import { BookOpen, GraduationCap, type LucideIcon, Shield, Sparkles, Users } from 'lucide-react';
import type { UserDomain } from '@/lib/types';

type DashboardDomainDisplay = {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
};

export const dashboardDomainDisplayConfig: Record<UserDomain, DashboardDomainDisplay> = {
  student: {
    icon: BookOpen,
    title: 'Student Dashboard',
    description: 'Access your courses, assignments, and academic progress.',
    color: 'text-primary',
    bgColor: 'bg-primary/10 dark:bg-primary/15',
    borderColor: 'border-primary/30 dark:border-primary/30',
  },
  instructor: {
    icon: GraduationCap,
    title: 'Instructor Dashboard',
    description: 'Manage your classes, create content, and track student performance.',
    color: 'text-success',
    bgColor: 'bg-success/10 dark:bg-success/20',
    borderColor: 'border-success/30 dark:border-success/30',
  },
  course_creator: {
    icon: Sparkles,
    title: 'Course Creator Dashboard',
    description: 'Design, publish, and monetise your courses across Elimika.',
    color: 'text-accent',
    bgColor: 'bg-accent/10 dark:bg-accent/20',
    borderColor: 'border-accent/30 dark:border-accent/30',
  },
  parent: {
    icon: Users,
    title: 'Parent Dashboard',
    description: 'Manage learner approvals, monitor progress, and stay on top of updates.',
    color: 'text-primary',
    bgColor: 'bg-primary/10 dark:bg-primary/15',
    borderColor: 'border-primary/30 dark:border-primary/30',
  },
  organisation_user: {
    icon: Users,
    title: 'Organization Dashboard',
    description: 'Oversee institutional operations, users, and system administration.',
    color: 'text-accent',
    bgColor: 'bg-accent/10 dark:bg-accent/20',
    borderColor: 'border-accent/30 dark:border-accent/30',
  },
  organisation: {
    icon: Users,
    title: 'Organization Dashboard',
    description: 'Oversee institutional operations, users, and system administration.',
    color: 'text-accent',
    bgColor: 'bg-accent/10 dark:bg-accent/20',
    borderColor: 'border-accent/30 dark:border-accent/30',
  },
  admin: {
    icon: Shield,
    title: 'Admin Dashboard',
    description: 'System administration and platform management.',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 dark:bg-destructive/20',
    borderColor: 'border-destructive/30 dark:border-destructive/30',
  },
};

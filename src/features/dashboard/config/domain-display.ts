import type { UserDomain } from '@/lib/types';
import { BookOpen, Briefcase, CalendarPlus, FileCheck, GraduationCap, type LucideIcon, MapPin, Shield, Sparkles, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { buildWorkspaceAliasPath } from '../lib/active-domain-storage';

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

export type CreateAction = {
  label: string;
  description: string;
  icon: LucideIcon;
  onSelect: () => void;
};

export function useCreateMenuActions(activeDomain: UserDomain | null): CreateAction[] {
  const router = useRouter();

  const createCourseHref = buildWorkspaceAliasPath(
    activeDomain,
    '/dashboard/course-management/create-new-course'
  );
  const createClassHref = buildWorkspaceAliasPath(activeDomain, '/dashboard/classes/new');

  return useMemo(() => {
    switch (activeDomain) {
      case 'course_creator':
        return [
          {
            label: 'Create Course',
            description: 'Start building a new course',
            icon: Sparkles,
            onSelect: () => router.push(createCourseHref),
          },
          {
            label: 'Add Certificate',
            description: 'Upload a qualification or document',
            icon: FileCheck,
            onSelect: () =>
              router.push(
                buildWorkspaceAliasPath(
                  activeDomain,
                  '/dashboard/course-management/certificates'
                )
              ),
          },
        ];

      case 'instructor':
        return [
          {
            label: 'Create Class',
            description: 'Schedule a new class',
            icon: CalendarPlus,
            onSelect: () => router.push(createClassHref),
          },
        ];

      case 'organisation':
        return [
          {
            label: 'Create Class',
            description: 'Schedule a class or event',
            icon: CalendarPlus,
            onSelect: () => router.push(createClassHref),
          },
          {
            label: 'Post a Job',
            description: 'Advertise an instructor opening',
            icon: Briefcase,
            onSelect: () => router.push(buildWorkspaceAliasPath(activeDomain, '/dashboard/jobs/new')),
          },
          {
            label: 'Add Classroom',
            description: 'Register a venue or online room',
            icon: MapPin,
            onSelect: () =>
              router.push(buildWorkspaceAliasPath(activeDomain, '/dashboard/venues/new')),
          },
        ];

      case 'student':
        return [
          {
            label: 'Enroll Course',
            description: 'Browse and join a course',
            icon: GraduationCap,
            onSelect: () => router.push('/dashboard/student/courses'),
          },
        ];

      default:
        return [];
    }
  }, [activeDomain, createCourseHref, createClassHref, router]);
}

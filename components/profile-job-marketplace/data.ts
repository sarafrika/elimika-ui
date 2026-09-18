import type { LucideIcon } from 'lucide-react';

/** Roles that browse the marketplace read-only; instructors have their own Find work page. */
export type JobMarketplaceRole = 'admin' | 'course_creator' | 'parent' | 'student';

export type MarketplaceTab = {
  id: string;
  label: string;
  count: string | number;
  icon: LucideIcon;
};

export type FilterItem = {
  label: string;
  count?: string | number;
  active: boolean;
  onSelect?: () => void;
};

export type FilterGroup = {
  title: string;
  icon: LucideIcon;
  items: FilterItem[];
};

export type JobMarketplaceRoleConfig = {
  description: string;
  emptyStateLabel: string;
};

const roleConfig: Record<JobMarketplaceRole, JobMarketplaceRoleConfig> = {
  student: {
    description: 'Browse the class jobs organisations have posted for instructors.',
    emptyStateLabel: 'No class jobs match these filters.',
  },
  course_creator: {
    description: 'See the class jobs organisations have posted, including jobs for your courses.',
    emptyStateLabel: 'No class jobs match these filters.',
  },
  parent: {
    description: 'Browse the class jobs organisations have posted for instructors.',
    emptyStateLabel: 'No class jobs match these filters.',
  },
  admin: {
    description: 'Monitor the class jobs organisations have posted across the platform.',
    emptyStateLabel: 'No class jobs match these filters.',
  },
};

export function getJobMarketplaceRoleConfig(role: JobMarketplaceRole): JobMarketplaceRoleConfig {
  return roleConfig[role];
}

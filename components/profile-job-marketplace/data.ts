export type JobMarketplaceRole =
  | 'admin'
  | 'course_creator'
  | 'instructor'
  | 'organization'
  | 'parent'
  | 'student';

export type JobMarketplaceRoleConfig = {
  title: string;
  description: string;
  showManagementRail: boolean;
  showCreateAction: boolean;
  emptyStateLabel: string;
};

const roleConfig: Record<JobMarketplaceRole, JobMarketplaceRoleConfig> = {
  student: {
    title: 'Opportunities',
    description: 'Explore active job postings and apply for the ones that match your profile.',
    showManagementRail: true,
    showCreateAction: false,
    emptyStateLabel: 'No active opportunities are available right now.',
  },
  instructor: {
    title: 'Opportunities',
    description: 'Explore active job postings and apply for roles that match your expertise.',
    showManagementRail: true,
    showCreateAction: false,
    emptyStateLabel: 'No active opportunities are available right now.',
  },
  course_creator: {
    title: 'Opportunities',
    description: 'Review active job postings and apply for work that fits your portfolio.',
    showManagementRail: true,
    showCreateAction: false,
    emptyStateLabel: 'No active opportunities are available right now.',
  },
  parent: {
    title: 'Opportunities',
    description: 'Browse active job postings and apply when a role fits your background.',
    showManagementRail: true,
    showCreateAction: false,
    emptyStateLabel: 'No active opportunities are available right now.',
  },
  admin: {
    title: 'Opportunities',
    description: 'Monitor active job postings and apply from the admin workspace when needed.',
    showManagementRail: true,
    showCreateAction: false,
    emptyStateLabel: 'No active opportunities are available right now.',
  },
  organization: {
    title: 'Opportunities',
    description: 'Create, manage, and review the job postings published by your organisation.',
    showManagementRail: false,
    showCreateAction: true,
    emptyStateLabel: 'No jobs have been created by your organisation yet.',
  },
};

export function getJobMarketplaceRoleConfig(role: JobMarketplaceRole): JobMarketplaceRoleConfig {
  return roleConfig[role];
}

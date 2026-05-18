import type { UserDomain, UserProfileType } from '@/lib/types';
import type { Organisation } from '@/services/client';

export type DashboardSettingsVariant = 'admin' | 'student' | 'instructor' | 'organisation' | 'course_creator';

export type SettingsTabConfig = {
  value: string;
  label: string;
};

export type SettingsSummaryItem = {
  label: string;
  value: string;
};

export type SettingsAccessItem = {
  title: string;
  description: string;
  href?: string;
};

export type SettingsVariantConfig = {
  title: string;
  subtitle: string;
  tabs: SettingsTabConfig[];
  accessTitle: string;
  accessItems: SettingsAccessItem[];
  supportHref: string;
};

export function normalizeUserDomainValue(domain: unknown): string | null {
  if (typeof domain === 'string') {
    return domain;
  }

  if (Array.isArray(domain)) {
    const first = domain.find(item => typeof item === 'string');
    return typeof first === 'string' ? first : null;
  }

  return null;
}

const formatDomain = (domain?: UserDomain | string | string[] | null) => {
  const normalized = normalizeUserDomainValue(domain);

  return normalized
    ? normalized
      .split('_')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
    : 'Account';
};

export function getProfileDisplayName(profile?: Partial<UserProfileType> | null) {
  if (!profile) return 'Account';
  return (
    profile.full_name?.trim() ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() ||
    profile.email ||
    'Account'
  );
}

export function getProfileInitials(profileName: string) {
  return profileName
    .split(' ')
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatDate(value?: string | Date | null) {
  if (!value) return 'Not set';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'Not set';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function displayName(profile?: Partial<UserProfileType> | null) {
  return (
    profile?.full_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
    profile?.email ||
    'Account'
  );
}

export function getSettingsVariantConfig(
  variant: DashboardSettingsVariant,
  profile?: Partial<UserProfileType> | null,
  organisation?: (Organisation & { users?: unknown[]; branches?: unknown[] }) | null
): SettingsVariantConfig {
  const titleByVariant: Record<DashboardSettingsVariant, string> = {
    admin: 'Settings & Configuration',
    student: 'Settings & Configuration',
    instructor: 'Settings & Configuration',
    organisation: 'Settings & Configuration',
    course_creator: 'Settings & Configuration',
  };

  const subtitleByVariant: Record<DashboardSettingsVariant, string> = {
    admin:
      'Manage platform access, account security, and operational settings using the information tied to your admin profile.',
    student:
      'Review your learning account, privacy preferences, and contact information that keeps your student profile up to date.',
    instructor:
      'Keep your teaching profile accurate with the latest professional details, communication preferences, and account controls.',
    organisation:
      'Manage your organisation profile, workspace details, and access rules from the data currently attached to this account.',
    course_creator:
      'Update your creator profile, publishing preferences, and account details so your workspace stays in sync.',
  };

  const supportHref = variant === 'admin' ? '/dashboard/support' : '/help';
  const roleLabel = formatDomain(normalizeUserDomainValue(profile?.user_domain) ?? variant);

  const tabsByVariant: Record<DashboardSettingsVariant, SettingsTabConfig[]> = {
    admin: [
      { value: 'profile', label: 'Profile' },
      { value: 'access', label: 'Platform Access' },
      { value: 'support', label: 'Support' },
      { value: 'advanced-settings', label: 'Advanced Settings' },
    ],
    student: [
      { value: 'profile', label: 'Profile' },
      { value: 'access', label: 'Learning Preferences' },
      { value: 'support', label: 'Support' },
      { value: 'advanced-settings', label: 'Advanced Settings' },
    ],
    instructor: [
      { value: 'profile', label: 'Profile' },
      { value: 'rate', label: 'Rate Card' },
      { value: 'access', label: 'Teaching Settings' },
      { value: 'support', label: 'Support' },
      { value: 'advanced-settings', label: 'Advanced Settings' },
    ],
    organisation: [
      { value: 'profile', label: 'Profile' },
      { value: 'access', label: 'Workspace Rules' },
      { value: 'support', label: 'Support' },
      { value: 'advanced-settings', label: 'Advanced Settings' },
    ],
    course_creator: [
      { value: 'profile', label: 'Profile' },
      { value: 'access', label: 'Publishing Rules' },
      { value: 'support', label: 'Support' },
      { value: 'advanced-settings', label: 'Advanced Settings' },
    ],
  };

  const accessItemsByVariant: Record<DashboardSettingsVariant, SettingsAccessItem[]> = {
    admin: [
      {
        title: 'System rules',
        description: 'Manage platform-wide access and configuration controls.',
        href: '/dashboard/system-config',
      },
      {
        title: 'User governance',
        description: 'Review roles, permissions, and approvals across the platform.',
      },
      {
        title: 'Audit trail',
        description: 'Inspect recent activity tied to your administrator account.',
      },
    ],
    student: [
      {
        title: 'Learning activity',
        description: 'See classes, assignments, and progress connected to your learner profile.',
      },
      {
        title: 'Credentials',
        description: 'Manage badges, certificates, and portfolio items from your account.',
      },
      {
        title: 'Support channel',
        description: 'Use the support widget when you need help with enrollment or billing.',
        href: supportHref,
      },
    ],
    instructor: [
      {
        title: 'Teaching profile',
        description: 'Update your professional headline, website, and bios from the profile tab.',
      },
      {
        title: 'Verification',
        description: 'Keep your instructor profile ready for review and publishing access.',
      },
      {
        title: 'Assigned classes',
        description: 'Review the courses and cohorts attached to your active teaching profile.',
      },
    ],
    organisation: [
      {
        title: 'Organisation record',
        description: 'Edit your workspace identity, address, and license information.',
      },
      {
        title: 'Branches',
        description: 'Track locations and branch-level records linked to this organisation.',
      },
      {
        title: 'Permissions',
        description: 'Control which team members can manage courses and users.',
      },
    ],
    course_creator: [
      {
        title: 'Publishing access',
        description: 'Review course creation access and verification status for your profile.',
      },
      {
        title: 'Creator assets',
        description: 'Keep your bio, website, and headline aligned with your public content.',
      },
      {
        title: 'Collaboration',
        description: 'Track instructors and collaborators attached to your content workflow.',
      },
    ],
  };

  return {
    title: titleByVariant[variant],
    subtitle: subtitleByVariant[variant],
    tabs: tabsByVariant[variant],
    accessTitle:
      variant === 'admin' || variant === 'organisation' ? 'Roles & Permissions' : 'Account Access',
    accessItems: accessItemsByVariant[variant],
    supportHref,
  };
}

export function getVariantSpecificSummary(
  variant: DashboardSettingsVariant,
  profile?: Partial<UserProfileType> | null,
  organisation?: (Organisation & { users?: unknown[]; branches?: unknown[] }) | null
): SettingsSummaryItem[] {
  const joined = formatDate(profile?.created_date ?? null);
  const activeLabel = profile?.active ? 'Active' : 'Inactive';
  const email = profile?.email || 'Not set';
  const phone = profile?.phone_number || 'Not set';
  const domain = formatDomain(normalizeUserDomainValue(profile?.user_domain) ?? variant);

  if (variant === 'organisation') {
    return [
      { label: 'Organisation', value: organisation?.name ?? 'Not set' },
      { label: 'Location', value: organisation?.location ?? 'Not set' },
      { label: 'Country', value: organisation?.country ?? 'Not set' },
      { label: 'Verified', value: organisation?.admin_verified ? 'Verified' : 'Pending' },
    ];
  }

  if (variant === 'student') {
    return [
      { label: 'Student name', value: displayName(profile) },
      { label: 'Email', value: email },
      { label: 'Phone', value: phone },
      { label: 'Joined', value: joined },
    ];
  }

  if (variant === 'instructor') {
    return [
      { label: 'Instructor name', value: displayName(profile) },
      { label: 'Email', value: email },
      { label: 'Website', value: profile?.instructor?.website ?? 'Not set' },
      { label: 'Joined', value: joined },
    ];
  }

  if (variant === 'course_creator') {
    return [
      { label: 'Creator name', value: displayName(profile) },
      { label: 'Email', value: email },
      { label: 'Headline', value: profile?.courseCreator?.professional_headline ?? 'Not set' },
      { label: 'Joined', value: joined },
    ];
  }

  return [
    { label: 'Admin name', value: displayName(profile) },
    { label: 'Email', value: email },
    { label: 'Access', value: activeLabel },
    { label: 'Role', value: domain },
  ];
}

import type { UserDomain } from '@/lib/types';
import {
  BadgeCheck,
  BarChart3,
  Bell,
  BoltIcon,
  BookAIcon,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardCheck,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  GraduationCap,
  Handshake,
  Layers2,
  LayoutDashboard,
  LayoutList,
  LibraryIcon,
  LineChart,
  ListTodo,
  LucideLandmark,
  MapPin,
  PiggyBank,
  Rocket,
  School,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Trophy,
  UserCheck,
  UserIcon,
  UserPlus,
  Users,
  UsersIcon,
  UsersRound,
  Wallet,
  Wrench
} from 'lucide-react';
import type { ComponentType } from 'react';

export type MenuItem = {
  title: string;
  url?: string;
  items?: MenuItem[];
  isActive?: boolean;
  domain?: UserDomain | null;
  launchInNewTab?: boolean;
  icon?: ComponentType<{ className?: string }>;
  requiresAdmin?: boolean;
  user?: MenuItem[];
  admin?: MenuItem[];
  student?: MenuItem[];
  instructor?: MenuItem[];
  organisation_user?: MenuItem[];
  course_creator?: MenuItem[];
};


type MenuSection = {
  title: string
  icon: string
  items: MenuItem[]
}


/**
 * A labelled group of nav items (Lovable-style sidebar sections). A domain's nav
 * may be either a flat `MenuItem[]` or a grouped `MenuGroup[]`; consumers use
 * {@link isMenuGroups} to tell them apart.
 */
export type MenuGroup = {
  label: string;
  items: MenuItem[];
};

export function isMenuGroups(items: MenuItem[] | MenuGroup[]): items is MenuGroup[] {
  const first = items[0] as MenuGroup | MenuItem | undefined;
  return (
    !!first &&
    'label' in first &&
    Array.isArray((first as MenuGroup).items) &&
    !('url' in first) &&
    !('icon' in first)
  );
}

/** Flatten a possibly-grouped nav into a flat list of leaf items. */
export function flattenMenuItems(items: MenuItem[] | MenuGroup[]): MenuItem[] {
  return isMenuGroups(items) ? items.flatMap(group => group.items) : items;
}

function collectMenuUrls(items: MenuItem[]): string[] {
  return items.flatMap(item => [
    ...(item.url ? [item.url] : []),
    ...(item.items ? collectMenuUrls(item.items) : []),
  ]);
}

// Only the single most-specific (longest) matching url is active, so /dashboard/courses/catalog
// activates "Apply to Train" and never also "My Courses" (/dashboard/courses).
function bestActiveUrl(items: MenuItem[], currentPath: string): string {
  let best = '';
  for (const url of collectMenuUrls(items)) {
    if ((currentPath === url || currentPath.startsWith(`${url}/`)) && url.length > best.length)
      best = url;
  }
  return best;
}

function applyActive(items: MenuItem[], bestUrl: string): MenuItem[] {
  return items.map(item => {
    const newItem: MenuItem = { ...item };
    newItem.isActive = Boolean(bestUrl) && item.url === bestUrl;
    if (item.items && item.items.length > 0) {
      newItem.items = applyActive(item.items, bestUrl);
    }
    return newItem;
  });
}

export function markActiveMenuItem(items: MenuItem[], currentPath: string): MenuItem[] {
  return applyActive(items, bestActiveUrl(items, currentPath));
}

export function getMenuWithActivePath(items: MenuItem[], currentPath: string): MenuItem[] {
  return markActiveMenuItem(items, currentPath);
}

type Menu = {
  main: MenuItem[];
  secondary?: MenuItem[];
  user?: MenuItem[];
  admin?: MenuItem[];
  student?: MenuSection[]
  instructor?: MenuItem[];
  organisation_user?: MenuItem[] | MenuGroup[];
  course_creator?: MenuItem[];
  parent?: MenuItem[];
};

export default {
  main: [
    {
      title: 'Course Management',
      icon: LibraryIcon,
      items: [
        {
          title: 'Create New Course',
          url: '/dashboard/courses/create-course',
        },
        {
          title: 'Courses & programs',
          url: '/dashboard/course-management',
        },
      ],
    },
  ] as MenuItem[],
  secondary: [
    process.env.NODE_ENV === 'development' && {
      title: 'API Docs',
      url: 'http://localhost:8080/swagger-ui/index.html',
      icon: FileText,
      launchInNewTab: true,
    },
  ] as MenuItem[],
  user: [
    {
      title: 'Profile',
      url: '/dashboard/profile',
      icon: UserIcon,
    },

    {
      title: 'Account',
      url: '/dashboard/account',
      icon: BoltIcon,
    },
  ],

  // ============================================================
  // STUDENT
  // ============================================================
  student: [
    {
      title: '',
      icon: '',
      items: [
        {
          title: 'Home',
          url: '/dashboard/overview',
          icon: LayoutDashboard,
        },
        {
          title: 'Skills Wallet',
          url: '/dashboard/skills-wallet',
          icon: BadgeCheck,
        },
        {
          title: 'Start a course',
          url: '/dashboard/courses',
          icon: Rocket,
        },
        {
          title: 'Learning Hub',
          url: '/dashboard/learning-hub',
          icon: BookOpen,
        },
        {
          title: 'My Bookings',
          url: '/dashboard/my-bookings',
          icon: CalendarClock,
        },
        {
          title: 'Calendar',
          url: '/dashboard/calendar',
          icon: Calendar,
        },
        {
          title: 'Wallet',
          url: '/dashboard/wallet',
          icon: Wallet,
        },
        {
          title: 'Skills Fund',
          url: '/dashboard/skills-fund',
          icon: PiggyBank,
        },
        {
          title: 'Notifications',
          url: '/dashboard/notifications',
          icon: Bell,
        },
        {
          title: 'Settings',
          url: '/dashboard/settings',
          icon: Settings,
        },
        // {
        //   title: 'My Courses',
        //   url: '/dashboard/courses/my-courses',
        //   icon: School,
        // },
        // {
        //   title: 'Contacts',
        //   url: '/dashboard/contacts',
        //   icon: Users,
        // },
        // {
        //   title: 'Communities',
        //   url: '/dashboard/communities',
        //   icon: Users,
        // },
        // {
        //   title: 'Library',
        //   url: '/dashboard/library',
        //   icon: LucideBookUser,
        // },
        // {
        //   title: 'Assignment',
        //   url: '/dashboard/assignment',
        //   icon: FileText,
        // },
        // {
        //   title: 'Analytics',
        //   url: '/dashboard/analytics',
        //   icon: LineChart,
        // },
        // {
        //   title: 'Profile',
        //   url: '/dashboard/profile',
        //   icon: UserCircle,
        // },
      ],
    },
  ],


  // ============================================================
  // INSTRUCTOR
  // ============================================================
  instructor: [
    {
      title: 'Overview',
      icon: LayoutDashboard,
      items: [
        {
          title: 'Home',
          url: '/dashboard/overview',
          icon: LayoutDashboard,
        },
        {
          title: 'Skills Wallet',
          url: '/dashboard/skills-wallet',
          icon: BadgeCheck,
        },
        {
          title: 'Calendar',
          url: '/dashboard/calendar',
          icon: CalendarClock,
        },
        {
          title: 'Jobs',
          url: '/dashboard/opportunities',
          icon: Handshake,
        },
        {
          title: 'Booking Requests',
          url: '/dashboard/booking-requests',
          icon: CalendarClock,
        },
        {
          title: 'Courses',
          url: '/dashboard/courses',
          icon: GraduationCap,
        },
        {
          title: 'Training Hub',
          url: '/dashboard/training-hub',
          icon: ClipboardList,
        },
        {
          title: 'My Courses',
          url: '/dashboard/my-courses',
          icon: BookOpen,
        },
        {
          title: 'Students',
          url: '/dashboard/students',
          icon: Users,
        },
        {
          title: 'Assignments',
          url: '/dashboard/assignment',
          icon: FileText,
        },
        {
          title: 'Assessment',
          url: '/dashboard/assessment',
          icon: BarChart3,
        },
        {
          title: 'Wallet',
          url: '/dashboard/wallet',
          icon: Wallet,
        },
        {
          title: 'Skills Fund',
          url: '/dashboard/skills-fund',
          icon: PiggyBank,
        },
        // {
        //   title: 'Profile',
        //   url: '/dashboard/profile',
        //   icon: UserCircle,
        // },
        // {
        //   title: 'Revenue',
        //   url: '/dashboard/revenue',
        //   icon: DollarSign,
        // },
        // {
        //   title: 'Payments',
        //   url: '/dashboard/payments',
        //   icon: DollarSign,
        // },
      ],
    },
    {
      title: 'Controls',
      icon: Settings,
      items: [
        {
          title: 'Analytics',
          url: '/dashboard/analytics',
          icon: LineChart,
        },
        {
          title: 'Notifications',
          url: '/dashboard/notifications',
          icon: Bell,
        },
        {
          title: 'Settings',
          url: '/dashboard/settings',
          icon: Settings,
        },
      ],
    },
  ],

  // ============================================================
  // COURSE CREATOR
  // ============================================================
  course_creator: [
    {
      title: 'Overview',
      icon: LayoutDashboard,
      items: [
        {
          title: 'Home',
          url: '/dashboard/overview',
          icon: LayoutDashboard,
        },
        {
          title: 'Skills Wallet',
          url: '/dashboard/skills-wallet',
          icon: BadgeCheck,
        },
        {
          title: 'Courses',
          url: '/dashboard/courses',
          icon: GraduationCap,
        },
        {
          title: 'My Courses',
          url: '/dashboard/course-management',
          icon: BookAIcon,
        },
        {
          title: 'Instructors',
          url: '/dashboard/instructors',
          icon: Users,
        },
        {
          title: 'Applications',
          url: '/dashboard/pending-approvals',
          icon: ListTodo,
        },
        {
          title: 'Rubrics',
          url: '/dashboard/rubrics',
          icon: ClipboardList,
        },
        {
          title: 'Wallet',
          url: '/dashboard/wallet',
          icon: Wallet,
        },
        // {
        //   title: 'Skills Fund',
        //   url: '/dashboard/skills-fund',
        //   icon: PiggyBank,
        // },
        // {
        //   title: 'Profile',
        //   url: '/dashboard/profile',
        //   icon: UserCircle,
        // },
        // {
        //   title: 'Students',
        //   url: '/dashboard/enrollments',
        //   icon: BookOpen,
        // },
        // {
        //   title: 'Library',
        //   url: '/dashboard/library',
        //   icon: Library,
        // },
        // {
        //   title: 'Credentials Vault',
        //   url: '/dashboard/credentials',
        //   icon: Award, // changed (certification/badges)
        // },
        // {
        //   title: 'Payments',
        //   url: '/dashboard/payments',
        //   icon: DollarSign,
        // },
      ],
    },
    {
      title: 'Controls',
      icon: Settings,
      items: [
        {
          title: 'Notifications',
          url: '/dashboard/notifications',
          icon: Bell,
        },
        {
          title: 'Revenue',
          url: '/dashboard/revenue',
          icon: DollarSign,
        },
        {
          title: 'Analytics',
          url: '/dashboard/analytics',
          icon: ChartNoAxesCombined,
        },
        {
          title: 'Settings',
          url: '/dashboard/settings',
          icon: Settings,
        },
      ],
    },
  ],

  // ============================================================
  // ADMIN
  // ============================================================
  // Rebuilt section by section; each item returns as its phase lands.
  admin: [
    {
      title: 'Overview',
      icon: LayoutDashboard,
      items: [
        {
          title: 'Home',
          url: '/dashboard/overview',
          icon: LayoutDashboard,
        },
        {
          title: 'Review inbox',
          url: '/dashboard/inbox',
          icon: ClipboardList,
        },
        {
          title: 'Activity log',
          url: '/dashboard/activity',
          icon: ChartNoAxesCombined,
        },
      ],
    },
    {
      title: 'People',
      icon: Users,
      items: [
        {
          title: 'People',
          url: '/dashboard/people',
          icon: Users,
        },
        {
          title: 'Organisations',
          url: '/dashboard/organisations',
          icon: Building2,
        },
        {
          title: 'Admins & access',
          url: '/dashboard/access',
          icon: BadgeCheck,
        },
      ],
    },
    {
      title: 'Learning',
      icon: BookOpen,
      items: [
        { title: 'Courses', url: '/dashboard/courses', icon: BookOpen },
        { title: 'Programs', url: '/dashboard/programs', icon: Layers2 },
        { title: 'Classes', url: '/dashboard/classes', icon: CalendarClock },
        { title: 'Catalogue', url: '/dashboard/catalogue', icon: ShoppingBag },
        { title: 'Rubrics', url: '/dashboard/rubrics', icon: ClipboardCheck },
        { title: 'Marketplace', url: '/dashboard/marketplace', icon: Briefcase },
      ],
    },
    {
      title: 'Finance',
      icon: ChartNoAxesCombined,
      items: [
        { title: 'Revenue', url: '/dashboard/revenue', icon: ChartNoAxesCombined },
        { title: 'Sales & payments', url: '/dashboard/sales', icon: DollarSign },
        { title: 'Currencies', url: '/dashboard/currencies', icon: DollarSign },
      ],
    },
    {
      title: 'Platform',
      icon: Settings,
      items: [
        { title: 'Categories', url: '/dashboard/platform/categories', icon: BookAIcon },
        { title: 'System rules', url: '/dashboard/platform/rules', icon: BoltIcon },
        { title: 'Config lists', url: '/dashboard/platform/config', icon: Settings },
        { title: 'Notifications', url: '/dashboard/notifications', icon: Bell },
        { title: 'Settings', url: '/dashboard/settings', icon: Settings },
      ],
    },
  ],
  // Exact Lovable navGroups (labels/order/icons). Items are added to each group as
  // their 1:1 page port lands; groups/items not yet ported are omitted (no stubs).
  organisation_user: [
    {
      label: 'Overview',
      items: [
        { title: 'Dashboard', url: '/dashboard/overview', icon: LayoutDashboard },
        { title: 'Calendar', url: '/dashboard/calendar', icon: Calendar },
        { title: 'Notifications', url: '/dashboard/notifications', icon: Bell },
      ],
    },
    {
      label: 'Onboarding',
      items: [
        { title: 'Apply to Train', url: '/dashboard/courses/catalog', icon: Rocket },
        { title: 'My Courses', url: '/dashboard/courses', icon: BookOpen },
        { title: 'My Applications', url: '/dashboard/my-applications', icon: FileText },
        { title: 'Groups', url: '/dashboard/groups', icon: UsersRound },
        { title: 'Job Matches', url: '/dashboard/job-matches', icon: Sparkles },
      ],
    },
    {
      label: 'Operations',
      items: [
        { title: 'Students', url: '/dashboard/students', icon: Users },
        { title: 'Invite Students', url: '/dashboard/invite-students', icon: UserPlus },
        { title: 'Instructors', url: '/dashboard/instructors', icon: UserCheck },
        { title: 'Jobs', url: '/dashboard/jobs', icon: Briefcase },
        { title: 'Classes', url: '/dashboard/classes', icon: LayoutList },
        { title: 'Waiting List', url: '/dashboard/waiting-list', icon: Clock },
        { title: 'Branches', url: '/dashboard/branches', icon: Building2 },
        { title: 'Venues', url: '/dashboard/venues', icon: MapPin },
        { title: 'Equipment', url: '/dashboard/resources', icon: Wrench },
      ],
    },
    {
      label: 'Assessment',
      items: [
        { title: 'Attendance', url: '/dashboard/attendance', icon: ClipboardCheck },
        { title: 'Assignments', url: '/dashboard/assignments', icon: FileText },
        { title: 'Competition', url: '/dashboard/competition', icon: Trophy },
        { title: 'Exams', url: '/dashboard/exams', icon: GraduationCap },
      ],
    },
    {
      label: 'Finance',
      items: [
        { title: 'Skills Wallet', url: '/dashboard/skills-wallet', icon: Wallet },
        { title: 'Skills Fund', url: '/dashboard/skills-fund', icon: PiggyBank },
        { title: 'Earnings', url: '/dashboard/revenue', icon: Tag },
        { title: 'Approvals', url: '/dashboard/approvals', icon: ClipboardCheck },
      ],
    },
    {
      label: 'Insights',
      items: [{ title: 'Reports', url: '/dashboard/audit', icon: BarChart3 }],
    },
    {
      label: 'System',
      items: [{ title: 'Settings', url: '/dashboard/settings', icon: Settings }],
    },
  ],

  // ============================================================
  // PARENT
  // ============================================================
  parent: [
    {
      title: 'Overview',
      icon: LayoutDashboard,
      items: [
        {
          title: 'Home - All courses',
          url: '/dashboard/all-courses',
          icon: School,
        },
        {
          title: 'Overview',
          url: '/dashboard/overview',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Onboarding',
      icon: Handshake,
      items: [
        {
          title: 'Opportunities',
          url: '/dashboard/opportunities',
          icon: Handshake,
        },
      ],
    },
    {
      title: 'Operations',
      icon: Users,
      items: [
        {
          title: 'Attendance',
          url: '/dashboard/attendance',
          icon: CalendarClock,
        },
      ],
    },
    {
      title: 'Assessment',
      icon: ClipboardList,
      items: [],
    },
    {
      title: 'Controls',
      icon: Settings,
      items: [
        {
          title: 'Notifications',
          url: '/dashboard/notifications',
          icon: Bell,
        },
        {
          title: 'Billing',
          url: '/dashboard/billing',
          icon: DollarSign,
        },
      ],
    },
  ],
} as Menu;

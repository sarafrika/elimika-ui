import type { UserDomain } from '@/lib/types';
import {
  Award,
  BadgeCheck,
  BarChart3,
  Bell,
  BoltIcon,
  BookAIcon,
  BookOpen,
  Briefcase,
  Building,
  Building2,
  Calendar,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardList,
  DollarSign,
  FileText,
  GraduationCap,
  Handshake,
  Layers2,
  LayoutDashboard,
  LibraryIcon,
  LineChart,
  LucideLandmark,
  School,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserIcon,
  Users,
  UsersIcon,
  Wallet,
  Warehouse,
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

export function markActiveMenuItem(items: MenuItem[], currentPath: string): MenuItem[] {
  return items.map(item => {
    const newItem: MenuItem = { ...item };
    const itemUrl = item.url;

    // ==> Mark as active only if exact match // newItem.isActive = item.url === currentPath;

    // == Mark as active only if exact match or path starts with item.url
    newItem.isActive =
      typeof itemUrl === 'string' && (currentPath === itemUrl || currentPath.startsWith(itemUrl));

    if (item.items && item.items.length > 0) {
      newItem.items = markActiveMenuItem(item.items, currentPath);

      // ==> Mark parent as active if child is active
      // if (newItem.items.some(child => child.isActive)) newItem.isActive = true
    }

    return newItem;
  });
}

export function getMenuWithActivePath(items: MenuItem[], currentPath: string): MenuItem[] {
  return markActiveMenuItem(items, currentPath);
}

type Menu = {
  main: MenuItem[];
  secondary?: MenuItem[];
  user?: MenuItem[];
  admin?: MenuItem[];
  student?: MenuItem[];
  instructor?: MenuItem[];
  organisation_user?: MenuItem[];
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
          url: '/dashboard/course-management/create-new-course',
        },
        {
          title: 'Drafts',
          url: '/dashboard/course-management/drafts',
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
      title: 'Overview',
      icon: LayoutDashboard,
      items: [
        {
          title: 'Home',
          url: '/dashboard/overview',
          icon: LayoutDashboard,
        },
        {
          title: 'My Skills',
          url: '/dashboard/my-skills',
          icon: BadgeCheck,
        },
        // {
        //   title: 'Profile',
        //   url: '/dashboard/profile',
        //   icon: UserCircle,
        // },
      ],
    },
    // {
    //   title: 'Onboarding',
    //   icon: 'Handshake',
    //   items: [
    //     {
    //       title: 'Invites',
    //       url: '/dashboard/invites',
    //       icon: UserPlus,
    //     },
    //   ],
    // },
    {
      title: 'Operations',
      icon: Users,
      items: [
        {
          title: 'Courses',
          url: '/dashboard/courses',
          icon: GraduationCap,
        },
        // {
        //   title: 'My Courses',
        //   url: '/dashboard/courses/my-courses',
        //   icon: School,
        // },
        {
          title: 'Learning Hub',
          url: '/dashboard/learning-hub',
          icon: BookOpen,
        },
        {
          title: 'Schedule',
          url: '/dashboard/calendar',
          icon: Calendar,
        },
        {
          title: 'Portfolio',
          url: '/dashboard/portfolio',
          icon: Briefcase,
        },
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
      ],
    },
    {
      title: 'Assessment',
      icon: ClipboardList,
      items: [
        {
          title: 'Assignment',
          url: '/dashboard/assignment',
          icon: FileText,
        },
        {
          title: 'Assessment',
          url: '/dashboard/assessment',
          icon: BarChart3,
        },
        {
          title: 'Credentials Vault',
          url: '/dashboard/credentials',
          icon: Award,
        },
      ],
    },
    {
      title: 'Finance',
      icon: '',
      items: [
        {
          title: 'Skills Fund',
          url: '/dashboard/skills-fund',
          icon: Wallet,
        },
        {
          title: 'Payments',
          url: '/dashboard/payments',
          icon: DollarSign,
        },
      ],
    },
    {
      title: 'System',
      icon: Settings,
      items: [
        {
          title: 'Notifications',
          url: '/dashboard/notifications',
          icon: Bell,
        },
        {
          title: 'Analytics',
          url: '/dashboard/analytics',
          icon: LineChart,
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
          title: 'My Skills',
          url: '/dashboard/my-skills',
          icon: BadgeCheck,
        },
        // {
        //   title: 'Profile',
        //   url: '/dashboard/profile',
        //   icon: UserCircle,
        // },
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
        // {
        //   title: 'Enrollments',
        //   url: '/dashboard/enrollments',
        //   icon: BookOpen,
        // },
      ],
    },
    {
      title: 'Operations',
      icon: Users,
      items: [
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
          title: 'Students',
          url: '/dashboard/students',
          icon: Users,
        },
        // {
        //   title: 'Classes',
        //   url: '/dashboard/classes',
        //   icon: School,
        // },
        {
          title: 'Schedule',
          url: '/dashboard/calendar',
          icon: CalendarClock,
        },
        {
          title: 'Portfolio',
          url: '/dashboard/portfolio',
          icon: Briefcase,
        },
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
      ],
    },
    {
      title: 'Assessment',
      icon: ClipboardList,
      items: [
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
          title: 'Credentials Vault',
          url: '/dashboard/credentials',
          icon: Award, // changed (certification/badges)
        },
        // {
        //   title: 'Reviews',
        //   url: '/dashboard/reviews',
        //   icon: Star,
        // },
      ],
    },
    {
      title: 'Controls',
      icon: Settings,
      items: [
        {
          title: 'Skills Fund',
          url: '/dashboard/skills-fund',
          icon: Wallet,
        },
        {
          title: 'Revenue',
          url: '/dashboard/revenue',
          icon: DollarSign,
        },
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
          title: 'My Skills',
          url: '/dashboard/my-skills',
          icon: BadgeCheck,
        },
        // {
        //   title: 'Profile',
        //   url: '/dashboard/profile',
        //   icon: UserCircle,
        // },
      ],
    },
    {
      title: 'Onboarding',
      icon: Handshake,
      items: [
        {
          title: 'Enrollments',
          url: '/dashboard/enrollments',
          icon: BookOpen,
        },
        // {
        //   title: 'Opportunities',
        //   url: '/dashboard/opportunities',
        //   icon: Handshake,
        // },
        // {
        //   title: 'Verification',
        //   url: '/dashboard/verification',
        //   icon: ShieldCheck,
        // },
      ],
    },
    {
      title: 'Operations',
      icon: Users,
      items: [
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
        // {
        //   title: 'My Programs',
        //   url: '/dashboard/programs',
        //   icon: FileStack,
        // },
        {
          title: 'Instructors',
          url: '/dashboard/instructors',
          // url: '/dashboard/training-applications',
          icon: Users,
        },
        {
          title: 'Portfolio',
          url: '/dashboard/portfolio',
          icon: Briefcase,
        },
        // {
        //   title: 'Library',
        //   url: '/dashboard/library',
        //   icon: Library,
        // },
      ],
    },
    {
      title: 'Assessment',
      icon: ClipboardList,
      items: [
        {
          title: 'Rubrics',
          url: '/dashboard/rubrics',
          icon: ClipboardList,
        },
        {
          title: 'Credentials Vault',
          url: '/dashboard/credentials',
          icon: Award, // changed (certification/badges)
        },
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
      ],
    },
    {
      title: 'Onboarding',
      icon: Handshake,
      items: [
        {
          title: 'Pending Approvals',
          url: '/dashboard/pending-approvals',
          icon: ClipboardList,
        },
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
          title: 'Users',
          url: '/dashboard/users',
          icon: UsersIcon,
        },
        {
          title: 'Manage Courses',
          url: '/dashboard/manage-courses',
          icon: BookOpen,
        },
        {
          title: 'Manage Programs',
          url: '/dashboard/manage-programs',
          icon: Layers2,
        },
        // {
        //   title: 'Classes',
        //   url: '/dashboard/classes',
        //   icon: FileStackIcon,
        // },
        {
          title: 'Students',
          url: '/dashboard/students',
          icon: School,
        },
        {
          title: 'Instructors',
          url: '/dashboard/instructors',
          icon: GraduationCap,
        },
        {
          title: 'Course Creators',
          url: '/dashboard/course-creators',
          icon: Sparkles,
        },
        {
          title: 'Organizations',
          url: '/dashboard/organizations',
          icon: Building2,
        },
        {
          title: 'Classes Schedule',
          url: '/dashboard/calendar',
          icon: CalendarClock,
        },
        {
          title: 'Catalogue',
          url: '/dashboard/catalogue',
          icon: ShoppingBag,
        },
        {
          title: 'Administrators',
          url: '/dashboard/administrators',
          icon: ShieldCheck,
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
          title: 'Currencies',
          url: '/dashboard/currencies',
          icon: DollarSign,
        },
        {
          title: 'Financial Overview',
          url: '/dashboard/financial-overview',
          icon: LucideLandmark,
        },
        {
          title: 'System Config',
          url: '/dashboard/system-config',
          icon: Settings,
        },
      ],
    },
  ],

  // ============================================================
  // ORGANISATION USER
  // ============================================================
  organisation_user: [
    {
      title: 'Overview',
      icon: LayoutDashboard,
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard/overview',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Onboarding',
      icon: '',
      items: [
        {
          title: 'Job posts',
          url: '/dashboard/opportunities',
          icon: Handshake,
        },
        {
          title: 'Training requests',
          url: '/dashboard/verification',
          icon: ShieldCheck,
        },
      ],
    },
    {
      title: 'Operations',
      icon: Users,
      items: [
        {
          title: 'Students',
          url: '/dashboard/people?domain=student',
          icon: GraduationCap,
        },
        {
          title: 'Courses',
          url: '/dashboard/courses',
          icon: BookOpen,
        },
        {
          title: 'Classes',
          url: '/dashboard/classes',
          icon: School,
        },
        // {
        //   title: 'Course Management',
        //   url: '/dashboard/course-management',
        //   icon: LibraryIcon,
        // },
        {
          title: 'Instructors',
          url: '/dashboard/people?domain=instructor',
          icon: Briefcase,
        },
        {
          title: 'Users',
          url: '/dashboard/users',
          icon: UserIcon,
        },
        {
          title: 'Training Branches',
          url: '/dashboard/branches',
          icon: Building,
        },
        {
          title: 'Resources',
          url: '/dashboard/resources',
          icon: Warehouse,
        },
        {
          title: 'Schedule',
          url: '/dashboard/calendar',
          icon: CalendarClock,
        },
      ],
    },
    {
      title: 'Assessment',
      icon: ClipboardList,
      items: [
        {
          title: 'Credentials',
          url: '/dashboard/credentials',
          icon: Award,
        },
      ],
    },
    {
      title: 'Controls',
      icon: Settings,
      items: [
        {
          title: 'Revenue',
          url: '/dashboard/revenue',
          icon: DollarSign,
        },
        {
          title: 'Reports',
          url: '/dashboard/audit',
          icon: BarChart3,
        },
        {
          title: 'Organisation',
          url: '/dashboard/account',
          icon: LucideLandmark,
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
  // PARENT
  // ============================================================
  parent: [
    {
      title: 'Overview',
      icon: LayoutDashboard,
      items: [
        {
          title: 'Home - All courses',
          url: '/dashboard/courses',
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
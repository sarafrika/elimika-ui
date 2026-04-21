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
  FileCheck,
  FileStackIcon,
  FileText,
  GraduationCap,
  Handshake,
  Layers2,
  LayoutDashboard,
  LibraryIcon,
  LineChart,
  LucideLandmark,
  PlusCircle,
  School,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserCircle,
  UserIcon,
  Users,
  UsersIcon,
  Wallet
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
  student: [
    {
      title: 'Dashboard',
      url: '/dashboard/overview',
      icon: LayoutDashboard,
    },
    {
      title: 'Skills Wallet Profile',
      url: '/dashboard/my-skills',
      icon: BadgeCheck,
    },
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
      icon: BookOpen, // changed (content-focused vs physical place)
    },
    {
      title: 'Assessment & Competency',
      url: '/dashboard/assessment',
      icon: BarChart3, // changed (evaluation + progress tracking)
    },
    {
      title: 'Assignment',
      url: '/dashboard/assignment',
      icon: FileText, // changed (clearer than checklist for submissions)
    },
    {
      title: 'Schedule',
      url: '/dashboard/schedule',
      icon: Calendar,
    },
    {
      title: 'Credentials',
      url: '/dashboard/credentials',
      icon: Award, // changed (certifications/badges)
    },
    {
      title: 'Portfolio',
      url: '/dashboard/portfolio',
      icon: Briefcase, // changed (personal work showcase)
    },
    {
      title: 'Opportunities',
      url: '/dashboard/opportunities',
      icon: Handshake,
    },
    // {
    //   title: 'Invites',
    //   url: '/dashboard/invites',
    //   icon: UserPlus,
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
    {
      title: 'Skills Fund',
      url: '/dashboard/skills-fund',
      icon: Wallet,
    },
    {
      title: 'Messaging & Notifications',
      url: '/dashboard/messaging-notifications',
      icon: Bell,
    },
    {
      title: 'Report & Analytics',
      url: '/dashboard/progress-analytics',
      icon: LineChart, // changed (clearer trend/progress than generic trending)
    },
    {
      title: 'Profile',
      url: '/dashboard/profile',
      icon: UserCircle,
    },
    {
      title: 'Settings',
      url: '/dashboard/settings',
      icon: Settings,
    },
  ],
  instructor: [
    {
      title: 'Dashboard',
      url: '/dashboard/overview',
      icon: LayoutDashboard,
    },
    {
      title: 'Skills Wallet Profile',
      url: '/dashboard/my-skills',
      icon: BadgeCheck,
    },
    {
      title: 'Calendar',
      url: '/dashboard/calendar',
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
      title: 'Classroom',
      url: '/dashboard/classes',
      icon: School, // changed (more "learning environment" than list)
    },
    {
      title: 'Assignments',
      url: '/dashboard/assignment',
      icon: FileText, // changed (represents tasks/submissions better)
    },
    {
      title: 'Assessment (Competency & Tracking)',
      url: '/dashboard/assessment',
      icon: BarChart3, // changed (analytics + evaluation feel)
    },
    {
      title: 'Credentials',
      url: '/dashboard/credentials',
      icon: Award, // changed (certification/badges)
    },
    {
      title: 'Portfolio',
      url: '/dashboard/portfolio',
      icon: Briefcase,
    },
    // {
    //   title: 'Enrollments',
    //   url: '/dashboard/enrollments',
    //   icon: BookOpen,
    // },
    {
      title: 'Opportunities',
      url: '/dashboard/opportunities',
      icon: Handshake,
    },
    {
      title: 'Skills Fund',
      url: '/dashboard/skills-fund',
      icon: Wallet,
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
    {
      title: 'Revenue',
      url: '/dashboard/revenue',
      icon: DollarSign,
    },
    {
      title: 'Reports & Analytics',
      url: '/dashboard/analytics',
      icon: LineChart, // changed (clearer analytics distinction)
    },
    {
      title: 'Messaging & Notifications',
      url: '/dashboard/messaging-notifications',
      icon: Bell,
    },
    // {
    //   title: 'Reviews',
    //   url: '/dashboard/reviews',
    //   icon: Star,
    // },
    {
      title: 'Profile',
      url: '/dashboard/profile',
      icon: UserCircle,
    },
    {
      title: 'Settings',
      url: '/dashboard/settings',
      icon: Settings,
    },
  ],
  course_creator: [
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
      title: 'My Skills',
      url: '/dashboard/my-skills',
      icon: BadgeCheck,
    },
    {
      title: 'Rubrics',
      url: '/dashboard/rubrics',
      icon: ClipboardList,
    },
    {
      title: 'Instructors',
      url: '/dashboard/instructors',
      // url: '/dashboard/training-applications',
      icon: Users,
    },
    {
      title: 'Notifications',
      url: '/dashboard/notifications',
      icon: Bell,
    },
    {
      title: 'Enrollments',
      url: '/dashboard/enrollments',
      icon: BookOpen,
    },
    // {
    //   title: 'Library',
    //   url: '/dashboard/library',
    //   icon: Library,
    // },
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
    // {
    //   title: 'Verification',
    //   url: '/dashboard/verification',
    //   icon: ShieldCheck,
    // },
    {
      title: 'Profile',
      url: '/dashboard/profile',
      icon: UserCircle,
    },
    {
      title: 'Settings',
      url: '/dashboard/settings',
      icon: Settings,
    },
  ],
  admin: [
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
    {
      title: 'Users',
      url: '/dashboard/users',
      icon: UsersIcon,
    },
    {
      title: 'Courses',
      url: '/dashboard/courses',
      icon: BookOpen,
    },
    {
      title: 'Programs',
      url: '/dashboard/programs',
      icon: Layers2,
    },
    {
      title: 'Classes',
      url: '/dashboard/classes',
      icon: FileStackIcon,
    },
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
      title: 'Catalogue',
      url: '/dashboard/catalogue',
      icon: ShoppingBag,
    },
    {
      title: 'Currencies',
      url: '/dashboard/currencies',
      icon: DollarSign,
    },
    {
      title: 'Administrators',
      url: '/dashboard/administrators',
      icon: ShieldCheck,
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
  organisation_user: [
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
    {
      title: 'Catalogue',
      url: '/dashboard/catalogue',
      icon: ShoppingBag,
    },
    {
      title: 'Training Applications',
      url: '/dashboard/training-applications',
      icon: GraduationCap,
    },
    {
      title: 'My Applications',
      url: '/dashboard/my-applications',
      icon: FileText,
    },
    {
      title: 'Branches',
      url: '/dashboard/branches',
      icon: Building,
    },
    {
      title: 'People',
      url: '/dashboard/people',
      icon: Users,
    },
    {
      title: 'Course Management',
      url: '/dashboard/course-management',
      icon: ClipboardList,
      items: [
        {
          title: 'Create New Course',
          url: '/dashboard/course-management/create-new-course',
          icon: PlusCircle,
        },
        {
          title: 'Drafts',
          url: '/dashboard/course-management/drafts',
          icon: FileText,
        },
        {
          title: 'Published',
          url: '/dashboard/course-management/published',
          icon: FileCheck,
        },
      ],
    },
    {
      title: 'Verification',
      url: '/dashboard/verification',
      icon: ShieldCheck,
      requiresAdmin: true,
    },
    {
      title: 'Audit & Activity',
      url: '/dashboard/audit',
      icon: ClipboardList,
      requiresAdmin: true,
    },
  ],
  parent: [
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
    {
      title: 'Attendance',
      url: '/dashboard/attendance',
      icon: CalendarClock,
    },
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
} as Menu;

import {
  Award,
  BadgeCheck,
  Bell,
  BoltIcon,
  Book,
  BookAIcon,
  BookOpen,
  Building,
  Building2,
  Calendar,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  FileCheck,
  FileText,
  GraduationCap,
  Handshake,
  Layers,
  LayoutDashboard,
  LibraryIcon,
  LucideBookUser,
  LucideLandmark,
  PlusCircle,
  School,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
  UserCircle,
  UserIcon,
  UserPlus,
  Users,
  UsersIcon,
  Wallet,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { UserDomain } from './types';

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

    // ==> Mark as active only if exact match // newItem.isActive = item.url === currentPath;

    // == Mark as active only if exact match or path starts with item.url
    newItem.isActive = currentPath.startsWith(item?.url as any);

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
      title: 'Overview',
      url: '/dashboard/overview',
      icon: LayoutDashboard,
    },
    {
      title: 'Browse Courses',
      url: '/dashboard/browse-courses',
      icon: Book,
    },
    {
      title: 'My Skills',
      url: '/dashboard/my-skills',
      icon: BadgeCheck,
    },
    {
      title: 'Schedule',
      url: '/dashboard/schedule',
      icon: Calendar,
    },
    {
      title: 'Assignment',
      url: '/dashboard/assignment',
      icon: ClipboardCheck,
    },
    {
      title: 'Assessment (Grades)',
      url: '/dashboard/assessment',
      icon: Award,
    },
    {
      title: 'Invites',
      url: '/dashboard/invites',
      icon: UserPlus,
    },
    {
      title: 'Skills Fund',
      url: '/dashboard/skills-fund',
      icon: Wallet,
    },
    {
      title: 'Opportunities',
      url: '/dashboard/opportunities',
      icon: Handshake,
    },
    {
      title: 'Contacts',
      url: '/dashboard/contacts',
      icon: Users,
    },
    {
      title: 'Communities',
      url: '/dashboard/communities',
      icon: Users,
    },
    {
      title: 'Library',
      url: '/dashboard/library',
      icon: LucideBookUser,
    },
    {
      title: 'Notifications',
      url: '/dashboard/notifications',
      icon: Bell,
    },
    {
      title: 'Progress Analytics',
      url: '/dashboard/progress-analytics',
      icon: TrendingUp,
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
      title: 'Overview',
      url: '/dashboard/overview',
      icon: LayoutDashboard,
    },
    {
      title: 'Courses',
      url: '/dashboard/courses',
      icon: BookOpen,
    },
    {
      title: 'My Skills',
      url: '/dashboard/my-skills',
      icon: BadgeCheck,
    },
    {
      title: 'Schedule',
      url: '/dashboard/trainings',
      icon: ClipboardList,
      // items: [
      //   {
      //     title: 'Overview',
      //     url: '/dashboard/trainings/overview',
      //     icon: LayoutDashboard,
      //   },
      //   {
      //     title: 'Timetable',
      //     url: '/dashboard/trainings/timetable',
      //     icon: Calendar,
      //   },
      //   {
      //     title: 'Students',
      //     url: '/dashboard/trainings/students',
      //     icon: Users,
      //   },
      // ],
    },
    {
      title: 'Assessment',
      url: '/dashboard/assessment',
      icon: Layers,
      // items: [
      //   {
      //     title: 'Assignments',
      //     url: '/dashboard/assessment/assignments',
      //     icon: FileText,
      //   },
      //   {
      //     title: 'Quiz',
      //     url: '/dashboard/assessment/quiz',
      //     icon: ListChecks,
      //   },
      //   {
      //     title: 'Exams',
      //     url: '/dashboard/assessment/exams',
      //     icon: FileCheck,
      //   },
      // ],
    },
    {
      title: 'Enrollments',
      url: '/dashboard/enrollments',
      icon: BookOpen,
    },
    {
      title: 'Waiting List',
      url: '/dashboard/waiting-list',
      icon: GraduationCap,
    },
    {
      title: 'Opportunities',
      url: '/dashboard/opportunities',
      icon: Handshake,
      // items: [
      //   {
      //     title: 'Jobs',
      //     url: '/dashboard/opportunities/jobs',
      //     icon: Briefcase,
      //   },
      //   {
      //     title: 'Apprenticeships',
      //     url: '/dashboard/opportunities/apprenticeships',
      //     icon: Wrench,
      //   },
      //   {
      //     title: 'Attachment',
      //     url: '/dashboard/opportunities/attachment',
      //     icon: UserPlus,
      //   },
      // ],
    },
    {
      title: 'Skills Fund',
      url: '/dashboard/skills-fund',
      icon: Wallet,
    },
    {
      title: 'Communities',
      url: '/dashboard/communities',
      icon: Users,
    },
    {
      title: 'Library',
      url: '/dashboard/library',
      icon: LucideBookUser,
    },
    {
      title: 'Revenue',
      url: '/dashboard/revenue',
      icon: DollarSign,
    },
    {
      title: 'Notifications',
      url: '/dashboard/notifications',
      icon: Bell,
    },
    {
      title: 'Analytics',
      url: '/dashboard/analytics',
      icon: ChartNoAxesCombined,
    },
    {
      title: 'Reviews',
      url: '/dashboard/reviews',
      icon: Star,
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
    // {
    //   title: 'Catalogue XXX',
    //   url: '/dashboard/catalogue',
    //   icon: ShoppingBag,
    // },

    // {
    //   title: 'Learning XXX',
    //   url: '/dashboard/learning',
    //   icon: GraduationCap,
    // },
    // {
    //   title: 'Bookings XXX',
    //   url: '/dashboard/bookings',
    //   icon: CalendarClock,
    // },
  ],
  course_creator: [
    {
      title: 'Overview',
      url: '/dashboard/overview',
      icon: LayoutDashboard,
    },
    {
      title: 'Courses',
      url: '/dashboard/course-management',
      icon: BookAIcon,
    },
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

import {
  Award,
  Bell,
  BoltIcon,
  Book,
  BookOpen,
  Building,
  Building2,
  Calendar,
  CalendarClock,
  ChartNoAxesCombined,
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
  LucideReceipt,
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
  Users,
  UsersIcon,
  Wallet
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
      title: 'My Classes',
      url: '/dashboard/my-classes',
      icon: BookOpen,
    },
    {
      title: 'My Schedule',
      url: '/dashboard/my-schedule',
      icon: Calendar,
    },
    {
      title: 'Skills Fund',
      url: '/dashboard/skills-fund',
      icon: Wallet,
    },
    {
      title: 'My Grades',
      url: '/dashboard/grades',
      icon: Award,
    },
    {
      title: 'My Certificates',
      url: '/dashboard/certificates',
      icon: Star,
    },
    {
      title: 'Progress Analytics',
      url: '/dashboard/progress-analytics',
      icon: TrendingUp,
    },
    {
      title: 'Payment History',
      url: '/dashboard/payment-history',
      icon: LucideReceipt,
    },
    {
      title: 'Profile',
      url: '/dashboard/profile',
      icon: UserCircle,
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
      title: 'Catalogue',
      url: '/dashboard/catalogue',
      icon: ShoppingBag,
    },
    {
      title: 'Trainings',
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
      title: 'Learning',
      url: '/dashboard/learning',
      icon: GraduationCap,
    },
    {
      title: 'Bookings',
      url: '/dashboard/bookings',
      icon: CalendarClock,
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
      title: 'Libraries',
      url: '/dashboard/libraries',
      icon: LucideBookUser,
    },
    {
      title: 'Earnings',
      url: '/dashboard/earnings',
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
  ],
  course_creator: [
    {
      title: 'Overview',
      url: '/dashboard/overview',
      icon: LayoutDashboard,
    },
    {
      title: 'Course Management',
      url: '/dashboard/course-management',
      icon: ClipboardList,
      // items: [
      //   {
      //     title: 'Create New Course',
      //     url: '/dashboard/course-management/create-new-course',
      //     icon: PlusCircle,
      //   },
      //   {
      //     title: 'All',
      //     url: '/dashboard/course-management/all',
      //     icon: BookOpen,
      //   },
      //   {
      //     title: 'Drafts',
      //     url: '/dashboard/course-management/drafts',
      //     icon: FileText,
      //   },
      //   {
      //     title: 'Published',
      //     url: '/dashboard/course-management/published',
      //     icon: FileCheck,
      //   },
      // ],
    },
    // {
    //   title: 'Courses',
    //   url: '/dashboard/courses',
    //   icon: BookOpen,
    // },
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
      title: 'Rubrics',
      url: '/dashboard/rubrics',
      icon: GraduationCap,
    },
    {
      title: 'Analytics',
      url: '/dashboard/analytics',
      icon: ChartNoAxesCombined,
    },
    {
      title: 'Verification',
      url: '/dashboard/verification',
      icon: ShieldCheck,
    },
    {
      title: 'Profile',
      url: '/dashboard/profile',
      icon: UserCircle,
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

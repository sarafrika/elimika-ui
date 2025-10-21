import {
  Award,
  BadgePlus,
  Bell,
  BoltIcon,
  Book,
  BookOpen,
  Briefcase,
  Building,
  Building2,
  Calendar,
  CalendarClock,
  ChartNoAxesCombined,
  CheckSquare,
  ClipboardList,
  DollarSign,
  FileCheck,
  FileText,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  LibraryIcon,
  ListChecks,
  LucideBookUser,
  Mails,
  PlusCircle,
  Settings,
  ShieldCheck,
  Star,
  UserCircle,
  UserCog,
  UserIcon,
  UserPlus,
  Users,
  Wallet,
  Wrench
} from 'lucide-react';
import { ComponentType } from 'react';
import { UserDomain } from './types';

export type MenuItem = {
  title: string;
  url?: string;
  items?: MenuItem[];
  isActive?: boolean;
  domain?: UserDomain | null;
  launchInNewTab?: boolean;
  icon?: ComponentType<{ className?: string }>;
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

    // ==> Mark as active only if exact match
    // newItem.isActive = item.url === currentPath;

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
      title: 'My Courses',
      url: '/dashboard/my-courses',
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
      title: 'Trainings',
      url: '/dashboard/trainings',
      icon: ClipboardList,
      items: [
        {
          title: 'Overview',
          url: '/dashboard/trainings/overview',
          icon: LayoutDashboard,
        },
        {
          title: 'Timetable',
          url: '/dashboard/trainings/timetable',
          icon: Calendar,
        },
        {
          title: 'Students',
          url: '/dashboard/trainings/students',
          icon: Users,
        },
      ],
    },
    {
      title: 'Assessment',
      url: '/dashboard/assessment',
      icon: ClipboardList,
      items: [
        {
          title: 'Assignments',
          url: '/dashboard/assessment/assignments',
          icon: FileText,
        },
        {
          title: 'Quiz',
          url: '/dashboard/assessment/quiz',
          icon: ListChecks,
        },
        {
          title: 'Exams',
          url: '/dashboard/assessment/exams',
          icon: FileCheck,
        },
      ],
    },
    {
      title: 'Waiting List',
      url: '/dashboard/waiting-list',
      icon: Mails,
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
      items: [
        {
          title: 'Jobs',
          url: '/dashboard/opportunities/jobs',
          icon: Briefcase,
        },
        {
          title: 'Apprenticeships',
          url: '/dashboard/opportunities/apprenticeships',
          icon: Wrench,
        },
        {
          title: 'Attachment',
          url: '/dashboard/opportunities/attachment',
          icon: UserPlus,
        },
      ],
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
      title: 'Profile',
      url: '/dashboard/profile',
      icon: UserCircle,
    },
    ///
    ///
    ///
    // {
    //   title: 'Course Management',
    //   url: '/dashboard/course-management',
    //   icon: BookOpen,
    // },
    // {
    //   title: 'Programs',
    //   url: '/dashboard/programs',
    //   icon: Layers,
    // },
    // {
    //   title: 'Rubrics Management',
    //   url: '/dashboard/rubric-management',
    //   icon: CheckSquare,
    // },
    // {
    //   title: 'Apply to train',
    //   url: '/dashboard/apply-to-train',
    //   icon: UserCheck,
    // }
  ],
  course_creator: [
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
      title: 'Rubrics Management',
      url: '/dashboard/rubric-management',
      icon: CheckSquare,
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
      title: 'Course Creators',
      url: '/dashboard/course-creators',
      icon: BadgePlus,
    },
    {
      title: 'Instructors',
      url: '/dashboard/instructors',
      icon: Users,
    },
    {
      title: 'Organizations',
      url: '/dashboard/organizations',
      icon: Building2,
    },
  ],
  organisation_user: [
    {
      title: 'Overview',
      url: '/dashboard/overview',
      icon: LayoutDashboard,
    },
    {
      title: 'Instructors',
      url: '/dashboard/instructors',
      icon: Briefcase,
    },
    {
      title: 'Students',
      url: '/dashboard/students',
      icon: Users,
    },
    {
      title: 'Course Management',
      url: '/dashboard/course-management',
      icon: BookOpen,
    },
    {
      title: 'Invites',
      url: '/dashboard/invites',
      icon: Mails,
    },
    {
      title: 'Classes',
      url: '/dashboard/classes',
      icon: ClipboardList,
    },
    {
      title: 'Branches',
      url: '/dashboard/branches',
      icon: Building,
    },
    {
      title: 'Skills Fund',
      url: '/dashboard/skills-fund',
      icon: Wallet,
    },
    {
      title: 'Users',
      url: '/dashboard/users',
      icon: UserCog,
    },
    {
      title: 'Account',
      url: '/dashboard/account',
      icon: Settings,
    },
  ],
} as Menu;

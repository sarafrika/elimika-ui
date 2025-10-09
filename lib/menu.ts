import {
  Award,
  BoltIcon,
  Book,
  BookOpen,
  Briefcase,
  Building,
  Building2,
  Calendar,
  CalendarCheck,
  CheckSquare,
  ClipboardList,
  DollarSign,
  FileText,
  Layers,
  LayoutDashboard,
  LibraryIcon,
  Mails,
  Settings,
  Star,
  UserCheck,
  UserCircle,
  UserCog,
  UserIcon,
  Users,
  WalletMinimal
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
      title: 'Course Management',
      url: '/dashboard/course-management',
      icon: BookOpen,
    },
    {
      title: 'Courses',
      url: '/dashboard/courses',
      icon: BookOpen,
    },
    {
      title: 'Invites',
      url: '/dashboard/invites',
      icon: Mails,
    },
    {
      title: 'Programs',
      url: '/dashboard/programs',
      icon: Layers,
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
      title: 'Apply to train',
      url: '/dashboard/apply-to-train',
      icon: UserCheck,
    },
    {
      title: 'Rubrics Management',
      url: '/dashboard/rubric-management',
      icon: CheckSquare,
    },
    {
      title: 'Assignments',
      url: '/dashboard/assignments',
      icon: Award,
    },

    {
      title: 'Availability',
      url: '/dashboard/availability',
      icon: CalendarCheck,
    },
    {
      title: 'Earnings',
      url: '/dashboard/earnings',
      icon: DollarSign,
    },
    {
      title: 'Rate Card',
      url: '/dashboard/rate-card',
      icon: WalletMinimal,
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
  admin: [
    {
      title: 'Overview',
      url: '/dashboard/overview',
      icon: LayoutDashboard,
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

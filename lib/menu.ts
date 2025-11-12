import {
  Award,
  BadgeDollarSign,
  Bell,
  BellIcon,
  BoltIcon,
  Book,
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
  FileText,
  GitBranch,
  GraduationCap,
  Handshake,
  Layers,
  LayoutDashboard,
  LibraryIcon,
  LucideBookUser,
  Mails,
  MessageCircle,
  PlusCircle,
  School,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  UserCircle,
  UserCog,
  UserIcon,
  Users,
  UsersIcon,
  Wallet,
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
    newItem.isActive = item.url ? currentPath.startsWith(item.url) : false;

    if (item.items && item.items.length > 0) {
      newItem.items = markActiveMenuItem(item.items, currentPath);
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

const studentNav: MenuItem[] = [
  { title: 'Overview', url: '/dashboard/overview', icon: LayoutDashboard },
  { title: 'Browse Courses', url: '/dashboard/browse-courses', icon: Book },
  { title: 'My Classes', url: '/dashboard/my-classes', icon: BookOpen },
  { title: 'My Schedule', url: '/dashboard/my-schedule', icon: Calendar },
  { title: 'Skills Fund', url: '/dashboard/skills-fund', icon: Wallet },
  { title: 'My Grades', url: '/dashboard/grades', icon: Award },
  { title: 'My Certificates', url: '/dashboard/certificates', icon: Star },
  { title: 'Profile', url: '/dashboard/profile', icon: UserCircle },
];

const instructorNav: MenuItem[] = [
  { title: 'Overview', url: '/dashboard/overview', icon: LayoutDashboard },
  { title: 'Courses', url: '/dashboard/courses', icon: BookOpen },
  { title: 'Trainings', url: '/dashboard/trainings', icon: ClipboardList },
  { title: 'Availability', url: '/dashboard/availability', icon: CalendarClock },
  { title: 'Opportunities', url: '/dashboard/opportunities', icon: Handshake },
  { title: 'Analytics', url: '/dashboard/analytics', icon: ChartNoAxesCombined },
  { title: 'Profile', url: '/dashboard/profile', icon: UserCircle },
];

const courseCreatorNav: MenuItem[] = [
  { title: 'Overview', url: '/dashboard/overview', icon: LayoutDashboard },
  {
    title: 'Course Management',
    icon: LibraryIcon,
    items: [
      { title: 'Create New Course', url: '/dashboard/course-management/create-new-course' },
      { title: 'Drafts', url: '/dashboard/course-management/drafts' },
      { title: 'Published', url: '/dashboard/course-management/published', icon: FileCheck },
    ],
  },
  { title: 'Analytics', url: '/dashboard/analytics', icon: ChartNoAxesCombined },
  { title: 'Verification', url: '/dashboard/verification', icon: ShieldCheck },
  { title: 'Profile', url: '/dashboard/profile', icon: UserCircle },
];

const organisationNav: MenuItem[] = [
  { title: 'Overview', url: '/dashboard/overview', icon: LayoutDashboard },
  { title: 'Instructors', url: '/dashboard/instructors', icon: Briefcase },
  { title: 'Students', url: '/dashboard/students', icon: Users },
  { title: 'Course Management', url: '/dashboard/course-management', icon: BookOpen },
  { title: 'Invites', url: '/dashboard/invites', icon: Mails },
  { title: 'Classes', url: '/dashboard/classes', icon: ClipboardList },
  { title: 'Branches', url: '/dashboard/branches', icon: Building },
  { title: 'Skills Fund', url: '/dashboard/skills-fund', icon: Wallet },
  { title: 'Users', url: '/dashboard/users', icon: UserCog },
  { title: 'Account', url: '/dashboard/account', icon: Settings },
];

const adminNav: MenuItem[] = [
  {
    title: 'Admin workspace',
    icon: ShieldCheck,
    items: [
      { title: 'Overview', url: '/dashboard/overview', icon: LayoutDashboard },
      { title: 'Users', url: '/dashboard/users', icon: UsersIcon },
      { title: 'Instructors', url: '/dashboard/instructors', icon: GraduationCap },
      { title: 'Course Creators', url: '/dashboard/course-creators', icon: Sparkles },
      { title: 'Organizations', url: '/dashboard/organizations', icon: Building2 },
      { title: 'Branches', url: '/dashboard/branches', icon: GitBranch },
      { title: 'System Config', url: '/dashboard/system-config', icon: Settings },
    ],
  },
];

const mainNav: MenuItem[] = [
  {
    title: 'Course Management',
    icon: LibraryIcon,
    items: courseCreatorNav[1]?.items ?? [],
  },
  { title: 'Analytics', url: '/dashboard/analytics', icon: ChartNoAxesCombined },
  { title: 'Verification', url: '/dashboard/verification', icon: ShieldCheck },
  { title: 'Profile', url: '/dashboard/profile', icon: UserCircle },
];

const menu: Menu = {
  main: mainNav,
  secondary: [
    process.env.NODE_ENV === 'development' && {
      title: 'API Docs',
      url: 'http://localhost:8080/swagger-ui/index.html',
      icon: FileText,
      launchInNewTab: true,
    },
  ] as MenuItem[],
  user: [
    { title: 'Profile', url: '/dashboard/profile', icon: UserIcon },
    { title: 'Account', url: '/dashboard/account', icon: BoltIcon },
  ],
  admin: adminNav,
  student: studentNav,
  instructor: instructorNav,
  organisation_user: organisationNav,
  course_creator: courseCreatorNav,
};

export default menu;

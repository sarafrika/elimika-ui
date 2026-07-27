import {
  Sidebar,
  SidebarContent,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Award,
  BookOpen,
  CheckSquare,
  ClipboardList,
  DollarSign,
  Layers,
  LayoutDashboard,
  Star,
  UserCircle,
  Users,
  WalletMinimal,
} from 'lucide-react';
import Link from 'next/link';
import type React from 'react';

const instructorMenuItems = [
  {
    title: 'Overview',
    url: '/dashboard/course-creator/overview',
    icon: LayoutDashboard,
  },
  {
    title: 'Course Management',
    url: '/dashboard/course-creator/course-management',
    icon: BookOpen,
  },
  {
    title: 'Programs',
    url: '/dashboard/course-creator/programs',
    icon: Layers,
  },
  {
    title: 'Trainings',
    url: '/dashboard/course-creator/trainings',
    icon: ClipboardList,
  },
  {
    title: 'Rubrics',
    url: '/dashboard/course-creator/rubrics',
    icon: CheckSquare,
  },
  {
    title: 'Assignments',
    url: '/dashboard/course-creator/assignments',
    icon: Award,
  },
  {
    title: 'Students',
    url: '/dashboard/course-creator/students',
    icon: Users,
  },
  {
    title: 'Earnings',
    url: '/dashboard/course-creator/earnings',
    icon: DollarSign,
  },
  {
    title: 'Rate Card',
    url: '/dashboard/course-creator/rate-card',
    icon: WalletMinimal,
  },
  {
    title: 'Reviews',
    url: '/dashboard/course-creator/reviews',
    icon: Star,
  },
  {
    title: 'Profile',
    url: '/dashboard/course-creator/profile',
    icon: UserCircle,
  },
];

function InstructorSidebar(): React.JSX.Element {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroupLabel>Instructor Panel</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {instructorMenuItems.map(item => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarContent>
    </Sidebar>
  );
}

export default InstructorSidebar;

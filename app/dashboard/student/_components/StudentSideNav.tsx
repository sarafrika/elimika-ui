import {
  Sidebar,
  SidebarContent,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Award, BookOpen, Calendar, LayoutDashboard, Star, UserCircle, Wallet } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';

const studentMenuItems = [
  {
    title: 'Overview',
    url: '/dashboard/student/overview',
    icon: LayoutDashboard,
  },
  {
    title: 'My Courses',
    url: '/dashboard/student/courses/my-courses',
    icon: BookOpen,
  },
  {
    title: 'My Schedule',
    url: '/dashboard/student/my-schedule',
    icon: Calendar,
  },
  {
    title: 'Skills Fund',
    url: '/dashboard/student/skills-fund',
    icon: Wallet,
  },
  {
    title: 'My Grades',
    url: '/dashboard/student/grades',
    icon: Award,
  },
  {
    title: 'My Certificates',
    url: '/dashboard/student/certificates',
    icon: Star,
  },
  {
    title: 'Profile',
    url: '/dashboard/student/profile',
    icon: UserCircle,
  },
];

function StudentSidebar(): React.JSX.Element {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroupLabel>Student Panel</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {studentMenuItems.map(item => (
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

export default StudentSidebar;

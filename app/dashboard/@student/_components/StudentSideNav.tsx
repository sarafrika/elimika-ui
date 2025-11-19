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
    url: '/dashboard/overview',
    icon: LayoutDashboard,
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

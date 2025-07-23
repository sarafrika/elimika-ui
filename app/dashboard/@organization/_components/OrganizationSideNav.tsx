import React from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  Building,
  UserCog,
  Settings,
  Briefcase,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import Link from 'next/link';

const organizationMenuItems = [
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
    title: 'Courses',
    url: '/dashboard/courses',
    icon: BookOpen,
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
];

function OrganizationSidebar(): React.JSX.Element {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroupLabel>Organization Panel</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {organizationMenuItems.map(item => (
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

export default OrganizationSidebar;

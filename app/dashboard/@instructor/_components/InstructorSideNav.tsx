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
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const instructorMenuItems = [
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
    title: 'Programs',
    url: '/dashboard/programs',
    icon: Layers,
  },
  {
    title: 'Trainings',
    url: '/dashboard/trainings',
    icon: ClipboardList,
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
    title: 'Students',
    url: '/dashboard/students',
    icon: Users,
  },
  {
    title: 'Earnings',
    url: '/dashboard/earnings',
    icon: DollarSign,
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

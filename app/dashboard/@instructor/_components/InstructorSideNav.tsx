import React from "react"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  Award,
  DollarSign,
  Star,
  UserCircle,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import Link from "next/link"

const instructorMenuItems = [
  {
    title: "Overview",
    url: "/dashboard/overview",
    icon: LayoutDashboard,
  },
  {
    title: "Course Management",
    url: "/dashboard/course-management",
    icon: BookOpen,
  },
  {
    title: "Classes",
    url: "/dashboard/classes",
    icon: ClipboardList,
  },
  {
    title: "Assignments",
    url: "/dashboard/assignments",
    icon: Award,
  },
  {
    title: "Students",
    url: "/dashboard/students",
    icon: Users,
  },
  {
    title: "Earnings",
    url: "/dashboard/earnings",
    icon: DollarSign,
  },
  {
    title: "Reviews",
    url: "/dashboard/reviews",
    icon: Star,
  },
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: UserCircle,
  },
]

function InstructorSidebar(): React.JSX.Element {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroupLabel>Instructor Panel</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {instructorMenuItems.map((item) => (
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
  )
}

export default InstructorSidebar

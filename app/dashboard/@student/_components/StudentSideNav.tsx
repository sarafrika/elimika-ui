import React from "react"
import {
  LayoutDashboard,
  Book,
  Calendar,
  Award,
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

const studentMenuItems = [
  {
    title: "Overview",
    url: "/dashboard/overview",
    icon: LayoutDashboard,
  },
  {
    title: "My Courses",
    url: "/dashboard/my-courses",
    icon: Book,
  },
  {
    title: "My Schedule",
    url: "/dashboard/my-schedule",
    icon: Calendar,
  },
  {
    title: "My Grades",
    url: "/dashboard/grades",
    icon: Award,
  },
  {
    title: "My Certificates",
    url: "/dashboard/certificates",
    icon: Star,
  },
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: UserCircle,
  },
]

function StudentSidebar(): React.JSX.Element {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroupLabel>Student Panel</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {studentMenuItems.map((item) => (
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

export default StudentSidebar

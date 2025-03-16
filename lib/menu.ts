import { ComponentType } from "react"
import { UserRole } from "@/context/user-role-provider"
import { LibraryIcon } from "lucide-react"

export type MenuItem = {
  title: string
  role?: UserRole | null
  url?: string
  items?: MenuItem[]
  isActive?: boolean
  icon?: ComponentType<{ className?: string }>
}

export default {
  navMain: [
    {
      title: "Course Management",
      icon: LibraryIcon,
      role: "instructor",
      items: [
        {
          title: "Create New Course",
          url: "/dashboard/instructor/courses/create"
        }
      ]
    }
  ] as MenuItem[]
} as { navMain: MenuItem[] }
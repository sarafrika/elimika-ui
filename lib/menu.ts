import { ComponentType } from "react"
import { UserRole } from "@/context/user-role-provider"
import { FileText, LibraryIcon } from "lucide-react"

export type MenuItem = {
  title: string
  url?: string
  items?: MenuItem[]
  isActive?: boolean
  role?: UserRole | null
  launchInNewTab?: boolean
  icon?: ComponentType<{ className?: string }>
}

export function markActiveMenuItem(items: MenuItem[], currentPath: string): MenuItem[] {
  return items.map((item) => {
    const newItem: MenuItem = { ...item }

    newItem.isActive = item.url === currentPath

    if (item.items && item.items.length > 0) {
      newItem.items = markActiveMenuItem(item.items, currentPath)

      if (newItem.items.some(child => child.isActive)) {
        newItem.isActive = true
      }
    }

    return newItem
  })
}

export function getMenuWithActivePath(items: MenuItem[], currentPath: string): MenuItem[] {
  return markActiveMenuItem(items, currentPath)
}

type Menu = {
  main: MenuItem[]
  secondary?: MenuItem[]
}

export default {
  main: [
    {
      title: "Course Management",
      icon: LibraryIcon,
      role: "instructor",
      items: [
        {
          title: "Create New Course",
          url: "/dashboard/instructor/course-management/create-new-course"
        }
      ]
    }
  ] as MenuItem[],
  secondary: [
    process.env.NODE_ENV === "development" && {
      title: "API Docs",
      url: "http://localhost:8080/swagger-ui/index.html",
      icon: FileText,
      launchInNewTab: true
    }
  ] as MenuItem[]

} as Menu
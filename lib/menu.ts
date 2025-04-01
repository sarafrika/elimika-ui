import { ComponentType } from "react"
import { BoltIcon, FileText, LibraryIcon, UserIcon } from "lucide-react"
import { UserDomain } from "@/context/auth-provider"

export type MenuItem = {
  title: string
  url?: string
  items?: MenuItem[]
  isActive?: boolean
  domain?: UserDomain | null
  launchInNewTab?: boolean
  icon?: ComponentType<{ className?: string }>
}

export function markActiveMenuItem(
  items: MenuItem[],
  currentPath: string,
): MenuItem[] {
  return items.map((item) => {
    const newItem: MenuItem = { ...item }

    newItem.isActive = item.url === currentPath

    if (item.items && item.items.length > 0) {
      newItem.items = markActiveMenuItem(item.items, currentPath)

      if (newItem.items.some((child) => child.isActive)) {
        newItem.isActive = true
      }
    }

    return newItem
  })
}

export function getMenuWithActivePath(
  items: MenuItem[],
  currentPath: string,
): MenuItem[] {
  return markActiveMenuItem(items, currentPath)
}

type Menu = {
  main: MenuItem[]
  secondary?: MenuItem[]
  user?: MenuItem[]
}

export default {
  main: [
    {
      title: "Course Management",
      icon: LibraryIcon,
      domain: "instructor",
      items: [
        {
          title: "Create New Course",
          url: "/dashboard/instructor/course-management/create-new-course",
        },
        {
          title: "Drafts",
          url: "/dashboard/instructor/course-management/drafts",
        },
      ],
    },
  ] as MenuItem[],
  secondary: [
    process.env.NODE_ENV === "development" && {
      title: "API Docs",
      url: "http://localhost:8080/swagger-ui/index.html",
      icon: FileText,
      launchInNewTab: true,
    },
  ] as MenuItem[],
  user: [
    {
      title: "Profile",
      url: "/dashboard/instructor/profile",
      icon: UserIcon,
      domain: "instructor",
    },

    {
      title: "Profile",
      url: "/dashboard/student/profile",
      icon: UserIcon,
      domain: "student",
    },

    {
      title: "Account",
      url: "/dashboard/organisation-user/account",
      icon: BoltIcon,
      domain: "organisation_user",
    },
  ],
} as Menu

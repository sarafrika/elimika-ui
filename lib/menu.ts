import { ComponentType } from "react"
import {
  BoltIcon,
  FileText,
  LibraryIcon,
  UserIcon,
  Users,
  Building2,
  BookOpen,
} from "lucide-react"
import { UserDomain } from "./types"

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
  admin?: MenuItem[]
}

export default {
  main: [
    {
      title: "Course Management",
      icon: LibraryIcon,
      items: [
        {
          title: "Create New Course",
          url: "/dashboard/course-management/create-new-course",
        },
        {
          title: "Drafts",
          url: "/dashboard/course-management/drafts",
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
      url: "/dashboard/profile",
      icon: UserIcon,
    },

    {
      title: "Account",
      url: "/dashboard/account",
      icon: BoltIcon,
    },
  ],
  student: [
    {
      title: "Courses",
      url: "/dashboard/courses",
      icon: BookOpen,
    },
  ],
  instructor: [
    {
      title: "Courses",
      url: "/dashboard/courses",
      icon: BookOpen,
    },
  ],
  admin: [
    {
      title: "Users",
      url: "/dashboard/instructors",
      icon: Users,
      items: [
        {
          title: "Instructors",
          url: "/dashboard/instructors",
          icon: Users,
        },
        {
          title: "Organizations",
          url: "/dashboard/organizations",
          icon: Building2,
        },
      ],
    },
  ],
} as Menu

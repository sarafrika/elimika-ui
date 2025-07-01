import { ComponentType } from "react"
import {
  BoltIcon,
  FileText,
  LibraryIcon,
  UserIcon,
  Users,
  Building2,
  BookOpen,
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  Building,
  UserCog,
  Settings,
  Award,
  DollarSign,
  Star,
  UserCircle,
  Book,
  Calendar,
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
  user?: MenuItem[]
  admin?: MenuItem[]
  student?: MenuItem[]
  instructor?: MenuItem[]
  organisation_user?: MenuItem[]
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
  student?: MenuItem[]
  instructor?: MenuItem[]
  organisation_user?: MenuItem[]
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
  ],
  instructor: [
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
  ],
  admin: [
    {
      title: "Overview",
      url: "/dashboard/admin/overview",
      icon: LayoutDashboard,
    },
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
  organisation_user: [
    {
      title: "Overview",
      url: "/dashboard/overview",
      icon: LayoutDashboard,
    },
    {
      title: "Instructors",
      url: "/dashboard/instructors",
      icon: Briefcase,
    },
    {
      title: "Students",
      url: "/dashboard/students",
      icon: Users,
    },
    {
      title: "Courses",
      url: "/dashboard/courses",
      icon: BookOpen,
    },
    {
      title: "Classes",
      url: "/dashboard/classes",
      icon: ClipboardList,
    },
    {
      title: "Branches",
      url: "/dashboard/branches",
      icon: Building,
    },
    {
      title: "Users",
      url: "/dashboard/users",
      icon: UserCog,
    },
    {
      title: "Account",
      url: "/dashboard/account",
      icon: Settings,
    },
  ],
} as Menu

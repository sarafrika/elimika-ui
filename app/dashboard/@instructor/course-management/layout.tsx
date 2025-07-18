"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { buttonVariants } from "@/components/ui/button"

interface CourseManagementLayoutProps {
  children: React.ReactNode
}

const sidebarNavItems = [
  {
    title: "Drafts",
    href: "/dashboard/course-management/drafts",
  },
  {
    title: "Published",
    href: "/dashboard/course-management/published",
  },
]

export default function CourseManagementLayout({ children }: CourseManagementLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="space-y-6 p-4 pb-16 md:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Course Management</h2>
          <p className="text-muted-foreground">Manage your course drafts and published courses.</p>
        </div>
      </div>
      <Separator />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-6">
        <aside className="lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-y-1 lg:space-x-0">
            {sidebarNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  pathname === item.href ? "bg-muted hover:bg-muted" : "hover:bg-transparent hover:underline",
                  "justify-start",
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1 lg:max-w-4xl">{children}</div>
      </div>
    </div>
  )
}

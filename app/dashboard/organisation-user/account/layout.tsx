"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ReactNode } from "react"

const sections = [
  /*{
    name: "Training Center",
    href: "/dashboard/organisation-user/account/training-center",
  }*/
  { name: "Admin Profile", href: "/dashboard/organisation-user/account/admin" },
]

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="relative flex min-h-screen p-0">
      <Sidebar
        variant="inset"
        className="relative w-64 border-r bg-white p-0"
        collapsible="none"
      >
        <SidebarContent className="border-none bg-white">
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 py-2 text-sm text-gray-500">
              ACCOUNT SETTINGS
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1 px-2">
              {sections.map((section) => (
                <SidebarMenuItem key={section.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === section.href}
                    className="w-full rounded px-4 py-2 text-left transition hover:bg-gray-100"
                  >
                    <Link href={section.href}>
                      <span>{section.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <main className="flex-1 overflow-auto px-6 py-3">
        <div>{children}</div>
      </main>
    </div>
  )
}

"use client"

import React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { NavMain } from "@/components/nav-main"
import menu from "@/lib/menu"
import { usePathname } from "next/navigation"

function AdminSidebar(): React.JSX.Element {
  const pathname = usePathname()
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <NavMain
              items={menu.admin!}
              activeDomain="admin"
              pathname={pathname}
            />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarContent>
    </Sidebar>
  )
}

export default AdminSidebar

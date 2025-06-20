"use client"
import * as React from "react"
import { LibraryBigIcon } from "lucide-react"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { NavMain } from "@/components/nav-main"
import { useTrainingCenter } from "@/context/training-center-provider"
import menu from "@/lib/menu"
import { NavSecondary } from "@/components/nav-secondary"
import { UserDomain } from "@/lib/types"

export function AppSidebar({
  activeDomain,
  ...props
}: React.ComponentProps<typeof Sidebar> & { activeDomain: UserDomain }) {
  const { trainingCenter } = useTrainingCenter()
  const menuItems = activeDomain ? menu[activeDomain as keyof typeof menu] : []

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={`/dashboard/overview`}>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <LibraryBigIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium capitalize">
                    {trainingCenter?.name}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {menuItems && <NavMain items={menuItems} activeDomain={activeDomain} />}
        {/*<NavOffice office={menu.office} />*/}
        <NavSecondary items={menu?.secondary ?? []} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser items={menu?.user ?? []} />
      </SidebarFooter>
    </Sidebar>
  )
}

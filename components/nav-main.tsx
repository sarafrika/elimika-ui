"use client"

import { ChevronRight, LayoutDashboard } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { getMenuWithActivePath, MenuItem } from "@/lib/menu"
import Link from "next/link"
import * as React from "react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { UserDomain } from "@/lib/types"

export function NavMain({
  items,
  activeDomain,
}: {
  items: MenuItem[]
  activeDomain: UserDomain
}) {
  const pathname = usePathname()
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({})

  const OVERVIEW_PATH = `/dashboard/overview`

  let menuLabel
  switch (activeDomain) {
    case "instructor":
      menuLabel = "Workspace"
      break
    case "student":
      menuLabel = "Learning Hub"
      break
    case "admin":
      menuLabel = "Admin Panel"
      break
    default:
      menuLabel = "Dashboard"
  }

  const filteredItems = items.filter(
    (item) => !item.domain || item.domain === activeDomain,
  )

  const menuWithActivePath = getMenuWithActivePath(filteredItems, pathname)

  const isPathActive = (url: string | undefined) => {
    if (!url) return false
    return pathname === url
  }

  const hasActiveChild = (items: MenuItem[] | undefined) => {
    if (!items) return false
    return items.some((item) => isPathActive(item.url))
  }

  const toggleCollapsible = (key: string) => {
    setOpenStates((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={isPathActive(OVERVIEW_PATH)}>
            <Link href={OVERVIEW_PATH}>
              <LayoutDashboard />
              Overview
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarGroupLabel>{menuLabel}</SidebarGroupLabel>
      {/* <SidebarMenu>
        {menuWithActivePath.map((item, index) => {
          const key = `${item.title}-${index}`
          const isOpen = openStates[key] ?? item.isActive

          return (
            <Collapsible
              key={key}
              asChild
              open={isOpen}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger
                  asChild
                  onClick={() => toggleCollapsible(key)}
                >
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={
                      (hasActiveChild(item.items) && !openStates[key]) ||
                      (!item.items && item.isActive)
                    }
                  >
                    <Link href={item.url || "#"}>
                      {item?.icon && <item.icon />}
                      <span>{item.title}</span>
                      {item.items?.length && (
                        <>
                          <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          <span className="sr-only">Toggle</span>
                        </>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                {item.items?.length ? (
                  <>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem, index) => (
                          <SidebarMenuSubItem key={`${subItem.title}-${index}`}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={subItem.isActive}
                            >
                              <Link href={subItem.url || "#"}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu> */}
    </SidebarGroup>
  )
}

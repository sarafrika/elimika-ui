"use client"

import { markActiveMenuItem, MenuItem } from "@/lib/menu"
import { UserDomain } from "@/lib/types"
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./ui/sidebar"
import Link from "next/link"

export function NavMain({
  items,
  activeDomain,
  pathname,
}: {
  items: MenuItem[]
  activeDomain: UserDomain | null
  pathname: string
}) {
  const markedItems = markActiveMenuItem(items, pathname)

  return (
    <SidebarMenu>
      {markedItems.map((item, index) => {
        if (item.domain && item.domain !== activeDomain) {
          return null
        }
        return (
          <SidebarMenuItem key={index}>
            <SidebarMenuButton isActive={item.isActive} asChild>
              <Link href={item.url!}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

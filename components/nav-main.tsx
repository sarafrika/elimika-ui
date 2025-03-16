"use client"

import { ChevronRight } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar"
import { MenuItem } from "@/lib/menu"
import { useUserRole } from "@/context/user-role-provider"
import Link from "next/link"

export function NavMain({ items }: { items: MenuItem[] }) {
  const { activeRole } = useUserRole()

  let menuLabel
  switch (activeRole) {
    case "instructor":
      menuLabel = "Workspace"
      break
    case "student":
      menuLabel = "Learning Hub"
      break
    default:
      menuLabel = "Dashboard"
  }

  const filteredItems = items.filter((item) => !item.role || item.role === activeRole)

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{menuLabel}</SidebarGroupLabel>
      <SidebarMenu>
        {filteredItems.map((item, index) => (
          <Collapsible key={`${item.title}-${index}`} asChild defaultOpen={item.isActive} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
                  <Link href={item.url || "#"}>
                    {item?.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.items?.length && (
                      <>
                        <ChevronRight
                          className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
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
                          <SidebarMenuSubButton asChild isActive={subItem.isActive}>
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
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

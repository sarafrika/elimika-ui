"use client"

import Link from "next/link"
import { Folder, MoreHorizontal, Share, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"
import { getMenuWithActivePath, MenuItem } from "@/lib/menu"
import { usePathname } from "next/navigation"
import { ComponentPropsWithoutRef } from "react"

interface NavOfficeProps {
  items: MenuItem[]
}

export function NavOffice({ items, ...props }: NavOfficeProps & ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { isMobile } = useSidebar()
  const pathname = usePathname()

  const menuWithActivePath = getMenuWithActivePath(items, pathname)

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden" {...props}>
      <SidebarGroupLabel className="mb-2 px-2 text-xs font-medium text-muted-foreground">
        Office
      </SidebarGroupLabel>
      <SidebarMenu className="gap-0.5">
        {menuWithActivePath.map((item, index) => (
          <SidebarMenuItem key={`${item.title}-${index}`}>
            <SidebarMenuButton asChild isActive={item.isActive}>
              <Link href={item.url || "#"} className="flex items-center gap-3">
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>View Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Share Project</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="flex items-center gap-3">
            <MoreHorizontal className="h-4 w-4" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
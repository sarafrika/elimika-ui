import { getMenuWithActivePath, MenuItem } from "@/lib/menu"
import { ComponentPropsWithoutRef } from "react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useUserStore } from "@/store/use-user-store"

interface NavSecondaryProps {
  items: MenuItem[]
}

export function NavSecondary({
  items,
  ...props
}: NavSecondaryProps & ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()
  const activeDomain = useUserStore(store => store.activeDomain)

  const filteredItems = items.filter(
    (item) => !item.domain || item.domain === activeDomain,
  )

  const menuWithActivePath = getMenuWithActivePath(filteredItems, pathname)

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {menuWithActivePath.map((item, index) => (
            <SidebarMenuItem key={`${item.title}-${index}`}>
              <SidebarMenuButton asChild size="sm" isActive={item.isActive}>
                <Link
                  href={item.url || "#"}
                  target={item.launchInNewTab ? "_blank" : "_self"}
                  rel={item.launchInNewTab ? "noopener noreferrer" : ""}
                  className="flex items-center gap-3"
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

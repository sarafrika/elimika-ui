"use client"

import { ChevronsUpDown, LogOut } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { MenuItem } from "@/lib/menu"
import { useUserStore } from "@/store/use-user-store"
import { signOut } from "@/services/auth"

type NavUserProps = {
  items: MenuItem[]
}

export function NavUser({ items }: NavUserProps) {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const { data: session } = useSession()
  const activeDomain = useUserStore(state => state.activeDomain)

  const userInitials =
    session?.user?.name
      ?.split(" ")
      ?.slice(0, 2)
      ?.map((name) => name?.[0])
      ?.join("") || ""

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-colors"
            >
              <Avatar className="bg-background h-8 w-8 rounded-md border">
                <AvatarImage
                  src={session?.user?.image ?? ""}
                  alt={session?.user?.name ?? ""}
                />
                <AvatarFallback className="rounded-md text-xs font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">
                    {session?.user?.name}
                  </span>
                  <Badge
                    variant="outline"
                    className="border-primary/20 text-primary h-5 px-1.5 py-0 text-[10px] font-normal capitalize"
                  >
                    {activeDomain}
                  </Badge>
                </div>
                <span className="text-muted-foreground truncate text-xs">
                  {session?.user?.email}
                </span>
              </div>
              <ChevronsUpDown className="text-muted-foreground ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl border bg-white p-4 shadow-md"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <div className="flex flex-col">
              {/* User Info */}
              <div className="mb-4 flex items-center gap-3">
                <Avatar className="bg-background h-10 w-10 rounded-md border">
                  <AvatarImage
                    src={session?.user?.image ?? ""}
                    alt={session?.user?.name ?? ""}
                  />
                  <AvatarFallback className="rounded-md text-sm font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-foreground text-sm font-medium">
                    {session?.user?.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {session?.user?.email}
                  </span>
                </div>
              </div>
              <DropdownMenuSeparator className="my-2" />
              {/* Profile & Logout Actions */}
              <div className="mt-0.5 flex flex-col gap-1">
                {items.map((item) => (
                  <div
                    key={item.title}
                    onClick={() => item.url && router.push(item.url)}
                    className="hover:bg-muted text-foreground flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
                  >
                    {item.icon && <item.icon className="size-4" />}
                    <span>{item.title}</span>
                  </div>
                ))}

                {/* Logout using Auth.js server action pattern */}
                <form
                  action={async () => {
                    await signOut({ redirectTo: "/" })
                  }}
                >
                  <button
                    type="submit"
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="size-4" />
                    <span>Log out</span>
                  </button>
                </form>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
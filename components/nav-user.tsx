"use client"

import { ChevronsUpDown, LogOut, UserIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { useSessionContext } from "@/context/session-provider-wrapper"
import { Badge } from "@/components/ui/badge"
import { useMemo } from "react"
import { useAuth, UserDomain } from "@/context/auth-provider"
import { useRouter } from "next/navigation"
import { MenuItem } from "@/lib/menu"



type NavUserProps = {
  items: MenuItem[]
}

export function NavUser({ items }: NavUserProps) {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const { session } = useSessionContext()
  const { domains, activeDomain, setActiveDomain } = useAuth()

  const userInitials =
    session?.user?.name
      ?.split(" ")
      ?.slice(0, 2)
      ?.map((name) => name?.[0])
      ?.join("") || ""

  const hasMultipleDomains = domains.length > 1
  const formatDomain = useMemo(
    () => (domain: UserDomain) => domain.replace(/_/g, " "),
    [],
  )

  const formatDomainRoute = useMemo(
    () => (domain: UserDomain) => domain.replace(/_/g, "-"),
    [],
  )

  const filteredItems = items.filter(
    (item) => !item.domain || item.domain === activeDomain,
  )

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

              {/* Domain Switcher */}
              <div>
                <div className="text-muted-foreground mb-2 text-xs font-medium">
                  {hasMultipleDomains ? "Switch Domain" : "Current Domain"}
                </div>
                {hasMultipleDomains ? (
                  <DropdownMenuRadioGroup
                    value={activeDomain || ""}
                    onValueChange={(value) =>
                      setActiveDomain(value as UserDomain)
                    }
                    className="flex flex-col gap-1"
                  >
                    {domains.map((domain) => (
                      <div
                        key={domain}
                        className={`flex items-center rounded-md px-2 py-1.5 text-sm ${domain === activeDomain
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted cursor-pointer"
                          }`}
                        onClick={() => setActiveDomain(domain)}
                      >
                        <div className="mr-2 flex h-4 w-4 items-center justify-center">
                          {domain === activeDomain ? (
                            <div className="bg-primary h-2 w-2 rounded-full" />
                          ) : (
                            <div className="border-muted-foreground h-2 w-2 rounded-full border" />
                          )}
                        </div>
                        <span className="flex-1 capitalize">
                          {formatDomain(domain)}
                        </span>
                        {domain === activeDomain && (
                          <Badge
                            variant="outline"
                            className="border-primary/20 text-primary ml-auto px-2 py-0.5 text-xs font-normal"
                          >
                            Active
                          </Badge>
                        )}
                      </div>
                    ))}
                  </DropdownMenuRadioGroup>
                ) : (
                  <div className="bg-primary/10 flex items-center rounded-md px-2 py-1.5 text-sm">
                    <div className="mr-2 flex h-4 w-4 items-center justify-center">
                      <div className="bg-primary h-2 w-2 rounded-full" />
                    </div>
                    <span className="text-primary flex-1 font-medium capitalize">
                      {activeDomain}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-primary/20 text-primary ml-auto px-2 py-0.5 text-xs font-normal"
                    >
                      Active
                    </Badge>
                  </div>
                )}
              </div>

              <DropdownMenuSeparator className="my-2" />
              {/* Profile & Logout Actions */}
              <div className="mt-0.5 flex flex-col gap-1">
                {filteredItems.map((item) => (
                  <div
                    key={item.title}
                    onClick={() => item.url && router.push(item.url)}
                    className="hover:bg-muted text-foreground flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
                  >
                    {item.icon && <item.icon className="size-4" />}
                    <span>{item.title}</span>
                  </div>
                ))}

                <div
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  onClick={async () => await signOut()}
                >
                  <LogOut className="size-4" />
                  <span>Log out</span>
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

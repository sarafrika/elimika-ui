"use client"

import { ChevronsUpDown, LogOut } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { useSessionContext } from "@/context/session-provider-wrapper"
import { Badge } from "@/components/ui/badge"
import { useMemo } from "react"
import { useAuth, UserDomain } from "@/context/auth-provider"

export async function logout() {
  try {
    await fetch("/api/auth/logout").then(() => {
      signOut({ callbackUrl: "/" }).then(() => {
        toast.success("You have been logged out successfully.")
      })
    })
  } catch (error) {
    console.error("Error logging out:", error)
    toast.error(error instanceof Error ? error.message : "Something went wrong while logging out. Please try again.")
  }
}

export function NavUser() {
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
  const formatDomain = useMemo(() => (domain: UserDomain) => domain.replace(/_/g, " "), [])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-colors"
            >
              <Avatar className="h-8 w-8 rounded-md border bg-background">
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
                    className="h-5 py-0 px-1.5 text-[10px] font-normal border-primary/20 text-primary capitalize"
                  >
                    {activeDomain}
                  </Badge>
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  {session?.user?.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 p-2 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <div className="flex flex-col space-y-4">
              <div className="flex items-center gap-3 px-1">
                <Avatar className="h-10 w-10 rounded-md border bg-background">
                  <AvatarImage
                    src={session?.user?.image ?? ""}
                    alt={session?.user?.name ?? ""}
                  />
                  <AvatarFallback className="rounded-md text-sm font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {session?.user?.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {session?.user?.email}
                  </span>
                </div>
              </div>

              <div className="px-1">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  {hasMultipleDomains ? "Switch Domain" : "Current Domain"}
                </div>
                {hasMultipleDomains ? (
                  <DropdownMenuRadioGroup
                    value={activeDomain || ""}
                    onValueChange={(value) => setActiveDomain(value as UserDomain)}
                    className="flex flex-col gap-1"
                  >
                    {domains.map((domain) => (
                      <div
                        key={domain}
                        className={`
                          flex items-center px-2 py-1.5 rounded-md text-sm
                          ${domain === activeDomain
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted cursor-pointer"}
                        `}
                        onClick={() => setActiveDomain(domain)}
                      >
                        <div className="w-4 h-4 mr-2 flex items-center justify-center">
                          {domain === activeDomain ? (
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                          ) : (
                            <div className="w-2 h-2 rounded-full border border-muted-foreground"></div>
                          )}
                        </div>
                        <span className="capitalize flex-1">{formatDomain(domain)}</span>
                        {domain === activeDomain && (
                          <Badge
                            variant="outline"
                            className="ml-auto py-0.5 px-2 text-xs font-normal border-primary/20 text-primary"
                          >
                            Active
                          </Badge>
                        )}
                      </div>
                    ))}
                  </DropdownMenuRadioGroup>
                ) : (
                  <div className="flex items-center px-2 py-1.5 rounded-md text-sm bg-primary/10">
                    <div className="w-4 h-4 mr-2 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                    <span className="capitalize flex-1 text-primary font-medium">{activeDomain}</span>
                    <Badge
                      variant="outline"
                      className="ml-auto py-0.5 px-2 text-xs font-normal border-primary/20 text-primary"
                    >
                      Active
                    </Badge>
                  </div>
                )}
              </div>

              <div
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md cursor-pointer transition-colors"
                onClick={async () => await logout()}
              >
                <LogOut className="size-4" />
                <span>Log out</span>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useSessionContext } from "@/context/session-provider-wrapper"
import { usePathname, useRouter } from "next/navigation"
import menu, { MenuItem } from "@/lib/menu"
import { useDomainStore } from "@/store/use-domain-store"

export type UserDomain = "instructor" | "student" | "organisation_user" | "admin"

interface AuthContextType {
  domains: UserDomain[];
  activeDomain: UserDomain | null;
  isLoading: boolean;
  isLoggedIn: boolean;

  setActiveDomain(domain: UserDomain): void;
}

const AuthContext = createContext<AuthContextType>({
  domains: [],
  activeDomain: null,
  isLoading: true,
  isLoggedIn: false,
  setActiveDomain: () => {
  }
})

const publicPaths = ["/", "/auth/create-account"]

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const pathname = usePathname()
  const { session, status } = useSessionContext()
  const domains = useDomainStore((state) => state.domains)
  const activeDomain = useDomainStore((state) => state.activeDomain)
  const setDomains = useDomainStore((state) => state.setDomains)
  const setActiveDomain = useDomainStore((state) => state.setActiveDomain)
  const resetDomains = useDomainStore((state) => state.resetDomains)
  const [isAuthenticating, setIsAuthenticating] = useState(true)

  const formatDomain = useMemo(() => (domain: UserDomain) => domain.replace(/_/g, "-"), [])

  const isAuthorizedPath = useMemo(() => {
    return (path: string, userDomains: UserDomain[], currentActiveDomain: UserDomain | null): boolean => {
      for (const domain of userDomains) {
        if (path === `/dashboard/${formatDomain(domain)}/overview`) {
          return true
        }
      }

      function searchMenuItems(items: MenuItem[], domain: string): boolean {
        for (const item of items) {
          const itemDomain = item.domain || null
          if (itemDomain !== null && itemDomain !== domain) {
            continue
          }
          if (item.url === path) {
            return true
          }
          if (item.items && item.items.length > 0) {
            if (searchMenuItems(item.items, domain)) {
              return true
            }
          }
        }
        return false
      }

      if (currentActiveDomain) {
        if (menu.main && searchMenuItems(menu.main, currentActiveDomain)) {
          return true
        }
        return !!(menu.secondary && searchMenuItems(menu.secondary, currentActiveDomain))
      }

      for (const domain of userDomains) {
        if (menu.main && searchMenuItems(menu.main, domain)) {
          return true
        }
        if (menu.secondary && searchMenuItems(menu.secondary, domain)) {
          return true
        }
      }

      return false
    }
  }, [formatDomain])

  useEffect(() => {
    if (status === "authenticated" && session?.decoded?.user_domain) {
      const userDomain = session.decoded.user_domain

      let userDomains: UserDomain[] = []
      if (Array.isArray(userDomain)) {
        userDomain.forEach(domain => {
          if (["instructor", "student", "organisation_user", "admin"].includes(domain)) {
            userDomains.push(domain)
          }
        })
      }

      setDomains(userDomains)
      setIsAuthenticating(false)
    } else if (status === "unauthenticated") {
      resetDomains()
      setIsAuthenticating(false)
    }
  }, [session?.decoded?.user_domain, status, setDomains, resetDomains])

  useEffect(() => {
    if (status === "loading" || isAuthenticating) {
      return
    }

    if (status === "authenticated" && domains.length > 0) {
      const isPublicPath = publicPaths.includes(pathname)

      if (!isPublicPath && !isAuthorizedPath(pathname, domains, activeDomain)) {
        const dashboardPath = activeDomain
          ? `/dashboard/${formatDomain(activeDomain)}/overview`
          : `/dashboard/${formatDomain(domains[0])}/overview`
        router.push(dashboardPath)
      }
    }
  }, [
    pathname,
    router,
    status,
    domains,
    activeDomain,
    formatDomain,
    isAuthorizedPath,
    isAuthenticating
  ])

  useEffect(() => {
    if (activeDomain && status === "authenticated" && !isAuthenticating) {
      router.push(`/dashboard/${formatDomain(activeDomain)}/overview`)
    }
  }, [activeDomain, router, status, formatDomain, isAuthenticating])

  const value = {
    domains,
    activeDomain,
    setActiveDomain,
    isLoading: status === "loading" || isAuthenticating,
    isLoggedIn: status === "authenticated"
  }

  if (status === "loading" || isAuthenticating) {
    return (
      <AuthContext.Provider value={value}>
        <div className="flex h-screen w-screen items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 mb-3"></div>
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
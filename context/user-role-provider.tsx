"use client"
import { createContext, useContext, useEffect, useMemo } from "react"
import { useSessionContext } from "@/context/session-provider-wrapper"
import { useRouter } from "next/navigation"
import { useRoleStore } from "@/store/use-role-store"

export type UserRole = "instructor" | "student" | "organisation_user" | "admin"

interface UserRoleContextType {
  roles: UserRole[];
  activeRole: UserRole | null;
  isLoading: boolean;
  isLoggedIn: boolean;

  setActiveRole(role: UserRole): void;
}

const UserRoleContext = createContext<UserRoleContextType>({
  roles: [],
  activeRole: null,
  isLoading: true,
  isLoggedIn: false,
  setActiveRole: () => {
  }
})

export const UserRoleProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const { session, status } = useSessionContext()

  const roles = useRoleStore((state) => state.roles)
  const activeRole = useRoleStore((state) => state.activeRole)
  const setRoles = useRoleStore((state) => state.setRoles)
  const setActiveRole = useRoleStore((state) => state.setActiveRole)
  const resetRoles = useRoleStore((state) => state.resetRoles)

  const formatRole = useMemo(() => (role: UserRole) => role.replace(/_/g, "-"), [])

  useEffect(() => {
    if (status === "authenticated" && session?.decoded?.user_domain) {
      const userDomain = session.decoded.user_domain
      let userRoles: UserRole[] = []

      if (Array.isArray(userDomain)) {
        userDomain.forEach(domain => {
          const role = domain as UserRole
          if (["instructor", "student", "organisation_user", "admin"].includes(role)) {
            userRoles.push(role)
          }
        })
      }

      setRoles(userRoles)
    } else if (status === "unauthenticated") {
      resetRoles()
    }
  }, [session?.decoded?.user_domain, status, setRoles, resetRoles])

  useEffect(() => {
    if (activeRole && status === "authenticated") {
      router.push(`/dashboard/${formatRole(activeRole)}/overview`)
    } else if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [activeRole, router, status, formatRole])

  const value = {
    roles,
    activeRole,
    setActiveRole,
    isLoading: status === "loading",
    isLoggedIn: status === "authenticated"
  }

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  )
}

export const useUserRole = () => useContext(UserRoleContext)
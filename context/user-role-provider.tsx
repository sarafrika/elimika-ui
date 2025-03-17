"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useSessionContext } from "@/context/session-provider-wrapper"
import { useRouter } from "next/navigation"

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
  const [roles, setRoles] = useState<UserRole[]>([])
  const [activeRole, setActiveRole] = useState<UserRole | null>(null)

  const formatRole = useMemo(() => (role: UserRole) => role.replace(/_/g, "-"), [])

  useEffect(() => {
    if (status === "authenticated" && session?.decoded?.user_domain) {
      const userDomain = session.decoded.user_domain

      let userRoles: UserRole[] = []
      const addRole = (role: UserRole) => userDomain.includes(role) && userRoles.push(role)
      if (Array.isArray(userDomain)) {
        userDomain.forEach(domain => addRole(domain as UserRole))
      }

      setRoles(userRoles)
      setActiveRole(userRoles[0] || null)
    } else {
      setRoles([])
      setActiveRole(null)
    }
  }, [session?.decoded?.user_domain, status])

  useEffect(() => {
    if (activeRole) {
      router.push(`/dashboard/${formatRole(activeRole)}/overview`)
    } else {
      router.push("/dashboard")
    }
  }, [activeRole, router])

  return (
    <UserRoleContext.Provider value={{
      roles,
      activeRole,
      setActiveRole,
      isLoading: status === "loading",
      isLoggedIn: status === "authenticated"
    }}>
      {children}
    </UserRoleContext.Provider>
  )
}

export const useUserRole = () => useContext(UserRoleContext)

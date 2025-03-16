"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useSessionContext } from "@/context/session-provider-wrapper"
import { useRouter } from "next/navigation"

export type UserRole = "instructor" | "student"

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

  useEffect(() => {
    if (status === "authenticated" && session?.decoded?.user_domain) {
      const userDomain = session.decoded.user_domain

      let userRoles: UserRole[] = []
      if (Array.isArray(userDomain)) {
        if (userDomain.includes("instructor")) userRoles.push("instructor")
        if (userDomain.includes("student")) userRoles.push("student")
      }

      setRoles(userRoles)
      setActiveRole(userRoles[0] || null)
    } else {
      setRoles([])
      setActiveRole(null)
    }
  }, [session?.decoded?.user_domain, status])

  useEffect(() => {
    switch (activeRole) {
      case "instructor":
        router.push("/dashboard/instructor/overview")
        break
      case "student":
        router.push("/dashboard/student/overview")
        break
      default:
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

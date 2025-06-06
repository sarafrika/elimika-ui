"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useSessionContext } from "@/context/session-provider-wrapper"
import { usePathname, useRouter } from "next/navigation"
import { useDomainStore } from "@/store/use-domain-store"
import { useQuery } from "@tanstack/react-query"
import { getUserProfile } from "@/services/user/actions"

interface AuthContextType {
  domains: UserDomain[]
  activeDomain: UserDomain | null
  isLoading: boolean
  setActiveDomain: (domain: UserDomain) => void
  isLoggedIn: boolean
}

const AuthContext = createContext<AuthContextType>({
  domains: [],
  activeDomain: null,
  setActiveDomain: () => { },
  isLoading: true,
  isLoggedIn: false,
})


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const pathname = usePathname()
  const { session, status } = useSessionContext()
  const domains = useDomainStore((state) => state.domains)
  const activeDomain = useDomainStore((state) => state.activeDomain)
  const setDomains = useDomainStore((state) => state.setDomains)
  const setActiveDomain = useDomainStore((state) => state.setActiveDomain)
  const resetDomains = useDomainStore((state) => state.resetDomains)
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUserProfile(),
    enabled: status === "authenticated",
  })



  // useEffect(() => {
  //   if (status === "authenticated" && user?.data) {
  //     const userDomains = user.data.roles
  //     if (userDomains) {
  //       if (userDomains.includes("admin")) {
  //         setActiveDomain("admin")
  //       } else if (userDomains.includes("instructor")) {
  //         setActiveDomain("instructor")
  //       } else if (userDomains.includes("student")) {
  //         setActiveDomain("student")
  //       }
  //       setDomains(userDomains)
  //     }
  //   }
  //   else {
  //     resetDomains()
  //   }
  // }, [user?.data, status, setDomains, resetDomains])



  const value = {
    domains,
    activeDomain,
    setActiveDomain,
    isLoading: status === "loading",
    isLoggedIn: status === "authenticated",
  }

  if (status === "loading") {
    return (
      <AuthContext.Provider value={value}>
        <div className="flex h-screen w-screen items-center justify-center">
          <div className="flex animate-pulse flex-col items-center">
            <div className="mb-3 h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      </AuthContext.Provider>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

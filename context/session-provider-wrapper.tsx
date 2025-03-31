"use client"

import { KeycloakSession } from "@/app/api/auth/[...nextauth]/_utils"
import { createContext, ReactNode, useContext } from "react"
import { useSession } from "next-auth/react"

interface SessionContextType {
  session: KeycloakSession | null
  status: "loading" | "authenticated" | "unauthenticated"
}

const SessionContext = createContext<SessionContextType | null>(null)

export function SessionProviderWrapper({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession() as {
    data: KeycloakSession | null
    status: "loading" | "authenticated" | "unauthenticated"
  }

  return (
    <SessionContext.Provider value={{ session, status }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSessionContext() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error(
      "useSessionContext must be used within a SessionProviderWrapper",
    )
  }
  return context
}

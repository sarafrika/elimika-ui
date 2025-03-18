"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import { SessionProviderWrapper } from "@/context/session-provider-wrapper"
import { AuthProvider } from "@/context/auth-provider"

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SessionProviderWrapper>
        <AuthProvider>
          {children}
        </AuthProvider>
      </SessionProviderWrapper>
    </SessionProvider>
  )
}
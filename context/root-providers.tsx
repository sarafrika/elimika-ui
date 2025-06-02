"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import { SessionProviderWrapper } from "@/context/session-provider-wrapper"
import { AuthProvider } from "@/context/auth-provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

export function RootProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <SessionProviderWrapper>
          {/* <AuthProvider>{children}</AuthProvider> */}
          {children}
        </SessionProviderWrapper>
      </SessionProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

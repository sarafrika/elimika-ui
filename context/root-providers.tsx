"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import { AuthProvider } from "@/context/auth-provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

export function RootProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AuthProvider>{children}</AuthProvider>
        {children}
      </SessionProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

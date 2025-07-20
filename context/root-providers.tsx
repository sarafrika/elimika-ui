"use client"

import { SessionProvider, useSession } from "next-auth/react"
import { ReactNode, useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useUserStore } from "@/store/use-user-store"
import UserContextProvider from "./user-context"

function UserFetcher() {
  const { data: session, status } = useSession()
  const { fetchCurrentUser, isLoading } = useUserStore()

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchCurrentUser()
    }
  }, [status, session, fetchCurrentUser])

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex animate-pulse flex-col items-center">
          <div className="mb-3 h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    )
  }
  return null
}

export function RootProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {/* <UserFetcher /> */}
        <UserContextProvider>
          {children}
        </UserContextProvider>
      </SessionProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

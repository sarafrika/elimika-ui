"use client"
import { createContext, useContext, useEffect } from "react"
import { useUserStore } from "@/store/use-user-store"
import { User } from "@/services/api/schema"
import ErrorPage from "@/components/ErrorPage"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  activeDomain: UserDomain | null

}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  activeDomain: null,
})


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, error, activeDomain, fetchCurrentUser } = useUserStore()
  useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex animate-pulse flex-col items-center">
          <div className="mb-3 h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    )
  }
  if (error) {
    console.log(error)
    return <ErrorPage message={error || "An unknown error occurred."} />
  }

  return <AuthContext.Provider value={{ user, isLoading, activeDomain }}>{children}</AuthContext.Provider>
}

export const useUser = () => useContext(AuthContext)

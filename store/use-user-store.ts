import { create } from "zustand"
import { persist } from "zustand/middleware"
import { User } from "@/services/api/schema"
import { useSession } from "next-auth/react"

export type UserState = {
  user: User | null
  domains: string[]
  activeDomain: string | null
  isLoading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setDomains: (domains: string[]) => void
  setActiveDomain: (domain: string) => void
  clearUser: () => void
  fetchCurrentUser: () => Promise<User | undefined>
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      domains: [],
      activeDomain: null,
      isLoading: false,
      error: null,
      setUser: (user) => set({ user }),
      setDomains: (domains) =>
        set({
          domains,
          activeDomain: domains.length > 0 ? domains[0] : null,
        }),
      setActiveDomain: (domain) => set({ activeDomain: domain }),
      clearUser: () => set({ user: null, domains: [], activeDomain: null }),
      fetchCurrentUser: async () => {
        try {
          set({ isLoading: true, error: null })
          const session = useSession();
          const userData = session.data?.user;

          set({ user: userData, isLoading: false })
          if (userData && userData?.user_domain && userData?.user_domain?.length > 0) {
            set({
              domains: userData.user_domain,
              activeDomain: userData.user_domain[0],
            })
          }
          return userData
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "An unknown error occurred",
            isLoading: false,
          })
          return undefined
        }
      },
    }),
    {
      name: "user-storage", // unique name for localStorage
      partialize: (state) => ({
        user: state.user,
        activeDomain: state.activeDomain,
      }),
    },
  ),
)

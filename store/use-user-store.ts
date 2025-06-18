import { create } from "zustand"
import { persist } from "zustand/middleware"
import { getUserProfile } from "@/services/user/actions"
import { User } from "@/services/api/schema"

type UserState = {
  user: User | null
  activeDomain: User["user_domain"] | null
  isLoading: boolean
  error: string | null
}
type UserActions = {
  setUser: (user: User | null) => void
  clearUser: () => void
  fetchCurrentUser: () => Promise<User | undefined>
}

type UserStore = UserState & UserActions
export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      fetchCurrentUser: async () => {
        try {
          set({ isLoading: true, error: null })

          const response = await getUserProfile()

          if (response?.error) {
            console.log(response.error)
            throw new Error(response.error.toString())
          }

          const userData = response?.data?.content?.[0]
          set({ user: userData, isLoading: false })
          if (
            userData &&
            userData?.user_domain &&
            userData?.user_domain?.length > 0
          ) {
            set({
              activeDomain: userData?.user_domain,
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
      activeDomain: null,
    }),
    {
      name: "user-storage", // unique name for localStorage
      partialize: (state) => ({ user: state.user }),
    },
  ),
)

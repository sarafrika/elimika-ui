import { User } from "@/app/auth/create-account/_components/user-account-form"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { fetchUsers } from "@/app/auth/create-account/actions"

type UserState = {
  user: User | null
  isLoading: boolean
  error: string | null
}

type UserActions = {
  setUser: (user: User | null) => void
  clearUser: () => void
  fetchCurrentUser: (email: string) => Promise<User | undefined>
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

      fetchCurrentUser: async (email: string) => {
        try {
          set({ isLoading: true, error: null })

          const response = await fetchUsers(0, `email_eq=${email}`)

          if (!response.success) {
            throw new Error(response.message)
          }

          const userData = response.data.content[0]
          set({ user: userData, isLoading: false })
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
      partialize: (state) => ({ user: state.user }),
    },
  ),
)

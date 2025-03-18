import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { UserRole } from "@/context/user-role-provider" // Adjust import path as needed

type RoleState = {
  roles: UserRole[];
  activeRole: UserRole | null;
  setRoles: (roles: UserRole[]) => void;
  setActiveRole: (role: UserRole) => void;
  resetRoles: () => void;
}

type RoleActions = {
  setRoles: (roles: UserRole[]) => void;
  setActiveRole: (role: UserRole) => void;
  resetRoles: () => void;
}

type RoleStore = RoleState & RoleActions

export const useRoleStore = create<RoleStore>()(
  persist(
    (set) => ({
      roles: [],
      activeRole: null,

      setRoles: (roles: UserRole[]) => set((state) => {
        const newActiveRole = state.activeRole && roles.includes(state.activeRole) ? state.activeRole : roles[0] || null

        return { roles, activeRole: newActiveRole }
      }),

      setActiveRole: (role: UserRole) => set((state) => {
        if (state.roles.includes(role)) {
          return { activeRole: role }
        }

        return state
      }),

      resetRoles: () => set({
        roles: [],
        activeRole: null
      })
    }),
    {
      name: "user-role-storage",
      partialize: (state) => ({
        activeRole: state.activeRole,
        roles: state.roles
      })
    }
  )
)
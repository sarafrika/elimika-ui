import { create } from "zustand"
import { persist } from "zustand/middleware"
import { UserDomain } from "@/context/auth-provider"

type DomainState = {
  domains: UserDomain[];
  activeDomain: UserDomain | null;
}

type DomainActions = {
  setDomains: (domains: UserDomain[]) => void;
  setActiveDomain: (domain: UserDomain) => void;
  resetDomains: () => void;
}

type DomainStore = DomainState & DomainActions

export const useDomainStore = create<DomainStore>()(
  persist(
    (set) => ({
      domains: [],
      activeDomain: null,

      setDomains: (domains: UserDomain[]) => set((state) => {
        const newActiveDomain = state.activeDomain && domains.includes(state.activeDomain) ? state.activeDomain : domains[0] || null

        return { domains, activeDomain: newActiveDomain }
      }),

      setActiveDomain: (domain: UserDomain) => set((state) => {
        if (state.domains.includes(domain)) {
          return { activeDomain: domain }
        }

        return state
      }),

      resetDomains: () => set({
        domains: [],
        activeDomain: null
      })
    }),
    {
      name: "user-domain-storage",
      partialize: (state) => ({
        activeDomain: state.activeDomain,
        domains: state.domains
      })
    }
  )
)
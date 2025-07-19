import { User } from "@/services/api/schema";
import { UserState, useUserStore } from "@/store/use-user-store";
import { createContext, ReactNode, useEffect } from "react";

export const UserContext = createContext<UserState | { user: null }>({ user: null });

export default function UserContextProvider({ children, user }: { user?: User, children: ReactNode }) {
    const userStore = useUserStore();
    userStore.setUser(user!);
    useEffect(() => {
        // if (!userStore.user) {
        //     userStore.fetchCurrentUser()
        // }
    }, [])
    return (<UserContext.Provider value={userStore}>{children}</UserContext.Provider>);
}
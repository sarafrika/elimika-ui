import { User } from "@/services/api/schema";
import { useSession } from "next-auth/react";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

const UserContext = createContext<User | null>(null)
export default function UserContextProvider({ children }: { children: ReactNode }) {
    const session = useSession();
    const [user, setUser] = useState(session.data?.user!);
    useEffect(() => {
        setUser(session.data?.user!);
    }, [session.status])
    return (<UserContext.Provider value={user!}>{children}</UserContext.Provider>);
}

export function useUser() {
    return useContext(UserContext);
}
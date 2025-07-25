"use client"
import { useSession } from 'next-auth/react';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { search, User } from '../services/client';

const UserContext = createContext<User & { updateSession: (usr: User) => void } | null>(null);
export default function UserContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const sessionStorageUser = typeof window !== "undefined" ? sessionStorage.getItem("user") : null;
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!sessionStorageUser || sessionStorageUser === "undefined") {
      (async () => {
        const resp = await search({ query: { searchParams: { email_eq: session?.user.email } } });
        if (!resp.error) {
          const results = resp.data.data!.content!;
          setUser(results[0]!)
          sessionStorage.setItem("user", JSON.stringify(results[0]))
        }
      })()
    }
    else {
      setUser(JSON.parse(sessionStorageUser))
    }

    if (status === "unauthenticated") {
      sessionStorage.removeItem("user");
      setUser(null)
    }
  }, [status]);

  function updateSession(userData: User) {
    sessionStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }

  return <UserContext.Provider value={{ ...user!, updateSession }}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}

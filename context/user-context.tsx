"use client"
import { useSession } from 'next-auth/react';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { search, User } from '../services/client';

const UserContext = createContext<User & { updateSession: (usr: User) => void } | null>(null);
export default function UserContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const sessionStorageUser = window ? sessionStorage.getItem("user") : null;
  const [user, setUser] = useState(sessionStorageUser ? JSON.parse(sessionStorageUser) : null);

  useEffect(() => {
    if (!sessionStorageUser) {
      (async () => {
        const resp = await search({ query: { searchParams: { email_eq: session?.user.email } } });
        if (!resp.error) {
          const results = resp.data.data!.content!;
          setUser(results[0])
          sessionStorage.setItem("user", JSON.stringify(results[0]))
        }
      })()
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

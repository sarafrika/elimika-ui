"use client"

import { signOut, useSession } from "next-auth/react"
import { useEffect } from "react"
import { toast } from "sonner"
import { KeycloakSession } from "@/app/api/auth/[...nextauth]/_utils"

export function useSessionExpiry() {
  const { data: session } = useSession()

  useEffect(() => {
    if ((session as KeycloakSession)?.error === "refresh_token_expired") {
      const handleExpiredSession = async () => {
        try {
          await fetch("/api/auth/logout")
          await signOut({ callbackUrl: "/" }).then(() =>
            toast.success("Session expired. Please log in again.")
          )
        } catch (error) {
          console.error("Error logging out:", error)
          toast.error("Failed to log out. Please try again.")
        }
      }

      handleExpiredSession()
    }
  }, [session])
}

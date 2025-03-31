"use client"

import { signOut } from "next-auth/react"
import { useEffect } from "react"
import { toast } from "sonner"
import { useSessionContext } from "@/context/session-provider-wrapper"

export function useSessionExpiry() {
  const { session } = useSessionContext()

  useEffect(() => {
    if (session?.error === "refresh_token_expired") {
      const handleExpiredSession = async () => {
        try {
          await fetch("/api/auth/logout")
          await signOut({ callbackUrl: "/" }).then(() =>
            toast.success("Session expired. Please log in again."),
          )
        } catch (error) {
          console.error("Error logging out:", error)
          toast.error("Failed to log out. Please try again.")
        }
      }

      handleExpiredSession()
    }
  }, [session?.error])
}

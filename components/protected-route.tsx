"use client"

import { ReactNode, useMemo } from "react"
import { useSessionExpiry } from "@/hooks/use-session-expiry"
import { useSession } from "next-auth/react"
import { FlashScreen } from "@/components/ui/flash-screen"

export default function ProtectedRoute({
                                         children
                                       }: {
  children: ReactNode
}) {
  useSessionExpiry()
  const { status } = useSession()
  const content = useMemo(() => children, [children])

  if (status === "loading") return <FlashScreen />

  return <>{content}</>
}

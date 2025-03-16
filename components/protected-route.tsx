"use client"

import { ReactNode, useMemo } from "react"
import { useSessionExpiry } from "@/hooks/use-session-expiry"
import { FlashScreen } from "@/components/ui/flash-screen"
import { useSessionContext } from "@/context/session-provider-wrapper"

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  useSessionExpiry()
  const { status } = useSessionContext()
  const content = useMemo(() => children, [children])

  if (status === "loading") return <FlashScreen />

  return <>{content}</>
}

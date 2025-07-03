"use client"
import React from "react"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { signIn } from "@/services/auth"

export default function LoginButton() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === "loading") {
    // Show a loading spinner or skeleton
    return <Button disabled>Loading...</Button>
  }

  if (status === "authenticated") {
    return (
      <Button onClick={() => router.push("/dashboard/overview")}>
        Go to Dashboard
      </Button>
    )
  }

  // status === "unauthenticated"
  return <Button onClick={async () => await signIn("keycloak")}>Sign In</Button>
}

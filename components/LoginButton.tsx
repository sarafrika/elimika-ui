"use client"
import React from "react"
import { Button } from "./ui/button"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginButton() {
  const { data: session } = useSession()
  const router = useRouter()

  if (session) {
    return (
      <Button onClick={() => router.push("/dashboard/overview")}>
        Go to Dashboard
      </Button>
    )
  }

  return <Button onClick={async () => await signIn("keycloak")}>Sign In</Button>
}

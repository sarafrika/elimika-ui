"use client"
import React from "react"
import { Button } from "./ui/button"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Spinner from "./ui/spinner"

export default function LoginButton() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === "loading") {
    return (
      <Button disabled>
        <Spinner />
      </Button>
    )
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

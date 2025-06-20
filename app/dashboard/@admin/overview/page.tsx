"use client"

import { useSession } from "next-auth/react"
export default function AdminOverviewPage() {
  const { data: session } = useSession()
  return (
    <div className="flex flex-col justify-start gap-4">
      <p className="text-2xl font-bold">
        Welcome <span className="text-primary">{session?.user?.name}</span>
      </p>
      <span className="text-muted-foreground">
        You are logged in as an Admin.
      </span>
    </div>
  )
}

"use client"
import { AppSidebar } from "@/components/app-sidebar"
import { useDashboardView } from "@/components/dashboard-view-context"
import { UserDomain } from "@/lib/types"
import React from "react"

export default function DashboardLayoutContent({
  student,
  admin,
  instructor,
  organization,
  children,
}: any) {
  const { view } = useDashboardView()
  let activeDomain: UserDomain = view
  // Only render the sidebar here
  return <AppSidebar activeDomain={activeDomain} />
}

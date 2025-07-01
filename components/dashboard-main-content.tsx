"use client"
import { useDashboardView } from "@/components/dashboard-view-context"
import DashboardTopBar from "@/components/dashboard-top-bar"
import React from "react"

export default function DashboardMainContent({
  student,
  admin,
  instructor,
  organization,
  children,
}: any) {
  const { view } = useDashboardView()
  let dashboardContent
  if (view === "student") dashboardContent = student
  else if (view === "admin") dashboardContent = admin
  else if (view === "instructor") dashboardContent = instructor
  else if (view === "organisation_user") dashboardContent = organization
  else dashboardContent = children
  return (
    <>
      <DashboardTopBar />
      <div className="flex flex-1 flex-col gap-4 space-y-4 px-6 pt-0">
        {dashboardContent}
      </div>
    </>
  )
}

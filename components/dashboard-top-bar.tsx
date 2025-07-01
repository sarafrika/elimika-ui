"use client"
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb"
import DashboardViewSwitcher from "@/components/dashboard-view-switcher"

export default function DashboardTopBar({
  showToggle = true,
}: {
  showToggle?: boolean
}) {
  if (!showToggle) {
    return (
      <div className="mb-2 flex items-center justify-between px-6 pt-4">
        <AppBreadcrumb />
      </div>
    )
  }
  return (
    <div className="mb-2 flex items-center justify-between px-6 pt-4">
      <AppBreadcrumb />
      <DashboardViewSwitcher />
    </div>
  )
}

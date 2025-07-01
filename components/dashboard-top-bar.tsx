"use client"
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb"
import DashboardViewSwitcher from "@/components/dashboard-view-switcher"

export default function DashboardTopBar() {
  return (
    <div className="mb-2 flex items-center justify-between px-6 pt-4">
      <AppBreadcrumb />
      <DashboardViewSwitcher />
    </div>
  )
}

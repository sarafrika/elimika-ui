"use client"
import { useDashboardView } from "@/components/dashboard-view-context"
import DashboardTopBar from "@/components/dashboard-top-bar"
import React, { ReactNode } from "react"
import { DashboardChildrenTypes } from "@/app/dashboard/_types";

export default function DashboardMainContent({ children }: { children: ReactNode }) {
  const { view } = useDashboardView();
  return (
    <>
      <DashboardTopBar />
      <div className="flex flex-1 flex-col gap-4 space-y-4 px-3 pt-0 sm:px-6">
        {/* {view in props ? props[view] : props.children} */}
        {children}
      </div>
    </>
  )
}

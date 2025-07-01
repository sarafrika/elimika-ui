"use client"
import React from "react"
import { Button } from "@/components/ui/button"
import { useDashboardView } from "./dashboard-view-context"

interface DashboardViewSwitcherProps {
  className?: string
}

export default function DashboardViewSwitcher({
  className,
}: DashboardViewSwitcherProps) {
  const { view, setView, availableViews } = useDashboardView()

  if (availableViews.length < 2) return null

  return (
    <div className={className + " flex items-center gap-2"}>
      <span className="text-sm font-medium">Dashboard View:</span>
      <Button
        variant={view === "student" ? "default" : "outline"}
        size="sm"
        onClick={() => setView("student")}
        className={view === "student" ? "font-bold" : ""}
      >
        Student
      </Button>
      <Button
        variant={view === "admin" ? "default" : "outline"}
        size="sm"
        onClick={() => setView("admin")}
        className={view === "admin" ? "font-bold" : ""}
      >
        Admin
      </Button>
    </div>
  )
}

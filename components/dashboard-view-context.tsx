"use client"
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"

export type DashboardView = "student" | "admin" | "instructor"

interface DashboardViewContextType {
  view: DashboardView
  setView: (view: DashboardView) => void
  availableViews: DashboardView[]
}

const DashboardViewContext = createContext<
  DashboardViewContextType | undefined
>(undefined)

const STORAGE_KEY = "elimika-dashboard-view"

export function DashboardViewProvider({
  children,
  initialView = "student",
  availableViews = ["student", "admin"],
}: {
  children: ReactNode
  initialView?: DashboardView
  availableViews?: DashboardView[]
}) {
  // Load from localStorage if available
  const [view, setViewState] = useState<DashboardView>(initialView)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && availableViews.includes(stored as DashboardView)) {
        setViewState(stored as DashboardView)
      }
    }
    // Only run on mount
    // eslint-disable-next-line
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, view)
    }
  }, [view])

  // Only allow switching to available views
  const setView = (v: DashboardView) => {
    if (availableViews.includes(v)) setViewState(v)
  }

  return (
    <DashboardViewContext.Provider value={{ view, setView, availableViews }}>
      {children}
    </DashboardViewContext.Provider>
  )
}

export function useDashboardView() {
  const ctx = useContext(DashboardViewContext)
  if (!ctx)
    throw new Error(
      "useDashboardView must be used within DashboardViewProvider",
    )
  return ctx
}

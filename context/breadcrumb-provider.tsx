"use client"

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react"
import { usePathname } from "next/navigation"
import menu, { MenuItem } from "@/lib/menu"

export type BreadcrumbItem = {
  id: string
  title: string
  url: string | null
  isLast?: boolean
}

type BreadcrumbContextType = {
  breadcrumbs: BreadcrumbItem[]
  addBreadcrumb: (title: string, url?: string | null) => void
  removeBreadcrumb: (id: string) => void
  removeLastBreadcrumb: () => void
  clearBreadcrumbs: () => void
  replaceBreadcrumbs: (newBreadcrumbs: BreadcrumbItem[]) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
  undefined,
)

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])

  const generateId = () =>
    `breadcrumb-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

  const findMenuPathByUrlInSources = (
    sources: Record<string, MenuItem[]>,
    url: string,
  ): MenuItem[] | null => {
    for (const sourceKey in sources) {
      const result = findMenuPathByUrl(sources[sourceKey] || [], url)
      if (result) return result
    }

    return null
  }

  const findMenuPathByUrl = (
    menuItems: MenuItem[],
    url: string,
    path: MenuItem[] = [],
  ): MenuItem[] | null => {
    for (const item of menuItems) {
      const currentPath = [...path, item]

      if (item.url === url) {
        return currentPath
      }

      if (item.items && item.items.length > 0) {
        const foundPath = findMenuPathByUrl(item.items, url, currentPath)
        if (foundPath) return foundPath
      }
    }

    return null
  }

  const convertMenuToBreadcrumbs = (
    menuItems: MenuItem[],
  ): BreadcrumbItem[] => {
    return menuItems.map((item, index) => ({
      id: generateId(),
      title: item.title,
      url: item.url || null,
      isLast: index === menuItems.length - 1,
    }))
  }

  useEffect(() => {
    if (pathname) {
      const menuPath = findMenuPathByUrlInSources(menu, pathname)

      if (menuPath) {
        const newBreadcrumbs = convertMenuToBreadcrumbs(menuPath)
        setBreadcrumbs(newBreadcrumbs)
        return
      }

      setBreadcrumbs([
        {
          id: generateId(),
          title: "Overview",
          url: "/dashboard/overview",
          isLast: true,
        },
      ])
    }
  }, [pathname])

  const addBreadcrumb = (title: string, url?: string | null) => {
    const updatedBreadcrumbs = breadcrumbs.map((breadcrumb) => ({
      ...breadcrumb,
      isLast: false,
    }))

    setBreadcrumbs([
      ...updatedBreadcrumbs,
      {
        id: generateId(),
        title,
        url: url || null,
        isLast: true,
      },
    ])
  }

  const removeBreadcrumb = (id: string) => {
    const filteredBreadcrumbs = breadcrumbs.filter(
      (breadcrumb) => breadcrumb.id !== id,
    )

    if (filteredBreadcrumbs.length > 0) {
      const updatedBreadcrumbs = filteredBreadcrumbs.map(
        (breadcrumb, index) => ({
          ...breadcrumb,
          isLast: index === filteredBreadcrumbs.length - 1,
        }),
      )
      setBreadcrumbs(updatedBreadcrumbs)
      return
    }

    setBreadcrumbs([])
  }

  const removeLastBreadcrumb = () => {
    if (breadcrumbs.length > 0) {
      const newBreadcrumbs = breadcrumbs.slice(0, -1)

      if (newBreadcrumbs.length > 0) {
        const lastIndex = newBreadcrumbs.length - 1
        const lastItem = newBreadcrumbs[lastIndex]
        if (lastItem) {
          newBreadcrumbs[lastIndex] = {
            ...lastItem,
            isLast: true,
          }
        }
      }

      setBreadcrumbs(newBreadcrumbs)
    }
  }

  const clearBreadcrumbs = () => {
    setBreadcrumbs([])
  }

  const replaceBreadcrumbs = (newBreadcrumbs: BreadcrumbItem[]) => {
    setBreadcrumbs(newBreadcrumbs)
  }

  const value = {
    breadcrumbs,
    addBreadcrumb,
    removeBreadcrumb,
    removeLastBreadcrumb,
    clearBreadcrumbs,
    replaceBreadcrumbs,
  }

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext)
  if (!context) {
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider")
  }
  return context
}

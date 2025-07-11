import { useEffect, useState } from "react"

export function useIsProfileCollapsed() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const check = () => setIsCollapsed(window.innerWidth <= 739)
    check()

    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return isCollapsed
}

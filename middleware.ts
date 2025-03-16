import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { KeycloakJWT } from "@/app/api/auth/[...nextauth]/_utils"
import menu, { MenuItem } from "@/lib/menu"

function isAuthorizedPath(path: string, userRoles: string[]): boolean {
  for (const role of userRoles) {
    if (path === `/dashboard/${role}/overview`) {
      return true
    }
  }

  function searchMenuItems(items: MenuItem[], role: string): boolean {
    for (const item of items) {
      const itemRole = item.role || null
      if (itemRole !== null && itemRole !== role) {
        continue
      }
      if (item.url === path) {
        return true
      }
      if (item.items && item.items.length > 0) {
        if (searchMenuItems(item.items, role)) {
          return true
        }
      }
    }
    return false
  }

  for (const role of userRoles) {
    if (menu.main && searchMenuItems(menu.main, role)) {
      return true
    }
    if (menu.secondary && searchMenuItems(menu.secondary, role)) {
      return true
    }
  }

  return false
}

function getDashboardPath(userRoles: string[]): string {
  if (userRoles.length > 0) {
    return `/dashboard/${userRoles[0]}/overview`
  }
  return "/dashboard/overview"
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  const publicPaths = [
    "/",
    "/auth/create-account",
    "/auth/login",
    "/auth/forgot-password",
    "/unauthorized"
  ]

  const isPublicPath = publicPaths.includes(path) || path.startsWith("/public/")

  const token = (await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })) as KeycloakJWT | null

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth/create-account", request.url))
  }

  if (token) {
    const userDomain = token?.decoded?.user_domain

    if (Array.isArray(userDomain) && userDomain.length > 0) {
      const dashboardPath = getDashboardPath(userDomain)

      if (isPublicPath) {
        return NextResponse.redirect(new URL(dashboardPath, request.url))
      }

      if (!isPublicPath && !isAuthorizedPath(path, userDomain)) {
        if (path === dashboardPath) {
          return NextResponse.next()
        }

        return NextResponse.redirect(new URL(dashboardPath, request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)"
  ]
}
import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { KeycloakJWT } from "@/app/api/auth/[...nextauth]/_utils"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const publicPaths = ["/", "/auth/create-account"]
  const isPublicPath = publicPaths.includes(path)

  const token = (await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })) as KeycloakJWT | null

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth/create-account", request.url))
  }

  if (token && isPublicPath) {
    const userDomain = token?.decoded?.user_domain || []

    let dashboardPath = "/"
    let baseDashboardPath = "/dashboard"

    if (Array.isArray(userDomain)) {
      if (userDomain.includes("instructor")) {
        baseDashboardPath = "/dashboard/instructor"
        dashboardPath = "/dashboard/instructor/overview"
      } else if (userDomain.includes("student")) {
        baseDashboardPath = "/dashboard/student"
        dashboardPath = "/dashboard/student/overview"
      }

      if (path !== dashboardPath && !path.startsWith(baseDashboardPath)) {
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
     * - public files (public folder)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)"
  ]
}

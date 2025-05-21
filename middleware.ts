import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { signIn } from "next-auth/react"
import { KeycloakJWT } from "@/app/api/auth/[...nextauth]/_utils"
import { getEnvironmentVariable } from "./lib/utils"

const publicPaths = ["/", "/auth/create-account"]

function formatRole(role: string): string {
  return role.replace(/_/g, "-")
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  const isPublicPath = publicPaths.includes(path)

  const token = (await getToken({
    req: request,
    secret: getEnvironmentVariable("NEXTAUTH_SECRET"),
  })) as KeycloakJWT | null
  if (!token && !isPublicPath) {
    await signIn("keycloak")
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - API routes
     * - Next.js internal files
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

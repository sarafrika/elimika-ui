export { auth as middleware } from "@/services/auth"

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - API routes
     * - Next.js internal files
     */
    "/",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

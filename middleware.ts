import { auth, signIn } from "auth"
export default auth(async (request) => {
  const isAuthenticated = request.auth

  if (!isAuthenticated) {
    await signIn()
  }
})

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

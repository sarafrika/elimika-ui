import { auth } from '@/services/auth';
import { NextResponse } from 'next/server';

export default auth(req => {
  const { pathname } = req.nextUrl;
  const isAuth = !!req.auth;

  // Define protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/onboarding'];

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If accessing protected route without authentication, redirect to home
  if (!isAuth && isProtectedRoute) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Allow the request to continue
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - API routes
     * - Next.js internal files
     */
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

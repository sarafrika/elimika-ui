import { auth } from '@/services/auth';
import { NextResponse } from 'next/server';

function buildPublicRequestUrl(req: Parameters<Parameters<typeof auth>[0]>[0], path: string) {
  const forwardedHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const host = forwardedHost || req.headers.get('host') || req.nextUrl.host;
  const protocol = forwardedProto || req.nextUrl.protocol.replace(/:$/, '');

  return new URL(path, `${protocol}://${host}`);
}

export default auth(req => {
  const { pathname } = req.nextUrl;
  const isAuth = !!req.auth;

  // Define protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/onboarding'];

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If accessing protected route without authentication, redirect to home
  if (!isAuth && isProtectedRoute) {
    return NextResponse.redirect(buildPublicRequestUrl(req, '/'));
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

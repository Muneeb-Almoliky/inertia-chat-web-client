import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const PUBLIC_PATHS = ['/login', '/signup']

// Define auth routes that should redirect to /chat if authenticated
const AUTH_PATHS = ['/login', '/signup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get the refresh token from cookies
  const hasRefreshToken = request.cookies.has('refreshToken')

  // Allow access to public assets
  if (
    pathname.startsWith('/_next') || // Next.js static files
    pathname.startsWith('/api') || // API routes
    pathname.startsWith('/static') // Static files
  ) {
    return NextResponse.next()
  }

  // If we have a refresh token and trying to access auth pages, redirect to chat
  if (hasRefreshToken && AUTH_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  // If we don't have a refresh token and trying to access protected routes, redirect to login
  if (!hasRefreshToken && !PUBLIC_PATHS.includes(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname) // Save the original path
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Configure the paths that middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/* (authentication routes)
     * 2. /_next/static (static files)
     * 3. /_next/image (image optimization files)
     * 4. /favicon.ico (favicon file)
     * 5. /static (public static files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|static).*)',
  ],
} 
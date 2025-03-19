import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || ''
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isPublicPath = ['/login'].includes(request.nextUrl.pathname)

  // If trying to access protected route without token
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If trying to access login page with token
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard/statistics', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    //'/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/((?!api|_next/static|_next/image|images|favicon.ico).*)'
  ],
}
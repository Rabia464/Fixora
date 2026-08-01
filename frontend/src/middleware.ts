import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authRole = request.cookies.get('auth_role')?.value;
  const path = request.nextUrl.pathname;

  // Protect /dashboard routes
  if (path.startsWith('/dashboard')) {
    if (!authRole) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Role-based routing enforcement
    if (path.startsWith('/dashboard/student') && authRole !== 'Student') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (path.startsWith('/dashboard/supervisor') && authRole !== 'Hostel Supervisor') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (path.startsWith('/dashboard/maintenance') && authRole !== 'Maintenance Office') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Redirect logged-in users away from /login
  if (path === '/login' && authRole) {
    if (authRole === 'Student') return NextResponse.redirect(new URL('/dashboard/student', request.url));
    if (authRole === 'Hostel Supervisor') return NextResponse.redirect(new URL('/dashboard/supervisor', request.url));
    if (authRole === 'Maintenance Office') return NextResponse.redirect(new URL('/dashboard/maintenance', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};

import { getSession } from '@auth0/nextjs-auth0/edge';
import { UserRole } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/:path*'] // Apply middleware to all paths
};

export default async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  // Skip setting the cookie if the request is for the logout endpoint
  if (req.nextUrl.pathname === '/api/auth/logout') {
    return res;
  }

  // If there's a session and it's valid, set the user email in a cookie if it doesn't already exist
  if (session && session.user && session.user.email) {
    const userEmail = session.user.email;
    if (!req.cookies.get('userEmail')) {
      res.cookies.set('userEmail', userEmail, { path: '/' });
    }
  }

  // Only protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // If not logged in, redirect to the login page.
    if (!session) {
      return NextResponse.redirect(
        new URL(`/api/auth/login?returnTo=${encodeURIComponent(req.nextUrl.pathname)}`, req.url)
      );
    }

    // If logged in, verify the user's role
    const userRoleResponse = await fetch(`${req.nextUrl.origin}/api/get-user-role`, {
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') || ''
      }
    });

    if (!userRoleResponse.ok) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { role } = await userRoleResponse.json();
    if (role !== UserRole.ADMIN) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
  // Only protect admin routes
  if (req.nextUrl.pathname.startsWith('/saved-bookings')) {
    // If not logged in, redirect to the login page.
    if (!session) {
      return NextResponse.redirect(
        new URL(`/api/auth/login?returnTo=${encodeURIComponent(req.nextUrl.pathname)}`, req.url)
      );
    }
  }

  return res;
}

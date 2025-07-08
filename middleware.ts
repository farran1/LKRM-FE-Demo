import { ROUTES } from '@/utils/routes';
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;

  const isAuthRoute = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/waitlist');

  if (!token) {
    if (!isAuthRoute) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  } else {
    if (req.nextUrl.pathname === '/' || isAuthRoute) {
      return NextResponse.redirect(new URL(ROUTES.planner.event, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|static|imgs|favicon.ico).*)'], // Apply to all routes except Next.js internal files
};
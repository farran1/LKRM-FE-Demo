import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SECURITY_HEADERS } from '@/lib/security/production-config'

export async function middleware(req: NextRequest) {
	const res = NextResponse.next()

	// Add security headers to all responses
	Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
		res.headers.set(key, value)
	})

	// Allow auth callback endpoints to pass through untouched
	if (req.nextUrl.pathname.startsWith('/auth')) {
		return res
	}

  // Allow static files and API routes to pass through (including PWA manifest)
  if (req.nextUrl.pathname.startsWith('/api') || 
		req.nextUrl.pathname.startsWith('/_next') || 
		req.nextUrl.pathname.startsWith('/static') ||
		req.nextUrl.pathname.startsWith('/imgs') ||
      req.nextUrl.pathname === '/favicon.ico' ||
      req.nextUrl.pathname === '/manifest.json') {
		return res
	}

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

	if (!supabaseUrl || !supabaseKey) {
		console.error('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in middleware')
		return NextResponse.redirect(new URL('/login?error=configuration', req.url))
	}

	try {
		const supabase = createMiddlewareClient({ req, res }, {
			supabaseUrl,
			supabaseKey
		})

		const { data: { session }, error } = await supabase.auth.getSession()

		if (error) {
			console.error('Session error:', error)
			return NextResponse.redirect(new URL('/login?error=session', req.url))
		}

		const authRoutes = ['/login', '/signup', '/waitlist', '/forgot-password', '/reset-password']
		const isAuthRoute = authRoutes.some(route => req.nextUrl.pathname.startsWith(route))

		// Redirect unauthenticated users to login (except for auth routes and home page)
		if (!session && !isAuthRoute && req.nextUrl.pathname !== '/') {
			return NextResponse.redirect(new URL('/login', req.url))
		}

		// Redirect authenticated users away from auth routes
		if (session && isAuthRoute) {
			return NextResponse.redirect(new URL('/dashboard', req.url))
		}

		// Redirect authenticated users from home page to dashboard
		if (session && req.nextUrl.pathname === '/') {
			return NextResponse.redirect(new URL('/dashboard', req.url))
		}

		// Add user info to headers for API routes
		if (session && req.nextUrl.pathname.startsWith('/api')) {
			res.headers.set('x-user-id', session.user.id)
			res.headers.set('x-user-email', session.user.email || '')
		}

		return res

	} catch (error) {
		console.error('Middleware error:', error)
		return NextResponse.redirect(new URL('/login?error=server', req.url))
	}
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - imgs (image files)
		 * - static (static files)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico|imgs|static).*)',
	],
}
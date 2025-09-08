import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
	const res = NextResponse.next()

	// Allow auth callback endpoints to pass through untouched
	if (req.nextUrl.pathname.startsWith('/auth')) {
		return res
	}

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

	if (!supabaseUrl || !supabaseKey) {
		console.error('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in middleware')
		return res
	}

	const supabase = createMiddlewareClient({ req, res }, {
		supabaseUrl,
		supabaseKey
	})

	const { data: { session } } = await supabase.auth.getSession()

	const authRoutes = ['/login', '/signup', '/waitlist']
	const isAuthRoute = authRoutes.some(route => req.nextUrl.pathname.startsWith(route))

	if (!session && !isAuthRoute && req.nextUrl.pathname !== '/') {
		return NextResponse.redirect(new URL('/login', req.url))
	}

	if (session && isAuthRoute) {
		return NextResponse.redirect(new URL('/dashboard', req.url))
	}

	if (session && req.nextUrl.pathname === '/') {
		return NextResponse.redirect(new URL('/dashboard', req.url))
	}

	return res
}

export const config = {
	matcher: ['/((?!api|_next|static|imgs|favicon.ico|auth).*)'],
}
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(request: Request) {
	const cookieStore = await cookies()
	const supabase = createRouteHandlerClient({ cookies: () => cookieStore as any })
	const { event, session } = await request.json()

	if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
		await supabase.auth.setSession({
			access_token: session?.access_token,
			refresh_token: session?.refresh_token
		})
	}
	if (event === 'SIGNED_OUT') {
		await supabase.auth.signOut()
	}

	return NextResponse.json({ ok: true })
}

export async function GET(request: Request) {
	const requestUrl = new URL(request.url)
	const code = requestUrl.searchParams.get('code')
	if (code) {
		const cookieStore = await cookies()
		const supabase = createRouteHandlerClient({ cookies: () => cookieStore as any })
		await supabase.auth.exchangeCodeForSession(code)
	}
	return NextResponse.redirect(new URL('/', requestUrl.origin))
}

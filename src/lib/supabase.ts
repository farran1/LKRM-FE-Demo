import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url) {
	throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set')
}
if (!anon) {
	throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not set')
}

// Use auth-helpers client in the browser so auth cookies sync with middleware
export const supabase = typeof window !== 'undefined'
	? createClientComponentClient<Database>({ 
		supabaseUrl: url, 
		supabaseKey: anon
	})
	: createClient<Database>(url, anon, { 
		auth: { 
			autoRefreshToken: true,
			persistSession: true, // Enable session persistence
			// Add rate limiting configuration
			flowType: 'pkce'
		},
		// Add global configuration to avoid Edge Runtime issues
		global: {
			headers: {
				'X-Client-Info': 'lkrm-app'
			}
		}
	})

export const createServerClient = () => {
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!serviceKey) {
		throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set')
	}
	return createClient<Database>(url, serviceKey, {
		auth: { 
			autoRefreshToken: false, 
			persistSession: false 
		}
	})
}

export const createServerClientWithAuth = async (request: Request) => {
	// Try to get authorization header first
	const authHeader = request.headers.get('authorization')
	
	if (authHeader) {
		const token = authHeader.replace('Bearer ', '')
		
		// Use service role client to verify the token and get user info
		const serviceClient = createServerClient()
		
		try {
			// Verify the token and get user info
			const { data: { user }, error } = await serviceClient.auth.getUser(token)
			
			if (error || !user) {
				throw new Error('Invalid token')
			}
			
			// Return the service client with user context
			return { client: serviceClient, user }
		} catch (error) {
			throw new Error('Authentication failed')
		}
	}
	
	// If no authorization header, use App Router server component client with cookies
	try {
		const { cookies } = await import('next/headers')
		const cookieStore = await cookies()
		// Create server client bound to Next.js cookies (App Router)
		const supabaseClient = createServerComponentClient<Database>({
			cookies: () => cookieStore as any
		})

		// Get the current user
		const { data: { user }, error } = await supabaseClient.auth.getUser()
		
		if (error || !user) {
			throw new Error('No authenticated user')
		}
		
		return { client: supabaseClient, user }
	} catch (error) {
		console.error('Authentication error:', error)
		throw new Error('Authentication failed')
	}
}
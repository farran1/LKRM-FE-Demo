import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url) {
	throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set')
}
if (!anon) {
	throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not set')
}

export const createServerClientWithAuth = async (_request?: Request) => {
	try {
		// Create server client with cookies for authentication (App Router)
		const cookieStore = await cookies()
		const supabaseClient = createServerComponentClient<Database>({ 
			cookies: () => cookieStore as any
		})

		// Get the current user from the session
		const { data: { user }, error } = await supabaseClient.auth.getUser()
		
		if (error || !user) {
			throw new Error('No authenticated user')
		}
		
		return { client: supabaseClient, user }
	} catch (error) {
		throw new Error('Authentication failed')
	}
}

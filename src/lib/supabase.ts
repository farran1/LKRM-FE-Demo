import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
			persistSession: false 
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
import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAPI } from '../../../src/services/supabase-api'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

const supabaseAPI = new SupabaseAPI()

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const params: any = Object.fromEntries(searchParams.entries())
		console.log('API GET /events - params:', params)
		
		// Convert parameters to proper types
		if (params.eventTypeIds) {
			params.eventTypeIds = String(params.eventTypeIds).split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id))
		}
		if (params.page) {
			params.page = parseInt(String(params.page))
		}
		if (params.perPage) {
			params.perPage = parseInt(String(params.perPage))
		}
		
		const res = await supabaseAPI.getEvents(params)
		console.log('API GET /events - supabase result:', res)
		
		// Return data in the expected format for dashboard components
		const responseData = res.data || []
		console.log('API GET /events - returning:', responseData)
		console.log('API GET /events - response length:', responseData.length)
		
		return NextResponse.json({ data: responseData })
	} catch (error) {
		console.error('Error fetching events:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch events' },
			{ status: 500 }
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		console.log('API POST /events - received body:', body)
		
		// Get the authenticated user from the request cookies using middleware client
		const res = NextResponse.next()
		const supabase = createMiddlewareClient({ req: request, res })
		
		// Get the session from cookies
		const { data: { session }, error: sessionError } = await supabase.auth.getSession()
		
		if (sessionError || !session?.user) {
			console.error('API POST /events - Session error:', sessionError)
			return NextResponse.json(
				{ error: 'Not authenticated' },
				{ status: 401 }
			)
		}
		
		const user = session.user
		console.log('API POST /events - Authenticated user:', user.id)
		
		// Create the event with the authenticated user context
		const created = await supabaseAPI.createEventWithUser(body, user.id)
		console.log('API POST /events - event created:', created)
		
		const eventId = (created as any)?.id || (created as any)?.event?.id || (created as any)?.userId || (created as any)?.eventId
		console.log('API POST /events - extracted eventId:', eventId)

		// Store attendees as JSON data instead of using public users table
		if (Array.isArray(body?.attendees) && eventId) {
			console.log('API POST /events - processing attendees:', body.attendees)
			const usernames: string[] = body.attendees.filter((v: any) => typeof v === 'string' && v.trim() !== '')
			console.log('API POST /events - filtered usernames:', usernames)
			
			if (usernames.length > 0) {
				const { createClient } = await import('@supabase/supabase-js')
				const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
				
				// Store attendees in event_coaches table
				const uniqueUsernames = Array.from(new Set(usernames))
				console.log('API POST /events - storing attendees:', uniqueUsernames)
				
				// Clear existing links
				await s.from('event_coaches').delete().eq('eventId', eventId)
				// Insert new links
				await s.from('event_coaches').upsert(
					usernames.map((u) => ({ 
						eventId, 
						coachUsername: u
					})),
					{ onConflict: 'eventId,coachUsername' }
				)

				// Create in-app notifications for each coach if resolvable to auth.users
				try {
					for (const username of uniqueUsernames) {
						let assigneeUuid: string | null = null
						// Try email == username
						const { data: byEmail } = await s
							.from('auth.users')
							.select('id, email')
							.eq('email', username)
							.limit(1)
						if (byEmail && byEmail.length > 0) assigneeUuid = (byEmail[0] as any).id
						if (!assigneeUuid) {
							// Try username in raw_user_meta_data.username
							const { data: byMeta } = await s
								.from('auth.users')
								.select('id, raw_user_meta_data')
								.limit(1000)
							if (byMeta) {
								const match = byMeta.find((u: any) => (u.raw_user_meta_data?.username || '').toLowerCase() === String(username).toLowerCase())
								if (match) assigneeUuid = match.id
							}
						}
						if (assigneeUuid) {
							await s
								.from('mention_notifications')
								.insert({ user_id: assigneeUuid, note_id: null, mentioned_by: user.id, is_read: false })
						}
					}
				} catch (notifyErr) {
					console.error('Failed to create attendee notifications:', notifyErr)
				}
			}
		}

		return NextResponse.json(created, { status: 201 })
	} catch (error) {
		console.error('API POST /events - Error creating event:', error)
		const err: any = error
		console.error('API POST /events - Error details:', {
			name: err?.name,
			message: err?.message,
			stack: err?.stack,
			code: err?.code,
			details: err?.details,
			hint: err?.hint
		})
		return NextResponse.json(
			{ error: 'Failed to create event' },
			{ status: 500 }
		)
	}
}

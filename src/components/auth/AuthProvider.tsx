'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/utils/routes'
import { SupabaseAPI } from '@/services/supabase-api'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {}
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

// Toggle whether to maintain a profiles table alongside Supabase Auth
const USE_PROFILES = process.env.NEXT_PUBLIC_USE_PROFILES === 'true'

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Track user activity to prevent unnecessary session refreshes during live games
    const updateUserActivity = () => {
      sessionStorage.setItem('lastUserActivity', Date.now().toString())
    }
    
    // Track various user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, updateUserActivity, { passive: true })
    })
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session ? 'exists' : 'none')
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session ? 'session exists' : 'no session')
      
      // Only update state, don't redirect for session refreshes
      if (event === 'TOKEN_REFRESHED') {
        console.log('Session refreshed successfully - no redirect needed')
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        return
      }
      
      // Only redirect for actual sign in/out events, not refreshes
      if (event === 'SIGNED_IN') {
        console.log('User signed in - redirecting to dashboard')
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Sync session cookies for middleware
        try {
          await fetch('/auth/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, session })
          })
        } catch {}

        // Optionally create/update profile; otherwise rely solely on Supabase Auth
        if (USE_PROFILES && session?.user) {
          const { error } = await (supabase as any)
            .from('profiles')
            .upsert({
              id: session.user.id,
              email: session.user.email!,
              first_name: session.user.user_metadata?.first_name || '',
              last_name: session.user.user_metadata?.last_name || '',
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' })
          
          if (error) {
            console.warn('Profile upsert skipped/failed:', {
              message: error.message,
              code: (error as any)?.code,
              details: (error as any)?.details,
              hint: (error as any)?.hint
            })
          }
        }
        
        // Only redirect if we're not already on a protected route
        const currentPath = window.location.pathname
        const protectedRoutes = [
          '/dashboard', 
          '/events', 
          '/players', 
          '/tasks', 
          '/budgets', 
          '/expenses',
          '/stats-dashboard',
          '/stats-overview',
          '/stats-dash',
          '/stats-dash2',
          '/stats-myway',
          '/performance',
          '/live-stat-tracker',
          '/funds',
          '/receipts',
          '/settings'
        ]
        const isOnProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route))
        
        if (!isOnProtectedRoute) {
          console.log('Redirecting to dashboard from:', currentPath)
          router.replace(ROUTES.dashboard)
        } else {
          console.log('Already on protected route, no redirect needed:', currentPath)
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out - redirecting to login')
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Clear session cache to prevent stale auth calls
        
        // Clear SupabaseAPI user cache
        const api = new SupabaseAPI()
        api.clearUserCache()
        
        // Clear session cookies
        try {
          await fetch('/auth/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, session: null })
          })
        } catch {}
        
        router.replace('/login')
      } else {
        // For other events (USER_UPDATED, etc.), just update state
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    // Set up session refresh interval (every 45 minutes to stay ahead of 1-hour timeout)
    // Only refresh if user is actively using the app (not during live games)
    const refreshInterval = setInterval(async () => {
      try {
        // Check if user is currently active (has interacted in last 5 minutes)
        const lastActivity = sessionStorage.getItem('lastUserActivity')
        const now = Date.now()
        const isUserActive = lastActivity && (now - parseInt(lastActivity)) < 5 * 60 * 1000
        
        // Check if user is on live stat tracking page (critical - never interrupt)
        const currentPath = window.location.pathname
        const isLiveStatTracking = currentPath.includes('live-stat-tracker') || 
                                  currentPath.includes('stat-tracker') ||
                                  currentPath.includes('game-stats')
        
        if (isLiveStatTracking) {
          console.log('User is on live stat tracking page - NEVER interrupting session')
          return
        }
        
        if (!isUserActive) {
          console.log('User not active, skipping session refresh')
          return
        }
        
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession) {
          // Refresh the session if it's close to expiring
          const expiresAt = currentSession.expires_at
          if (expiresAt) {
            const now = Math.floor(Date.now() / 1000)
            const timeUntilExpiry = expiresAt - now
            // If session expires in less than 15 minutes, refresh it
            if (timeUntilExpiry < 900) {
              console.log('Refreshing session before expiry (user is active)')
              await supabase.auth.refreshSession()
            }
          }
        }
      } catch (error) {
        console.warn('Session refresh failed:', error)
      }
    }, 45 * 60 * 1000) // 45 minutes

    return () => {
      subscription.unsubscribe()
      clearInterval(refreshInterval)
      
      // Clean up event listeners
      events.forEach(event => {
        document.removeEventListener(event, updateUserActivity)
      })
    }
  }, [router])

  const signOut = async () => {
    console.log('Signing out...')
    // Clear session cache before signing out
    
    // Clear SupabaseAPI user cache
    const api = new SupabaseAPI()
    api.clearUserCache()
    
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    loading,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
import { User } from '@supabase/supabase-js'

/**
 * Get a user's display name from their Supabase user object
 * Falls back to email username if no name metadata is available
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) return 'Unknown User'
  
  // Try to get first_name and last_name from metadata
  if (user.user_metadata?.first_name && user.user_metadata?.last_name) {
    return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
  }
  
  // Try full_name from metadata
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name
  }
  
  // Try name from metadata
  if (user.user_metadata?.name) {
    return user.user_metadata.name
  }
  
  // Fall back to email username
  if (user.email) {
    return user.email.split('@')[0]
  }
  
  // Last resort
  return 'Unknown User'
}

/**
 * Get user initials for avatar display
 */
export function getUserInitials(user: User | null): string {
  if (!user) return 'UU'
  
  const displayName = getUserDisplayName(user)
  const nameParts = displayName.split(' ')
  
  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
  }
  
  return displayName.substring(0, 2).toUpperCase()
}

/**
 * Check if user has complete profile information
 */
export function hasCompleteProfile(user: User | null): boolean {
  if (!user) return false
  
  return !!(
    user.user_metadata?.first_name && 
    user.user_metadata?.last_name
  )
}

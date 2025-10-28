/**
 * Cross-platform UUID generation utility
 * Works in both browser and Node.js environments
 */

/**
 * Generate a UUID v4
 * Uses crypto.randomUUID() in browsers and Node.js 15.6.0+
 * Falls back to a simple UUID-like string for older environments
 */
export function generateUUID(): string {
  // Check if we're in a browser or Node.js environment with crypto.randomUUID
  if (typeof window !== 'undefined' && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  
  // Check for Node.js crypto module
  if (typeof require !== 'undefined') {
    try {
      const crypto = require('crypto')
      if (crypto && 'randomUUID' in crypto) {
        return crypto.randomUUID()
      }
    } catch (e) {
      // Ignore require errors in browser
    }
  }

  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}


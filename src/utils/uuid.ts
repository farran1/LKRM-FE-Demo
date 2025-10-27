/**
 * Generate a UUID with fallback for environments where crypto.randomUUID is not available
 * @returns A UUID string
 */
export function generateUUID(): string {
  // Check if crypto.randomUUID is available (Node.js 14.17.0+ or browsers with proper support)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback implementation for older environments
  // This is a simple UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}


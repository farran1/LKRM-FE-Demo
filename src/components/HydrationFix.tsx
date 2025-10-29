'use client'

import { useEffect } from 'react'

export default function HydrationFix() {
  useEffect(() => {
    // Suppress hydration warnings for elements that might be modified by browser extensions
    const originalError = console.error
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('Hydration failed') &&
        args[0].includes('fusion-extension-loaded')
      ) {
        // Suppress hydration warnings caused by browser extensions
        return
      }
      originalError.apply(console, args)
    }

    // Cleanup function
    return () => {
      console.error = originalError
    }
  }, [])

  return null
}



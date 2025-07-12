// DEV-ONLY: MSW entry point to start the worker in development mode.
import { worker } from './browser'

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
  }).catch(console.error)
} 
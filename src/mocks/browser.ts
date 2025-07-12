// DEV-ONLY: MSW browser setup for API mocking.
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers) 
// DEV-ONLY: MSW initialization for browser API mocking
// DISABLED: Using localStorage-based API instead
/*
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  import('./mocks/browser').then(({ worker }) => {
    worker.start()
  })
}
*/
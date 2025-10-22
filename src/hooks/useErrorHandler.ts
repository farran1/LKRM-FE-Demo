/**
 * React Hook for Error Handling
 * Provides error handling capabilities for React components
 */

import { useState, useEffect, useCallback } from 'react'
import { errorHandler, ErrorInfo, ErrorContext } from '../services/error-handler'

export interface UseErrorHandlerOptions {
  showToast?: boolean
  logErrors?: boolean
  onError?: (error: ErrorInfo) => void
}

export interface UseErrorHandlerReturn {
  errors: ErrorInfo[]
  hasErrors: boolean
  hasCriticalErrors: boolean
  retryableErrors: ErrorInfo[]
  handleError: (error: Error, context?: ErrorContext) => ErrorInfo
  handleOfflineError: (error: Error, context?: ErrorContext) => ErrorInfo
  handleSyncError: (error: Error, context?: ErrorContext) => ErrorInfo
  clearErrors: () => void
  clearErrorHistory: () => void
  getErrorsByType: (type: ErrorInfo['type']) => ErrorInfo[]
  getErrorsBySeverity: (severity: ErrorInfo['severity']) => ErrorInfo[]
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const {
    showToast = true,
    logErrors = true,
    onError
  } = options

  const [errors, setErrors] = useState<ErrorInfo[]>([])

  // Handle error with context
  const handleError = useCallback((error: Error, context: ErrorContext = {}) => {
    const errorInfo = errorHandler.handleError(error, {
      ...context,
      timestamp: Date.now()
    })

    if (logErrors) {
      console.error(`[${errorInfo.type.toUpperCase()}] ${errorInfo.message}`, context)
    }

    if (showToast) {
      // Import antd message dynamically to avoid SSR issues
      import('antd').then(({ message }) => {
        switch (errorInfo.severity) {
          case 'critical':
            message.error(errorInfo.userMessage)
            break
          case 'high':
            message.error(errorInfo.userMessage)
            break
          case 'medium':
            message.warning(errorInfo.userMessage)
            break
          case 'low':
            message.info(errorInfo.userMessage)
            break
        }
      })
    }

    if (onError) {
      onError(errorInfo)
    }

    return errorInfo
  }, [showToast, logErrors, onError])

  // Handle offline-specific errors
  const handleOfflineError = useCallback((error: Error, context: ErrorContext = {}) => {
    return handleError(error, { ...context, offline: true })
  }, [handleError])

  // Handle sync-specific errors
  const handleSyncError = useCallback((error: Error, context: ErrorContext = {}) => {
    return handleError(error, { ...context, sync: true })
  }, [handleError])

  // Clear current errors
  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  // Clear error history
  const clearErrorHistory = useCallback(() => {
    errorHandler.clearHistory()
    setErrors([])
  }, [])

  // Get errors by type
  const getErrorsByType = useCallback((type: ErrorInfo['type']) => {
    return errors.filter(error => error.type === type)
  }, [errors])

  // Get errors by severity
  const getErrorsBySeverity = useCallback((severity: ErrorInfo['severity']) => {
    return errors.filter(error => error.severity === severity)
  }, [errors])

  // Listen for new errors
  useEffect(() => {
    const removeListener = errorHandler.addErrorListener((errorInfo) => {
      setErrors(prev => [errorInfo, ...prev.slice(0, 49)]) // Keep last 50 errors
    })

    return removeListener
  }, [])

  // Update errors from history on mount
  useEffect(() => {
    const history = errorHandler.getErrorHistory()
    setErrors(history.slice(0, 50)) // Show last 50 errors
  }, [])

  return {
    errors,
    hasErrors: errors.length > 0,
    hasCriticalErrors: errors.some(error => error.severity === 'critical'),
    retryableErrors: errors.filter(error => error.retryable),
    handleError,
    handleOfflineError,
    handleSyncError,
    clearErrors,
    clearErrorHistory,
    getErrorsByType,
    getErrorsBySeverity
  }
}

/**
 * Hook for handling async operations with error handling
 */
export function useAsyncErrorHandler<T>(
  asyncFn: (...args: any[]) => Promise<T>,
  options: UseErrorHandlerOptions = {}
) {
  const { handleError } = useErrorHandler(options)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorInfo | null>(null)

  const execute = useCallback(async (...args: any[]) => {
    try {
      setLoading(true)
      setError(null)
      const result = await asyncFn(...args)
      return result
    } catch (err) {
      const errorInfo = handleError(err as Error, {
        component: 'useAsyncErrorHandler',
        action: 'execute',
        metadata: { args }
      })
      setError(errorInfo)
      throw err
    } finally {
      setLoading(false)
    }
  }, [asyncFn, handleError])

  return {
    execute,
    loading,
    error,
    setError
  }
}

/**
 * Hook for handling offline operations
 */
export function useOfflineErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { handleOfflineError, handleSyncError, ...rest } = useErrorHandler(options)

  const handleOfflineOperation = useCallback(async (
    operation: () => Promise<any>,
    context: ErrorContext = {}
  ) => {
    try {
      return await operation()
    } catch (error) {
      return handleOfflineError(error as Error, context)
    }
  }, [handleOfflineError])

  const handleSyncOperation = useCallback(async (
    operation: () => Promise<any>,
    context: ErrorContext = {}
  ) => {
    try {
      return await operation()
    } catch (error) {
      return handleSyncError(error as Error, context)
    }
  }, [handleSyncError])

  return {
    ...rest,
    handleOfflineError,
    handleSyncError,
    handleOfflineOperation,
    handleSyncOperation
  }
}

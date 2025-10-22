/**
 * Centralized Error Handling Service
 * Provides consistent error handling for offline scenarios and network issues
 */

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  timestamp?: number
  metadata?: Record<string, any>
  offline?: boolean
  sync?: boolean
}

export interface ErrorInfo {
  type: 'network' | 'authentication' | 'validation' | 'storage' | 'sync' | 'unknown'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  context: ErrorContext
  retryable: boolean
  userMessage: string
  suggestedAction?: string
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private errorListeners: Array<(error: ErrorInfo) => void> = []
  private errorHistory: ErrorInfo[] = []
  private maxHistorySize = 100

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Handle different types of errors with appropriate responses
   */
  public handleError(error: Error, context: ErrorContext = {}): ErrorInfo {
    const errorInfo = this.analyzeError(error, context)
    
    // Add to history
    this.addToHistory(errorInfo)
    
    // Notify listeners
    this.notifyListeners(errorInfo)
    
    // Log error
    this.logError(errorInfo)
    
    return errorInfo
  }

  /**
   * Analyze error and determine appropriate response
   */
  private analyzeError(error: Error, context: ErrorContext): ErrorInfo {
    const errorMessage = error.message.toLowerCase()
    const timestamp = Date.now()

    // Network errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('fetch') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('offline')) {
      return {
        type: 'network',
        severity: 'medium',
        message: error.message,
        context: { ...context, timestamp },
        retryable: true,
        userMessage: 'Network connection issue. Data will be saved offline and synced when connection is restored.',
        suggestedAction: 'Check your internet connection and try again.'
      }
    }

    // Authentication errors
    if (errorMessage.includes('authentication') || 
        errorMessage.includes('unauthorized') || 
        errorMessage.includes('401') ||
        errorMessage.includes('forbidden') ||
        errorMessage.includes('403')) {
      return {
        type: 'authentication',
        severity: 'high',
        message: error.message,
        context: { ...context, timestamp },
        retryable: false,
        userMessage: 'Authentication issue. Please log in again.',
        suggestedAction: 'Please refresh the page and log in again.'
      }
    }

    // Storage errors
    if (errorMessage.includes('storage') || 
        errorMessage.includes('quota') || 
        errorMessage.includes('localstorage') ||
        errorMessage.includes('indexeddb')) {
      return {
        type: 'storage',
        severity: 'high',
        message: error.message,
        context: { ...context, timestamp },
        retryable: false,
        userMessage: 'Storage issue. Some data may not be saved.',
        suggestedAction: 'Clear browser storage or try a different browser.'
      }
    }

    // Sync errors
    if (errorMessage.includes('sync') || 
        errorMessage.includes('conflict') || 
        errorMessage.includes('merge')) {
      return {
        type: 'sync',
        severity: 'medium',
        message: error.message,
        context: { ...context, timestamp },
        retryable: true,
        userMessage: 'Data synchronization issue. Changes will be saved locally.',
        suggestedAction: 'Data will be synced when connection is restored.'
      }
    }

    // Validation errors
    if (errorMessage.includes('validation') || 
        errorMessage.includes('invalid') || 
        errorMessage.includes('required')) {
      return {
        type: 'validation',
        severity: 'low',
        message: error.message,
        context: { ...context, timestamp },
        retryable: false,
        userMessage: 'Please check your input and try again.',
        suggestedAction: 'Review the form and correct any errors.'
      }
    }

    // Unknown errors
    return {
      type: 'unknown',
      severity: 'medium',
      message: error.message,
      context: { ...context, timestamp },
      retryable: true,
      userMessage: 'An unexpected error occurred. Please try again.',
      suggestedAction: 'If the problem persists, please contact support.'
    }
  }

  /**
   * Add error to history
   */
  private addToHistory(errorInfo: ErrorInfo): void {
    this.errorHistory.unshift(errorInfo)
    
    // Keep only the most recent errors
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize)
    }
  }

  /**
   * Notify error listeners
   */
  private notifyListeners(errorInfo: ErrorInfo): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(errorInfo)
      } catch (error) {
        console.error('Error in error listener:', error)
      }
    })
  }

  /**
   * Log error to console with appropriate level
   */
  private logError(errorInfo: ErrorInfo): void {
    const logMessage = `[${errorInfo.type.toUpperCase()}] ${errorInfo.message}`
    const contextInfo = `Context: ${JSON.stringify(errorInfo.context)}`

    switch (errorInfo.severity) {
      case 'critical':
        console.error(logMessage, contextInfo)
        break
      case 'high':
        console.error(logMessage, contextInfo)
        break
      case 'medium':
        console.warn(logMessage, contextInfo)
        break
      case 'low':
        console.info(logMessage, contextInfo)
        break
    }
  }

  /**
   * Add error listener
   */
  public addErrorListener(listener: (error: ErrorInfo) => void): () => void {
    this.errorListeners.push(listener)
    
    return () => {
      const index = this.errorListeners.indexOf(listener)
      if (index > -1) {
        this.errorListeners.splice(index, 1)
      }
    }
  }

  /**
   * Get error history
   */
  public getErrorHistory(): ErrorInfo[] {
    return [...this.errorHistory]
  }

  /**
   * Get errors by type
   */
  public getErrorsByType(type: ErrorInfo['type']): ErrorInfo[] {
    return this.errorHistory.filter(error => error.type === type)
  }

  /**
   * Get errors by severity
   */
  public getErrorsBySeverity(severity: ErrorInfo['severity']): ErrorInfo[] {
    return this.errorHistory.filter(error => error.severity === severity)
  }

  /**
   * Clear error history
   */
  public clearHistory(): void {
    this.errorHistory = []
  }

  /**
   * Check if there are critical errors
   */
  public hasCriticalErrors(): boolean {
    return this.errorHistory.some(error => error.severity === 'critical')
  }

  /**
   * Get retryable errors
   */
  public getRetryableErrors(): ErrorInfo[] {
    return this.errorHistory.filter(error => error.retryable)
  }

  /**
   * Create user-friendly error message
   */
  public createUserMessage(errorInfo: ErrorInfo): string {
    const baseMessage = errorInfo.userMessage
    
    if (errorInfo.suggestedAction) {
      return `${baseMessage} ${errorInfo.suggestedAction}`
    }
    
    return baseMessage
  }

  /**
   * Handle offline-specific errors
   */
  public handleOfflineError(error: Error, context: ErrorContext = {}): ErrorInfo {
    const offlineContext = {
      ...context,
      offline: true,
      timestamp: Date.now()
    }

    return this.handleError(error, offlineContext)
  }

  /**
   * Handle sync-specific errors
   */
  public handleSyncError(error: Error, context: ErrorContext = {}): ErrorInfo {
    const syncContext = {
      ...context,
      sync: true,
      timestamp: Date.now()
    }

    return this.handleError(error, syncContext)
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()

// Export convenience functions
export const handleError = (error: Error, context?: ErrorContext) => 
  errorHandler.handleError(error, context)

export const handleOfflineError = (error: Error, context?: ErrorContext) => 
  errorHandler.handleOfflineError(error, context)

export const handleSyncError = (error: Error, context?: ErrorContext) => 
  errorHandler.handleSyncError(error, context)

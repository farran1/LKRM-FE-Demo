export interface SecurityConfig {
  // Session Management
  sessionTimeout: number // minutes
  maxLoginAttempts: number
  lockoutDuration: number // minutes
  
  // File Security
  maxFileSize: number // bytes
  allowedFileTypes: string[]
  virusScanEnabled: boolean
  fileEncryptionEnabled: boolean
  
  // Network Security
  enableIPWhitelist: boolean
  allowedIPRanges: string[]
  rateLimitEnabled: boolean
  maxRequestsPerMinute: number
  
  // Audit & Logging
  auditLogRetention: number // days
  securityAlertEmail: string
  logSuspiciousActivity: boolean
  
  // Compliance
  ferpaCompliant: boolean
  coppaCompliant: boolean
  gdprCompliant: boolean
  
  // Advanced Security
  mfaRequired: boolean
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    maxAge: number // days
  }
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  // Session Management
  sessionTimeout: 60, // 1 hour
  maxLoginAttempts: 5,
  lockoutDuration: 15, // 15 minutes
  
  // File Security
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'image/webp'
  ],
  virusScanEnabled: true,
  fileEncryptionEnabled: false, // TODO: Implement file encryption
  
  // Network Security
  enableIPWhitelist: false, // Can be enabled for school networks
  allowedIPRanges: [
    '192.168.1.0/24', // Example school network
    '10.0.0.0/8',     // Example school network
    '172.16.0.0/12'   // Example school network
  ],
  rateLimitEnabled: true,
  maxRequestsPerMinute: 100,
  
  // Audit & Logging
  auditLogRetention: 2555, // 7 years (FERPA requirement)
  securityAlertEmail: 'security@schoolsports.com',
  logSuspiciousActivity: true,
  
  // Compliance
  ferpaCompliant: true,
  coppaCompliant: true,
  gdprCompliant: false, // US-based platform
  
  // Advanced Security
  mfaRequired: false, // TODO: Implement MFA
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90 // 90 days
  }
}

export class SecurityConfigManager {
  private static instance: SecurityConfigManager
  private config: SecurityConfig
  
  private constructor() {
    this.config = { ...DEFAULT_SECURITY_CONFIG }
    this.loadFromEnvironment()
  }
  
  static getInstance(): SecurityConfigManager {
    if (!SecurityConfigManager.instance) {
      SecurityConfigManager.instance = new SecurityConfigManager()
    }
    return SecurityConfigManager.instance
  }
  
  getConfig(): SecurityConfig {
    return { ...this.config }
  }
  
  updateConfig(updates: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...updates }
    this.saveToEnvironment()
  }
  
  private loadFromEnvironment(): void {
    // Load configuration from environment variables
    if (process.env.SESSION_TIMEOUT) {
      this.config.sessionTimeout = parseInt(process.env.SESSION_TIMEOUT)
    }
    
    if (process.env.MAX_FILE_SIZE) {
      this.config.maxFileSize = parseInt(process.env.MAX_FILE_SIZE)
    }
    
    if (process.env.ENABLE_IP_WHITELIST) {
      this.config.enableIPWhitelist = process.env.ENABLE_IP_WHITELIST === 'true'
    }
    
    if (process.env.RATE_LIMIT_ENABLED) {
      this.config.rateLimitEnabled = process.env.RATE_LIMIT_ENABLED === 'true'
    }
    
    if (process.env.MAX_REQUESTS_PER_MINUTE) {
      this.config.maxRequestsPerMinute = parseInt(process.env.MAX_REQUESTS_PER_MINUTE)
    }
    
    if (process.env.AUDIT_LOG_RETENTION) {
      this.config.auditLogRetention = parseInt(process.env.AUDIT_LOG_RETENTION)
    }
    
    if (process.env.SECURITY_ALERT_EMAIL) {
      this.config.securityAlertEmail = process.env.SECURITY_ALERT_EMAIL
    }
    
    if (process.env.MFA_REQUIRED) {
      this.config.mfaRequired = process.env.MFA_REQUIRED === 'true'
    }
  }
  
  private saveToEnvironment(): void {
    // Save configuration to environment variables (for persistence)
    // In production, this should save to a secure configuration store
    process.env.SESSION_TIMEOUT = this.config.sessionTimeout.toString()
    process.env.MAX_FILE_SIZE = this.config.maxFileSize.toString()
    process.env.ENABLE_IP_WHITELIST = this.config.enableIPWhitelist.toString()
    process.env.RATE_LIMIT_ENABLED = this.config.rateLimitEnabled.toString()
    process.env.MAX_REQUESTS_PER_MINUTE = this.config.maxRequestsPerMinute.toString()
    process.env.AUDIT_LOG_RETENTION = this.config.auditLogRetention.toString()
    process.env.SECURITY_ALERT_EMAIL = this.config.securityAlertEmail
    process.env.MFA_REQUIRED = this.config.mfaRequired.toString()
  }
  
  // Validation methods
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const policy = this.config.passwordPolicy
    
    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`)
    }
    
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  // Compliance check methods
  isFERPACompliant(): boolean {
    return this.config.ferpaCompliant
  }
  
  isCOPPACompliant(): boolean {
    return this.config.coppaCompliant
  }
  
  getComplianceStatus(): Record<string, boolean> {
    return {
      FERPA: this.config.ferpaCompliant,
      COPPA: this.config.coppaCompliant,
      GDPR: this.config.gdprCompliant
    }
  }
}

export const securityConfig = SecurityConfigManager.getInstance()

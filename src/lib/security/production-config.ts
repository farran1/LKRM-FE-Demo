import { SecurityConfig } from './config'

// Production-ready security configuration
// Align to SecurityConfig structure
export const PRODUCTION_SECURITY_CONFIG = {
  // Session Management compatible with SecurityConfig
  sessionTimeout: 480, // minutes
  maxLoginAttempts: 5,
  lockoutDuration: 15,

  // File Security
  maxFileSize: 10 * 1024 * 1024,
  allowedFileTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ],
  virusScanEnabled: true,
  fileEncryptionEnabled: false,

  // Network Security
  enableIPWhitelist: false,
  allowedIPRanges: [],
  rateLimitEnabled: true,
  maxRequestsPerMinute: 100,

  // Audit & Logging
  auditLogRetention: 2555,
  securityAlertEmail: 'security@schoolsports.com',
  logSuspiciousActivity: true,

  // Compliance
  ferpaCompliant: true,
  coppaCompliant: true,
  gdprCompliant: false,

  // Advanced Security
  mfaRequired: true,
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90
  }
}

// Development security configuration (more permissive)
export const DEVELOPMENT_SECURITY_CONFIG = {
  ...PRODUCTION_SECURITY_CONFIG,
  
  sessionTimeout: 24 * 60, // minutes

  maxFileSize: 50 * 1024 * 1024,
  virusScanEnabled: false,

  maxRequestsPerMinute: 1000,

  auditLogRetention: 30,

  passwordPolicy: {
    ...PRODUCTION_SECURITY_CONFIG.passwordPolicy,
    minLength: 8
  },
  mfaRequired: false



}

// Get the appropriate security configuration based on environment
export function getSecurityConfig(): SecurityConfig {
  const isDevelopment = process.env.NODE_ENV === 'development'
  return isDevelopment ? DEVELOPMENT_SECURITY_CONFIG : PRODUCTION_SECURITY_CONFIG
}

// Security headers for Next.js
export const SECURITY_HEADERS = {
  'X-DNS-Prefetch-Control': 'off',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.io wss://*.supabase.co ws://localhost:3000",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
}

// Rate limiting configuration
export const RATE_LIMITS = {
  // API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per window
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // File upload endpoints
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // General endpoints
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
    standardHeaders: true,
    legacyHeaders: false
  }
}

// Input validation rules
export const VALIDATION_RULES = {
  // Common patterns
  patterns: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[1-9][\d]{0,15}$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    alphanumeric: /^[a-zA-Z0-9]+$/,
    alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
    noSpecialChars: /^[a-zA-Z0-9\s\-_]+$/
  },
  
  // Length limits
  limits: {
    shortText: 50,
    mediumText: 200,
    longText: 1000,
    veryLongText: 5000,
    description: 1000,
    name: 100,
    email: 255,
    phone: 20,
    url: 2000
  },
  
  // File limits
  files: {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
  }
}

// Security monitoring thresholds
export const SECURITY_THRESHOLDS = {
  // Failed login attempts
  failedLogins: {
    warning: 3,
    critical: 5,
    blockAfter: 10
  },
  
  // Suspicious activity
  suspiciousActivity: {
    warning: 5,
    critical: 10
  },
  
  // Rate limiting
  rateLimit: {
    warning: 80, // 80% of limit
    critical: 95 // 95% of limit
  },
  
  // File uploads
  fileUploads: {
    warning: 5, // 5 uploads per minute
    critical: 10 // 10 uploads per minute
  }
}

// Environment-specific configurations
export const ENVIRONMENT_CONFIG = {
  development: {
    enableDebugLogging: true,
    enableVerboseErrors: true,
    enableHotReload: true,
    enableSourceMaps: true,
    enableProfiling: false
  },
  
  staging: {
    enableDebugLogging: false,
    enableVerboseErrors: true,
    enableHotReload: false,
    enableSourceMaps: true,
    enableProfiling: true
  },
  
  production: {
    enableDebugLogging: false,
    enableVerboseErrors: false,
    enableHotReload: false,
    enableSourceMaps: false,
    enableProfiling: false
  }
}

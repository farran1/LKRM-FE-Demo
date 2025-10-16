import { NextRequest, NextResponse } from 'next/server'
import { auditLogger, AuditAction, AuditSeverity } from './audit'
import { hasPermission, UserRole } from './roles'

export interface SecurityContext {
  userId: string
  userEmail: string
  userRole: UserRole
  ipAddress: string
  userAgent: string
  sessionId: string
}

export class SecurityMiddleware {
  private static instance: SecurityMiddleware
  
  private constructor() {}
  
  static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware()
    }
    return SecurityMiddleware.instance
  }
  
  // Rate limiting for brute force protection
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>()
  
  // IP whitelist for school networks (configurable)
  private allowedIPs = new Set([
    // Add school network IPs here
    '192.168.1.0/24', // Example school network
    '10.0.0.0/8',     // Example school network
  ])
  
  async validateRequest(
    request: NextRequest,
    requiredPermission?: keyof import('./roles').RolePermissions
  ): Promise<{ isValid: boolean; context?: SecurityContext; error?: string }> {
    try {
      // 1. Rate limiting check
      const rateLimitResult = this.checkRateLimit(request)
      if (!rateLimitResult.allowed) {
        await this.logSecurityEvent(request, 'Rate limit exceeded', AuditSeverity.HIGH)
        return { isValid: false, error: 'Rate limit exceeded' }
      }
      
      // 2. IP validation (optional - can be disabled)
      if (process.env.ENABLE_IP_WHITELIST === 'true') {
        const ipResult = this.validateIP(request)
        if (!ipResult.allowed) {
          await this.logSecurityEvent(request, 'IP not in whitelist', AuditSeverity.HIGH)
          return { isValid: false, error: 'Access denied from this IP' }
        }
      }
      
      // 3. Authentication check
      const authResult = await this.validateAuthentication(request)
      if (!authResult.authenticated) {
        await this.logSecurityEvent(request, 'Authentication failed', AuditSeverity.MEDIUM)
        return { isValid: false, error: 'Authentication required' }
      }
      
      // 4. Permission check (if required)
      if (requiredPermission && authResult.context) {
        const hasAccess = hasPermission(authResult.context.userRole, requiredPermission)
        if (!hasAccess) {
          await this.logSecurityEvent(
            request, 
            `Permission denied: ${requiredPermission}`, 
            AuditSeverity.HIGH,
            authResult.context
          )
          return { isValid: false, error: 'Insufficient permissions' }
        }
      }
      
      return { 
        isValid: true, 
        context: authResult.context 
      }
      
    } catch (error) {
      console.error('Security middleware error:', error)
      await this.logSecurityEvent(request, 'Security middleware error', AuditSeverity.CRITICAL)
      return { isValid: false, error: 'Security validation failed' }
    }
  }
  
  private checkRateLimit(request: NextRequest): { allowed: boolean; remaining: number } {
    const ip = this.getClientIP(request)
    const now = Date.now()
    const windowMs = 15 * 60 * 1000 // 15 minutes
    const maxRequests = 100 // Max requests per window
    
    const key = `rate_limit:${ip}`
    const current = this.rateLimitMap.get(key)
    
    if (!current || now > current.resetTime) {
      // Reset or create new rate limit entry
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return { allowed: true, remaining: maxRequests - 1 }
    }
    
    if (current.count >= maxRequests) {
      return { allowed: false, remaining: 0 }
    }
    
    current.count++
    return { allowed: true, remaining: maxRequests - current.count }
  }
  
  private validateIP(request: NextRequest): { allowed: boolean } {
    const clientIP = this.getClientIP(request)
    
    // Simple IP validation - in production, use proper CIDR validation
    for (const allowedIP of this.allowedIPs) {
      if (this.isIPInRange(clientIP, allowedIP)) {
        return { allowed: true }
      }
    }
    
    return { allowed: false }
  }
  
  private async validateAuthentication(request: NextRequest): Promise<{ 
    authenticated: boolean; context?: SecurityContext 
  }> {
    try {
      // Get session from Supabase
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return { authenticated: false }
      }
      
      // TODO: Implement proper Supabase session validation
      // For now, return unauthenticated
      return { authenticated: false }
      
    } catch (error) {
      console.error('Authentication validation error:', error)
      return { authenticated: false }
    }
  }
  
  private getClientIP(request: NextRequest): string {
    // Get real IP from various headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    if (realIP) {
      return realIP
    }
    if (cfConnectingIP) {
      return cfConnectingIP
    }
    
    return '127.0.0.1' // Fallback
  }
  
  private isIPInRange(ip: string, cidr: string): boolean {
    // Simple IP range validation - in production, use proper CIDR library
    if (cidr.includes('/')) {
      const [range, bits] = cidr.split('/')
      const mask = parseInt(bits)
      // This is a simplified check - use proper CIDR validation in production
      return ip.startsWith(range.split('.').slice(0, Math.ceil(mask / 8)).join('.'))
    }
    return ip === cidr
  }
  
  private async logSecurityEvent(
    request: NextRequest, 
    message: string, 
    severity: AuditSeverity,
    context?: SecurityContext
  ): Promise<void> {
    try {
      await auditLogger.logSecurityEvent(
        context?.userId || 'unknown',
        context?.userEmail || 'unknown',
        context?.userRole || 'unknown',
        AuditAction.SUSPICIOUS_ACTIVITY,
        {
          message,
          ipAddress: this.getClientIP(request),
          userAgent: request.headers.get('user-agent') || 'unknown',
          url: request.url,
          method: request.method
        },
        severity
      )
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }
  
  // Clean up old rate limit entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.rateLimitMap.entries()) {
      if (now > value.resetTime) {
        this.rateLimitMap.delete(key)
      }
    }
  }
}

export const securityMiddleware = SecurityMiddleware.getInstance()

// Clean up rate limit map every 15 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    securityMiddleware.cleanup()
  }, 15 * 60 * 1000)
}

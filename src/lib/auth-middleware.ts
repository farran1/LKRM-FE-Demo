import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth } from '@/lib/supabase'
import { auditLogger, AuditAction, AuditSeverity } from '@/lib/security/audit'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string | null
    user_metadata?: any
  }
}

export interface AuthContext {
  user: {
    id: string
    email: string | null
    user_metadata?: any
  }
  supabase: any
}

/**
 * Standardized authentication middleware for API routes
 * Ensures consistent authentication across all endpoints
 */
export async function withAuth(
  handler: (request: AuthenticatedRequest, context: AuthContext, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      // Extract authentication from request
      const { client: supabase, user } = await createServerClientWithAuth(request)
      
      if (!user) {
        await auditLogger.logSecurityEvent(
          'unknown',
          'unknown',
          'unknown',
          AuditAction.PERMISSION_DENIED,
          {
            endpoint: request.url,
            method: request.method,
            reason: 'No authentication provided'
          },
          AuditSeverity.HIGH
        )
        
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Create authenticated request context
      const authRequest = request as AuthenticatedRequest
      const normalizedUser = {
        id: user.id,
        email: user.email ?? null,
        user_metadata: (user as any).user_metadata
      }
      authRequest.user = normalizedUser

      const authContext: AuthContext = {
        user: normalizedUser,
        supabase
      }

      // Call the actual handler with authenticated context
      return await handler(authRequest, authContext, ...args)

    } catch (error) {
      console.error('Authentication middleware error:', error)
      
      await auditLogger.logSecurityEvent(
        'unknown',
        'unknown',
        'unknown',
        AuditAction.SUSPICIOUS_ACTIVITY,
        {
          endpoint: request.url,
          method: request.method,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        AuditSeverity.HIGH
      )

      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

/**
 * Optional authentication middleware - allows both authenticated and anonymous access
 */
export async function withOptionalAuth(
  handler: (request: AuthenticatedRequest, context: AuthContext | null, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      let authContext: AuthContext | null = null
      const authRequest = request as AuthenticatedRequest

      try {
        const { client: supabase, user } = await createServerClientWithAuth(request)
        if (user) {
          const normalizedUser = {
            id: user.id,
            email: user.email ?? null,
            user_metadata: (user as any).user_metadata
          }
          authRequest.user = normalizedUser
          authContext = { user: normalizedUser, supabase }
        }
      } catch (authError) {
        // Authentication failed, but that's okay for optional auth
        console.log('Optional auth failed, proceeding without authentication')
      }

      return await handler(authRequest, authContext, ...args)

    } catch (error) {
      console.error('Optional authentication middleware error:', error)
      return NextResponse.json(
        { error: 'Request failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Role-based access control middleware
 */
export function requireRole(allowedRoles: string[]) {
  return function(
    handler: (request: AuthenticatedRequest, context: AuthContext, ...args: any[]) => Promise<NextResponse>
  ) {
    return withAuth(async (request: AuthenticatedRequest, context: AuthContext, ...args: any[]) => {
      const userRole = context.user.user_metadata?.role || 'user'
      
      if (!allowedRoles.includes(userRole)) {
        await auditLogger.logSecurityEvent(
          context.user.id,
          context.user.email ?? 'unknown',
          userRole,
          AuditAction.PERMISSION_DENIED,
          {
            endpoint: request.url,
            method: request.method,
            requiredRoles: allowedRoles,
            userRole
          },
          AuditSeverity.HIGH
        )

        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      return await handler(request, context, ...args)
    })
  }
}

/**
 * Rate limiting middleware (basic implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return function(
    handler: (request: AuthenticatedRequest, context: AuthContext, ...args: any[]) => Promise<NextResponse>
  ) {
    return withAuth(async (request: AuthenticatedRequest, context: AuthContext, ...args: any[]) => {
      const clientIP = getClientIP(request)
      const now = Date.now()
      const key = `rate_limit:${clientIP}`

      const current = rateLimitMap.get(key)
      
      if (!current || now > current.resetTime) {
        rateLimitMap.set(key, {
          count: 1,
          resetTime: now + windowMs
        })
      } else {
        if (current.count >= maxRequests) {
          await auditLogger.logSecurityEvent(
            context.user.id,
            context.user.email ?? 'unknown',
            'unknown',
            AuditAction.SUSPICIOUS_ACTIVITY,
            {
              endpoint: request.url,
              method: request.method,
              reason: 'Rate limit exceeded',
              clientIP
            },
            AuditSeverity.HIGH
          )

          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          )
        }
        current.count++
      }

      return await handler(request, context, ...args)
    })
  }
}

/**
 * Get client IP address from request headers
 */
function getClientIP(request: NextRequest): string {
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
  
  return '127.0.0.1'
}

/**
 * Input validation middleware
 */
export function validateInput(schema: any) {
  return function(
    handler: (request: AuthenticatedRequest, context: AuthContext, ...args: any[]) => Promise<NextResponse>
  ) {
    return withAuth(async (request: AuthenticatedRequest, context: AuthContext, ...args: any[]) => {
      try {
        const body = await request.json()
        const validatedData = schema.parse(body)
        
        // Add validated data to request context
        ;(request as any).validatedData = validatedData
        
        return await handler(request, context, ...args)
      } catch (error) {
        await auditLogger.logSecurityEvent(
          context.user.id,
          context.user.email ?? 'unknown',
          'unknown',
          AuditAction.SUSPICIOUS_ACTIVITY,
          {
            endpoint: request.url,
            method: request.method,
            reason: 'Input validation failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          AuditSeverity.MEDIUM
        )

        return NextResponse.json(
          { error: 'Invalid input data' },
          { status: 400 }
        )
      }
    })
  }
}

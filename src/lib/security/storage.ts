import { supabase } from '@/lib/supabase'
import { auditLogger, AuditAction, AuditSeverity } from './audit'
import { hasPermission, UserRole } from './roles'

/**
 * Normalize a receipt reference which may be stored as a full public URL
 * or as a bucket-relative path. Returns the object path relative to the
 * 'receipts' bucket, suitable for Supabase Storage API calls.
 */
export function normalizeReceiptPath(filePathOrUrl: string | null | undefined): string {
  if (!filePathOrUrl) return ''
  let value = String(filePathOrUrl).trim()

  try {
    // If value contains '/receipts/' take the segment after it
    const marker = '/receipts/'
    const idx = value.lastIndexOf(marker)
    if (idx !== -1) {
      value = value.substring(idx + marker.length)
      value = decodeURIComponent(value)
    }
  } catch {
    // ignore decode errors
  }

  // Remove any leading bucket prefixes or slashes
  if (value.startsWith('receipts/')) {
    value = value.substring('receipts/'.length)
  }
  while (value.startsWith('/')) {
    value = value.substring(1)
  }
  return value
}

export interface FileUploadResult {
  success: boolean
  filePath?: string
  error?: string
  virusScanResult?: 'clean' | 'infected' | 'unknown'
}

export interface FileAccessResult {
  success: boolean
  signedUrl?: string
  error?: string
  accessDenied?: boolean
}

export class SecureStorage {
  private static instance: SecureStorage
  
  // Allowed file types for security
  private static readonly ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/pdf',
    'image/webp'
  ])
  
  // Maximum file size (10MB)
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024
  
  // Virus scanning patterns (basic - in production use proper antivirus service)
  private static readonly SUSPICIOUS_PATTERNS = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.pif$/i,
    /\.com$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.jar$/i
  ]
  
  private constructor() {}
  
  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage()
    }
    return SecureStorage.instance
  }
  
  /**
   * Secure file upload with validation and virus scanning
   */
  async uploadFile(
    file: File,
    userId: string,
    userRole: UserRole,
    context: string
  ): Promise<FileUploadResult> {
    try {
      // 1. Permission check
      if (!hasPermission(userRole, 'canUploadReceipts')) {
        await this.logAccessDenied(userId, userRole, 'file_upload', context)
        return {
          success: false,
          error: 'Insufficient permissions to upload files'
        }
      }
      
      // 2. File type validation
      if (!SecureStorage.ALLOWED_MIME_TYPES.has(file.type)) {
        await this.logSecurityEvent(userId, userRole, 'Invalid file type', {
          fileName: file.name,
          mimeType: file.type,
          context
        })
        return {
          success: false,
          error: 'File type not allowed'
        }
      }
      
      // 3. File size validation
      if (file.size > SecureStorage.MAX_FILE_SIZE) {
        await this.logSecurityEvent(userId, userRole, 'File too large', {
          fileName: file.name,
          fileSize: file.size,
          maxSize: SecureStorage.MAX_FILE_SIZE,
          context
        })
        return {
          success: false,
          error: 'File size exceeds maximum allowed (10MB)'
        }
      }
      
      // 4. Filename security validation
      const filenameValidation = this.validateFilename(file.name)
      if (!filenameValidation.valid) {
        await this.logSecurityEvent(userId, userRole, 'Suspicious filename', {
          fileName: file.name,
          reason: filenameValidation.reason,
          context
        })
        return {
          success: false,
          error: 'Filename contains suspicious characters'
        }
      }
      
      // 5. Virus scanning (basic pattern matching)
      const virusScanResult = await this.scanForViruses(file)
      if (virusScanResult === 'infected') {
        await this.logSecurityEvent(userId, userRole, 'Virus detected', {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          context
        }, AuditSeverity.CRITICAL)
        return {
          success: false,
          error: 'File appears to be infected',
          virusScanResult: 'infected'
        }
      }
      
      // 6. Generate secure filename
      const secureFilename = this.generateSecureFilename(file.name, userId)
      
      // 7. Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(secureFilename, file, {
          cacheControl: '3600',
          upsert: false,
          metadata: {
            originalName: file.name,
            uploadedBy: userId,
            userRole: userRole,
            uploadContext: context,
            virusScanResult: virusScanResult,
            fileSize: file.size,
            mimeType: file.type,
            uploadTimestamp: new Date().toISOString()
          }
        })
      
      if (error) {
        await this.logSecurityEvent(userId, userRole, 'Upload failed', {
          fileName: file.name,
          error: error.message,
          context
        })
        throw error
      }
      
      // 8. Log successful upload
      await auditLogger.logUserAction(
        userId,
        'unknown', // Will be filled by actual user context
        userRole,
        AuditAction.RECEIPT_UPLOADED,
        'receipt',
        secureFilename,
        {
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          context,
          virusScanResult
        }
      )
      
      return {
        success: true,
        filePath: secureFilename,
        virusScanResult
      }
      
    } catch (error) {
      console.error('Secure file upload error:', error)
      return {
        success: false,
        error: 'File upload failed'
      }
    }
  }
  
  /**
   * Secure file access with signed URLs and access logging
   */
  async getSecureFileAccess(
    filePath: string,
    userId: string,
    userRole: UserRole,
    context: string
  ): Promise<FileAccessResult> {
    try {
      const objectPath = normalizeReceiptPath(filePath)
      if (!objectPath) {
        return { success: false, error: 'Invalid file path' }
      }
      // 1. Permission check
      if (!hasPermission(userRole, 'canViewReceipts')) {
        await this.logAccessDenied(userId, userRole, 'file_access', context)
        return {
          success: false,
          error: 'Insufficient permissions to view files',
          accessDenied: true
        }
      }
      
      // 2. Generate short-lived signed URL (1 hour)
      const { data, error } = await supabase.storage
        .from('receipts')
        .createSignedUrl(objectPath, 3600)
      
      if (error) {
        await this.logSecurityEvent(userId, userRole, 'Signed URL generation failed', {
          filePath,
          objectPath,
          error: error.message,
          context
        })
        throw error
      }
      
      // 3. Log file access
      await auditLogger.logUserAction(
        userId,
        'unknown', // Will be filled by actual user context
        userRole,
        AuditAction.RECEIPT_VIEWED,
        'receipt',
        filePath,
        { context }
      )
      
      return {
        success: true,
        signedUrl: data.signedUrl
      }
      
    } catch (error) {
      console.error('Secure file access error:', error)
      return {
        success: false,
        error: 'File access failed'
      }
    }
  }
  
  /**
   * Delete file with security logging
   */
  async deleteFile(
    filePath: string,
    userId: string,
    userRole: UserRole,
    context: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const objectPath = normalizeReceiptPath(filePath)
      if (!objectPath) {
        return { success: false, error: 'Invalid file path' }
      }
      // 1. Permission check
      if (!hasPermission(userRole, 'canDeleteExpenses')) {
        await this.logAccessDenied(userId, userRole, 'file_deletion', context)
        return {
          success: false,
          error: 'Insufficient permissions to delete files'
        }
      }
      
      // 2. Delete from storage
      const { error } = await supabase.storage
        .from('receipts')
        .remove([objectPath])
      
      if (error) {
        await this.logSecurityEvent(userId, userRole, 'File deletion failed', {
          filePath,
          objectPath,
          error: error.message,
          context
        })
        throw error
      }
      
      // 3. Log deletion
      await auditLogger.logUserAction(
        userId,
        'unknown', // Will be filled by actual user context
        userRole,
        AuditAction.RECEIPT_DELETED,
        'receipt',
        filePath,
        { context }
      )
      
      return { success: true }
      
    } catch (error) {
      console.error('Secure file deletion error:', error)
      return {
        success: false,
        error: 'File deletion failed'
      }
    }
  }
  
  /**
   * Basic virus scanning using pattern matching
   * In production, integrate with proper antivirus service
   */
  private async scanForViruses(file: File): Promise<'clean' | 'infected' | 'unknown'> {
    try {
      // Check for suspicious file extensions
      for (const pattern of SecureStorage.SUSPICIOUS_PATTERNS) {
        if (pattern.test(file.name)) {
          return 'infected'
        }
      }
      
      // Check for suspicious MIME type mismatches
      if (file.type === 'application/octet-stream' && file.size > 1024) {
        return 'unknown' // Suspicious but not definitely infected
      }
      
      // TODO: Integrate with proper antivirus service
      // For now, return clean for allowed file types
      return 'clean'
      
    } catch (error) {
      console.error('Virus scan error:', error)
      return 'unknown'
    }
  }
  
  /**
   * Validate filename for security
   */
  private validateFilename(filename: string): { valid: boolean; reason?: string } {
    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return { valid: false, reason: 'Path traversal detected' }
    }
    
    // Check for suspicious characters
    if (/[<>:"|?*]/.test(filename)) {
      return { valid: false, reason: 'Invalid characters in filename' }
    }
    
    // Check for extremely long filenames
    if (filename.length > 255) {
      return { valid: false, reason: 'Filename too long' }
    }
    
    return { valid: true }
  }
  
  /**
   * Generate secure, unique filename
   */
  private generateSecureFilename(originalName: string, userId: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const extension = originalName.split('.').pop() || 'bin'
    
    // Include user ID for audit trail
    return `${timestamp}-${random}-${userId}.${extension}`
  }
  
  /**
   * Log access denied events
   */
  private async logAccessDenied(
    userId: string,
    userRole: UserRole,
    action: string,
    context: string
  ): Promise<void> {
    await auditLogger.logSecurityEvent(
      userId,
      'unknown', // Will be filled by actual user context
      userRole,
      AuditAction.PERMISSION_DENIED,
      {
        action,
        context,
        resourceType: 'file'
      },
      AuditSeverity.HIGH
    )
  }
  
  /**
   * Log security events
   */
  private async logSecurityEvent(
    userId: string,
    userRole: UserRole,
    message: string,
    details: Record<string, any>,
    severity: AuditSeverity = AuditSeverity.MEDIUM
  ): Promise<void> {
    await auditLogger.logSecurityEvent(
      userId,
      'unknown', // Will be filled by actual user context
      userRole,
      AuditAction.SUSPICIOUS_ACTIVITY,
      {
        message,
        ...details
      },
      severity
    )
  }
}

export const secureStorage = SecureStorage.getInstance()

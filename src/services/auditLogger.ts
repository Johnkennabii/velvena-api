import prisma from "../lib/prisma.js";
import pino from "../lib/logger.js";
import type { Request } from "express";

/**
 * Audit Logger Service
 *
 * Logs critical operations for RGPD compliance with 7-year retention.
 *
 * Usage:
 * - Account deletions (requested, confirmed, cancelled, failed)
 * - User management operations
 * - Contract operations
 * - Data exports
 */

// ========================================
// AUDIT ACTION TYPES
// ========================================

export enum AuditAction {
  // Account Deletion Actions
  ACCOUNT_DELETION_REQUESTED = "ACCOUNT_DELETION_REQUESTED",
  ACCOUNT_DELETION_CONFIRMED = "ACCOUNT_DELETION_CONFIRMED",
  ACCOUNT_DELETION_CANCELLED = "ACCOUNT_DELETION_CANCELLED",
  ACCOUNT_DELETION_FAILED = "ACCOUNT_DELETION_FAILED",
  ACCOUNT_DELETION_CODE_SENT = "ACCOUNT_DELETION_CODE_SENT",
  ACCOUNT_DELETION_INVALID_CODE = "ACCOUNT_DELETION_INVALID_CODE",
  ACCOUNT_DELETION_EXPIRED_CODE = "ACCOUNT_DELETION_EXPIRED_CODE",

  // User Management Actions
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  USER_PASSWORD_CHANGED = "USER_PASSWORD_CHANGED",
  USER_ROLE_CHANGED = "USER_ROLE_CHANGED",

  // Organization Actions
  ORGANIZATION_CREATED = "ORGANIZATION_CREATED",
  ORGANIZATION_UPDATED = "ORGANIZATION_UPDATED",
  ORGANIZATION_DELETED = "ORGANIZATION_DELETED",

  // Data Export Actions
  DATA_EXPORT_REQUESTED = "DATA_EXPORT_REQUESTED",
  DATA_EXPORT_COMPLETED = "DATA_EXPORT_COMPLETED",
  DATA_EXPORT_FAILED = "DATA_EXPORT_FAILED",

  // Contract Actions
  CONTRACT_CREATED = "CONTRACT_CREATED",
  CONTRACT_SIGNED = "CONTRACT_SIGNED",
  CONTRACT_DELETED = "CONTRACT_DELETED",
}

export enum AuditStatus {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
}

export enum ResourceType {
  ORGANIZATION = "organization",
  USER = "user",
  CONTRACT = "contract",
  CUSTOMER = "customer",
  PROSPECT = "prospect",
  DRESS = "dress",
  EXPORT = "export",
}

// ========================================
// AUDIT LOG INTERFACE
// ========================================

interface AuditLogData {
  // Required fields
  action: AuditAction;
  status: AuditStatus;

  // Optional context
  organization_id?: string;
  user_id?: string;
  resource_type?: ResourceType;
  resource_id?: string;

  // Request context
  ip_address?: string;
  user_agent?: string;
  method?: string;
  endpoint?: string;

  // Result
  error_message?: string;

  // Additional flexible metadata
  metadata?: Record<string, any>;
}

// ========================================
// MAIN AUDIT LOGGING FUNCTION
// ========================================

/**
 * Log an audit event to the database
 *
 * @param data - Audit log data
 * @returns The created audit log entry or null if failed
 */
export async function logAudit(data: AuditLogData) {
  try {
    // Calculate retention_until (7 years from now for RGPD compliance)
    const retention_until = new Date();
    retention_until.setFullYear(retention_until.getFullYear() + 7);

    const auditLog = await prisma.auditLog.create({
      data: {
        ...(data.organization_id && { organization_id: data.organization_id }),
        ...(data.user_id && { user_id: data.user_id }),
        action: data.action,
        ...(data.resource_type && { resource_type: data.resource_type as string }),
        ...(data.resource_id && { resource_id: data.resource_id }),
        ...(data.ip_address && { ip_address: data.ip_address }),
        ...(data.user_agent && { user_agent: data.user_agent }),
        ...(data.method && { method: data.method }),
        ...(data.endpoint && { endpoint: data.endpoint }),
        status: data.status,
        ...(data.error_message && { error_message: data.error_message }),
        ...(data.metadata && { metadata: data.metadata }),
        retention_until,
      },
    });

    pino.info(
      {
        audit_id: auditLog.id,
        action: data.action,
        status: data.status,
        organization_id: data.organization_id,
        user_id: data.user_id,
      },
      "📝 Audit log created"
    );

    return auditLog;
  } catch (error) {
    pino.error(
      { error, action: data.action },
      "❌ Failed to create audit log"
    );
    return null;
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Extract request metadata from Express Request
 *
 * @param req - Express Request object
 * @returns Object with ip_address, user_agent, method, endpoint
 */
export function extractRequestMetadata(req: Request) {
  return {
    ip_address: req.ip || req.headers["x-forwarded-for"] as string || req.socket.remoteAddress,
    user_agent: req.headers["user-agent"] || undefined,
    method: req.method,
    endpoint: req.originalUrl || req.url,
  };
}

// ========================================
// SPECIALIZED AUDIT LOGGING FUNCTIONS
// ========================================

/**
 * Log account deletion request
 */
export async function logAccountDeletionRequested(
  organizationId: string,
  userId: string,
  userRole: string,
  userEmail: string,
  req?: Request
) {
  const metadata: Record<string, any> = {
    user_role: userRole,
    user_email: userEmail,
  };

  const requestData = req ? extractRequestMetadata(req) : {};

  return await logAudit({
    action: AuditAction.ACCOUNT_DELETION_REQUESTED,
    status: AuditStatus.SUCCESS,
    organization_id: organizationId,
    user_id: userId,
    resource_type: ResourceType.ORGANIZATION,
    resource_id: organizationId,
    metadata,
    ...requestData,
  });
}

/**
 * Log account deletion confirmation
 */
export async function logAccountDeletionConfirmed(
  organizationId: string,
  userId: string,
  deletedData: {
    users: number;
    dresses: number;
    customers: number;
    prospects: number;
    contracts: number;
  },
  exportPath?: string,
  req?: Request
) {
  const metadata: Record<string, any> = {
    deleted_data: deletedData,
    data_exported: !!exportPath,
    export_file_path: exportPath,
    total_records_deleted:
      deletedData.users +
      deletedData.dresses +
      deletedData.customers +
      deletedData.prospects +
      deletedData.contracts,
  };

  const requestData = req ? extractRequestMetadata(req) : {};

  return await logAudit({
    action: AuditAction.ACCOUNT_DELETION_CONFIRMED,
    status: AuditStatus.SUCCESS,
    organization_id: organizationId,
    user_id: userId,
    resource_type: ResourceType.ORGANIZATION,
    resource_id: organizationId,
    metadata,
    ...requestData,
  });
}

/**
 * Log account deletion failure
 */
export async function logAccountDeletionFailed(
  organizationId: string,
  userId: string,
  errorMessage: string,
  req?: Request
) {
  const requestData = req ? extractRequestMetadata(req) : {};

  return await logAudit({
    action: AuditAction.ACCOUNT_DELETION_FAILED,
    status: AuditStatus.FAILURE,
    organization_id: organizationId,
    user_id: userId,
    resource_type: ResourceType.ORGANIZATION,
    resource_id: organizationId,
    error_message: errorMessage,
    ...requestData,
  });
}

/**
 * Log invalid validation code attempt
 */
export async function logAccountDeletionInvalidCode(
  organizationId: string,
  userId: string,
  attemptedCode: string,
  req?: Request
) {
  const metadata: Record<string, any> = {
    attempted_code: attemptedCode,
  };

  const requestData = req ? extractRequestMetadata(req) : {};

  return await logAudit({
    action: AuditAction.ACCOUNT_DELETION_INVALID_CODE,
    status: AuditStatus.FAILURE,
    organization_id: organizationId,
    user_id: userId,
    resource_type: ResourceType.ORGANIZATION,
    resource_id: organizationId,
    metadata,
    ...requestData,
  });
}

/**
 * Log expired validation code
 */
export async function logAccountDeletionExpiredCode(
  organizationId: string,
  userId: string,
  expiresAt: Date,
  req?: Request
) {
  const metadata: Record<string, any> = {
    expires_at: expiresAt.toISOString(),
    time_since_expiry: Date.now() - expiresAt.getTime(),
  };

  const requestData = req ? extractRequestMetadata(req) : {};

  return await logAudit({
    action: AuditAction.ACCOUNT_DELETION_EXPIRED_CODE,
    status: AuditStatus.FAILURE,
    organization_id: organizationId,
    user_id: userId,
    resource_type: ResourceType.ORGANIZATION,
    resource_id: organizationId,
    metadata,
    ...requestData,
  });
}

/**
 * Log validation code sent
 */
export async function logAccountDeletionCodeSent(
  organizationId: string,
  userId: string,
  organizationEmail: string,
  expiresAt: Date,
  req?: Request
) {
  const metadata: Record<string, any> = {
    organization_email: organizationEmail,
    expires_at: expiresAt.toISOString(),
    validity_minutes: 30,
  };

  const requestData = req ? extractRequestMetadata(req) : {};

  return await logAudit({
    action: AuditAction.ACCOUNT_DELETION_CODE_SENT,
    status: AuditStatus.SUCCESS,
    organization_id: organizationId,
    user_id: userId,
    resource_type: ResourceType.ORGANIZATION,
    resource_id: organizationId,
    metadata,
    ...requestData,
  });
}

/**
 * Log data export
 */
export async function logDataExport(
  organizationId: string,
  userId: string,
  exportPath: string,
  stats: any,
  req?: Request
) {
  const metadata: Record<string, any> = {
    export_file_path: exportPath,
    export_stats: stats,
  };

  const requestData = req ? extractRequestMetadata(req) : {};

  return await logAudit({
    action: AuditAction.DATA_EXPORT_COMPLETED,
    status: AuditStatus.SUCCESS,
    organization_id: organizationId,
    user_id: userId,
    resource_type: ResourceType.EXPORT,
    metadata,
    ...requestData,
  });
}

// ========================================
// AUDIT LOG CLEANUP (7+ YEARS OLD)
// ========================================

/**
 * Clean up audit logs older than retention period
 * Should be run periodically (e.g., daily cron job)
 *
 * @returns Number of deleted audit logs
 */
export async function cleanupExpiredAuditLogs(): Promise<number> {
  try {
    const now = new Date();

    const result = await prisma.auditLog.deleteMany({
      where: {
        retention_until: {
          lt: now,
        },
      },
    });

    if (result.count > 0) {
      pino.info(
        { count: result.count },
        "🧹 Cleaned up expired audit logs (7+ years old)"
      );
    }

    return result.count;
  } catch (error) {
    pino.error({ error }, "❌ Failed to cleanup expired audit logs");
    return 0;
  }
}

// ========================================
// AUDIT LOG QUERY HELPERS
// ========================================

/**
 * Get audit logs for an organization
 */
export async function getOrganizationAuditLogs(
  organizationId: string,
  options: {
    limit?: number;
    offset?: number;
    action?: AuditAction;
    status?: AuditStatus;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const {
    limit = 100,
    offset = 0,
    action,
    status,
    startDate,
    endDate,
  } = options;

  const where: any = {
    organization_id: organizationId,
  };

  if (action) {
    where.action = action;
  }

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) {
      where.created_at.gte = startDate;
    }
    if (endDate) {
      where.created_at.lte = endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    limit,
    offset,
  };
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    action?: AuditAction;
    status?: AuditStatus;
  } = {}
) {
  const {
    limit = 100,
    offset = 0,
    action,
    status,
  } = options;

  const where: any = {
    user_id: userId,
  };

  if (action) {
    where.action = action;
  }

  if (status) {
    where.status = status;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: limit,
      skip: offset,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    limit,
    offset,
  };
}

import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import pino from "../lib/logger.js";

/**
 * Multi-tenant middleware
 *
 * Extracts the organizationId from the authenticated user or API key
 * and makes it available on req.organizationId for easy access in controllers.
 *
 * This middleware should run AFTER authentication middleware.
 */
export const tenantMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Extract organizationId from user (JWT auth) or apiKey
  const organizationId = req.user?.organizationId || req.apiKey?.organizationId;

  if (!organizationId) {
    pino.warn(
      { user: req.user, apiKey: req.apiKey },
      "❌ No organization context found"
    );
    return res.status(403).json({
      message: "Organization context required. Please ensure you are authenticated.",
    });
  }

  // Make organizationId available on request object
  req.organizationId = organizationId;

  pino.debug(
    { organizationId, userId: req.user?.id, apiKeyId: req.apiKey?.id },
    "✅ Tenant context established"
  );

  next();
};

/**
 * Optional tenant middleware - doesn't fail if no organization is found
 * Useful for public routes that may optionally use organization context
 */
export const optionalTenantMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const organizationId = req.user?.organizationId || req.apiKey?.organizationId;

  if (organizationId) {
    req.organizationId = organizationId;
    pino.debug({ organizationId }, "✅ Optional tenant context established");
  } else {
    pino.debug("ℹ️ No tenant context (optional route)");
  }

  next();
};

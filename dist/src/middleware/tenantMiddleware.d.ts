import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
/**
 * Multi-tenant middleware
 *
 * Extracts the organizationId from the authenticated user or API key
 * and makes it available on req.organizationId for easy access in controllers.
 *
 * This middleware should run AFTER authentication middleware.
 */
export declare const tenantMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Optional tenant middleware - doesn't fail if no organization is found
 * Useful for public routes that may optionally use organization context
 */
export declare const optionalTenantMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=tenantMiddleware.d.ts.map
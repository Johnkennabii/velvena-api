import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
/**
 * Get current user's organization
 */
export declare const getMyOrganization: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update current user's organization
 * Only admins should be able to do this (add role check in route)
 */
export declare const updateMyOrganization: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get organization statistics
 */
export declare const getOrganizationStats: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * SUPER ADMIN ONLY: Create a new organization
 * This endpoint should be protected by a super-admin check
 */
export declare const createOrganization: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * SUPER ADMIN ONLY: List all organizations
 */
export declare const listOrganizations: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=organizationController.d.ts.map
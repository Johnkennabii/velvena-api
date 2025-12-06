import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
/**
 * Create a new prospect request
 * POST /prospects/:prospectId/requests
 */
export declare const createProspectRequest: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get all requests for a prospect
 * GET /prospects/:prospectId/requests
 */
export declare const getProspectRequests: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get a single request by ID
 * GET /prospects/:prospectId/requests/:requestId
 */
export declare const getProspectRequestById: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update a prospect request
 * PATCH /prospects/:prospectId/requests/:requestId
 */
export declare const updateProspectRequest: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete a prospect request (soft delete)
 * DELETE /prospects/:prospectId/requests/:requestId
 */
export declare const deleteProspectRequest: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=prospectRequestController.d.ts.map
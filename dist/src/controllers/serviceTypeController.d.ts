import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
/**
 * GET /service-types
 * Liste tous les types de services (globaux + org-specific)
 */
export declare const getServiceTypes: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * GET /service-types/:id
 * Récupère un type de service par ID
 */
export declare const getServiceTypeById: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * POST /service-types
 * Créer un nouveau type de service (org-specific)
 */
export declare const createServiceType: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * PUT /service-types/:id
 * Mettre à jour un type de service
 */
export declare const updateServiceType: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * DELETE /service-types/:id
 * Supprimer un type de service (soft delete)
 */
export declare const deleteServiceType: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=serviceTypeController.d.ts.map
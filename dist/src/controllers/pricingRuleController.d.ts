import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
/**
 * GET /pricing-rules
 * Liste toutes les règles de pricing (globales + org-specific)
 */
export declare const getPricingRules: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * GET /pricing-rules/:id
 * Récupère une règle de pricing par ID
 */
export declare const getPricingRuleById: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * POST /pricing-rules
 * Créer une nouvelle règle de pricing (org-specific)
 */
export declare const createPricingRule: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * PUT /pricing-rules/:id
 * Mettre à jour une règle de pricing
 */
export declare const updatePricingRule: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * DELETE /pricing-rules/:id
 * Supprimer une règle de pricing (soft delete)
 */
export declare const deletePricingRule: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * POST /pricing-rules/calculate
 * Calculer le prix pour un contexte donné
 */
export declare const calculatePriceEndpoint: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=pricingRuleController.d.ts.map
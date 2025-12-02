import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
/**
 * Générer une nouvelle API Key
 * POST /api-keys
 * Body: { name: string, scopes: string[], expires_at?: Date }
 */
export declare const generateApiKey: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Lister toutes les API Keys (sans les clés en clair)
 * GET /api-keys
 */
export declare const listApiKeys: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Obtenir une API Key par ID
 * GET /api-keys/:id
 */
export declare const getApiKeyById: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Révoquer une API Key
 * DELETE /api-keys/:id
 */
export declare const revokeApiKey: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Refresh (renouveler) une API Key
 * POST /api-keys/:id/refresh
 * Génère une nouvelle clé, révoque l'ancienne
 */
export declare const refreshApiKey: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=apiKeyController.d.ts.map
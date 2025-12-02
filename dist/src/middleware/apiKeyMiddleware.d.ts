import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
/**
 * Middleware pour authentifier avec une API Key
 * Header attendu: X-API-Key: <api_key>
 */
export declare const apiKeyMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware pour vérifier qu'un scope spécifique est présent
 */
export declare const requireScope: (requiredScope: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=apiKeyMiddleware.d.ts.map
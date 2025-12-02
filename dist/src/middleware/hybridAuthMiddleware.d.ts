import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
/**
 * Middleware d'authentification hybride
 * Accepte soit un token JWT (Bearer) soit une API Key (X-API-Key)
 *
 * Priorité:
 * 1. Si X-API-Key est fourni, utiliser l'authentification API Key
 * 2. Sinon, si Authorization Bearer est fourni, utiliser JWT
 * 3. Sinon, rejeter la requête
 */
export declare const hybridAuthMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware pour vérifier qu'un scope API Key spécifique est présent
 * (Ne s'applique que si authentifié via API Key, pas JWT)
 */
export declare const requireApiKeyScope: (requiredScope: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=hybridAuthMiddleware.d.ts.map
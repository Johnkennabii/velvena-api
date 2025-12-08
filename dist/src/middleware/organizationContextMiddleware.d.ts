import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
/**
 * Middleware pour gérer le contexte d'organisation
 *
 * Comportement:
 * - SUPER_ADMIN: Peut spécifier une organisation via le header X-Organization-Slug
 * - Autres rôles: Utilisent automatiquement leur organization_id
 *
 * Usage:
 * Header: X-Organization-Slug: acme-corp
 * → Le SUPER_ADMIN opère dans le contexte de l'organisation "acme-corp"
 */
export declare const organizationContextMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=organizationContextMiddleware.d.ts.map
import type { AuthenticatedRequest } from "../types/express.js";
import type { Response } from "express";
/**
 * Récupère l'organization_id effectif de la requête
 *
 * Gère automatiquement:
 * - Utilisateurs normaux: Leur organization_id
 * - SUPER_ADMIN avec header X-Organization-Slug: L'organisation sélectionnée
 *
 * @param req - La requête authentifiée
 * @returns L'organization_id effectif ou null
 */
export declare function getEffectiveOrganizationId(req: AuthenticatedRequest): string | null;
/**
 * Vérifie que le contexte d'organisation est présent
 * Retourne une erreur 403 si absent
 *
 * @param req - La requête authentifiée
 * @param res - La réponse Express
 * @returns L'organization_id ou null (et envoie la réponse d'erreur)
 */
export declare function requireOrganizationContext(req: AuthenticatedRequest, res: Response): string | null;
/**
 * Vérifie si la requête provient d'un SUPER_ADMIN opérant dans le contexte d'une autre organisation
 *
 * @param req - La requête authentifiée
 * @returns true si c'est un SUPER_ADMIN en mode impersonation
 */
export declare function isSuperAdminContext(req: AuthenticatedRequest): boolean;
//# sourceMappingURL=organizationHelper.d.ts.map
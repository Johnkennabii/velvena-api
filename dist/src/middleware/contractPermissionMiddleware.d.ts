import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
export declare function isContractActionAllowed(role: string | null | undefined, status: string | null | undefined): boolean;
/**
 * Middleware de contrôle d'accès par rôle/statut de contrat.
 * Bloque les opérations critiques si le rôle n'est pas autorisé pour le statut courant.
 */
export declare function contractPermissionMiddleware(paramKey?: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=contractPermissionMiddleware.d.ts.map
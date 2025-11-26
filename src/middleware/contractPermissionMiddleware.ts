import type { NextFunction, Response } from "express";
import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import type { AuthenticatedRequest } from "../types/express.js";

const SIGNED_STATUSES = new Set(["SIGNED", "SIGNED_ELECTRONICALLY"]);
const DRAFT_STATUS = "DRAFT";

export function isContractActionAllowed(role: string | null | undefined, status: string | null | undefined): boolean {
  const normalizedRole = role?.toUpperCase() ?? "";
  const normalizedStatus = status?.toUpperCase() ?? "";

  if (normalizedRole === "ADMIN") return true;
  if (normalizedRole === "MANAGER") return !SIGNED_STATUSES.has(normalizedStatus);
  if (normalizedRole === "COLLABORATOR") return normalizedStatus === DRAFT_STATUS;

  return false;
}

/**
 * Middleware de contrôle d'accès par rôle/statut de contrat.
 * Bloque les opérations critiques si le rôle n'est pas autorisé pour le statut courant.
 */
export function contractPermissionMiddleware(paramKey = "id") {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const contractId = req.params[paramKey];
    const user = req.user;

    if (!user?.id || !user.role) {
      logger.warn({ contractId, userId: user?.id, role: user?.role }, "Tentative sans authentification ou rôle manquant");
      return res.status(401).json({ success: false, error: "Authentification requise" });
    }

    if (!contractId) {
      return res.status(400).json({ success: false, error: "Contract ID requis" });
    }

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true, status: true, contract_number: true },
    });

    if (!contract) {
      return res.status(404).json({ success: false, error: "Contrat introuvable" });
    }

    const allowed = isContractActionAllowed(user.role, contract.status);

    if (!allowed) {
      logger.warn(
        {
          contractId: contract.id,
          contractNumber: contract.contract_number,
          status: contract.status,
          userId: user.id,
          role: user.role,
        },
        "Tentative non autorisée sur un contrat"
      );
      return res.status(403).json({ success: false, error: "Accès refusé pour ce contrat" });
    }

    return next();
  };
}

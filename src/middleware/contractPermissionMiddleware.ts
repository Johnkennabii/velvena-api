import type { NextFunction, Response } from "express";
import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import type { AuthenticatedRequest } from "../types/express.js";

const SIGNED_STATUSES = new Set(["SIGNED", "SIGNED_ELECTRONICALLY"]);
const DRAFT_STATUS = "DRAFT";

// Champs liés aux paiements que les MANAGERs peuvent modifier même sur les contrats signés
const PAYMENT_FIELDS = new Set([
  "account_paid_ttc",
  "account_paid_ht",
  "account_payment_method",
  "account_payment_date",
  "caution_paid_ttc",
  "caution_paid_ht",
  "caution_payment_method",
  "caution_payment_date",
  "balance_paid_ttc",
  "balance_paid_ht",
  "balance_payment_method",
  "balance_payment_date",
]);

/**
 * Vérifie si la requête ne contient que des champs de paiement
 */
function isPaymentOnlyUpdate(requestBody: any): boolean {
  if (!requestBody || typeof requestBody !== "object") return false;

  const bodyKeys = Object.keys(requestBody);
  if (bodyKeys.length === 0) return false;

  // Tous les champs doivent être des champs de paiement
  return bodyKeys.every(key => PAYMENT_FIELDS.has(key));
}

export function isContractActionAllowed(
  role: string | null | undefined,
  status: string | null | undefined,
  isPaymentAction: boolean = false
): boolean {
  const normalizedRole = role?.toUpperCase() ?? "";
  const normalizedStatus = status?.toUpperCase() ?? "";

  if (normalizedRole === "ADMIN") return true;

  // Les MANAGERs peuvent toujours faire des actions de paiement, même sur les contrats signés
  if (normalizedRole === "MANAGER") {
    if (isPaymentAction) return true;
    return !SIGNED_STATUSES.has(normalizedStatus);
  }

  if (normalizedRole === "COLLABORATOR") return normalizedStatus === DRAFT_STATUS;

  return false;
}

/**
 * Middleware de contrôle d'accès par rôle/statut de contrat.
 * Bloque les opérations critiques si le rôle n'est pas autorisé pour le statut courant.
 * Exception : Les MANAGERs peuvent toujours modifier les champs de paiement, même sur les contrats signés.
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

    // Vérifier si c'est une action de paiement uniquement
    const isPaymentAction = req.method === "PUT" && isPaymentOnlyUpdate(req.body);

    const allowed = isContractActionAllowed(user.role, contract.status, isPaymentAction);

    if (!allowed) {
      logger.warn(
        {
          contractId: contract.id,
          contractNumber: contract.contract_number,
          status: contract.status,
          userId: user.id,
          role: user.role,
          isPaymentAction,
          requestBody: req.body,
        },
        "Tentative non autorisée sur un contrat"
      );
      return res.status(403).json({ success: false, error: "Accès refusé pour ce contrat" });
    }

    return next();
  };
}

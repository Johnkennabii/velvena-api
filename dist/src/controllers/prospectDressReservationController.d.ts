import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
/**
 * Ajouter des robes à un prospect avec dates de location
 * POST /prospects/:prospectId/dress-reservations
 */
export declare const addDressReservations: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Obtenir toutes les réservations d'un prospect
 * GET /prospects/:prospectId/dress-reservations
 */
export declare const getProspectReservations: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Mettre à jour une réservation
 * PUT /prospects/:prospectId/dress-reservations/:reservationId
 */
export declare const updateReservation: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Supprimer une réservation
 * DELETE /prospects/:prospectId/dress-reservations/:reservationId
 */
export declare const deleteReservation: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=prospectDressReservationController.d.ts.map
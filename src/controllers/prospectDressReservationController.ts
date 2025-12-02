// src/controllers/prospectDressReservationController.ts
import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import prisma from "../lib/prisma.js";
import pino from "../lib/logger.js";

/**
 * Ajouter des robes à un prospect avec dates de location
 * POST /prospects/:prospectId/dress-reservations
 */
export const addDressReservations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prospectId } = req.params;
    const { dresses } = req.body; // Array of { dress_id, rental_start_date, rental_end_date, notes? }

    if (!prospectId) {
      return res.status(400).json({
        success: false,
        error: "Prospect ID is required",
      });
    }

    if (!dresses || !Array.isArray(dresses) || dresses.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Dresses array is required with at least one dress",
      });
    }

    // Vérifier que le prospect existe
    const prospect = await prisma.prospect.findUnique({
      where: { id: String(prospectId) },
    });

    if (!prospect) {
      return res.status(404).json({
        success: false,
        error: "Prospect not found",
      });
    }

    // Valider et créer les réservations
    const reservations = await Promise.all(
      dresses.map(async (dress: any) => {
        if (!dress.dress_id || !dress.rental_start_date || !dress.rental_end_date) {
          throw new Error("Each dress must have dress_id, rental_start_date, and rental_end_date");
        }

        return prisma.prospectDressReservation.create({
          data: {
            prospect_id: String(prospectId),
            dress_id: String(dress.dress_id),
            rental_start_date: new Date(dress.rental_start_date),
            rental_end_date: new Date(dress.rental_end_date),
            notes: dress.notes || null,
            created_by: req.user?.id ?? null,
          },
          include: {
            dress: {
              include: {
                type: true,
                size: true,
                color: true,
                condition: true,
              },
            },
          },
        });
      })
    );

    pino.info(
      { prospectId, count: reservations.length },
      "✅ Dress reservations added to prospect"
    );

    res.status(201).json({
      success: true,
      data: reservations,
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Error adding dress reservations");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to add dress reservations",
    });
  }
};

/**
 * Obtenir toutes les réservations d'un prospect
 * GET /prospects/:prospectId/dress-reservations
 */
export const getProspectReservations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prospectId } = req.params;

    if (!prospectId) {
      return res.status(400).json({
        success: false,
        error: "Prospect ID is required",
      });
    }

    const reservations = await prisma.prospectDressReservation.findMany({
      where: {
        prospect_id: String(prospectId),
        deleted_at: null,
      },
      include: {
        dress: {
          include: {
            type: true,
            size: true,
            color: true,
            condition: true,
          },
        },
      },
      orderBy: {
        rental_start_date: "asc",
      },
    });

    res.json({
      success: true,
      data: reservations,
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Error fetching prospect reservations");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch reservations",
    });
  }
};

/**
 * Mettre à jour une réservation
 * PUT /prospects/:prospectId/dress-reservations/:reservationId
 */
export const updateReservation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prospectId, reservationId } = req.params;
    const { rental_start_date, rental_end_date, notes } = req.body;

    if (!prospectId || !reservationId) {
      return res.status(400).json({
        success: false,
        error: "Prospect ID and Reservation ID are required",
      });
    }

    const reservation = await prisma.prospectDressReservation.findFirst({
      where: {
        id: String(reservationId),
        prospect_id: String(prospectId),
        deleted_at: null,
      },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: "Reservation not found",
      });
    }

    // Build update data conditionally
    const updateData: any = {
      updated_by: req.user?.id ?? null,
    };

    if (rental_start_date) {
      updateData.rental_start_date = new Date(rental_start_date);
    }

    if (rental_end_date) {
      updateData.rental_end_date = new Date(rental_end_date);
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updated = await prisma.prospectDressReservation.update({
      where: { id: String(reservationId) },
      data: updateData,
      include: {
        dress: {
          include: {
            type: true,
            size: true,
            color: true,
            condition: true,
          },
        },
      },
    });

    pino.info({ reservationId }, "✅ Reservation updated");

    res.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Error updating reservation");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to update reservation",
    });
  }
};

/**
 * Supprimer une réservation
 * DELETE /prospects/:prospectId/dress-reservations/:reservationId
 */
export const deleteReservation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prospectId, reservationId } = req.params;

    if (!prospectId || !reservationId) {
      return res.status(400).json({
        success: false,
        error: "Prospect ID and Reservation ID are required",
      });
    }

    const reservation = await prisma.prospectDressReservation.findFirst({
      where: {
        id: String(reservationId),
        prospect_id: String(prospectId),
      },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: "Reservation not found",
      });
    }

    await prisma.prospectDressReservation.update({
      where: { id: String(reservationId) },
      data: {
        deleted_at: new Date(),
        deleted_by: req.user?.id ?? null,
      },
    });

    pino.info({ reservationId }, "✅ Reservation deleted");

    res.json({
      success: true,
      message: "Reservation deleted successfully",
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Error deleting reservation");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to delete reservation",
    });
  }
};

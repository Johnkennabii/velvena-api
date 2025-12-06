// src/controllers/prospectRequestController.ts
import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import prisma from "../lib/prisma.js";
import pino from "../lib/logger.js";

/**
 * Generate a unique request number (format: REQ-YYYYMMDD-XXXX)
 */
async function generateRequestNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const datePrefix = `REQ-${year}${month}${day}`;

  // Find the last request number for today
  const lastRequest = await prisma.prospectRequest.findFirst({
    where: {
      request_number: {
        startsWith: datePrefix,
      },
    },
    orderBy: {
      request_number: "desc",
    },
  });

  let sequence = 1;
  if (lastRequest) {
    const parts = lastRequest.request_number.split("-");
    const lastSequence = parseInt(parts[2] || "0", 10);
    sequence = lastSequence + 1;
  }

  return `${datePrefix}-${String(sequence).padStart(4, "0")}`;
}

/**
 * Calculate rental days and estimated prices for dresses
 */
function calculateDressEstimates(dresses: any[]) {
  return dresses.map((dressData: any) => {
    const startDate = new Date(dressData.rental_start_date);
    const endDate = new Date(dressData.rental_end_date);
    const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const pricePerDayHt = Number(dressData.dress?.price_per_day_ht ?? 0);
    const pricePerDayTtc = Number(dressData.dress?.price_per_day_ttc ?? 0);

    const estimatedPriceHt = rentalDays * pricePerDayHt;
    const estimatedPriceTtc = rentalDays * pricePerDayTtc;

    return {
      rental_days: rentalDays,
      estimated_price_ht: estimatedPriceHt,
      estimated_price_ttc: estimatedPriceTtc,
    };
  });
}

/**
 * Create a new prospect request
 * POST /prospects/:prospectId/requests
 */
export const createProspectRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prospectId } = req.params;
    const { dresses, notes, status } = req.body;

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

    // Verify prospect exists
    const prospect = await prisma.prospect.findUnique({
      where: { id: String(prospectId), deleted_at: null },
    });

    if (!prospect) {
      return res.status(404).json({
        success: false,
        error: "Prospect not found",
      });
    }

    // Validate and fetch dress details
    const dressIds = dresses.map((d: any) => d.dress_id);
    const fetchedDresses = await prisma.dress.findMany({
      where: {
        id: { in: dressIds },
        deleted_at: null,
      },
    });

    if (fetchedDresses.length !== dressIds.length) {
      return res.status(400).json({
        success: false,
        error: "One or more dresses not found",
      });
    }

    // Create dress map for easy lookup
    const dressMap = new Map(fetchedDresses.map(d => [d.id, d]));

    // Calculate totals
    let totalEstimatedHt = 0;
    let totalEstimatedTtc = 0;

    const dressesWithCalculations = dresses.map((dressData: any) => {
      const dress = dressMap.get(dressData.dress_id);
      if (!dress) {
        throw new Error(`Dress ${dressData.dress_id} not found`);
      }

      const startDate = new Date(dressData.rental_start_date);
      const endDate = new Date(dressData.rental_end_date);
      const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const pricePerDayHt = Number(dress.price_per_day_ht);
      const pricePerDayTtc = Number(dress.price_per_day_ttc);

      const estimatedPriceHt = rentalDays * pricePerDayHt;
      const estimatedPriceTtc = rentalDays * pricePerDayTtc;

      totalEstimatedHt += estimatedPriceHt;
      totalEstimatedTtc += estimatedPriceTtc;

      return {
        dress_id: dressData.dress_id,
        rental_start_date: startDate,
        rental_end_date: endDate,
        rental_days: rentalDays,
        estimated_price_ht: estimatedPriceHt,
        estimated_price_ttc: estimatedPriceTtc,
        notes: dressData.notes || null,
      };
    });

    // Generate unique request number
    const requestNumber = await generateRequestNumber();

    // Create the request with dresses
    const request = await prisma.prospectRequest.create({
      data: {
        request_number: requestNumber,
        prospect_id: String(prospectId),
        status: status || "draft",
        total_estimated_ht: totalEstimatedHt,
        total_estimated_ttc: totalEstimatedTtc,
        notes: notes || null,
        created_by: req.user?.id ?? null,
        dresses: {
          create: dressesWithCalculations.map(d => ({
            dress_id: d.dress_id,
            rental_start_date: d.rental_start_date,
            rental_end_date: d.rental_end_date,
            rental_days: d.rental_days,
            estimated_price_ht: d.estimated_price_ht,
            estimated_price_ttc: d.estimated_price_ttc,
            notes: d.notes,
            created_by: req.user?.id ?? null,
          })),
        },
      },
      include: {
        dresses: {
          where: { deleted_at: null },
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
        },
      },
    });

    pino.info(
      { prospectId, requestId: request.id, requestNumber },
      "✅ Prospect request created"
    );

    res.status(201).json({
      success: true,
      data: request,
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Error creating prospect request");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to create prospect request",
    });
  }
};

/**
 * Get all requests for a prospect
 * GET /prospects/:prospectId/requests
 */
export const getProspectRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prospectId } = req.params;

    if (!prospectId) {
      return res.status(400).json({
        success: false,
        error: "Prospect ID is required",
      });
    }

    const requests = await prisma.prospectRequest.findMany({
      where: {
        prospect_id: String(prospectId),
        deleted_at: null,
      },
      include: {
        dresses: {
          where: { deleted_at: null },
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
          orderBy: { rental_start_date: "asc" },
        },
      },
      orderBy: { created_at: "desc" },
    });

    res.json({
      success: true,
      data: requests,
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Error fetching prospect requests");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch prospect requests",
    });
  }
};

/**
 * Get a single request by ID
 * GET /prospects/:prospectId/requests/:requestId
 */
export const getProspectRequestById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prospectId, requestId } = req.params;

    if (!prospectId || !requestId) {
      return res.status(400).json({
        success: false,
        error: "Prospect ID and Request ID are required",
      });
    }

    const request = await prisma.prospectRequest.findFirst({
      where: {
        id: String(requestId),
        prospect_id: String(prospectId),
        deleted_at: null,
      },
      include: {
        prospect: true,
        dresses: {
          where: { deleted_at: null },
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
          orderBy: { rental_start_date: "asc" },
        },
      },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Error fetching prospect request");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch prospect request",
    });
  }
};

/**
 * Update a prospect request
 * PATCH /prospects/:prospectId/requests/:requestId
 */
export const updateProspectRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prospectId, requestId } = req.params;
    const { status, notes, dresses } = req.body;

    if (!prospectId || !requestId) {
      return res.status(400).json({
        success: false,
        error: "Prospect ID and Request ID are required",
      });
    }

    // Verify request exists
    const existingRequest = await prisma.prospectRequest.findFirst({
      where: {
        id: String(requestId),
        prospect_id: String(prospectId),
        deleted_at: null,
      },
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    // Prepare update data
    const updateData: any = {
      updated_by: req.user?.id ?? null,
    };

    if (status !== undefined) {
      updateData.status = status;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // If dresses are being updated, recalculate totals
    if (dresses && Array.isArray(dresses)) {
      // Validate and fetch dress details
      const dressIds = dresses.map((d: any) => d.dress_id);
      const fetchedDresses = await prisma.dress.findMany({
        where: {
          id: { in: dressIds },
          deleted_at: null,
        },
      });

      if (fetchedDresses.length !== dressIds.length) {
        return res.status(400).json({
          success: false,
          error: "One or more dresses not found",
        });
      }

      const dressMap = new Map(fetchedDresses.map(d => [d.id, d]));

      let totalEstimatedHt = 0;
      let totalEstimatedTtc = 0;

      const dressesWithCalculations = dresses.map((dressData: any) => {
        const dress = dressMap.get(dressData.dress_id);
        if (!dress) {
          throw new Error(`Dress ${dressData.dress_id} not found`);
        }

        const startDate = new Date(dressData.rental_start_date);
        const endDate = new Date(dressData.rental_end_date);
        const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const pricePerDayHt = Number(dress.price_per_day_ht);
        const pricePerDayTtc = Number(dress.price_per_day_ttc);

        const estimatedPriceHt = rentalDays * pricePerDayHt;
        const estimatedPriceTtc = rentalDays * pricePerDayTtc;

        totalEstimatedHt += estimatedPriceHt;
        totalEstimatedTtc += estimatedPriceTtc;

        return {
          dress_id: dressData.dress_id,
          rental_start_date: startDate,
          rental_end_date: endDate,
          rental_days: rentalDays,
          estimated_price_ht: estimatedPriceHt,
          estimated_price_ttc: estimatedPriceTtc,
          notes: dressData.notes || null,
        };
      });

      // Delete existing dresses and create new ones
      await prisma.prospectRequestDress.deleteMany({
        where: { request_id: String(requestId) },
      });

      updateData.total_estimated_ht = totalEstimatedHt;
      updateData.total_estimated_ttc = totalEstimatedTtc;
      updateData.dresses = {
        create: dressesWithCalculations.map(d => ({
          dress_id: d.dress_id,
          rental_start_date: d.rental_start_date,
          rental_end_date: d.rental_end_date,
          rental_days: d.rental_days,
          estimated_price_ht: d.estimated_price_ht,
          estimated_price_ttc: d.estimated_price_ttc,
          notes: d.notes,
          created_by: req.user?.id ?? null,
        })),
      };
    }

    // Update the request
    const updatedRequest = await prisma.prospectRequest.update({
      where: { id: String(requestId) },
      data: updateData,
      include: {
        dresses: {
          where: { deleted_at: null },
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
          orderBy: { rental_start_date: "asc" },
        },
      },
    });

    pino.info({ prospectId, requestId }, "✅ Prospect request updated");

    res.json({
      success: true,
      data: updatedRequest,
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Error updating prospect request");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to update prospect request",
    });
  }
};

/**
 * Delete a prospect request (soft delete)
 * DELETE /prospects/:prospectId/requests/:requestId
 */
export const deleteProspectRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prospectId, requestId } = req.params;

    if (!prospectId || !requestId) {
      return res.status(400).json({
        success: false,
        error: "Prospect ID and Request ID are required",
      });
    }

    // Verify request exists
    const existingRequest = await prisma.prospectRequest.findFirst({
      where: {
        id: String(requestId),
        prospect_id: String(prospectId),
        deleted_at: null,
      },
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        error: "Request not found",
      });
    }

    // Soft delete the request
    await prisma.prospectRequest.update({
      where: { id: String(requestId) },
      data: {
        deleted_at: new Date(),
        deleted_by: req.user?.id ?? null,
      },
    });

    pino.info({ prospectId, requestId }, "✅ Prospect request deleted");

    res.json({
      success: true,
      message: "Request deleted successfully",
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Error deleting prospect request");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to delete prospect request",
    });
  }
};

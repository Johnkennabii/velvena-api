import type { Response } from "express";
import prisma from "../../lib/prisma.js";
import pino from "../../lib/logger.js";
import type { AuthenticatedRequest } from "../../types/express.js";

// GET all conditions
export const getDressConditions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;

    const conditions = await prisma.dressCondition.findMany({
      where: {
        deleted_at: null,
        organization_id: organizationId ?? null,
      },
      orderBy: { name: "asc" },
    });
    pino.info({ count: conditions.length }, "📌 Récupération des conditions");
    res.json({ success: true, data: conditions });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération conditions");
    res.status(500).json({ success: false, error: "Failed to fetch dress conditions" });
  }
};

// CREATE
export const createDressCondition = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "Name is required" });

    const condition = await prisma.dressCondition.create({
      data: {
        name,
        organization_id: req.user?.organizationId ?? null,
        created_by: req.user?.id ?? null
      },
    });

    pino.info({ condition }, "✅ Condition créée");
    res.status(201).json({ success: true, data: condition });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur création condition");

    // Handle unique constraint violation
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: `Une condition avec le nom '${req.body.name}' existe déjà dans votre organisation.`,
        code: "DUPLICATE_NAME"
      });
    }

    res.status(500).json({ success: false, error: "Failed to create condition" });
  }
};

// UPDATE
export const updateDressCondition = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!id) return res.status(400).json({ success: false, error: "ID is required" });

    const updated = await prisma.dressCondition.update({
      where: { id: id as string },
      data: { name, updated_by: req.user?.id ?? null },
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur update condition");

    // Handle unique constraint violation
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: `Une condition avec le nom '${req.body.name}' existe déjà dans votre organisation.`,
        code: "DUPLICATE_NAME"
      });
    }

    res.status(500).json({ success: false, error: "Failed to update condition" });
  }
};

// SOFT DELETE
export const softDeleteDressCondition = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "ID is required" });

    const deleted = await prisma.dressCondition.update({
      where: { id: id as string },
      data: { deleted_at: new Date(), deleted_by: req.user?.id ?? null },
    });
    res.json({ success: true, data: deleted });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur soft delete condition");
    res.status(500).json({ success: false, error: "Failed to soft delete condition" });
  }
};

// HARD DELETE
export const hardDeleteDressCondition = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "ID is required" });

    await prisma.dressCondition.delete({ where: { id: id as string } });
    res.json({ success: true, message: "Condition hard deleted" });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur hard delete condition");
    res.status(500).json({ success: false, error: "Failed to hard delete condition" });
  }
};
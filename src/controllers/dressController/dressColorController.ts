import type { Response } from "express";
import prisma from "../../lib/prisma.js";
import pino from "../../lib/logger.js";
import type { AuthenticatedRequest } from "../../types/express.js";

// GET all colors
export const getDressColors = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;

    const colors = await prisma.dressColor.findMany({
      where: {
        deleted_at: null,
        organization_id: organizationId ?? null,
      },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: colors });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération couleurs");
    res.status(500).json({ success: false, error: "Failed to fetch colors" });
  }
};

// CREATE
export const createDressColor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, hex_code } = req.body;
    if (!name || !hex_code) {
      return res.status(400).json({ success: false, error: "Name and hex_code are required" });
    }

    const color = await prisma.dressColor.create({
      data: {
        name,
        hex_code,
        organization_id: req.user?.organizationId ?? null,
        created_by: req.user?.id ?? null
      },
    });

    res.status(201).json({ success: true, data: color });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur création couleur");

    // Handle unique constraint violation
    if (err.code === "P2002") {
      const fields = err.meta?.target;
      if (fields?.includes("hex_code")) {
        return res.status(409).json({
          success: false,
          error: `Une couleur avec le code hex '${req.body.hex_code}' existe déjà dans votre organisation.`,
          code: "DUPLICATE_HEX_CODE"
        });
      }
      if (fields?.includes("name")) {
        return res.status(409).json({
          success: false,
          error: `Une couleur avec le nom '${req.body.name}' existe déjà dans votre organisation.`,
          code: "DUPLICATE_NAME"
        });
      }
      return res.status(409).json({
        success: false,
        error: "Une couleur avec ces informations existe déjà.",
        code: "DUPLICATE_ENTRY"
      });
    }

    res.status(500).json({ success: false, error: "Failed to create color" });
  }
};

// UPDATE
export const updateDressColor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Color id is required" });
    }
    const { name, hex_code } = req.body;

    const updated = await prisma.dressColor.update({
      where: { id: id as string },
      data: { name, hex_code, updated_by: req.user?.id ?? null },
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur update couleur");

    // Handle unique constraint violation
    if (err.code === "P2002") {
      const fields = err.meta?.target;
      if (fields?.includes("hex_code")) {
        return res.status(409).json({
          success: false,
          error: `Une couleur avec le code hex '${req.body.hex_code}' existe déjà dans votre organisation.`,
          code: "DUPLICATE_HEX_CODE"
        });
      }
      if (fields?.includes("name")) {
        return res.status(409).json({
          success: false,
          error: `Une couleur avec le nom '${req.body.name}' existe déjà dans votre organisation.`,
          code: "DUPLICATE_NAME"
        });
      }
      return res.status(409).json({
        success: false,
        error: "Une couleur avec ces informations existe déjà.",
        code: "DUPLICATE_ENTRY"
      });
    }

    res.status(500).json({ success: false, error: "Failed to update color" });
  }
};

// SOFT DELETE
export const softDeleteDressColor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Color id is required" });
    }
    const deleted = await prisma.dressColor.update({
      where: { id: id as string },
      data: { deleted_at: new Date(), deleted_by: req.user?.id ?? null },
    });
    res.json({ success: true, data: deleted });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur soft delete couleur");
    res.status(500).json({ success: false, error: "Failed to soft delete color" });
  }
};

// HARD DELETE
export const hardDeleteDressColor = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Color id is required" });
    }
    await prisma.dressColor.delete({ where: { id: id as string } });
    res.json({ success: true, message: "Color hard deleted" });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur hard delete couleur");
    res.status(500).json({ success: false, error: "Failed to hard delete color" });
  }
};
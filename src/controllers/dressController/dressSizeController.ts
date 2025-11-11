import type { Response } from "express";
import prisma from "../../lib/prisma.js";
import pino from "../../lib/logger.js";
import type { AuthenticatedRequest } from "../../types/express.js";

// GET all dress sizes
export const getDressSizes = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const sizes = await prisma.dressSize.findMany({
      where: { deleted_at: null },
      orderBy: { name: "asc" },
    });
    pino.info({ count: sizes.length }, "📌 Récupération des tailles");
    res.json({ success: true, data: sizes });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération tailles");
    res.status(500).json({ success: false, error: "Failed to fetch dress sizes" });
  }
};

// CREATE a new size
export const createDressSize = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "Name is required" });

    const size = await prisma.dressSize.create({
      data: {
        name,
        created_by: req.user?.id ?? null,
      },
    });

    pino.info({ size }, "✅ Taille créée");
    res.status(201).json({ success: true, data: size });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur création taille");
    res.status(500).json({ success: false, error: "Failed to create dress size" });
  }
};

// UPDATE size
export const updateDressSize = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "ID is required" });
    const { name } = req.body;

    const existingSize = await prisma.dressSize.findUnique({ where: { id } });
    if (!existingSize) {
      pino.warn({ id }, "⚠️ Taille non trouvée");
      return res.status(404).json({ success: false, error: "Dress size not found" });
    }

    const size = await prisma.dressSize.update({
      where: { id },
      data: {
        name,
        updated_by: req.user?.id ?? null,
      },
    });

    pino.info({ id }, "✏️ Taille mise à jour");
    res.json({ success: true, data: size });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur mise à jour taille");
    res.status(500).json({ success: false, error: "Failed to update dress size" });
  }
};

// SOFT DELETE
export const softDeleteDressSize = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "ID is required" });

    const existingSize = await prisma.dressSize.findUnique({ where: { id } });
    if (!existingSize) {
      pino.warn({ id }, "⚠️ Taille non trouvée");
      return res.status(404).json({ success: false, error: "Dress size not found" });
    }

    const size = await prisma.dressSize.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by: req.user?.id ?? null,
      },
    });

    pino.warn({ id }, "🗑 Taille soft supprimée");
    res.json({ success: true, data: size });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur soft delete taille");
    res.status(500).json({ success: false, error: "Failed to soft delete dress size" });
  }
};

// HARD DELETE
export const hardDeleteDressSize = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "ID is required" });

    const existingSize = await prisma.dressSize.findUnique({ where: { id } });
    if (!existingSize) {
      pino.warn({ id }, "⚠️ Taille non trouvée");
      return res.status(404).json({ success: false, error: "Dress size not found" });
    }

    await prisma.dressSize.delete({ where: { id } });

    pino.warn({ id }, "🔥 Taille hard supprimée");
    res.json({ success: true, message: "Dress size permanently deleted" });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur hard delete taille");
    res.status(500).json({ success: false, error: "Failed to hard delete dress size" });
  }
};
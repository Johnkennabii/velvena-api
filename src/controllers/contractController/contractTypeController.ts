import type { Response } from "express";
import prisma from "../../lib/prisma.js";
import pino from "../../lib/logger.js";
import type { AuthenticatedRequest } from "../../types/express.js";

// GET all contract types
export const getContractTypes = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const types = await prisma.contractType.findMany({
      where: { deleted_at: null },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: types });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération contract types");
    res.status(500).json({ success: false, error: "Failed to fetch contract types" });
  }
};

// GET contract type by ID
export const getContractTypeById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }
    const type = await prisma.contractType.findUnique({ where: { id: String(id) } });
    if (!type || type.deleted_at) {
      return res.status(404).json({ success: false, error: "Contract type not found" });
    }
    res.json({ success: true, data: type });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération contract type");
    res.status(500).json({ success: false, error: "Failed to fetch contract type" });
  }
};

// CREATE
export const createContractType = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "Name is required" });

    const type = await prisma.contractType.create({
      data: {
        name,
        created_by: req.user?.id ?? null,
      },
    });

    res.status(201).json({ success: true, data: type });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur création contract type");

    // Handle unique constraint violation
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: `Un type de contrat avec le nom '${req.body.name}' existe déjà.`,
        code: "DUPLICATE_NAME"
      });
    }

    res.status(500).json({ success: false, error: "Failed to create contract type" });
  }
};

// UPDATE
export const updateContractType = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }
    const { name } = req.body;

    const type = await prisma.contractType.update({
      where: { id: String(id) },
      data: {
        name,
        updated_by: req.user?.id ?? null,
      },
    });

    res.json({ success: true, data: type });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur update contract type");

    // Handle unique constraint violation
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: `Un type de contrat avec le nom '${req.body.name}' existe déjà.`,
        code: "DUPLICATE_NAME"
      });
    }

    res.status(500).json({ success: false, error: "Failed to update contract type" });
  }
};

// SOFT DELETE
export const softDeleteContractType = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }

    const type = await prisma.contractType.update({
      where: { id: String(id) },
      data: {
        deleted_at: new Date(),
        deleted_by: req.user?.id ?? null,
      },
    });

    res.json({ success: true, data: type });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur soft delete contract type");
    res.status(500).json({ success: false, error: "Failed to soft delete contract type" });
  }
};

// HARD DELETE
export const hardDeleteContractType = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }
    await prisma.contractType.delete({ where: { id: String(id) } });

    res.json({ success: true, message: "Contract type permanently deleted" });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur hard delete contract type");
    res.status(500).json({ success: false, error: "Failed to hard delete contract type" });
  }
};
import type { Response } from "express";
import prisma from "../../lib/prisma.js";
import pino from "../../lib/logger.js";
import type { AuthenticatedRequest } from "../../types/express.js";

// GET all addons
export const getContractAddons = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;

    const addons = await prisma.contractAddon.findMany({
      where: {
        deleted_at: null,
        organization_id: organizationId ?? null,
      },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: addons });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération contract addons");
    res.status(500).json({ success: false, error: "Failed to fetch contract addons" });
  }
};

// GET addon by ID
export const getContractAddonById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "ID is required" });

    const addon = await prisma.contractAddon.findUnique({ where: { id: String(id) } });
    if (!addon || addon.deleted_at) {
      return res.status(404).json({ success: false, error: "Contract addon not found" });
    }

    res.json({ success: true, data: addon });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération contract addon");
    res.status(500).json({ success: false, error: "Failed to fetch contract addon" });
  }
};

// CREATE
export const createContractAddon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, price_ht, price_ttc, included } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "Name is required" });

    const addon = await prisma.contractAddon.create({
      data: {
        name,
        description: description ?? null,
        price_ht,
        price_ttc,
        included: included ?? false,
        organization_id: req.user?.organizationId ?? null,
        created_by: req.user?.id ?? null,
      },
    });

    res.status(201).json({ success: true, data: addon });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur création contract addon");

    // Handle unique constraint violation
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: `Une option avec le nom '${req.body.name}' existe déjà.`,
        code: "DUPLICATE_NAME"
      });
    }

    res.status(500).json({ success: false, error: "Failed to create contract addon" });
  }
};

// UPDATE
export const updateContractAddon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "ID is required" });

    const { name, description, price_ht, price_ttc, included } = req.body;

    const addon = await prisma.contractAddon.update({
      where: { id: String(id) },
      data: {
        name,
        description: description ?? null,
        price_ht,
        price_ttc,
        included: included ?? false,
        updated_by: req.user?.id ?? null,
      },
    });

    res.json({ success: true, data: addon });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur update contract addon");

    // Handle unique constraint violation
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: `Une option avec le nom '${req.body.name}' existe déjà.`,
        code: "DUPLICATE_NAME"
      });
    }

    res.status(500).json({ success: false, error: "Failed to update contract addon" });
  }
};

// SOFT DELETE
export const softDeleteContractAddon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "ID is required" });

    const addon = await prisma.contractAddon.update({
      where: { id: String(id) },
      data: {
        deleted_at: new Date(),
        deleted_by: req.user?.id ?? null,
      },
    });

    res.json({ success: true, data: addon });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur soft delete contract addon");
    res.status(500).json({ success: false, error: "Failed to soft delete contract addon" });
  }
};

// HARD DELETE
export const hardDeleteContractAddon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "ID is required" });

    await prisma.contractAddon.delete({ where: { id: String(id) } });

    res.json({ success: true, message: "Contract addon permanently deleted" });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur hard delete contract addon");
    res.status(500).json({ success: false, error: "Failed to hard delete contract addon" });
  }
};

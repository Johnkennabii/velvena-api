import type { Request, Response } from "express";
import prisma from "../../lib/prisma.js";
import { v4 as uuidv4 } from "uuid";

export const getAllContractPackages = async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user?.organizationId;

    const packages = await prisma.contractPackage.findMany({
      where: {
        deleted_at: null,
        organization_id: organizationId ?? null,
      },
      include: { addons: true },
    });
    res.json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch contract packages" });
  }
};

export const getContractPackageById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pkg = await prisma.contractPackage.findUnique({
      where: { id: id as string },
      include: { addons: true },
    });
    if (!pkg || pkg.deleted_at) {
      return res.status(404).json({ success: false, error: "Contract package not found" });
    }
    res.json({ success: true, data: pkg });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch contract package" });
  }
};

export const createContractPackage = async (req: Request, res: Response) => {
  try {
    const { name, num_dresses, price_ht, price_ttc, addon_ids } = req.body;
    const now = new Date();

    const pkg = await prisma.contractPackage.create({
      data: {
        id: uuidv4(),
        name,
        num_dresses,
        price_ht,
        price_ttc,
        organization_id: (req as any).user?.organizationId || null,
        created_at: now,
        created_by: (req as any).user?.id || null,
        ...(addon_ids && addon_ids.length > 0
          ? {
              addons: {
                create: addon_ids.map((addonId: string) => ({
                  addon: { connect: { id: addonId } },
                })),
              },
            }
          : {}),
      },
      include: { addons: { include: { addon: true } } },
    });

    res.status(201).json({ success: true, data: pkg });
  } catch (error: any) {
    console.error(error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: `Un package avec le nom '${req.body.name}' existe déjà dans votre organisation.`,
        code: "DUPLICATE_NAME"
      });
    }

    res.status(500).json({ success: false, error: "Failed to create contract package" });
  }
};

export const updateContractPackage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, num_dresses, price_ht, price_ttc, addon_ids } = req.body;

    const addonIds = Array.isArray(addon_ids) ? (addon_ids as string[]) : null;
    const addonUpdates = addonIds !== null
      ? {
          addons: {
            deleteMany: {},
            ...(addonIds.length > 0
              ? {
                  create: addonIds.map((addonId: string) => ({
                    addon: { connect: { id: addonId } },
                  })),
                }
              : {}),
          },
        }
      : {};

    const pkg = await prisma.contractPackage.update({
      where: { id: id as string },
      data: {
        name,
        num_dresses,
        price_ht,
        price_ttc,
        updated_at: new Date(),
        updated_by: (req as any).user?.id || null,
        ...addonUpdates,
      },
      include: { addons: { include: { addon: true } } },
    });

    res.json({ success: true, data: pkg });
  } catch (error: any) {
    console.error(error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: `Un package avec le nom '${req.body.name}' existe déjà dans votre organisation.`,
        code: "DUPLICATE_NAME"
      });
    }

    res.status(500).json({ success: false, error: "Failed to update contract package" });
  }
};

export const softDeleteContractPackage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.contractPackage.update({
      where: { id: id as string },
      data: {
        deleted_at: new Date(),
        deleted_by: (req as any).user?.id || null,
      },
    });

    res.json({ success: true, message: "Contract package soft deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to delete contract package" });
  }
};

export const hardDeleteContractPackage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      await tx.packageAddon.deleteMany({ where: { package_id: id as string } });
      await tx.contractPackage.delete({ where: { id: id as string } });
    });

    res.json({ success: true, message: "Contract package permanently deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to permanently delete contract package" });
  }
};

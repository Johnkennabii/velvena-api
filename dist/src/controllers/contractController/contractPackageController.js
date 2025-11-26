import prisma from "../../lib/prisma.js";
import { v4 as uuidv4 } from "uuid";
export const getAllContractPackages = async (req, res) => {
    try {
        const packages = await prisma.contractPackage.findMany({
            where: { deleted_at: null },
            include: { addons: true },
        });
        res.json({ success: true, data: packages });
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch contract packages" });
    }
};
export const getContractPackageById = async (req, res) => {
    try {
        const { id } = req.params;
        const pkg = await prisma.contractPackage.findUnique({
            where: { id: id },
            include: { addons: true },
        });
        if (!pkg || pkg.deleted_at) {
            return res.status(404).json({ success: false, error: "Contract package not found" });
        }
        res.json({ success: true, data: pkg });
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch contract package" });
    }
};
export const createContractPackage = async (req, res) => {
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
                created_at: now,
                created_by: req.user?.id || null,
                ...(addon_ids && addon_ids.length > 0
                    ? {
                        addons: {
                            create: addon_ids.map((addonId) => ({
                                addon: { connect: { id: addonId } },
                            })),
                        },
                    }
                    : {}),
            },
            include: { addons: { include: { addon: true } } },
        });
        res.status(201).json({ success: true, data: pkg });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Failed to create contract package" });
    }
};
export const updateContractPackage = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, num_dresses, price_ht, price_ttc, addon_ids } = req.body;
        const addonIds = Array.isArray(addon_ids) ? addon_ids : null;
        const addonUpdates = addonIds !== null
            ? {
                addons: {
                    deleteMany: {},
                    ...(addonIds.length > 0
                        ? {
                            create: addonIds.map((addonId) => ({
                                addon: { connect: { id: addonId } },
                            })),
                        }
                        : {}),
                },
            }
            : {};
        const pkg = await prisma.contractPackage.update({
            where: { id: id },
            data: {
                name,
                num_dresses,
                price_ht,
                price_ttc,
                updated_at: new Date(),
                updated_by: req.user?.id || null,
                ...addonUpdates,
            },
            include: { addons: { include: { addon: true } } },
        });
        res.json({ success: true, data: pkg });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Failed to update contract package" });
    }
};
export const softDeleteContractPackage = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.contractPackage.update({
            where: { id: id },
            data: {
                deleted_at: new Date(),
                deleted_by: req.user?.id || null,
            },
        });
        res.json({ success: true, message: "Contract package soft deleted" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Failed to delete contract package" });
    }
};
export const hardDeleteContractPackage = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.$transaction(async (tx) => {
            await tx.packageAddon.deleteMany({ where: { package_id: id } });
            await tx.contractPackage.delete({ where: { id: id } });
        });
        res.json({ success: true, message: "Contract package permanently deleted" });
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Failed to permanently delete contract package" });
    }
};
//# sourceMappingURL=contractPackageController.js.map
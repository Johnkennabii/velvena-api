import prisma from "../../lib/prisma.js";
import pino from "../../lib/logger.js";
// Récupérer tous les types (hors supprimés si soft delete)
export const getDressTypes = async (_req, res) => {
    try {
        const types = await prisma.dressType.findMany({
            where: { deleted_at: null },
            orderBy: { name: "asc" },
        });
        res.json({ success: true, data: types });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur getDressTypes");
        res.status(500).json({ success: false, error: "Failed to fetch dress types" });
    }
};
// Créer un type
export const createDressType = async (req, res) => {
    try {
        const { name, description } = req.body;
        // Check for uniqueness of name (not soft-deleted)
        const existing = await prisma.dressType.findFirst({
            where: { name, deleted_at: null },
        });
        if (existing) {
            return res.status(400).json({ success: false, error: "Dress type name already exists" });
        }
        const dressType = await prisma.dressType.create({
            data: {
                name,
                description,
                created_by: req.user?.id ?? null,
            },
        });
        return res.json({ success: true, data: dressType });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
// Mettre à jour un type
export const updateDressType = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id)
            return res.status(400).json({ success: false, error: "Missing id parameter" });
        const { name, description } = req.body;
        // Ensure the type exists
        const existing = await prisma.dressType.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, error: "Dress type not found" });
        }
        // Check uniqueness of name (excluding itself, not soft-deleted)
        if (name) {
            const nameExists = await prisma.dressType.findFirst({
                where: {
                    name,
                    deleted_at: null,
                    NOT: { id },
                },
            });
            if (nameExists) {
                return res.status(400).json({ success: false, error: "Another dress type with this name already exists" });
            }
        }
        const updated = await prisma.dressType.update({
            where: { id, name: existing.name }, // Enforce id and current name
            data: {
                name,
                description,
                updated_at: new Date(),
                updated_by: req.user?.id ?? null,
            },
        });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur updateDressType");
        res.status(500).json({ success: false, error: "Failed to update dress type" });
    }
};
// Soft delete (PATCH - mettre deleted_at au lieu de delete)
export const softDeleteDressType = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id)
            return res.status(400).json({ success: false, error: "Missing id parameter" });
        // Ensure the type exists
        const existing = await prisma.dressType.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, error: "Dress type not found" });
        }
        const deleted = await prisma.dressType.update({
            where: { id, name: existing.name }, // Enforce id and name
            data: {
                deleted_at: new Date(),
                deleted_by: req.user?.id ?? null,
            },
        });
        res.json({ success: true, data: deleted });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur softDeleteDressType");
        res.status(500).json({ success: false, error: "Failed to soft delete dress type" });
    }
};
// Hard delete (vraie suppression SQL)
export const hardDeleteDressType = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id)
            return res.status(400).json({ success: false, error: "Missing id parameter" });
        // Ensure the type exists
        const existing = await prisma.dressType.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, error: "Dress type not found" });
        }
        await prisma.dressType.delete({
            where: { id, name: existing.name }, // Enforce id and name
        });
        res.json({ success: true, message: "Dress type hard deleted", data: null });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur hardDeleteDressType");
        res.status(500).json({ success: false, error: "Failed to hard delete dress type" });
    }
};
//# sourceMappingURL=dressTypeController.js.map
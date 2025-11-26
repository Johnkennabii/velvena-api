import prisma from "../../lib/prisma.js";
import pino from "../../lib/logger.js";
// GET all conditions
export const getDressConditions = async (_req, res) => {
    try {
        const conditions = await prisma.dressCondition.findMany({
            where: { deleted_at: null },
            orderBy: { name: "asc" },
        });
        pino.info({ count: conditions.length }, "📌 Récupération des conditions");
        res.json({ success: true, data: conditions });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur récupération conditions");
        res.status(500).json({ success: false, error: "Failed to fetch dress conditions" });
    }
};
// CREATE
export const createDressCondition = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name)
            return res.status(400).json({ success: false, error: "Name is required" });
        const condition = await prisma.dressCondition.create({
            data: { name, created_by: req.user?.id ?? null },
        });
        pino.info({ condition }, "✅ Condition créée");
        res.status(201).json({ success: true, data: condition });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur création condition");
        res.status(500).json({ success: false, error: "Failed to create condition" });
    }
};
// UPDATE
export const updateDressCondition = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!id)
            return res.status(400).json({ success: false, error: "ID is required" });
        const updated = await prisma.dressCondition.update({
            where: { id: id },
            data: { name, updated_by: req.user?.id ?? null },
        });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur update condition");
        res.status(500).json({ success: false, error: "Failed to update condition" });
    }
};
// SOFT DELETE
export const softDeleteDressCondition = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ success: false, error: "ID is required" });
        const deleted = await prisma.dressCondition.update({
            where: { id: id },
            data: { deleted_at: new Date(), deleted_by: req.user?.id ?? null },
        });
        res.json({ success: true, data: deleted });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur soft delete condition");
        res.status(500).json({ success: false, error: "Failed to soft delete condition" });
    }
};
// HARD DELETE
export const hardDeleteDressCondition = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ success: false, error: "ID is required" });
        await prisma.dressCondition.delete({ where: { id: id } });
        res.json({ success: true, message: "Condition hard deleted" });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur hard delete condition");
        res.status(500).json({ success: false, error: "Failed to hard delete condition" });
    }
};
//# sourceMappingURL=dressConditionController.js.map
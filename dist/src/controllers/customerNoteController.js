import prisma from "../lib/prisma.js";
import pino from "../lib/logger.js";
// Get all notes for a customer (excluding soft-deleted ones)
export const getCustomerNotes = async (req, res) => {
    try {
        const { customerId } = req.params;
        if (!customerId) {
            return res.status(400).json({ success: false, error: "Customer ID is required" });
        }
        // Verify customer exists
        const customer = await prisma.customer.findUnique({
            where: { id: String(customerId) }
        });
        if (!customer || customer.deleted_at) {
            return res.status(404).json({ success: false, error: "Customer not found" });
        }
        // Fetch notes
        const notes = await prisma.customerNote.findMany({
            where: {
                customer_id: String(customerId),
                deleted_at: null
            },
            orderBy: { created_at: "desc" },
        });
        res.json({
            success: true,
            data: notes,
        });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur récupération notes client");
        res.status(500).json({
            success: false,
            error: err.message || "Failed to fetch customer notes",
            details: err.meta || err,
        });
    }
};
// Get one note by ID
export const getCustomerNoteById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, error: "Note ID is required" });
        }
        const note = await prisma.customerNote.findUnique({
            where: { id: String(id) }
        });
        if (!note || note.deleted_at) {
            return res.status(404).json({ success: false, error: "Note not found" });
        }
        res.json({ success: true, data: note });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur récupération note");
        res.status(500).json({
            success: false,
            error: err.message || "Failed to fetch note",
            details: err.meta || err,
        });
    }
};
// Create a new note for a customer
export const createCustomerNote = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { content } = req.body;
        if (!customerId) {
            return res.status(400).json({ success: false, error: "Customer ID is required" });
        }
        if (!content || typeof content !== "string" || content.trim().length === 0) {
            return res.status(400).json({ success: false, error: "Note content is required" });
        }
        // Verify customer exists
        const customer = await prisma.customer.findUnique({
            where: { id: String(customerId) }
        });
        if (!customer || customer.deleted_at) {
            return res.status(404).json({ success: false, error: "Customer not found" });
        }
        const note = await prisma.customerNote.create({
            data: {
                customer_id: String(customerId),
                content: content.trim(),
                created_by: req.user?.id ?? null,
            },
        });
        res.status(201).json({ success: true, data: note });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur création note client");
        res.status(500).json({
            success: false,
            error: err.message || "Failed to create customer note",
            details: err.meta || err,
        });
    }
};
// Update a note
export const updateCustomerNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, error: "Note ID is required" });
        }
        if (!content || typeof content !== "string" || content.trim().length === 0) {
            return res.status(400).json({ success: false, error: "Note content is required" });
        }
        const existing = await prisma.customerNote.findUnique({
            where: { id: String(id) }
        });
        if (!existing || existing.deleted_at) {
            return res.status(404).json({ success: false, error: "Note not found" });
        }
        const updated = await prisma.customerNote.update({
            where: { id: String(id) },
            data: {
                content: content.trim(),
                updated_at: new Date(),
                updated_by: req.user?.id ?? null,
            },
        });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur update note");
        res.status(500).json({
            success: false,
            error: err.message || "Failed to update note",
            details: err.meta || err,
        });
    }
};
// Soft delete a note
export const softDeleteCustomerNote = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, error: "Note ID is required" });
        }
        const existing = await prisma.customerNote.findUnique({
            where: { id: String(id) }
        });
        if (!existing || existing.deleted_at) {
            return res.status(404).json({ success: false, error: "Note not found" });
        }
        const deleted = await prisma.customerNote.update({
            where: { id: String(id) },
            data: {
                deleted_at: new Date(),
                deleted_by: req.user?.id ?? null,
            },
        });
        res.json({ success: true, data: deleted });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur soft delete note");
        res.status(500).json({
            success: false,
            error: err.message || "Failed to soft delete note",
            details: err.meta || err,
        });
    }
};
// Hard delete a note
export const hardDeleteCustomerNote = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, error: "Note ID is required" });
        }
        const existing = await prisma.customerNote.findUnique({
            where: { id: String(id) }
        });
        if (!existing) {
            return res.status(404).json({ success: false, error: "Note not found" });
        }
        await prisma.customerNote.delete({ where: { id: String(id) } });
        res.json({ success: true, message: "Note permanently deleted" });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur hard delete note");
        res.status(500).json({
            success: false,
            error: err.message || "Failed to hard delete note",
            details: err.meta || err,
        });
    }
};
//# sourceMappingURL=customerNoteController.js.map
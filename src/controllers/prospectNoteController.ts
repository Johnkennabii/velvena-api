// src/controllers/prospectNoteController.ts
import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import prisma from "../lib/prisma.js";
import pino from "../lib/logger.js";

// Get all notes for a prospect (excluding soft-deleted ones)
export const getProspectNotes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prospectId } = req.params;
    if (!prospectId) {
      return res.status(400).json({ success: false, error: "Prospect ID is required" });
    }

    // Verify prospect exists and belongs to the organization
    const prospect = await prisma.prospect.findUnique({
      where: { id: String(prospectId) }
    });
    if (!prospect || prospect.deleted_at || prospect.organization_id !== req.user!.organizationId) {
      return res.status(404).json({ success: false, error: "Prospect not found" });
    }

    // Fetch notes
    const notes = await prisma.prospectNote.findMany({
      where: {
        prospect_id: String(prospectId),
        deleted_at: null
      },
      orderBy: { created_at: "desc" },
    });

    res.json({
      success: true,
      data: notes,
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération notes prospect");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch prospect notes",
      details: err.meta || err,
    });
  }
};

// Get one note by ID
export const getProspectNoteById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Note ID is required" });
    }

    const note = await prisma.prospectNote.findUnique({
      where: { id: String(id) },
      include: {
        prospect: true
      }
    });
    if (!note || note.deleted_at || note.prospect.organization_id !== req.user!.organizationId) {
      return res.status(404).json({ success: false, error: "Note not found" });
    }

    res.json({ success: true, data: note });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération note prospect");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch note",
      details: err.meta || err,
    });
  }
};

// Create a new note for a prospect
export const createProspectNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prospectId } = req.params;
    const { content } = req.body;

    if (!prospectId) {
      return res.status(400).json({ success: false, error: "Prospect ID is required" });
    }
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Note content is required" });
    }

    // Verify prospect exists and belongs to the organization
    const prospect = await prisma.prospect.findUnique({
      where: { id: String(prospectId) }
    });
    if (!prospect || prospect.deleted_at || prospect.organization_id !== req.user!.organizationId) {
      return res.status(404).json({ success: false, error: "Prospect not found" });
    }

    const note = await prisma.prospectNote.create({
      data: {
        prospect_id: String(prospectId),
        content: content.trim(),
        created_by: req.user?.id ?? null,
      },
    });

    res.status(201).json({ success: true, data: note });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur création note prospect");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to create prospect note",
      details: err.meta || err,
    });
  }
};

// Update a note
export const updateProspectNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, error: "Note ID is required" });
    }
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Note content is required" });
    }

    const existing = await prisma.prospectNote.findUnique({
      where: { id: String(id) },
      include: {
        prospect: true
      }
    });
    if (!existing || existing.deleted_at || existing.prospect.organization_id !== req.user!.organizationId) {
      return res.status(404).json({ success: false, error: "Note not found" });
    }

    const updated = await prisma.prospectNote.update({
      where: { id: String(id) },
      data: {
        content: content.trim(),
        updated_at: new Date(),
        updated_by: req.user?.id ?? null,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur update note prospect");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to update note",
      details: err.meta || err,
    });
  }
};

// Soft delete a note
export const softDeleteProspectNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Note ID is required" });
    }

    const existing = await prisma.prospectNote.findUnique({
      where: { id: String(id) },
      include: {
        prospect: true
      }
    });
    if (!existing || existing.deleted_at || existing.prospect.organization_id !== req.user!.organizationId) {
      return res.status(404).json({ success: false, error: "Note not found" });
    }

    const deleted = await prisma.prospectNote.update({
      where: { id: String(id) },
      data: {
        deleted_at: new Date(),
        deleted_by: req.user?.id ?? null,
      },
    });

    res.json({ success: true, data: deleted });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur soft delete note prospect");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to soft delete note",
      details: err.meta || err,
    });
  }
};

// Hard delete a note
export const hardDeleteProspectNote = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Note ID is required" });
    }

    const existing = await prisma.prospectNote.findUnique({
      where: { id: String(id) },
      include: {
        prospect: true
      }
    });
    if (!existing || existing.prospect.organization_id !== req.user!.organizationId) {
      return res.status(404).json({ success: false, error: "Note not found" });
    }

    await prisma.prospectNote.delete({ where: { id: String(id) } });
    res.json({ success: true, message: "Note permanently deleted" });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur hard delete note prospect");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to hard delete note",
      details: err.meta || err,
    });
  }
};

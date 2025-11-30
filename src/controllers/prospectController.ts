// src/controllers/prospectController.ts
import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import prisma from "../lib/prisma.js";
import pino from "../lib/logger.js";

// Get all prospects (excluding soft-deleted ones)
export const getProspects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Parse query params
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
    const status = typeof req.query.status === "string" ? req.query.status.trim() : undefined;
    const page = req.query.page ? Math.max(1, parseInt(String(req.query.page), 10)) : 1;
    const limit = req.query.limit ? Math.max(1, parseInt(String(req.query.limit), 10)) : 20;
    const skip = (page - 1) * limit;

    // Build Prisma where condition
    let where: any = { deleted_at: null };

    if (status) {
      where.status = status;
    }

    if (search) {
      // Case-insensitive contains on firstname, lastname, email, phone
      where = {
        ...where,
        OR: [
          { firstname: { contains: search, mode: "insensitive" } },
          { lastname: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Count total for pagination
    const total = await prisma.prospect.count({ where });

    // Fetch paginated data
    const prospects = await prisma.prospect.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    });

    res.json({
      success: true,
      data: prospects,
      page,
      limit,
      total,
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération prospects");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch prospects",
      details: err.meta || err,
    });
  }
};

// Get one prospect by ID
export const getProspectById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Prospect ID is required" });
    }
    const prospect = await prisma.prospect.findUnique({ where: { id: String(id) } });
    if (!prospect || prospect.deleted_at) {
      return res.status(404).json({ success: false, error: "Prospect not found" });
    }
    res.json({ success: true, data: prospect });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération prospect");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch prospect",
      details: err.meta || err,
    });
  }
};

// Create a new prospect
export const createProspect = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      firstname,
      lastname,
      email,
      phone,
      birthday,
      country,
      city,
      address,
      postal_code,
      status,
      source,
      notes
    } = req.body;

    const prospect = await prisma.prospect.create({
      data: {
        firstname,
        lastname,
        email,
        phone,
        birthday: birthday ? new Date(birthday) : null,
        country,
        city,
        address,
        postal_code,
        status: status || "new",
        source,
        notes,
        created_by: req.user?.id ?? null,
      },
    });
    res.status(201).json({ success: true, data: prospect });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur création prospect");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to create prospect",
      details: err.meta || err,
    });
  }
};

// Update a prospect
export const updateProspect = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Prospect ID is required" });
    }

    const {
      firstname,
      lastname,
      email,
      phone,
      birthday,
      country,
      city,
      address,
      postal_code,
      status,
      source,
      notes
    } = req.body;

    const existing = await prisma.prospect.findUnique({ where: { id: String(id) } });
    if (!existing || existing.deleted_at) {
      return res.status(404).json({ success: false, error: "Prospect not found" });
    }

    // Check if prospect is already converted
    if (existing.converted_at) {
      return res.status(400).json({
        success: false,
        error: "Cannot update a converted prospect"
      });
    }

    const updated = await prisma.prospect.update({
      where: { id: String(id) },
      data: {
        firstname,
        lastname,
        email,
        phone,
        birthday,
        country,
        city,
        address,
        postal_code,
        status,
        source,
        notes,
        updated_at: new Date(),
        updated_by: req.user?.id ?? null,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur update prospect");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to update prospect",
      details: err.meta || err,
    });
  }
};

// Soft delete a prospect
export const softDeleteProspect = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Prospect ID is required" });
    }
    const existing = await prisma.prospect.findUnique({ where: { id: String(id) } });
    if (!existing || existing.deleted_at) {
      return res.status(404).json({ success: false, error: "Prospect not found" });
    }

    const deleted = await prisma.prospect.update({
      where: { id: String(id) },
      data: {
        deleted_at: new Date(),
        deleted_by: req.user?.id ?? null,
      },
    });

    res.json({ success: true, data: deleted });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur soft delete prospect");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to soft delete prospect",
      details: err.meta || err,
    });
  }
};

// Hard delete a prospect
export const hardDeleteProspect = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Prospect ID is required" });
    }
    const existing = await prisma.prospect.findUnique({ where: { id: String(id) } });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Prospect not found" });
    }

    await prisma.prospect.delete({ where: { id: String(id) } });
    res.json({ success: true, message: "Prospect permanently deleted" });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur hard delete prospect");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to hard delete prospect",
      details: err.meta || err,
    });
  }
};

// Convert prospect to customer
export const convertProspectToCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Prospect ID is required" });
    }

    const prospect = await prisma.prospect.findUnique({ where: { id: String(id) } });
    if (!prospect || prospect.deleted_at) {
      return res.status(404).json({ success: false, error: "Prospect not found" });
    }

    // Check if already converted
    if (prospect.converted_at) {
      return res.status(400).json({
        success: false,
        error: "Prospect already converted to customer",
        customer_id: prospect.converted_to
      });
    }

    // Check if email already exists in customers
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: prospect.email }
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: "A customer with this email already exists",
        customer_id: existingCustomer.id
      });
    }

    // Create customer from prospect data
    const customer = await prisma.customer.create({
      data: {
        firstname: prospect.firstname,
        lastname: prospect.lastname,
        email: prospect.email,
        phone: prospect.phone,
        birthday: prospect.birthday,
        country: prospect.country,
        city: prospect.city,
        address: prospect.address,
        postal_code: prospect.postal_code,
        created_by: req.user?.id ?? null,
      },
    });

    // Update prospect to mark as converted
    const updatedProspect = await prisma.prospect.update({
      where: { id: String(id) },
      data: {
        converted_at: new Date(),
        converted_by: req.user?.id ?? null,
        converted_to: customer.id,
        status: "converted",
        updated_at: new Date(),
        updated_by: req.user?.id ?? null,
      },
    });

    res.json({
      success: true,
      data: {
        prospect: updatedProspect,
        customer: customer
      },
      message: "Prospect successfully converted to customer"
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur conversion prospect vers customer");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to convert prospect to customer",
      details: err.meta || err,
    });
  }
};

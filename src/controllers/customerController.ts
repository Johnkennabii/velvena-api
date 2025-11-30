// src/controllers/customerController.ts
import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import prisma from "../lib/prisma.js";
import pino from "../lib/logger.js";

// Get all customers (excluding soft-deleted ones)
export const getCustomers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Parse query params
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
    const page = req.query.page ? Math.max(1, parseInt(String(req.query.page), 10)) : 1;
    const limit = req.query.limit ? Math.max(1, parseInt(String(req.query.limit), 10)) : 20;
    const skip = (page - 1) * limit;

    // Build Prisma where condition
    let where: any = { deleted_at: null };
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
    const total = await prisma.customer.count({ where });

    // Fetch paginated data
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    });

    res.json({
      success: true,
      data: customers,
      page,
      limit,
      total,
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération clients");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch customers",
      details: err.meta || err,
    });
  }
};

// Get one customer by ID
export const getCustomerById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Customer ID is required" });
    }

    // Check if notes should be included (query param)
    const includeNotes = req.query.includeNotes === "true";

    const customer = includeNotes
      ? await prisma.customer.findUnique({
          where: { id: String(id) },
          include: {
            notes: {
              where: { deleted_at: null },
              orderBy: { created_at: "desc" }
            }
          }
        })
      : await prisma.customer.findUnique({
          where: { id: String(id) }
        });

    if (!customer || customer.deleted_at) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }
    res.json({ success: true, data: customer });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération client");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch customer",
      details: err.meta || err,
    });
  }
};

// Create a new customer
export const createCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { firstname, lastname, email, phone, birthday, country, city, address, postal_code } = req.body;
    const customer = await prisma.customer.create({
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
        created_by: req.user?.id ?? null,
      },
    });
    res.status(201).json({ success: true, data: customer });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur création client");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to create customer",
      details: err.meta || err,
    });
  }
};

// Update a customer
export const updateCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Customer ID is required" });
    }
    const { firstname, lastname, email, phone, birthday, country, city, address, postal_code } = req.body;

    const existing = await prisma.customer.findUnique({ where: { id: String(id) } });
    if (!existing || existing.deleted_at) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    const updated = await prisma.customer.update({
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
        updated_at: new Date(),
        updated_by: req.user?.id ?? null,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur update client");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to update customer",
      details: err.meta || err,
    });
  }
};

// Soft delete
export const softDeleteCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Customer ID is required" });
    }
    const existing = await prisma.customer.findUnique({ where: { id: String(id) } });
    if (!existing || existing.deleted_at) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    const deleted = await prisma.customer.update({
      where: { id: String(id) },
      data: {
        deleted_at: new Date(),
        deleted_by: req.user?.id ?? null,
      },
    });

    res.json({ success: true, data: deleted });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur soft delete client");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to soft delete customer",
      details: err.meta || err,
    });
  }
};

// Hard delete
export const hardDeleteCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Customer ID is required" });
    }
    const existing = await prisma.customer.findUnique({ where: { id: String(id) } });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    await prisma.customer.delete({ where: { id: String(id) } });
    res.json({ success: true, message: "Customer permanently deleted" });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur hard delete client");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to hard delete customer",
      details: err.meta || err,
    });
  }
};
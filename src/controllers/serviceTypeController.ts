import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import { withOrgOrGlobal, withOrgData } from "../utils/tenantHelper.js";

/**
 * GET /service-types
 * Liste tous les types de services (globaux + org-specific)
 */
export const getServiceTypes = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(403).json({ error: "Organization context required" });
    }

    const serviceTypes = await prisma.serviceType.findMany({
      where: withOrgOrGlobal(req.user.organizationId, {
        deleted_at: null,
        is_active: true,
      }),
      include: {
        pricing_rules: {
          where: { is_active: true, deleted_at: null },
          orderBy: { priority: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      data: serviceTypes,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to fetch service types");
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /service-types/:id
 * Récupère un type de service par ID
 */
export const getServiceTypeById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(403).json({ error: "Organization context required" });
    }

    const { id } = req.params;

    const serviceType = await prisma.serviceType.findFirst({
      where: {
        ...(id && { id }),
        OR: [
          { organization_id: req.user.organizationId },
          { organization_id: null },
        ],
        deleted_at: null,
      },
      include: {
        pricing_rules: {
          where: { is_active: true, deleted_at: null },
          orderBy: { priority: "desc" },
        },
      },
    });

    if (!serviceType) {
      return res.status(404).json({
        success: false,
        error: "Service type not found",
      });
    }

    res.json({
      success: true,
      data: serviceType,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to fetch service type");
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /service-types
 * Créer un nouveau type de service (org-specific)
 */
export const createServiceType = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId || !req.user?.id) {
      return res.status(403).json({ error: "Organization context required" });
    }

    const { name, code, description, config } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        error: "name and code are required",
      });
    }

    // Check uniqueness
    const existing = await prisma.serviceType.findFirst({
      where: {
        code,
        organization_id: req.user.organizationId,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Service type with this code already exists in your organization",
      });
    }

    const serviceType = await prisma.serviceType.create({
      data: withOrgData(req.user.organizationId, req.user.id, {
        name,
        code,
        description,
        config,
        is_active: true,
      }),
    });

    logger.info(
      { serviceTypeId: serviceType.id, organizationId: req.user.organizationId },
      "Service type created"
    );

    res.status(201).json({
      success: true,
      data: serviceType,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to create service type");
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * PUT /service-types/:id
 * Mettre à jour un type de service
 */
export const updateServiceType = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId || !req.user?.id) {
      return res.status(403).json({ error: "Organization context required" });
    }

    const { id } = req.params;
    const { name, description, config, is_active } = req.body;

    // Check ownership
    const existing = await prisma.serviceType.findFirst({
      where: {
        ...(id && { id }),
        organization_id: req.user.organizationId, // Only org-specific can be updated
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Service type not found or cannot be modified",
      });
    }

    const serviceType = await prisma.serviceType.update({
      where: { id: existing.id },
      data: withOrgData(
        req.user.organizationId,
        req.user.id,
        {
          name,
          description,
          config,
          is_active,
        },
        true
      ),
    });

    logger.info(
      { serviceTypeId: serviceType.id, organizationId: req.user.organizationId },
      "Service type updated"
    );

    res.json({
      success: true,
      data: serviceType,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to update service type");
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * DELETE /service-types/:id
 * Supprimer un type de service (soft delete)
 */
export const deleteServiceType = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId || !req.user?.id) {
      return res.status(403).json({ error: "Organization context required" });
    }

    const { id } = req.params;

    const existing = await prisma.serviceType.findFirst({
      where: {
        ...(id && { id }),
        organization_id: req.user.organizationId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Service type not found",
      });
    }

    await prisma.serviceType.update({
      where: { id: existing.id },
      data: {
        deleted_at: new Date(),
        deleted_by: req.user.id,
      },
    });

    logger.info(
      { serviceTypeId: id, organizationId: req.user.organizationId },
      "Service type deleted"
    );

    res.json({
      success: true,
      message: "Service type deleted successfully",
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to delete service type");
    res.status(500).json({ success: false, error: err.message });
  }
};
